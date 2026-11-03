/**
 * 流程产出相关的契约：「取」的快照、「对」的动作、「发」的结果。
 *
 * SPEC-GAP：规格书 3.3 只给了 Usage 的输入/输出两个数，但 21.2 要求成本必须按
 * 「未缓存输入 / 缓存写入短 / 缓存写入长 / 缓存读取 / 输出」五类拆开呈现，
 * 否则无法判断省在哪。这里按 21.2 把用量拆成 {@link TokenUsage}，Usage 保留总额。
 *
 * SPEC-GAP：规格书 16.8 要求输出覆盖率台账、12.1 要求输出丢弃与告警，
 * 但 3.3 的 ReviewResult 没有对应字段。这里补 {@link CoverageSummary} 与 {@link ReviewWarning}。
 */

import type { ParsedDiff } from './diff.js';
import type { Finding, Rejection, ReviewerId, ReviewScope } from './finding.js';

/** 平台上已存在的一条本工具评论。 */
export interface ExistingComment {
  /** 平台侧的评论标识 */
  readonly commentId: string;
  /** 解析自评论正文的隐藏标记；null 表示不是本工具发的，永不动它 */
  readonly marker: CommentMarker | null;
  /** 评论创建时记录的行号（平台原值，不会随代码变动而更新） */
  readonly line: number | null;
  readonly side: 'new' | 'old';
  readonly path: string;
  /** 人工是否已标记为已解决 */
  readonly resolved: boolean;
  /** 平台是否已标记该评论过时 */
  readonly outdated: boolean;
}

/** 评论正文末尾的隐藏身份标记，用于跨轮次识别与追溯。 */
export interface CommentMarker {
  readonly version: 'v1';
  readonly fingerprint: string;
  readonly reviewer: ReviewerId;
  readonly scope: ReviewScope;
  /** 产出这条评论时的提示词版本，用于追溯结论差异 */
  readonly promptVersion: string;
  /** 实际使用的模型（被路由降档时与默认模型不同） */
  readonly model: string;
}

/** 「取」这一步的全部产出。 */
export interface DiffSnapshot {
  readonly diff: ParsedDiff;
  /** 文件路径 → 改动后完整内容；取不到或未取时为 null */
  readonly fileContents: ReadonlyMap<string, string | null>;
  /** 平台上已存在的、由本工具发出的评论 */
  readonly existingComments: readonly ExistingComment[];
  /** 仓库约定文件内容（贡献指南等），无则 null */
  readonly conventions: string | null;
  /** 依赖清单与构建配置的摘要，供安全审核判断；无则 null */
  readonly buildContext: string | null;
}

/**
 * 发送动作。
 *
 * create 显式带 target 而不是由下游按 scope 推断：审计时需要一眼看出这条去了哪。
 */
export type PublishAction =
  | {
      readonly kind: 'create';
      /** 发到行内还是摘要区 */
      readonly target: 'inline' | 'summary';
      readonly finding: Finding;
      readonly body: string;
    }
  | { readonly kind: 'keep'; readonly commentId: string; readonly finding: Finding }
  | {
      readonly kind: 'replace';
      readonly commentId: string;
      readonly finding: Finding;
      readonly body: string;
    }
  | { readonly kind: 'resolve'; readonly commentId: string; readonly finding: Finding | null };

/** 用量按计价口径拆分。五类各自单价不同，混成一个总数就算不出真实成本。 */
export interface TokenUsage {
  /** 未命中缓存的输入 */
  readonly uncachedInput: number;
  /** 缓存写入，短有效期 */
  readonly cacheWriteShort: number;
  /** 缓存写入，长有效期 */
  readonly cacheWriteLong: number;
  /** 缓存读取 */
  readonly cacheRead: number;
  readonly output: number;
}

/** 一轮运行的用量与费用。 */
export interface Usage {
  readonly calls: number;
  readonly tokens: TokenUsage;
  /**
   * 按配置单价折算的金额（美元）。
   * 未配置单价时为 null——**不得用 0 代替**，0 会让人误以为免费。
   */
  readonly estimatedCostUsd: number | null;
  /** 是否因预算上限提前中止 */
  readonly truncatedByBudget: boolean;
}

/** 覆盖率台账。运行终态由它推导，而不是由「是否出现过错误」推导。 */
export interface CoverageSummary {
  /** 派发前冻结的分母 */
  readonly planned: number;
  /** 产出了结果的条目 */
  readonly completed: number;
  /** 命中跳过规则 */
  readonly skipped: number;
  /** 调用失败或输出非法 */
  readonly failed: number;
  /** 检查点命中，未重跑 */
  readonly reused: number;
}

/** 不影响整体成败、但用户必须知道的告警。 */
export interface ReviewWarning {
  readonly kind:
    /** 发送后回读校验失败（平台可能静默改写了内容） */
    | 'readback'
    /** 权限不足，某项操作降级 */
    | 'permission'
    /** 输出被长度限制截断 */
    | 'truncated'
    /** 预算或配额触顶 */
    | 'budget'
    /** 历史评论读取失败，本轮可能重复发 */
    | 'history'
    | 'other';
  readonly message: string;
  /** 相关对象，如文件路径或评论标识；无则 null */
  readonly target: string | null;
}

/** 门禁结论摘要。完整判定过程在 gate 模块，这里只放结果需要展示的部分。 */
export interface GateSummary {
  readonly conclusion: 'success' | 'failure' | 'neutral';
  readonly blockers: number;
  readonly exempted: number;
  readonly title: string;
}

/** 一轮审查的完整结果。 */
export interface ReviewResult {
  /** 全部通过校验的问题项；summaryOnly 是它的子集，不是另一份数据 */
  readonly findings: readonly Finding[];
  /** findings 中只进摘要、不进行内的那部分（存量问题、函数级、文件级） */
  readonly summaryOnly: readonly Finding[];
  readonly rejections: readonly Rejection[];
  readonly actions: readonly PublishAction[];
  readonly summaryMarkdown: string;
  readonly coverage: CoverageSummary;
  readonly usage: Usage;
  readonly warnings: readonly ReviewWarning[];
  /** 门禁未启用时为 null */
  readonly gate: GateSummary | null;
  /** ISO 时间戳 */
  readonly startedAt: string;
  /** ISO 时间戳 */
  readonly finishedAt: string;
}
