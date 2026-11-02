/**
 * 评论正文渲染。
 *
 * 两条硬规则：
 * 1. **标记永远在最后一行。** 平台可能在正文前后追加内容，标记在末尾更容易被完整保留；
 *    在开头被截断一次，下一轮就认不出这条是自己的了。
 * 2. **正文只呈现结论，不重新解释。** 渲染层不调用模型、不改措辞——
 *    一旦这里能「润色」，前面所有的定位与去重都可能被一次改写绕过。
 */

import type { Finding, ReviewerId, Severity } from '../../contracts/finding.js';
import type { CommentMarker } from '../../contracts/result.js';
import { renderMarker } from '../reconcile/markers.js';

const SEVERITY_LABEL: Readonly<Record<Severity, string>> = {
  blocker: '严重',
  major: '主要',
  minor: '次要',
  nit: '提示',
};

/** 维度名，用于摘要分组与标记。 */
export const REVIEWER_LABEL: Readonly<Record<ReviewerId, string>> = {
  correctness: '正确性',
  security: '安全性',
  convention: '规范性',
};

export function severityLabel(severity: Severity): string {
  return SEVERITY_LABEL[severity];
}

/** 从问题项构造评论标记。提示词版本与模型都记上，便于追溯结论差异。 */
export function markerFor(
  finding: Finding,
  meta: { readonly promptVersion: string; readonly model: string },
): CommentMarker {
  return {
    version: 'v1',
    fingerprint: finding.fingerprint,
    reviewer: finding.reviewer,
    scope: finding.scope,
    promptVersion: meta.promptVersion,
    model: meta.model,
  };
}

export interface RenderOptions {
  readonly promptVersion: string;
  readonly model: string;
}

/** 渲染一条行内评论。 */
export function renderInlineBody(finding: Finding, options: RenderOptions): string {
  const blocks: string[] = [];

  blocks.push(
    `**${finding.title}** \`${severityLabel(finding.severity)}\` · ${REVIEWER_LABEL[finding.reviewer]}`,
  );

  blocks.push(finding.body);

  if (finding.evidence.trim() !== '') {
    blocks.push(['```', finding.evidence, '```'].join('\n'));
  }

  if (finding.suggestion !== null && finding.suggestion.trim() !== '') {
    blocks.push(`**建议**：${finding.suggestion}`);
  }

  blocks.push(renderMarker(markerFor(finding, options)));

  return blocks.join('\n\n');
}
