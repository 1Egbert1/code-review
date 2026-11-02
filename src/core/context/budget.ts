/**
 * 上下文预算裁剪。
 *
 * 规则来自规格书 9.5：按层砍，从最外围开始，L0（改动行本身）永不砍。
 *
 * 两个不显然的实现决定：
 *
 * 1. **同层内按体积从大到小砍。** 一次砍掉整层会浪费预算——可能把一个 3000 token 的
 *    整文件段砍掉就够了，没必要连带砍掉三个 200 token 的函数段。
 * 2. **被砍的段要记账，不能静默。** 材料不全时审核员的结论会变形（漏报跨函数问题），
 *    用户必须能在报告里看到「这次砍了 3 处上下文」，否则会以为工具就是没看出来。
 */

import type {
  ContextBundle,
  ContextSegment,
  ContextTier,
  DroppedSegment,
} from '../../contracts/context.js';

/** 砍除顺序：L3 最先，L0 永不砍（不在表内）。 */
const DROP_ORDER: readonly ContextTier[] = ['L3', 'L2', 'L1', 'L4'];

/** 保留时的排序权重：L0 在前。 */
const KEEP_RANK: Readonly<Record<ContextTier, number>> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

export interface BudgetInput {
  /** 本文件可用的 token 预算，已扣除提示词固定开销 */
  readonly budgetTokens: number;
  /** 从总预算中预留的提示词固定开销，仅用于记录 */
  readonly reservedTokens: number;
}

/**
 * 把段裁到预算之内。
 *
 * 返回的顺序固定为 L0 → L4，同层保持传入顺序，便于提示词按稳定顺序拼接
 * （顺序不稳会破坏缓存命中，见规格书 21.4）。
 */
export function applyBudget(
  segments: readonly ContextSegment[],
  input: BudgetInput,
): ContextBundle {
  const budget = Math.max(0, input.budgetTokens);
  const kept = [...segments];
  const dropped: DroppedSegment[] = [];

  let used = kept.reduce((sum, segment) => sum + segment.estimatedTokens, 0);

  for (const tier of DROP_ORDER) {
    if (used <= budget) break;

    // 同层内先砍大的：用同样的预算砍掉更少的段，保留的信息更完整
    const candidates = kept
      .filter((segment) => segment.tier === tier)
      .sort((a, b) => b.estimatedTokens - a.estimatedTokens);

    for (const candidate of candidates) {
      if (used <= budget) break;
      const index = kept.indexOf(candidate);
      if (index < 0) continue;
      kept.splice(index, 1);
      used -= candidate.estimatedTokens;
      dropped.push({
        tier: candidate.tier,
        path: candidate.path,
        title: candidate.title,
        estimatedTokens: candidate.estimatedTokens,
      });
    }
  }

  kept.sort((a, b) => KEEP_RANK[a.tier] - KEEP_RANK[b.tier]);

  return {
    segments: kept,
    trim: {
      budgetTokens: budget,
      reservedTokens: input.reservedTokens,
      usedTokens: used,
      dropped,
      // 只剩 L0 仍超预算：材料已经不全，下游必须在报告里说明
      overBudget: used > budget,
    },
  };
}
