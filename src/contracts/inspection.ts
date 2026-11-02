/**
 * 项目巡检相关的契约。
 *
 * 与改动审查的根本区别：巡检没有改动，问题大多落在文件级或仓库级而非具体行。
 * 分数由公式算出（见规格书 16.2），模型只负责写评语，不打分——
 * 让模型打分会导致同一份代码今天 78 分明天 71 分，用户看两次就不信了。
 */

import type { Finding } from './finding.js';

/** 五个评分维度。各维度默认满分 20，权重可配。 */
export type ScoreDimension =
  /** 复杂度：圈复杂度、函数长度、嵌套深度 */
  | 'complexity'
  /** 重复度：重复代码块占比 */
  | 'duplication'
  /** 依赖健康：过期依赖、已知漏洞、循环依赖 */
  | 'dependency'
  /** 类型安全：逃逸类型的数量与密度 */
  | 'type-safety'
  /** 测试：覆盖率、测试与代码的比例 */
  | 'test';

/** 单个指标的实测值与阈值。报告里的「依据」就是它。 */
export interface MetricValue {
  readonly metricId: string;
  /** 展示名，如「函数平均长度」 */
  readonly label: string;
  readonly value: number;
  readonly threshold: number;
  /** 是否超出阈值 */
  readonly exceeded: boolean;
}

/** 一个维度内某一项指标的扣分明细，用于「分数可核对」。 */
export interface ScoreItem {
  readonly metricId: string;
  readonly label: string;
  /** 实际值，展示用原文（如「62 行」「18」） */
  readonly actual: string;
  /** 阈值，展示用原文 */
  readonly threshold: string;
  /** 该项扣了多少分；0 表示未扣 */
  readonly deduction: number;
}

/** 一个维度的得分与其明细。 */
export interface ScoreBreakdown {
  readonly dimension: ScoreDimension;
  readonly score: number;
  readonly maxScore: number;
  /** 该维度的权重，百分比 */
  readonly weight: number;
  readonly items: readonly ScoreItem[];
}

/** 按严重度的问题计数，报告头部要用。 */
export interface SeverityCounts {
  readonly blocker: number;
  readonly major: number;
  readonly minor: number;
  readonly nit: number;
}

/** 报告载体。一期默认按可用性自动选择：Wiki 优先，否则用常设 Issue。 */
export type ReportCarrier = 'wiki' | 'issue';

/** 载体写入结果。 */
export interface ReportLocation {
  readonly carrier: ReportCarrier;
  /** Wiki 页面名 或 Issue 编号，用于生成链接与下期对比 */
  readonly reference: string;
  readonly url: string;
}

/** 一次巡检的结果。用于渲染报告，并与上期对比。 */
export interface InspectionReport {
  readonly repository: string;
  readonly commitSha: string;
  /** ISO 时间戳 */
  readonly inspectedAt: string;
  readonly metrics: readonly MetricValue[];
  readonly breakdown: readonly ScoreBreakdown[];
  readonly totalScore: number;
  readonly scores: Readonly<Record<ScoreDimension, number>>;
  readonly counts: SeverityCounts;
  readonly findings: readonly Finding[];
  /** 与上期相比新增或恶化的问题指纹 */
  readonly regressions: readonly string[];
  /** 与上期相比已消失的问题指纹（判定为已修复） */
  readonly resolved: readonly string[];
  /** 上期报告的定位信息；首期为 null */
  readonly previousRef: string | null;
  /** 本次报告写到了哪里；尚未写入时为 null */
  readonly location: ReportLocation | null;
}
