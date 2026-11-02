/**
 * 评论正文里的隐藏标记：跨轮次识别「这条是我发的」以及追溯结论来源。
 *
 * 标记放在正文最后一行，渲染时对用户不可见。解析必须容错——
 * 读不懂就当成「不是本工具发的」，绝不动它。
 *
 * SPEC-GAP：规格书 8.2 定义了标记的五个字段，但 T-04 只需要指纹用于回读校验；
 * 其余字段一并实现，避免后续任务包回头改格式。
 */

import type { CommentMarker, ReviewerId, ReviewScope } from '../../contracts/index.js';

/** 标记格式版本。改动格式必须升级它，否则旧评论会被误判。 */
const MARKER_VERSION = 'v1';

const MARKER_PATTERN = /<!--\s*acr:(v\d+)\|([\s\S]*?)-->\s*$/;

const REVIEWER_IDS: readonly string[] = ['correctness', 'security', 'convention'];
const SCOPES: readonly string[] = ['changed', 'function', 'file'];

function isReviewerId(value: string): value is ReviewerId {
  return REVIEWER_IDS.includes(value);
}

function isScope(value: string): value is ReviewScope {
  return SCOPES.includes(value);
}

/** 把标记渲染成可以拼在正文末尾的一行。 */
export function renderMarker(marker: CommentMarker): string {
  const parts = [
    `acr:${marker.version}`,
    `fp=${marker.fingerprint}`,
    `rv=${marker.reviewer}`,
    `sc=${marker.scope}`,
    `pv=${marker.promptVersion}`,
    `md=${marker.model}`,
  ];
  return `<!-- ${parts.join('|')} -->`;
}

/**
 * 从评论正文中解析标记。
 *
 * @returns 解析失败或版本不符时返回 null——调用方据此判定「非本工具评论」，永不动它
 */
export function parseMarker(body: string): CommentMarker | null {
  const match = MARKER_PATTERN.exec(body);
  if (match === null) return null;

  const version = match[1];
  const payload = match[2];
  if (version !== MARKER_VERSION || payload === undefined) return null;

  const fields = new Map<string, string>();
  for (const segment of payload.split('|')) {
    const index = segment.indexOf('=');
    if (index <= 0) continue;
    // 标记写成 `<!-- acr:v1|...|md=x -->`，最后一段会带一个空格，必须裁掉
    fields.set(segment.slice(0, index).trim(), segment.slice(index + 1).trim());
  }

  const fingerprint = fields.get('fp');
  const reviewer = fields.get('rv');
  const scope = fields.get('sc');
  const promptVersion = fields.get('pv');
  const model = fields.get('md');

  if (
    fingerprint === undefined ||
    reviewer === undefined ||
    scope === undefined ||
    promptVersion === undefined ||
    model === undefined
  ) {
    return null;
  }

  if (!isReviewerId(reviewer) || !isScope(scope)) return null;

  return {
    version: MARKER_VERSION,
    fingerprint,
    reviewer,
    scope,
    promptVersion,
    model,
  };
}

/** 从正文里去掉标记，得到用户可见的部分。用于比较正文是否被平台改写。 */
export function stripMarker(body: string): string {
  return body.replace(MARKER_PATTERN, '').trimEnd();
}

/**
 * 摘要评论的固定标记。
 *
 * 与行内评论的标记分开，因为它没有指纹也没有位置——它只是一个「这条是本工具的摘要」的信号。
 * 靠它实现「有则编辑、无则新建」，否则每轮都会多一条摘要，PR 很快被刷屏。
 */
export const SUMMARY_MARKER = '<!-- acr:v1|kind=summary -->';

/** 判断一段正文是不是本工具的摘要评论。 */
export function isSummaryBody(body: string): boolean {
  return body.includes(SUMMARY_MARKER);
}
