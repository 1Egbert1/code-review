/**
 * 上下文装配的契约。
 *
 * SPEC-GAP：规格书 9.5 给了四层上下文与砍除顺序，但第 3 章没有对应类型。
 * 这里补上，因为「喂多少材料」直接决定成本与结论质量，必须可断言、可追溯。
 *
 * 设计要点：段是**扁平**的，用 `path` 标明归属。L3（仓库约定）的 path 为 null，
 * 因为它不属于任何单个文件。这样裁剪算法对所有段一视同仁，不需要为「全局段」写特例。
 */

/**
 * 上下文层级。数字越大越外围，越先被砍。
 *
 * L0 改动行、L1 所在函数、L2 被引用符号签名、L3 仓库约定、L4 文件其余部分。
 */
export type ContextTier = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

/** 一段送入模型的材料。 */
export interface ContextSegment {
  readonly tier: ContextTier;
  /** 所属文件；仓库级内容（L3 约定、构建上下文）为 null */
  readonly path: string | null;
  /** 展示用标题，如「所在函数 handleUpload()」；同时进裁剪日志，便于解释砍了什么 */
  readonly title: string;
  readonly content: string;
  /**
   * 估算 token 数。
   * 估算而非精确：只用于裁剪决策。**计费一律以接口返回的用量为准**，不得用这个数字算钱。
   */
  readonly estimatedTokens: number;
}

/** 因超预算被砍掉的一段。 */
export interface DroppedSegment {
  readonly tier: ContextTier;
  readonly path: string | null;
  readonly title: string;
  readonly estimatedTokens: number;
}

/** 裁剪记录。必须能回答「这次砍了什么、为什么砍」。 */
export interface TrimRecord {
  /** 可用预算（已扣除提示词固定开销） */
  readonly budgetTokens: number;
  /** 提示词固定开销，从预算中预留 */
  readonly reservedTokens: number;
  /** 裁剪后实际占用 */
  readonly usedTokens: number;
  /** 按被砍顺序列出，便于解释「为什么这条信息不够」 */
  readonly dropped: readonly DroppedSegment[];
  /** L0 单独就超出预算时为真：材料已不全，下游必须在报告里标注 */
  readonly overBudget: boolean;
}

/** 一次装配的产物。审核员只读它，不自己决定看什么。 */
export interface ContextBundle {
  /** 按保留优先级排列：L0 在前，L4 在末 */
  readonly segments: readonly ContextSegment[];
  readonly trim: TrimRecord;
}
