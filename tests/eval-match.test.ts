import { describe, expect, it } from 'vitest';

import type { ActualFinding, ExpectedFinding } from '../src/core/eval/match.js';
import { matchFindings } from '../src/core/eval/match.js';

function want(
  line: number,
  category: string,
  reviewer: ExpectedFinding['reviewer'] = 'correctness',
): ExpectedFinding {
  return { line, category, reviewer };
}

function got(
  fingerprint: string,
  line: number,
  category: string,
  reviewer: ActualFinding['reviewer'] = 'correctness',
): ActualFinding {
  return { fingerprint, line, category, reviewer, severity: 'major' };
}

describe('评测匹配：严格', () => {
  it('行号相同、类别相同算严格命中', () => {
    const result = matchFindings([want(56, 'boundary')], [got('a', 56, 'boundary')]);

    expect(result.strict).toHaveLength(1);
    expect(result.strict[0]?.exact).toBe(true);
    expect(result.missed).toEqual([]);
    expect(result.falsePositives).toEqual([]);
  });

  it('容差内算命中，但标记为非精确', () => {
    const result = matchFindings([want(56, 'boundary')], [got('a', 54, 'boundary')]);

    expect(result.strict).toHaveLength(1);
    expect(result.strict[0]?.exact).toBe(false);
    expect(result.strict[0]?.lineDelta).toBe(-2);
  });

  it('超出容差既算漏报也算误报', () => {
    const result = matchFindings([want(56, 'boundary')], [got('a', 60, 'boundary')]);

    expect(result.strict).toEqual([]);
    expect(result.missed).toEqual([0]);
    expect(result.falsePositives).toEqual(['a']);
  });

  it('容差可配，设 0 时只认完全相等', () => {
    const tolerant = matchFindings([want(56, 'boundary')], [got('a', 55, 'boundary')]);
    const exactOnly = matchFindings([want(56, 'boundary')], [got('a', 55, 'boundary')], {
      lineTolerance: 0,
    });

    expect(tolerant.strict).toHaveLength(1);
    expect(exactOnly.strict).toEqual([]);
  });
});

describe('评测匹配：类别报错', () => {
  it('位置对、维度对、类别错 → 算宽松命中，不算严格命中也不算误报', () => {
    const result = matchFindings([want(56, 'boundary')], [got('a', 56, 'logic')]);

    expect(result.strict).toEqual([]);
    expect(result.loose).toHaveLength(1);
    expect(result.loose[0]).toMatchObject({
      expectedCategory: 'boundary',
      actualCategory: 'logic',
    });
    // 关键：它不能同时被算成误报，否则一个「归错类」会同时扣召回和精确率，双重惩罚
    expect(result.falsePositives).toEqual([]);
  });

  it('维度都不同 → 既不是命中也不是宽松命中，算误报', () => {
    const result = matchFindings(
      [want(56, 'boundary', 'correctness')],
      [got('a', 56, 'boundary', 'security')],
    );

    expect(result.strict).toEqual([]);
    expect(result.loose).toEqual([]);
    expect(result.falsePositives).toEqual(['a']);
  });

  it('严格匹配优先：类别相同的条目不会被行号更近的错类别抢走', () => {
    const result = matchFindings(
      [want(56, 'boundary')],
      [got('near-wrong', 56, 'logic'), got('far-right', 58, 'boundary')],
    );

    // 若实现先做宽松匹配，near-wrong 会先占位（距离 0），far-right 变成多余。
    // 严格命中能拿到 far-right，就证明顺序是对的。
    expect(result.strict.map((hit) => hit.fingerprint)).toEqual(['far-right']);
    // near-wrong 是「同一处问题的重复报告 + 归错类」，它没对上任何期望，算误报
    expect(result.falsePositives).toEqual(['near-wrong']);
  });
});

describe('评测匹配：一条结论只能用一次', () => {
  it('两条期望抢同一条结论时，近的拿到，远的算漏', () => {
    const result = matchFindings(
      [want(50, 'boundary'), want(56, 'boundary')],
      [got('a', 55, 'boundary')],
    );

    // 55 距 56 更近（1 行），距 50 有 5 行
    expect(result.strict).toHaveLength(1);
    expect(result.strict[0]?.expectedIndex).toBe(1);
    expect(result.missed).toEqual([0]);
    expect(result.falsePositives).toEqual([]);
  });

  it('同一条结论不会同时命中两条期望', () => {
    const result = matchFindings(
      [want(56, 'boundary'), want(56, 'boundary')],
      [got('a', 56, 'boundary')],
    );

    expect(result.strict).toHaveLength(1);
    expect(result.missed).toHaveLength(1);
  });
});

describe('评测匹配：空集', () => {
  it('没有期望也没有产出时，两边都空（这是「干净通过」，不是「没测」）', () => {
    const result = matchFindings([], []);

    expect(result.strict).toEqual([]);
    expect(result.missed).toEqual([]);
    expect(result.falsePositives).toEqual([]);
  });

  it('有期望没产出 → 全漏，没有误报', () => {
    const result = matchFindings([want(56, 'boundary')], []);

    expect(result.missed).toEqual([0]);
    expect(result.falsePositives).toEqual([]);
  });

  it('没期望有产出 → 全误报', () => {
    const result = matchFindings([], [got('a', 56, 'boundary')]);

    expect(result.missed).toEqual([]);
    expect(result.falsePositives).toEqual(['a']);
  });
});
