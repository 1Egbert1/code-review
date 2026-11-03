/**
 * 计价。
 *
 * 为什么不能只算一个总额：只知道「这次花了 0.06 美元」什么都优化不了。
 * 必须能看出省在哪——是未缓存输入降了（材料变少），还是缓存读取涨了（前缀稳定），
 * 还是换了便宜模型（输出单价变了）。所以固定拆成五项。
 *
 * 两个刻意的设计：
 *
 * 1. **未配单价时返回 null，不返回 0。** 0 会让人以为免费，而「不知道」和「零」是两件事。
 * 2. **倍率来自配置，不内置。** 各家缓存定价不同（有的写入更贵、有的干脆没有写入费），
 *    写死任何一组数字都会在换厂商时算出一张假账单。
 */

import type { PricingConfig } from '../../contracts/config.js';
import type { CostBreakdown, TokenUsage } from '../../contracts/result.js';

export type { CostBreakdown };

const PER_MILLION = 1_000_000;

/**
 * 按五项分别计价。
 *
 * @returns 未配置单价时返回 null——**不要用 0 代替**
 */
export function computeCost(
  usage: TokenUsage,
  pricing: PricingConfig | null,
): CostBreakdown | null {
  if (pricing === null) return null;

  const inputPrice = pricing.inputPerMTok / PER_MILLION;
  const outputPrice = pricing.outputPerMTok / PER_MILLION;

  const uncachedInput = usage.uncachedInput * inputPrice;
  const cacheWriteShort = usage.cacheWriteShort * inputPrice * pricing.cacheWriteShortMultiplier;
  const cacheWriteLong = usage.cacheWriteLong * inputPrice * pricing.cacheWriteLongMultiplier;
  const cacheRead = usage.cacheRead * inputPrice * pricing.cacheReadMultiplier;
  const output = usage.output * outputPrice;

  return {
    uncachedInput,
    cacheWriteShort,
    cacheWriteLong,
    cacheRead,
    output,
    total: uncachedInput + cacheWriteShort + cacheWriteLong + cacheRead + output,
  };
}

export interface CostDelta {
  readonly field: keyof Omit<CostBreakdown, 'total'>;
  readonly before: number;
  readonly after: number;
  /** 相对变化；before 为 0 时为 null（从无到有，百分比没有意义） */
  readonly changeRatio: number | null;
}

/** 对比两次成本构成。用于「优化前后」这类问题。 */
export function compareCost(before: CostBreakdown, after: CostBreakdown): CostDelta[] {
  const fields: (keyof Omit<CostBreakdown, 'total'>)[] = [
    'uncachedInput',
    'cacheWriteShort',
    'cacheWriteLong',
    'cacheRead',
    'output',
  ];

  return fields.map((field) => {
    const left = before[field];
    const right = after[field];
    return {
      field,
      before: left,
      after: right,
      changeRatio: left === 0 ? null : (right - left) / left,
    };
  });
}

/** 美元金额的展示。金额常常很小，保留两位有效数字比固定小数位更有信息量。 */
export function formatUsd(value: number): string {
  if (value === 0) return '$0';
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  if (value >= 0.0001) return `$${value.toFixed(5)}`;
  return `$${value.toExponential(2)}`;
}
