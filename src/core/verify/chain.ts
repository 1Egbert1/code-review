/**
 * 校验链。
 *
 * 顺序固定，不可调换：**定位 → 严重度下限 → 去重 → 配额路由**。
 *
 * 顺序之所以重要：如果先去重再定位，跨文件搬移会让两条本来不同的条目变成「同一条」；
 * 如果先配额再定位，就会按未经校验的数据做排序，越界的条目占掉名额。
 *
 * **配额不是丢弃。** 行内位置有限，超出的条目路由到摘要——一条已经花钱算出来、
 * 验证过、定位成功的问题，扔掉等于白花，而且用户不知道自己少了什么。
 */

import type { ParsedDiff } from '../../contracts/diff.js';
import type {
  Finding,
  RawFinding,
  Rejection,
  RejectionReason,
  ReviewerId,
  Severity,
} from '../../contracts/finding.js';
import type { LineIndex } from '../diff/index-lines.js';
import { computeFingerprint } from '../reconcile/fingerprint.js';
import { SEVERITY_ORDER } from '../reviewers/schema.js';
import { locate } from './locate.js';

export interface VerifyOptions {
  readonly diff: ParsedDiff;
  readonly index: LineIndex;
  readonly fileContents: ReadonlyMap<string, string | null>;
  /** 每个维度的严重度下限 */
  readonly severityFloors: Readonly<Partial<Record<ReviewerId, Severity>>>;
  /** 行内评论条数上限 */
  readonly maxInline: number;
}

export interface VerifyOutcome {
  /** 全部通过校验的条目（含被路由到摘要的） */
  readonly findings: readonly Finding[];
  /** 分配了行内位置的条目 */
  readonly inline: readonly Finding[];
  /** 只进摘要的条目：非改动行、或行内配额已满 */
  readonly summaryOnly: readonly Finding[];
  readonly rejections: readonly Rejection[];
}

function severityRank(severity: Severity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

/**
 * 校验一批原始问题项。
 *
 * 传入的 `raw` 必须带上是哪个维度产出的——指纹里含维度，同一句话由不同维度报出算两条。
 */
export function verifyFindings(
  items: readonly { readonly raw: RawFinding; readonly reviewer: ReviewerId }[],
  options: VerifyOptions,
): VerifyOutcome {
  const findings: Finding[] = [];
  const rejections: Rejection[] = [];
  const seen = new Set<string>();

  for (const { raw, reviewer } of items) {
    const reject = (reason: RejectionReason, detail: string): void => {
      rejections.push({
        reviewer,
        file: raw.file,
        line: raw.line,
        title: raw.title,
        reason,
        detail,
      });
    };

    const located = locate({
      raw,
      diff: options.diff,
      index: options.index,
      fileContents: options.fileContents,
    });
    if (!located.ok) {
      reject(located.reason, located.detail);
      continue;
    }

    const floor = options.severityFloors[reviewer];
    // 序号越大越轻，所以「比下限更轻」= 序号更大
    if (floor !== undefined && severityRank(raw.severity) > severityRank(floor)) {
      reject('below-severity-floor', `严重度 ${raw.severity} 低于该维度下限 ${floor}`);
      continue;
    }

    // 派生字段必须在定位之后算：指纹含文件路径，跨文件搬移会改文件
    const fingerprint = computeFingerprint({
      file: located.anchor.file,
      reviewer,
      title: raw.title,
      evidence: raw.evidence,
    });
    if (seen.has(fingerprint)) {
      reject('duplicate', `与本轮已有条目指纹相同（${fingerprint}）`);
      continue;
    }
    seen.add(fingerprint);

    findings.push({
      fingerprint,
      reviewer,
      anchor: located.anchor,
      positionOrigin: located.origin,
      severity: raw.severity,
      title: raw.title,
      body: raw.body,
      evidence: raw.evidence,
      suggestion: raw.suggestion,
      confidence: raw.confidence,
      // 上下文行在改动前就存在，不是本次引入的
      preexisting: located.anchor.kind === 'context',
      // 只有真正新增/删除的行才允许进行内评论
      scope: located.anchor.kind === 'context' ? 'function' : 'changed',
    });
  }

  const inlineCandidates = findings
    .filter((finding) => finding.scope === 'changed')
    .sort((a, b) => {
      const bySeverity = severityRank(a.severity) - severityRank(b.severity);
      if (bySeverity !== 0) return bySeverity;
      return b.confidence - a.confidence;
    });

  const inline = inlineCandidates.slice(0, Math.max(0, options.maxInline));
  const inlineSet = new Set(inline.map((finding) => finding.fingerprint));

  return {
    findings,
    inline,
    summaryOnly: findings.filter((finding) => !inlineSet.has(finding.fingerprint)),
    rejections,
  };
}
