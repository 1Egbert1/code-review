/**
 * 由指标算分。
 *
 * 三条硬规则，写在代码里而不是文档里：
 *
 * 1. **分数只由公式产生，模型不参与。** 同一份代码今天 78 明天 71，用户看两次就再也不信这个数。
 * 2. **每个扣分项都要能对出「实际值 / 阈值 / 扣分」三元组。** 只说「复杂度高」等于没解释；
 *    给出「平均 62 行，阈值 40，扣 3 分」才叫可核对。
 * 3. **单项扣分有上限，总分不为负。** 一个极端差的指标不该把整维打到 0，那样其他维度的改进
 *    在报告里完全看不出来——指标要能反映「哪一项在变差」，不是只给一个难看的总数。
 */

import type { InspectionConfig } from '../../contracts/config.js';
import type {
  MetricValue,
  ScoreBreakdown,
  ScoreDimension,
  ScoreItem,
} from '../../contracts/inspection.js';
import type {
  ComplexityStats,
  DependencyStats,
  DuplicationStats,
  TestStats,
  TypeSafetyStats,
} from './metrics.js';

export interface Thresholds {
  readonly avgFunctionLines: number;
  readonly avgCyclomatic: number;
  readonly maxFileLines: number;
  readonly complexFunctionCount: number;
  readonly duplicationRatio: number;
  readonly circularDependencies: number;
  readonly looseVersionRatio: number;
  readonly anyDensity: number;
  readonly ignoredChecks: number;
  readonly testToCodeRatio: number;
  readonly coveragePercent: number;
}

/**
 * 默认阈值。取值参考业界常见经验，但**重点不是绝对正确，而是稳定**：
 * 只要口径不变，趋势就能说明问题。业务方可以整体覆盖。
 */
export const DEFAULT_THRESHOLDS: Thresholds = {
  avgFunctionLines: 40,
  avgCyclomatic: 10,
  maxFileLines: 500,
  complexFunctionCount: 3,
  duplicationRatio: 0.03,
  circularDependencies: 0,
  looseVersionRatio: 0.3,
  anyDensity: 5,
  ignoredChecks: 0,
  testToCodeRatio: 0.6,
  coveragePercent: 80,
};

export interface ScoreInput {
  readonly complexity: ComplexityStats;
  readonly duplication: DuplicationStats;
  readonly dependency: DependencyStats;
  readonly typeSafety: TypeSafetyStats;
  readonly tests: TestStats;
  readonly config: InspectionConfig;
  readonly thresholds?: Thresholds;
}

export interface ScoreOutcome {
  readonly breakdown: readonly ScoreBreakdown[];
  readonly totalScore: number;
  readonly scores: Readonly<Record<ScoreDimension, number>>;
  /** 扁平指标清单，报告头部与趋势对比都要用 */
  readonly metrics: readonly MetricValue[];
}

/** 计算单项扣分：超出阈值的倍数决定扣多少，上限由 cap 控制。 */
function tiered(value: number, threshold: number, unit: number, cap: number, per = 1): number {
  if (value <= threshold) return 0;
  const steps = Math.ceil((value - threshold) / unit);
  return Math.min(cap, steps * per);
}

interface ItemSpec {
  readonly metricId: string;
  readonly label: string;
  readonly actual: string;
  readonly threshold: string;
  readonly value: number;
  readonly thresholdValue: number;
  readonly deduction: number;
}

function toItems(specs: readonly ItemSpec[]): { items: ScoreItem[]; metrics: MetricValue[] } {
  return {
    items: specs.map((spec) => ({
      metricId: spec.metricId,
      label: spec.label,
      actual: spec.actual,
      threshold: spec.threshold,
      deduction: spec.deduction,
    })),
    metrics: specs.map((spec) => ({
      metricId: spec.metricId,
      label: spec.label,
      value: spec.value,
      threshold: spec.thresholdValue,
      exceeded: spec.value > spec.thresholdValue,
    })),
  };
}

