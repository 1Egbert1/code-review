import { describe, expect, it } from 'vitest';

import type { ContextSegment } from '../src/contracts/context.js';
import { applyBudget } from '../src/core/context/budget.js';
import { estimateTokens } from '../src/core/context/tokens.js';

function segment(tier: ContextSegment['tier'], title: string, tokens: number): ContextSegment {
  return { tier, path: 'src/a.ts', title, content: '', estimatedTokens: tokens };
}

describe('token 估算', () => {
  it('空串为零', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('纯 ASCII 按 4 字符 1 token 向上取整', () => {
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
  });

  it('中文按一字一 token', () => {
    expect(estimateTokens('十个中文字符啊')).toBe(7);
  });

  it('中英混排分别累计', () => {
    // 4 个宽字符 + 8 个窄字符 = 4 + 2
    expect(estimateTokens('代码审查abcdabcd')).toBe(6);
  });
});

describe('预算裁剪', () => {
  it('预算足够时不砍任何段', () => {
    const bundle = applyBudget([segment('L0', 'l0', 100), segment('L3', 'l3', 100)], {
      budgetTokens: 1000,
      reservedTokens: 0,
    });

    expect(bundle.trim.dropped).toHaveLength(0);
    expect(bundle.trim.usedTokens).toBe(200);
    expect(bundle.trim.overBudget).toBe(false);
  });

  it('L3 最先被砍', () => {
    const bundle = applyBudget(
      [segment('L0', 'l0', 100), segment('L1', 'l1', 100), segment('L3', 'l3', 100)],
      { budgetTokens: 200, reservedTokens: 0 },
    );

    expect(bundle.trim.dropped.map((item) => item.tier)).toEqual(['L3']);
    expect(bundle.segments.map((item) => item.tier)).toEqual(['L0', 'L1']);
  });

  it('砍除顺序为 L3 → L2 → L1 → L4', () => {
    const bundle = applyBudget(
      [
        segment('L0', 'l0', 10),
        segment('L1', 'l1', 10),
        segment('L2', 'l2', 10),
        segment('L3', 'l3', 10),
        segment('L4', 'l4', 10),
      ],
      { budgetTokens: 20, reservedTokens: 0 },
    );

    expect(bundle.trim.dropped.map((item) => item.tier)).toEqual(['L3', 'L2', 'L1']);
  });

  it('L0 永不砍：只剩它且仍超预算时标记 overBudget', () => {
    const bundle = applyBudget([segment('L0', 'l0', 500)], {
      budgetTokens: 100,
      reservedTokens: 0,
    });

    expect(bundle.segments).toHaveLength(1);
    expect(bundle.segments[0]?.tier).toBe('L0');
    expect(bundle.trim.overBudget).toBe(true);
  });

  it('同层内先砍大的，小的能留下来', () => {
    const bundle = applyBudget(
      [segment('L0', 'l0', 50), segment('L4', 'big', 300), segment('L4', 'small', 30)],
      { budgetTokens: 100, reservedTokens: 0 },
    );

    expect(bundle.trim.dropped.map((item) => item.title)).toEqual(['big']);
    expect(bundle.segments.map((item) => item.title)).toEqual(['l0', 'small']);
  });

  it('输出按 L0 在前排序，同层保持传入顺序', () => {
    const bundle = applyBudget(
      [segment('L4', 'a', 1), segment('L0', 'b', 1), segment('L1', 'c', 1), segment('L1', 'd', 1)],
      { budgetTokens: 100, reservedTokens: 0 },
    );

    expect(bundle.segments.map((item) => item.title)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('预算为零时只留 L0', () => {
    const bundle = applyBudget([segment('L0', 'l0', 10), segment('L4', 'l4', 10)], {
      budgetTokens: 0,
      reservedTokens: 0,
    });

    expect(bundle.segments.map((item) => item.title)).toEqual(['l0']);
  });
});
