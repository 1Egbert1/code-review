/**
 * 评估基准：把两次跑分放在一起比，并**先判断能不能比**。
 *
 * 这个模块最重要的不是算差值，是拒绝给出误导性的差值。
 * 样本集换了一批、模型换了一个，算出来的「召回率 +3pt」没有任何意义——
 * 用户会拿它当结论，然后据此决定要不要上线。
 *
 * 三类可比性，处理方式完全不同：
 *
 * | 情况 | 处理 |
 * | --- | --- |
 * | 样本集指纹不同 | **拒绝对比**。这不是同一道题，分数没有可比性 |
 * | 模型不同 | 允许，但标注「跨模型比较」。有时就是想比这个 |
 * | 提示词版本不同 | 允许且**不标注为异常**——优化往往就是改提示词，这正是要比的东西 |
 */

import { createHash } from 'node:crypto';

import type { CostBreakdown } from '../../contracts/result.js';

/** 一次跑分的完整快照。落盘为 JSON，用于日后对比。 */
export interface BaselineSnapshot {
  readonly version: 1;
  /** 人类可读的标签，如 v1.2.0 */
  readonly label: string;
  readonly createdAt: string;
  /** 代码版本，通常是提交号 */
  readonly codeVersion: string;
  /** 各维度提示词版本 */
  readonly promptVersions: Readonly<Record<string, string>>;
  readonly model: string;
  /** 配置指纹，维度开关之类变了也影响可比性 */
  readonly configHash: string;
  /** 样本集指纹：换了题就不许比 */
  readonly datasetHash: string;
  readonly metrics: BaselineMetrics;
  readonly cost: CostBreakdown | null;
}

export interface BaselineMetrics {
  /** 召回率 0~1：该报的有没有报出来 */
  readonly recall: number;
  /** 精确率 0~1：报出来的有多少是真的 */
  readonly precision: number;
  /** 每次审查的平均耗时（毫秒） */
  readonly avgLatencyMs: number;
  /** 同一输入多次运行结论一致的比例 0~1 */
  readonly reproducibility: number;
  readonly samples: number;
}

/** 一条样本的跑分原始结果。 */
export interface SampleResult {
  readonly id: string;
  /** 期望发现的问题数（人工标注） */
  readonly expected: number;
  /** 实际命中期望问题的数量 */
  readonly hit: number;
  /** 报出来但不该报的数量 */
  readonly falsePositives: number;
}

/** 由逐条结果汇总指标。 */
export function summarize(
  samples: readonly SampleResult[],
  extras: { avgLatencyMs: number; reproducibility: number },
): BaselineMetrics {
  const expected = samples.reduce((sum, sample) => sum + sample.expected, 0);
  const hit = samples.reduce((sum, sample) => sum + sample.hit, 0);
  const falsePositives = samples.reduce((sum, sample) => sum + sample.falsePositives, 0);

  const recall = expected === 0 ? 0 : hit / expected;
  const reported = hit + falsePositives;
  const precision = reported === 0 ? 1 : hit / reported;

  return {
    recall,
    precision,
    avgLatencyMs: extras.avgLatencyMs,
    reproducibility: extras.reproducibility,
    samples: samples.length,
  };
}

/** 样本集指纹。样本 id 与期望数量都进哈希——加一条样本或改一条标注都会变。 */
export function computeDatasetHash(
  samples: readonly { readonly id: string; readonly expected: number }[],
): string {
  const normalized = [...samples]
    .map((sample) => `${sample.id}:${String(sample.expected)}`)
    .sort()
    .join('\u0000');
  return createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 16);
}

export interface MetricDelta {
  readonly name: string;
  readonly before: number;
  readonly after: number;
  readonly delta: number;
  /** 越大越好还是越小越好，决定结论怎么写 */
  readonly higherIsBetter: boolean;
}

export type BaselineComparison =
  | { readonly comparable: false; readonly reason: string }
  | {
      readonly comparable: true;
      readonly metrics: readonly MetricDelta[];
      /** 提示词变了的维度；允许对比，但要标出来 */
      readonly changedPrompts: readonly string[];
      /** 跨模型比较，结论仅供参考 */
      readonly crossModel: boolean;
      readonly verdict: string;
    };

/**
 * 对比两份快照。
 *
 * 只有样本集不同才拒绝——那是唯一「分数根本不可比」的情况。
 */
