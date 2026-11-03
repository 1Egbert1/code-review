/**
 * 巡检编排：指标 → 规则 → 打分 → 成报告。
 *
 * 与改动审查共用「问题项」这个契约，但**不共用编排**：巡检没有 diff、没有行内位置、
 * 没有上轮评论要比对。硬塞进同一个流程，两边都会变形。
 *
 * 一条重要约束：**巡检不调模型也能跑完**。指标、规则、打分、报告全是确定性的；
 * 模型的角色只有「写评语」和「选出最该改的三件事」，属于可选增强。
 * 这样定时任务不会因为模型不可用而整轮失败。
 */

import type { InspectionConfig } from '../../contracts/config.js';
import type { Finding, Severity } from '../../contracts/finding.js';
import type { InspectionReport, ScoreDimension } from '../../contracts/inspection.js';
import { computeFingerprint } from '../reconcile/fingerprint.js';
import { checkFileRules } from './file-rules.js';
import {
  computeComplexity,
  computeDependencies,
  computeDuplication,
  computeTests,
  computeTypeSafety,
} from './metrics.js';
import type { SourceFile } from './metrics.js';
import { scoreInspection } from './score.js';
import type { Thresholds } from './score.js';

export interface InspectionRunInput {
  readonly repository: string;
  readonly commitSha: string;
  readonly files: readonly SourceFile[];
  readonly config: InspectionConfig;
  readonly thresholds?: Thresholds;
  /** 覆盖率百分比；没有测试报告时传 null，不猜 */
  readonly coveragePercent?: number | null;
  /** 上一期的问题指纹，用于算「新增」与「已修复」 */
  readonly previousFingerprints?: readonly string[];
  readonly now?: () => string;
}

/** 把文件级规则产出转成统一的问题项。巡检里的一切都是「早就存在」，因此 preexisting 恒为 true。 */
function toFindings(files: readonly SourceFile[], thresholds?: Thresholds): Finding[] {
  return checkFileRules(files, thresholds).map((issue) => {
    const line = issue.line ?? 1;
    const fingerprint = computeFingerprint({
      file: issue.path,
      reviewer: 'correctness',
      title: issue.title,
      evidence: `${issue.rule}:${issue.path}:${issue.title}`,
    });

    return {
      fingerprint,
      reviewer: 'correctness',
      // 巡检没有改动，锚点用「上下文行」表达：这行在文件里存在，但不属于任何一次改动
      anchor: { file: issue.path, oldPath: null, kind: 'context', newLine: line, oldLine: line },
      positionOrigin: 'model-line',
      severity: issue.severity,
      category: issue.rule,
      title: issue.title,
      body: issue.detail,
      evidence: issue.title,
      suggestion: null,
      confidence: 1,
      preexisting: true,
      scope: 'file',
    };
  });
}

function countBySeverity(findings: readonly Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { blocker: 0, major: 0, minor: 0, nit: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}

/** 跑一次巡检。纯函数（除时间戳），可对着固定输入断言。 */
export function runInspection(input: InspectionRunInput): InspectionReport {
  const complexity = computeComplexity(
    input.files,
    (input.thresholds ?? undefined)?.avgCyclomatic ?? 10,
  );
  const duplication = computeDuplication(input.files);
  const dependency = computeDependencies(input.files);
  const typeSafety = computeTypeSafety(input.files);
  const tests = computeTests(input.files, input.coveragePercent ?? null);

  const scored = scoreInspection({
    complexity,
    duplication,
    dependency,
    typeSafety,
    tests,
    config: input.config,
    ...(input.thresholds === undefined ? {} : { thresholds: input.thresholds }),
  });

  const findings = toFindings(input.files, input.thresholds);
  const counts = countBySeverity(findings);

  const current = new Set(findings.map((finding) => finding.fingerprint));
  const previous = new Set(input.previousFingerprints ?? []);
  // 首期没有上期数据时不报「全是新增」——那会把第一份报告写成灾难
  const hasPrevious = input.previousFingerprints !== undefined;
  const regressions = hasPrevious
    ? [...current].filter((fingerprint) => !previous.has(fingerprint))
    : [];
  const resolved = hasPrevious
    ? [...previous].filter((fingerprint) => !current.has(fingerprint))
    : [];

  const scores = {} as Record<ScoreDimension, number>;
  for (const item of scored.breakdown) scores[item.dimension] = item.score;

  return {
    repository: input.repository,
    commitSha: input.commitSha,
    inspectedAt: (input.now ?? ((): string => new Date().toISOString()))(),
    metrics: scored.metrics,
    breakdown: scored.breakdown,
    totalScore: scored.totalScore,
    scores,
    counts: {
      blocker: counts.blocker,
      major: counts.major,
      minor: counts.minor,
      nit: counts.nit,
    },
    findings,
    regressions,
    resolved,
    previousRef: null,
    location: null,
  };
}