/** 五个维度的扣分明细。每项都给出实际值、阈值、扣分。 */
function buildSpecs(input: ScoreInput, t: Thresholds): Record<ScoreDimension, ItemSpec[]> {
  const { complexity, duplication, dependency, typeSafety, tests } = input;

  return {
    complexity: [
      {
        metricId: 'avg-function-lines',
        label: '函数平均长度',
        actual: `${String(complexity.avgFunctionLines)} 行`,
        threshold: `${String(t.avgFunctionLines)} 行`,
        value: complexity.avgFunctionLines,
        thresholdValue: t.avgFunctionLines,
        deduction: tiered(complexity.avgFunctionLines, t.avgFunctionLines, 10, 6),
      },
      {
        metricId: 'avg-cyclomatic',
        label: '圈复杂度均值',
        actual: String(complexity.avgCyclomatic),
        threshold: String(t.avgCyclomatic),
        value: complexity.avgCyclomatic,
        thresholdValue: t.avgCyclomatic,
        deduction: tiered(complexity.avgCyclomatic, t.avgCyclomatic, 1, 6),
      },
      {
        metricId: 'max-file-lines',
        label: '最长文件',
        actual: `${String(complexity.maxFileLines)} 行`,
        threshold: `${String(t.maxFileLines)} 行`,
        value: complexity.maxFileLines,
        thresholdValue: t.maxFileLines,
        deduction: tiered(complexity.maxFileLines, t.maxFileLines, 100, 4),
      },
      {
        metricId: 'complex-functions',
        label: '超限函数数',
        actual: String(complexity.complexFunctions),
        threshold: String(t.complexFunctionCount),
        value: complexity.complexFunctions,
        thresholdValue: t.complexFunctionCount,
        deduction: tiered(complexity.complexFunctions, t.complexFunctionCount, 1, 4),
      },
    ],

    duplication: [
      {
        metricId: 'duplication-ratio',
        label: '重复代码占比',
        actual: `${(duplication.ratio * 100).toFixed(1)}%`,
        threshold: `${(t.duplicationRatio * 100).toFixed(1)}%`,
        value: duplication.ratio,
        thresholdValue: t.duplicationRatio,
        // 每超 1 个百分点扣 2 分，最多 20
        deduction: tiered(duplication.ratio, t.duplicationRatio, 0.01, 20, 2),
      },
    ],

    dependency: [
      {
        metricId: 'circular-dependencies',
        label: '循环依赖',
        actual: String(dependency.circular),
        threshold: String(t.circularDependencies),
        value: dependency.circular,
        thresholdValue: t.circularDependencies,
        deduction: tiered(dependency.circular, t.circularDependencies, 1, 10, 3),
      },
      {
        metricId: 'loose-versions',
        label: '版本范围过宽的依赖占比',
        actual: `${(dependency.looseRatio * 100).toFixed(0)}%`,
        threshold: `${(t.looseVersionRatio * 100).toFixed(0)}%`,
        value: dependency.looseRatio,
        thresholdValue: t.looseVersionRatio,
        deduction: tiered(dependency.looseRatio, t.looseVersionRatio, 0.1, 10, 3),
      },
    ],

    'type-safety': [
      {
        metricId: 'any-density',
        label: '每千行 any 数量',
        actual: String(typeSafety.anyDensity),
        threshold: String(t.anyDensity),
        value: typeSafety.anyDensity,
        thresholdValue: t.anyDensity,
        deduction: tiered(typeSafety.anyDensity, t.anyDensity, 2, 12, 2),
      },
      {
        metricId: 'ignored-checks',
        label: '忽略检查的注释数',
        actual: String(typeSafety.ignoredChecks),
        threshold: String(t.ignoredChecks),
        value: typeSafety.ignoredChecks,
        thresholdValue: t.ignoredChecks,
        deduction: tiered(typeSafety.ignoredChecks, t.ignoredChecks, 1, 8, 2),
      },
    ],

    test: [
      {
        metricId: 'coverage',
        label: '行覆盖率',
        actual: tests.coveragePercent === null ? '未提供' : `${String(tests.coveragePercent)}%`,
        threshold: `${String(t.coveragePercent)}%`,
        value: tests.coveragePercent ?? 0,
        thresholdValue: t.coveragePercent,
        // 没有覆盖率数据时不扣分：拿「不知道」当「零」会平白扣掉一整个维度
        deduction:
          tests.coveragePercent === null
            ? 0
            : tiered(t.coveragePercent - tests.coveragePercent, 0, 10, 12),
      },
      {
        metricId: 'test-ratio',
        label: '测试与源码文件比',
        actual: String(tests.ratio),
        threshold: String(t.testToCodeRatio),
        value: tests.ratio,
        thresholdValue: t.testToCodeRatio,
        deduction: tiered(t.testToCodeRatio - tests.ratio, 0, 0.2, 8, 2),
      },
    ],
  };
}

/** 计算全部维度得分与总分。 */
export function scoreInspection(input: ScoreInput): ScoreOutcome {
  const thresholds = input.thresholds ?? DEFAULT_THRESHOLDS;
  const maxScore = input.config.maxScorePerDimension;
  const specs = buildSpecs(input, thresholds);

  const breakdown: ScoreBreakdown[] = [];
  const metrics: MetricValue[] = [];
  const scores = {} as Record<ScoreDimension, number>;

  for (const dimension of Object.keys(specs) as ScoreDimension[]) {
    const converted = toItems(specs[dimension]);
    const deduction = converted.items.reduce((sum, item) => sum + item.deduction, 0);
    const score = Math.max(0, maxScore - deduction);

    scores[dimension] = score;
    metrics.push(...converted.metrics);
    breakdown.push({
      dimension,
      score,
      maxScore,
      weight: input.config.weights[dimension],
      items: converted.items,
    });
  }

  const weightSum = breakdown.reduce((sum, item) => sum + item.weight, 0);
  const weighted = breakdown.reduce(
    (sum, item) => sum + (item.score / item.maxScore) * item.weight,
    0,
  );
  // 权重合计可能被用户改得不是 100，按实际合计归一，避免分数超过 100
  const totalScore = weightSum === 0 ? 0 : Math.round((weighted / weightSum) * 100);

  return { breakdown, totalScore, scores, metrics };
}
