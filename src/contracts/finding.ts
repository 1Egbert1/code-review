/**
 * 问题项相关的契约。
 *
 * 三层区分必须守住：
 * - {@link RawFinding}：审核员直接吐出的原始输出，位置只有裸行号，**一律不可信**；
 * - {@link Finding}：经「校」这一步校验并定位后的结果，全部派生字段由总控填充；
 * - {@link Rejection}：被校验拦下的条目及原因，用于统计与排查。
 *
 * 审核员绝不能产出 Finding——它拿不到指纹（需要确定性算法）、也判不了是否本次引入。
 */

import type { LineAnchor } from './diff.js';

/** 审核员标识。每一维有独立的提示词与字段规范。 */
export type ReviewerId = 'correctness' | 'security' | 'convention';

/** 严重度。四级分流决定出口：行内评论 / 摘要 / 仅计数。 */
export type Severity = 'blocker' | 'major' | 'minor' | 'nit';

/** 审查范围。决定问题项能落到哪：只有 changed 能进行内评论。 */
export type ReviewScope = 'changed' | 'function' | 'file';

/**
 * 位置最终由哪条路径确定，用于度量双轨定位的健康度。
 *
 * 如果绝大多数都是 model-line，说明提示词里的行号指示有效；
 * 如果 evidence-* 占比很高，说明模型数行号不可靠，正在靠证据兜底——该去改提示词了。
 */
export type PositionOrigin =
  /** 模型给的行号合法，且该行内容与证据一致，直接采用 */
  | 'model-line'
  /** 行号不可用，在本文件的改动块内按证据搜索命中 */
  | 'evidence-hunk'
  /** 改动块内搜不到，在本文件全文中搜索命中 */
  | 'evidence-file'
  /** 原文件搜不到，在其他改动文件中唯一命中并整条搬移 */
  | 'evidence-crossfile';

/** 审核员的原始输出。位置不可信，必须经校验才能变成 {@link Finding}。 */
export interface RawFinding {
  /** 相对仓库根的文件路径 */
  readonly file: string;
  /** 行号 */
  readonly line: number;
  /** 这个行号指的是哪一侧：new 为改动后，old 为改动前 */
  readonly side: 'new' | 'old';
  readonly severity: Severity;
  /** 简短标题，不超过 60 字 */
  readonly title: string;
  /** 必须写清「什么条件下出问题 + 后果」 */
  readonly body: string;
  /** 必须逐字引用改动中的代码；不得改写、省略或加省略号 */
  readonly evidence: string;
  /** 建议改法；无建议为 null */
  readonly suggestion: string | null;
  /** 模型自评，0~1 */
  readonly confidence: number;
}

/** 校验通过的问题项。全部字段由总控填充，审核员不产出这些字段。 */
export interface Finding {
  /** 跨轮次稳定身份。不含行号，因此代码挪行不会导致重复发布，代码一改豁免自动失效 */
  readonly fingerprint: string;
  readonly reviewer: ReviewerId;
  readonly anchor: LineAnchor;
  /** 位置来自哪条路径，用于度量定位质量 */
  readonly positionOrigin: PositionOrigin;
  readonly severity: Severity;
  readonly title: string;
  readonly body: string;
  readonly evidence: string;
  readonly suggestion: string | null;
  readonly confidence: number;
  /** 是否为本次改动引入；false 表示早就在（摘要中必须分开呈现） */
  readonly preexisting: boolean;
  readonly scope: ReviewScope;
}

/**
 * 拦截原因码。
 *
 * 注意：**超限不是拦截原因**——超过行内配额的问题项会被路由到摘要，而不是丢弃。
 * 丢弃只发生在「这条问题项根本站不住」的情况下。
 */
export type RejectionReason =
  /** 声明的文件不在改动中，且跨文件搜索也未找到唯一归属 */
  | 'file-not-in-diff'
  /** 证据文本在任何改动块与任何改动文件中都不存在（模型编造或改写） */
  | 'evidence-mismatch'
  /** 证据存在但命中多处，无法确定唯一位置（不猜） */
  | 'unlocatable'
  /** 输出不符合该维度的字段规范 */
  | 'schema-invalid'
  /** 与本轮其他问题项重复 */
  | 'duplicate'
  /** 低于该维度设定的严重度下限 */
  | 'below-severity-floor';

/** 被校验拦下的问题项。 */
export interface Rejection {
  readonly reviewer: ReviewerId;
  /** 审核员声明的文件路径（可能并不存在于改动中） */
  readonly file: string;
  /** 审核员声明的行号 */
  readonly line: number;
  readonly title: string;
  readonly reason: RejectionReason;
  /** 人类可读的补充说明，用于排查是提示词问题还是模型问题 */
  readonly detail: string;
}
