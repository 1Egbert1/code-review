/**
 * 跨轮次检查点：只审「上次审到哪」之后的新提交。
 *
 * 这个功能的价值很具体——在长期分支上，第二轮往往只加了一个提交，却要重审全部改动。
 * 但它的风险也很具体：**一旦判断错了，后果是安静地漏审**。多花钱没人会怪你，漏审会。
 *
 * 所以设计原则只有一条：**fail-closed**。六种存疑情况一律退回全量，不做任何「大概没问题」的推测。
 * 这条比省下来的钱重要得多——省一次是几毛钱，漏一个 bug 是事故。
 *
 * 另一条容易忽略的边界：检查点只决定**审哪一段改动**，不改变「每次都要重新解析、
 * 重新算行号」这条铁律。它省的是模型调用，不是位置计算。
 */

import { createHash } from 'node:crypto';

import type { ResolvedConfig } from '../../contracts/config.js';

/** 检查点允许的版本。格式变动必须升号，旧标记会被当作「读不出」而不是硬解析。 */
export const CHECKPOINT_VERSION = 'v1';

/** 检查点写在摘要评论正文里，与摘要标记并存。 */
const CHECKPOINT_PATTERN = /<!--\s*acr:v1\|kind=checkpoint\|([^>]*?)-->/;

export interface CheckpointState {
  readonly version: string;
  /** 上一轮审到的头部提交 */
  readonly headSha: string;
  /** 上一轮的对比基准 */
  readonly baseSha: string;
  /** 配置指纹：维度开关与严重度下限变了，结论就不可比 */
  readonly configHash: string;
  /** 提示词版本指纹：改了提示词，两轮结论也不能直接比 */
  readonly promptHash: string;
  readonly reviewedAt: string;
}

/** 退回全量的原因。区分它们是为了让「为什么这次全量」可解释。 */
export type CheckpointFallbackReason =
  | 'disabled'
  | 'no-summary'
  | 'foreign-author'
  | 'unparsable'
  | 'base-moved'
  | 'basis-changed'
  | 'not-ancestor'
  | 'nothing-new';

export type CheckpointDecision =
  | { readonly use: false; readonly reason: CheckpointFallbackReason; readonly detail: string }
  | { readonly use: true; readonly from: string; readonly to: string };

/** 渲染检查点标记。数值全部是十六进制或 ISO 时间，不含会破坏注释语法的字符。 */
export function renderCheckpoint(state: CheckpointState): string {
  const fields = [
    `kind=checkpoint`,
    `head=${state.headSha}`,
    `base=${state.baseSha}`,
    `cfg=${state.configHash}`,
    `pv=${state.promptHash}`,
    `at=${state.reviewedAt}`,
  ];
  return `<!-- acr:v1|${fields.join('|')} -->`;
}

/** 从摘要正文里读出检查点；读不出或版本不符时返回 null（由调用方退回全量）。 */
export function parseCheckpoint(body: string): CheckpointState | null {
  const match = CHECKPOINT_PATTERN.exec(body);
  if (match === null) return null;

  const fields = new Map<string, string>();
  for (const segment of (match[1] ?? '').split('|')) {
    const index = segment.indexOf('=');
    if (index <= 0) continue;
    fields.set(segment.slice(0, index).trim(), segment.slice(index + 1).trim());
  }

  const headSha = fields.get('head');
  const baseSha = fields.get('base');
  const configHash = fields.get('cfg');
  const promptHash = fields.get('pv');
  if (headSha === undefined || baseSha === undefined) return null;
  if (configHash === undefined || promptHash === undefined) return null;

  return {
    version: CHECKPOINT_VERSION,
    headSha,
    baseSha,
    configHash,
    promptHash,
    reviewedAt: fields.get('at') ?? '',
  };
}

function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex').slice(0, 16);
}

/**
 * 配置指纹。
 *
 * 只取会影响结论的部分：维度开关、严重度下限、模型名。
 * 把 maxInlineComments 这类纯展示参数也算进来的话，改个条数上限就会白白全量重审一遍。
 */
export function computeConfigHash(config: ResolvedConfig): string {
  const dimensions = Object.entries(config.review.dimensions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, setting]) => [name, setting.enabled, setting.severityFloor]);

  return stableHash({ dimensions, model: config.llm.model });
}

/** 提示词版本指纹。 */
export function computePromptHash(versions: Readonly<Record<string, string>>): string {
  const sorted = Object.entries(versions).sort(([a], [b]) => a.localeCompare(b));
  return stableHash(sorted);
}

export interface CheckpointInput {
  readonly enabled: boolean;
  /** 已有的摘要评论；正文与作者都要 */
  readonly summary: { readonly body: string; readonly author: string } | null;
  /**
   * 本次使用的令牌对应的账号。
   * 为 null 表示判断不了作者 —— 判断不了就是存疑，按 fail-closed 退回全量。
   */
  readonly expectedAuthor: string | null;
  readonly current: {
    readonly headSha: string;
    readonly baseSha: string;
    readonly configHash: string;
    readonly promptHash: string;
  };
  /** 证明上一轮头部是当前头部的祖先。无法证明（含抛错）一律视为否。 */
  readonly isAncestor: (previousHead: string, currentHead: string) => Promise<boolean>;
}

/**
 * 判断能否使用检查点。
 *
 * 六条检查对应规格书 8.6 的六种情况，顺序无关紧要——任意一条不通过就退回全量。
 */
export async function decideCheckpoint(input: CheckpointInput): Promise<CheckpointDecision> {
  if (!input.enabled) return { use: false, reason: 'disabled', detail: '未启用检查点' };

  if (input.summary === null) {
    return { use: false, reason: 'no-summary', detail: '没有找到上一轮的摘要评论' };
  }

  if (input.expectedAuthor === null) {
    return { use: false, reason: 'foreign-author', detail: '无法确认摘要作者，按存疑处理' };
  }

  if (input.summary.author !== input.expectedAuthor) {
    return {
      use: false,
      reason: 'foreign-author',
      detail: `摘要由 ${input.summary.author} 发布，不是本令牌（${input.expectedAuthor}）`,
    };
  }

  const state = parseCheckpoint(input.summary.body);
  if (state === null) {
    return { use: false, reason: 'unparsable', detail: '摘要里读不出检查点，可能版本不符' };
  }

  if (state.baseSha !== input.current.baseSha) {
    return {
      use: false,
      reason: 'base-moved',
      detail: `基准分支已移动（${state.baseSha.slice(0, 7)} → ${input.current.baseSha.slice(0, 7)}），行号基准变了`,
    };
  }

  if (
    state.configHash !== input.current.configHash ||
    state.promptHash !== input.current.promptHash
  ) {
    return {
      use: false,
      reason: 'basis-changed',
      detail: '配置或提示词版本已变化，两轮结论不可比',
    };
  }

  if (state.headSha === input.current.headSha) {
    return { use: false, reason: 'nothing-new', detail: '头部未变化，没有新增提交' };
  }

  // 证明不了就是不信，不能因为一次接口抖动就默认「应该是祖先」
  const ancestor = await input.isAncestor(state.headSha, input.current.headSha).catch(() => false);

  if (!ancestor) {
    return {
      use: false,
      reason: 'not-ancestor',
      detail: '无法证明检查点是当前头部的祖先（可能被强推或变基）',
    };
  }

  return { use: true, from: state.headSha, to: input.current.headSha };
}
