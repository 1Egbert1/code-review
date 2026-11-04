/**
 * 评测跑分：对样本集逐条跑审查，比对期望，产出一份可落盘的快照。
 *
 * 三件事的取舍先说清：
 *
 * 1. **正确性与安全性强制打开，不按样本期望裁剪。** 样本里只标了正确性问题，也照样跑安全性——
 *    「样本没标」不等于「报出来的一定是误报」，也不等于「一定是真的」。
 *    拿不准的时候让多余项暴露出来，比悄悄少跑一个维度、把精确率刷成 1.0 要诚实。
 *    规范性例外，理由见 forcedDimensions 的注释。
 *
 * 2. **成本与耗时只统计首轮。** 复现率要跑第二轮，但第二轮会命中提示词缓存，
 *    把它算进成本会让「repeats 从 2 调到 3」凭空改变成本指标，指标就不可比了。
 *
 * 3. **严格命中才算召回。** 类别报错的条目算「维度内命中」，单独统计，不进召回也不进误报。
 *    理由见 match.ts 的模块注释。
 */

import { createHash } from 'node:crypto';

import type { ResolvedConfig } from '../../contracts/config.js';
import type { ParsedDiff, ReviewRequest } from '../../contracts/diff.js';
import type { Finding } from '../../contracts/finding.js';
import type { CostBreakdown, TokenUsage } from '../../contracts/result.js';
import type { LlmClient } from '../../providers/types.js';
import { computeCost } from '../cost/pricing.js';
import { parsePatch } from '../diff/parse.js';
import { runReview } from '../engine.js';
import { conventionReviewer } from '../reviewers/dimensions/convention/index.js';
import { correctnessReviewer } from '../reviewers/dimensions/correctness/index.js';
import { securityReviewer } from '../reviewers/dimensions/security/index.js';
import { sumUsage } from '../reviewers/run.js';
import type { SampleResult, BaselineSnapshot } from './baseline.js';
import { summarize } from './baseline.js';
import type { EvalDataset, EvalSample } from './dataset.js';
import { datasetHashOf } from './dataset.js';
import type { ActualFinding } from './match.js';
import { matchFindings } from './match.js';

/** 一条样本的跑分明细。给「分数掉了，掉在哪」用。 */
export interface EvalSampleDetail {
  readonly id: string;
  readonly expected: number;
  readonly strictHit: number;
  /** 位置对、维度对，但类别报错 */
  readonly looseHit: number;
  readonly missed: number;
  readonly falsePositives: number;
  /** 误报中「与已命中项同位置」的重复报告数，不算说错 */
  readonly sameLineExtras: number;
  /** 行号完全相等（不含容差）的条数 */
  readonly exactLine: number;
  readonly missedItems: readonly {
    readonly line: number;
    readonly category: string;
    readonly note: string | null;
  }[];
  readonly extraItems: readonly {
    readonly line: number;
    readonly category: string;
    readonly title: string;
  }[];
  /** 定位来源分布：line / evidence-hunk / evidence-file … */
  readonly origins: Readonly<Record<string, number>>;
  readonly latencyMs: number;
  /** 两轮运行之间，指纹集合的一致度（Jaccard）。只在 repeats >= 2 时有意义 */
  readonly stability: number;
}

export interface EvalDetail {
  readonly samples: readonly EvalSampleDetail[];
  /** 复现率是否真的测了 */
  readonly reproducibilityMeasured: boolean;
  readonly repeats: number;
  /** 首轮之外的额外调用次数与用量，只做展示，不进成本指标 */
  readonly extraUsage: TokenUsage;
}

export interface RunEvalOptions {
  readonly dataset: EvalDataset;
  readonly config: ResolvedConfig;
  readonly client: LlmClient;
  /** 快照标签，如 v1.1 */
  readonly label: string;
  /** 代码版本，通常是短提交号 */
  readonly codeVersion: string;
  /** 每个样本跑几轮，最小 2（低于 2 测不出复现率）。默认 2 */
  readonly repeats?: number;
  readonly now?: () => string;
  readonly onProgress?: (message: string) => void;
}

