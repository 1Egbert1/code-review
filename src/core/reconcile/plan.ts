/**
 * 生命周期比对：拿本轮结论对上轮留下的评论，算出该做什么。
 *
 * 这是唯一有状态的一步，而状态**全部来自平台上的评论列表**，本工具不落任何本地存储。
 *
 * 三个判断容易做错，必须先说清：
 *
 * 1. **身份用指纹，位置另行比较。** 用「文件 + 行号 + 内容」当身份，代码一挪就认不出是老问题，
 *    每轮都会重复发评论。
 * 2. **人工已解决的必须尊重。** 作者手动标了已解决，下一轮又原地重发一遍，等于告诉对方
 *    「你的判断不算数」。
 * 3. **已修复的必须清掉。** 问题改好了评论还挂着，是这类工具最快失去信任的方式——
 *    用户看到的第一反应是「它在瞎说」。
 */

import type { Finding } from '../../contracts/finding.js';
import type { ExistingComment, PublishAction, ReviewWarning } from '../../contracts/result.js';

export interface PlanOptions {
  /** 本轮全部通过校验的条目（含只进摘要的） */
  readonly findings: readonly Finding[];
  /** 本轮拿到行内位置的条目 */
  readonly inline: readonly Finding[];
  /** 平台上已有的本工具评论 */
  readonly existing: readonly ExistingComment[];
  /** 渲染评论正文；不传时用最简单的占位，便于单测 */
  readonly renderBody?: (finding: Finding) => string;
}

export interface PlanOutcome {
  readonly actions: readonly PublishAction[];
  readonly warnings: readonly ReviewWarning[];
  /** 位置已过时但仍保留旧评论的条目数，供统计与摘要说明 */
  readonly outdatedKept: number;
}

/** 行内位置的可比较形式。不同平台的位置参数不同，但「文件 + 行号 + 哪一侧」是共通的。 */
function positionOf(finding: Finding): { path: string; line: number; side: 'new' | 'old' } | null {
  const { anchor } = finding;
  if (anchor.kind === 'removed') {
    return anchor.oldLine === null
      ? null
      : { path: anchor.file, line: anchor.oldLine, side: 'old' };
  }
  return anchor.newLine === null ? null : { path: anchor.file, line: anchor.newLine, side: 'new' };
}

function defaultRender(finding: Finding): string {
  return `**${finding.title}**\n\n${finding.body}`;
}

/** 位置变了才值得打扰，但只有会出故障的严重度才值得删旧发新。 */
const REPLACE_SEVERITIES = new Set(['blocker', 'major']);

export function planActions(options: PlanOptions): PlanOutcome {
  const render = options.renderBody ?? defaultRender;
  const actions: PublishAction[] = [];
  const warnings: ReviewWarning[] = [];
  let outdatedKept = 0;

  // 指纹 → 已有评论。没有标记的评论是别人写的，永不触碰
  const byFingerprint = new Map<string, ExistingComment>();
  for (const comment of options.existing) {
    if (comment.marker === null) continue;
    byFingerprint.set(comment.marker.fingerprint, comment);
  }

  const allFingerprints = new Set(options.findings.map((finding) => finding.fingerprint));
  const inlineFingerprints = new Set(options.inline.map((finding) => finding.fingerprint));

  for (const finding of options.inline) {
    const previous = byFingerprint.get(finding.fingerprint);

    if (previous === undefined) {
      actions.push({ kind: 'create', target: 'inline', finding, body: render(finding) });
      continue;
    }

    // 人工已标记解决：尊重判断，不重发也不改
    if (previous.resolved) {
      actions.push({ kind: 'keep', commentId: previous.commentId, finding });
      continue;
    }

    const current = positionOf(finding);
    const unchanged =
      current !== null &&
      previous.path === current.path &&
      previous.line === current.line &&
      previous.side === current.side;

    if (unchanged) {
      actions.push({ kind: 'keep', commentId: previous.commentId, finding });
      continue;
    }

    if (REPLACE_SEVERITIES.has(finding.severity)) {
      actions.push({
        kind: 'replace',
        commentId: previous.commentId,
        finding,
        body: render(finding),
      });
      continue;
    }

    // 其余级别不为了一条已存在的意见再打扰一次通知
    outdatedKept += 1;
    actions.push({ kind: 'keep', commentId: previous.commentId, finding });
    warnings.push({
      kind: 'other',
      message: `「${finding.title}」的代码位置已变动，旧评论保留（平台会标记为过时）`,
      target: `${current?.path ?? previous.path}:${String(current?.line ?? previous.line ?? 0)}`,
    });
  }

  // 上一轮有、本轮没有：判定已修复
  for (const comment of options.existing) {
    if (comment.marker === null) continue;
    const fingerprint = comment.marker.fingerprint;
    if (inlineFingerprints.has(fingerprint)) continue;

    // 仍然存在、只是被路由到摘要的条目不算修复——结论没变，只是出口变了
    if (allFingerprints.has(fingerprint)) continue;

    if (comment.resolved) continue;

    actions.push({ kind: 'resolve', commentId: comment.commentId, finding: null });
  }

  return { actions, warnings, outdatedKept };
}

/** 已修复评论的正文前缀。保留原文，只在最前面加一行说明。 */
export function resolvedNotice(isoTime: string): string {
  return `> 该问题已在后续提交中修复（${isoTime}）。`;
}