export function compareBaselines(
  before: BaselineSnapshot,
  after: BaselineSnapshot,
): BaselineComparison {
  if (before.datasetHash !== after.datasetHash) {
    return {
      comparable: false,
      reason: `样本集已变更（${before.datasetHash} → ${after.datasetHash}），两份结果不是同一道题，需重跑基准`,
    };
  }

  const metrics: MetricDelta[] = [
    {
      name: '召回率',
      before: before.metrics.recall,
      after: after.metrics.recall,
      delta: after.metrics.recall - before.metrics.recall,
      higherIsBetter: true,
    },
    {
      // 不叫「精确率」：分母里混着「真问题但本轮未标注」的条目。
      // 叫精确率会让人以为模型在乱报，而实际往往只是标注不全。
      name: '标注命中率',
      before: before.metrics.precision,
      after: after.metrics.precision,
      delta: after.metrics.precision - before.metrics.precision,
      higherIsBetter: true,
    },
    {
      name: '平均延迟',
      before: before.metrics.avgLatencyMs,
      after: after.metrics.avgLatencyMs,
      delta: after.metrics.avgLatencyMs - before.metrics.avgLatencyMs,
      higherIsBetter: false,
    },
    {
      name: '复现率',
      before: before.metrics.reproducibility,
      after: after.metrics.reproducibility,
      delta: after.metrics.reproducibility - before.metrics.reproducibility,
      higherIsBetter: true,
    },
  ];

  if (before.cost !== null && after.cost !== null) {
    metrics.push({
      name: '平均成本',
      before: before.cost.total,
      after: after.cost.total,
      delta: after.cost.total - before.cost.total,
      higherIsBetter: false,
    });
  }

  const changedPrompts = Object.keys({ ...before.promptVersions, ...after.promptVersions }).filter(
    (key) => before.promptVersions[key] !== after.promptVersions[key],
  );

  return {
    comparable: true,
    metrics,
    changedPrompts,
    crossModel: before.model !== after.model,
    verdict: verdictOf(metrics),
  };
}

/**
 * 由规则生成一句话结论，不调模型。
 *
 * 顺序是刻意排的：**召回变化优先于成本变化**。
 *
 * 实测踩过一次：把提示词的类别映射修好之后，召回从 5.6% 涨到 88.9%，
 * 而成本同时降了 17%（少了几次重试）。旧规则只判断「召回有没有掉」，
 * 没掉就去看成本，于是结论写成「成本明显下降且召回未退，净收益为正」——
 * 把一次召回从 6% 到 89% 的修复，说成了省钱的优化。
 *
 * 一个指标变好和「主要改进在哪」是两件事，结论必须先说最要紧的那个。
 */
function verdictOf(metrics: readonly MetricDelta[]): string {
  const recall = metrics.find((metric) => metric.name === '召回率');
  const precision = metrics.find((metric) => metric.name === '标注命中率');
  const cost = metrics.find((metric) => metric.name === '平均成本');

  // 召回涨 5 个点以上，就是这一轮的主要改进，其他都往后放
  if (recall !== undefined && recall.delta >= 0.05) {
    // 但要多说一句命中率：召回涨、命中率跌，说明它开始「什么都报」，需要人看明细
    const precisionDrop = precision !== undefined && precision.delta < -0.1;
    return precisionDrop
      ? '召回显著提升，但标注命中率同时下降——报得多了，需看明细确认新增的是真问题'
      : '召回显著提升，这是本轮的主要改进';
  }

  if (recall !== undefined && recall.delta <= -0.02) return '召回明显下降，不建议采用';

  const costDrop = cost !== undefined && cost.before > 0 && cost.delta / cost.before < -0.15;
  if (costDrop) return '成本明显下降且召回未退，净收益为正';

  return '变化不显著，需结合具体样本判断';
}

/** 校验从磁盘读回来的 JSON 是不是一份快照。坏文件要立刻报错，不能当成空数据。 */
export function isBaselineSnapshot(value: unknown): value is BaselineSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record['version'] === 1 &&
    typeof record['label'] === 'string' &&
    typeof record['datasetHash'] === 'string' &&
    typeof record['model'] === 'string' &&
    typeof record['metrics'] === 'object' &&
    record['metrics'] !== null
  );
}