/**
 * 强制打开「逐文件」的两个维度：正确性与安全性。
 *
 * 不看配置里开了哪个，因为评测要回答的是「这两个维度整体表现如何」，
 * 而不是「上次恰好配的那个组合表现如何」。
 *
 * **规范性维度不强制打开，这是实测改过来的。**
 * 它判断的是「不同文件之间写法是否一致」，天生需要多文件上下文；
 * 而样本集每个样本只有一个文件，模型看不到别的文件，只能照着通用直觉报
 * `consistency` / `duplication` / `structure`——第一次跑出来 22 条「多余」里有 10 条是它，
 * 把一个 15 条标注的样本集的精确率压到 29%。那不是模型差，是**样本给不出它需要的输入**。
 *
 * 所以规范性跟随配置：有多文件样本时再打开。用单文件样本测它，测的是噪声。
 */
function forcedDimensions(config: ResolvedConfig): ResolvedConfig {
  return {
    ...config,
    review: {
      ...config.review,
      dimensions: {
        correctness: { ...config.review.dimensions.correctness, enabled: true },
        security: { ...config.review.dimensions.security, enabled: true },
        convention: { ...config.review.dimensions.convention },
      },
    },
    // 评测不写任何东西，也不该被门禁判定干扰
    gate: { ...config.gate, enabled: false },
  };
}

function snapshotOf(
  datasetName: string,
  sample: EvalSample,
): { diff: ParsedDiff; fileContents: Map<string, string | null> } {
  const file = parsePatch(sample.patch, {
    path: sample.path,
    oldPath: null,
    status: sample.status,
  });

  return {
    diff: {
      files: [file],
      // 评测没有真实的提交号，但下游会用它们做展示，给稳定的占位值而不是空串
      baseSha: `eval-base-${datasetName}`,
      headSha: `eval-head-${sample.id}`,
    },
    fileContents: new Map([[sample.path, sample.content]]),
  };
}

function toActual(findings: readonly Finding[]): ActualFinding[] {
  return findings.map((finding) => ({
    fingerprint: finding.fingerprint,
    // 删除行锚在旧侧；评测样本以新版本为准，旧侧行号只作兜底
    line: finding.anchor.newLine ?? finding.anchor.oldLine ?? 0,
    category: finding.category,
    reviewer: finding.reviewer,
    severity: finding.severity,
  }));
}

/** 两轮指纹集合的一致度。空集与空集视为完全一致（没报问题也是一种稳定结论）。 */
function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

export interface RunEvalResult {
  readonly snapshot: BaselineSnapshot;
  readonly detail: EvalDetail;
}

