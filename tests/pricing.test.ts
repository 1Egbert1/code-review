import { describe, expect, it } from 'vitest';

import type { PricingConfig } from '../src/contracts/config.js';
import type { TokenUsage } from '../src/contracts/result.js';
import { compareCost, computeCost, formatUsd } from '../src/core/cost/pricing.js';

const PRICING: PricingConfig = {
  inputPerMTok: 1,
  outputPerMTok: 4,
  cacheWriteShortMultiplier: 1.25,
  cacheWriteLongMultiplier: 2,
  cacheReadMultiplier: 0.1,
};

function usage(overrides: Partial<TokenUsage> = {}): TokenUsage {
  return {
    uncachedInput: 0,
    cacheWriteShort: 0,
    cacheWriteLong: 0,
    cacheRead: 0,
    output: 0,
    ...overrides,
  };
}

describe('五项分别计价', () => {
  it('未缓存输入按原价', () => {
    const cost = computeCost(usage({ uncachedInput: 1_000_000 }), PRICING);
    expect(cost?.uncachedInput).toBeCloseTo(1);
    expect(cost?.total).toBeCloseTo(1);
  });

  it('缓存写入按倍率加价，短有效期与长有效期不同', () => {
    const cost = computeCost(
      usage({ cacheWriteShort: 1_000_000, cacheWriteLong: 1_000_000 }),
      PRICING,
    );
    expect(cost?.cacheWriteShort).toBeCloseTo(1.25);
    expect(cost?.cacheWriteLong).toBeCloseTo(2);
  });

  it('缓存读取按折扣计', () => {
    const cost = computeCost(usage({ cacheRead: 1_000_000 }), PRICING);
    expect(cost?.cacheRead).toBeCloseTo(0.1);
  });

  it('输出用输出单价，不与输入单价混用', () => {
    const cost = computeCost(usage({ output: 1_000_000 }), PRICING);
    expect(cost?.output).toBeCloseTo(4);
  });

  it('总额等于五项之和', () => {
    const cost = computeCost(
      usage({
        uncachedInput: 500_000,
        cacheWriteShort: 200_000,
        cacheRead: 800_000,
        output: 100_000,
      }),
      PRICING,
    );
    const sum =
      (cost?.uncachedInput ?? 0) +
      (cost?.cacheWriteShort ?? 0) +
      (cost?.cacheWriteLong ?? 0) +
      (cost?.cacheRead ?? 0) +
      (cost?.output ?? 0);
    expect(cost?.total).toBeCloseTo(sum);
  });
});

describe('未配置单价', () => {
  it('返回 null，而不是 0——「不知道」和「零」是两件事', () => {
    expect(computeCost(usage({ uncachedInput: 1000 }), null)).toBeNull();
  });
});

describe('成本对比', () => {
  it('给出每项的相对变化，能看出省在哪', () => {
    const before = computeCost(usage({ uncachedInput: 1_000_000, output: 100_000 }), PRICING);
    const after = computeCost(
      usage({ uncachedInput: 400_000, cacheRead: 600_000, output: 100_000 }),
      PRICING,
    );
    if (before === null || after === null) throw new Error('价格未配置');

    const deltas = compareCost(before, after);
    const uncached = deltas.find((delta) => delta.field === 'uncachedInput');
    const read = deltas.find((delta) => delta.field === 'cacheRead');

    expect(uncached?.changeRatio).toBeCloseTo(-0.6);
    // 从无到有时百分比没有意义，给 null 而不是 Infinity
    expect(read?.changeRatio).toBeNull();
    expect(after.total).toBeLessThan(before.total);
  });
});

describe('金额展示', () => {
  it('小额保留足够有效位，避免显示成 0', () => {
    expect(formatUsd(0)).toBe('$0');
    expect(formatUsd(0.000012)).not.toBe('$0');
    expect(formatUsd(0.000012)).toContain('e');
    expect(formatUsd(0.0623)).toBe('$0.062');
  });
});