export async function runEval(options: RunEvalOptions): Promise<RunEvalResult> {
  const repeats = Math.max(2, options.repeats ?? 2);
  const config = forcedDimensions(options.config);
  const now = options.now ?? (() => new Date().toISOString());

  const sampleResults: SampleResult[] = [];
  const details: EvalSampleDetail[] = [];

  let totalUsage: TokenUsage = {
    uncachedInput: 0,
    cacheWriteShort: 0,
    cacheWriteLong: 0,
    cacheRead: 0,
    output: 0,
  };
  let extraUsage: TokenUsage = totalUsage;
  let totalLatency = 0;

  for (const sample of options.dataset.samples) {
    const { diff, fileContents } = snapshotOf(options.dataset.name, sample);

    const request: ReviewRequest = {
      repository: `eval/${options.dataset.name}`,
      mode: 'local',
      pullRequestNumber: null,
      baseRef: null,
      headRef: null,
      dryRun: true,
    };

    const findingsOfRun: {
      fingerprints: Set<string>;
      actual: ActualFinding[];
      origins: Record<string, number>;
    }[] = [];
    let firstLatency = 0;

    for (let round = 0; round < repeats; round += 1) {
      const roundStarted = Date.now();
      const result = await runReview(request, {
        config,
        client: options.client,
        // 快照是固定的：评测不测取数，取数有自己的集成测试
        fetchSnapshot: () =>
          Promise.resolve({
            diff,
            fileContents,
            existingComments: [],
            conventions: null,
            buildContext: null,
          }),
        // 只打印模式不创建写入端口——评测绝不产生任何写操作
        port: null,
      });
      const latency = Date.now() - roundStarted;

      if (round === 0) {
        firstLatency = latency;
        totalUsage = sumUsage(totalUsage, result.usage.tokens);
      } else {
        extraUsage = sumUsage(extraUsage, result.usage.tokens);
      }

      findingsOfRun.push({
        fingerprints: new Set(result.findings.map((finding) => finding.fingerprint)),
        actual: toActual(result.findings),
        origins: countOrigins(result.findings),
      });
    }

    const first = findingsOfRun[0];
    const actual = first?.actual ?? [];
    const matched = matchFindings(sample.expected, actual);

    const stability =
      findingsOfRun.length < 2
        ? 1
        : average(
            findingsOfRun
              .slice(1)
              .map((run) => jaccard(first?.fingerprints ?? new Set(), run.fingerprints)),
          );

    sampleResults.push({
      id: sample.id,
      expected: sample.expected.length,
      hit: matched.strict.length,
      falsePositives: matched.falsePositives.length,
    });

    details.push({
      id: sample.id,
      expected: sample.expected.length,
      strictHit: matched.strict.length,
      looseHit: matched.loose.length,
      missed: matched.missed.length,
      falsePositives: matched.falsePositives.length,
      sameLineExtras: matched.sameLineExtras.length,
      exactLine: matched.strict.filter((hit) => hit.exact).length,
      missedItems: matched.missed.map((index) => {
        const want = sample.expected[index];
        return {
          line: want?.line ?? 0,
          category: want?.category ?? '',
          note: want?.note ?? null,
        };
      }),
      extraItems: matched.falsePositives.map((fingerprint) => {
        const item = actual.find((candidate) => candidate.fingerprint === fingerprint);
        return {
          line: item?.line ?? 0,
          category: item?.category ?? '',
          title: `${item?.reviewer ?? '?'}/${item?.category ?? '?'}`,
        };
      }),
      origins: first?.origins ?? {},
      latencyMs: firstLatency,
      stability,
    });

    totalLatency += firstLatency;
    options.onProgress?.(
      `${sample.id}：命中 ${String(matched.strict.length)}/${String(sample.expected.length)}，` +
        `类别错 ${String(matched.loose.length)}，多余 ${String(matched.falsePositives.length)}`,
    );
  }

  const metrics = summarize(sampleResults, {
    avgLatencyMs: Math.round(totalLatency / Math.max(1, options.dataset.samples.length)),
    reproducibility: average(details.map((detail) => detail.stability)),
  });

  const cost: CostBreakdown | null = computeCost(totalUsage, config.llm.pricing);

  const snapshot: BaselineSnapshot = {
    version: 1,
    label: options.label,
    createdAt: now(),
    codeVersion: options.codeVersion,
    promptVersions: promptVersionsOf(),
    model: config.llm.model,
    configHash: configHashOf(config),
    datasetHash: datasetHashOf(options.dataset),
    metrics,
    // 成本按「单个样本的平均值」记，样本数变了也不影响这个数
    cost:
      cost === null
        ? null
        : {
            ...cost,
            total: cost.total / Math.max(1, options.dataset.samples.length),
          },
  };

  const detail: EvalDetail = {
    samples: details,
    reproducibilityMeasured: repeats >= 2,
    repeats,
    extraUsage,
  };

  return { snapshot, detail };
}

function countOrigins(findings: readonly Finding[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const finding of findings) {
    counts[finding.positionOrigin] = (counts[finding.positionOrigin] ?? 0) + 1;
  }
  return counts;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** 提示词版本从审核员规格里取，避免快照与实现漂移。 */
function promptVersionsOf(): Record<string, string> {
  return {
    correctness: correctnessReviewer.promptVersion,
    security: securityReviewer.promptVersion,
    convention: conventionReviewer.promptVersion,
  };
}

/** 只取影响结论的配置项：改行内条数上限不该让历史基准不可比。 */
function configHashOf(config: ResolvedConfig): string {
  const payload = JSON.stringify({
    model: config.llm.model,
    temperature: config.llm.temperature,
    maxOutputTokens: config.llm.maxOutputTokens,
    dimensions: config.review.dimensions,
    skipPaths: config.review.skipPaths,
    crossFileDepth: config.review.crossFileDepth,
  });
  return createHash('sha256').update(payload, 'utf8').digest('hex').slice(0, 16);
}
