/**
 * 评测匹配：把「模型报出来的」和「人工标注的」对上号。
 *
 * 这个模块的全部难点在一件事：**同一句话可以有两种对法，而两种对法的分数差很远**。
 *
 * | 情况 | 算不算命中 | 为什么 |
 * | --- | --- | --- |
 * | 行号相近 + 类别相同 | 严格命中 | 这就是标注时想要的结果 |
 * | 行号相近 + 类别不同 | 只算「维度内命中」 | 位置对了但归错类，是质量问题，不能算全对 |
 * | 行号差很远 + 类别相同 | 不算命中 | 说对了问题但指错了地方，评论贴过去是错的 |
 *
 * 把前两种混成一个「召回率」是最常见的自欺：改一版提示词，模型把 `boundary` 全说成 `logic`，
 * 召回率纹丝不动，而实际输出已经需要人工纠正每一类。
 *
 * 所以这里**先严格、后宽松**，两者分开统计。宽松匹配只在严格匹配用完剩余条目上做——
 * 顺序反了会让「类别不同但行号更近」的条目抢走本该严格命中的位置。
 */

import type { ReviewerId } from '../../contracts/finding.js';

/** 人工标注的一条期望结论。 */
export interface ExpectedFinding {
  /** 期望的行号（新版本一侧） */
  readonly line: number;
  /** 期望的类别，必须是该维度 schema 里的值 */
  readonly category: string;
  /** 所属维度。宽松匹配靠它判断「是不是在说同一类事」 */
  readonly reviewer: ReviewerId;
  readonly severity?: string;
  /** 给人看的说明，不参与匹配 */
  readonly note?: string;
}

/** 模型实际产出的一条结论。 */
export interface ActualFinding {
  readonly fingerprint: string;
  readonly line: number;
  readonly category: string;
  readonly reviewer: ReviewerId;
  readonly severity: string;
}

export interface MatchOptions {
  /**
   * 行号容差，默认 2。
   *
   * 为什么不设 0：模型对同一处缺陷的定位本身有波动（实测同一问题两轮可能报 55 行和 56 行）。
   * 设 0 会把「说对了但差一行」判成漏报，于是召回率反映的是「模型数行数的准确度」，
   * 而不是「有没有发现问题」。
   *
   * 为什么不超过 2：容差再放大，跨函数、跨分支的误配就会开始出现，
   * 那时「命中」这个说法就没有意义了。同时**精确命中单独统计**，容差不能用来掩盖定位问题。
   */
  readonly lineTolerance?: number;
}

export interface StrictHit {
  readonly expectedIndex: number;
  readonly fingerprint: string;
  /** 实际行号 - 期望行号 */
  readonly lineDelta: number;
  /** 行号完全相等 */
  readonly exact: boolean;
}

export interface LooseHit {
  readonly expectedIndex: number;
  readonly fingerprint: string;
  readonly expectedCategory: string;
  readonly actualCategory: string;
  readonly lineDelta: number;
}

export interface MatchResult {
  /** 行号在容差内且类别相同 */
  readonly strict: readonly StrictHit[];
  /** 行号在容差内、维度相同，但类别不同 */
  readonly loose: readonly LooseHit[];
  /** 没被任何结论命中的期望下标 */
  readonly missed: readonly number[];
  /** 没对上任何期望的结论指纹 */
  readonly falsePositives: readonly string[];
  /**
   * 误报里「与某个已命中项落在同一位置」的那部分。
   *
   * 它和真正的误报要分开看：同一处代码被两个维度各说一遍（安全性说越权、正确性说逻辑错），
   * 这一条算重复报告——作者看到的是同一行两条评论，烦，但不是「说错了」。
   * 混进精确率会让指标失真，而分开之后「精确率」才真的在说「有多少是说错的」。
   */
  readonly sameLineExtras: readonly string[];
}

/**
 * 做匹配。
 *
 * 贪心顺序：所有 (期望, 结论) 候选按「行号距离」升序取，一条结论只能被用一次。
 * 用全局排序而不是「按期望顺序逐个找最近」——后者遇到两条期望抢同一条结论时，
 * 会按标注顺序决定归属，而标注顺序是无意义的。
 */
export function matchFindings(
  expected: readonly ExpectedFinding[],
  actual: readonly ActualFinding[],
  options: MatchOptions = {},
): MatchResult {
  const tolerance = options.lineTolerance ?? 2;
  const usedActual = new Set<string>();
  const strict: StrictHit[] = [];
  const loose: LooseHit[] = [];
  const matchedExpected = new Set<number>();

  // ── 第一轮：严格匹配（维度 + 类别 + 行号容差） ──
  for (const hit of greedyMatch(expected, actual, usedActual, matchedExpected, tolerance, true)) {
    const actualItem = actual.find((item) => item.fingerprint === hit.fingerprint);
    strict.push({
      expectedIndex: hit.expectedIndex,
      fingerprint: hit.fingerprint,
      lineDelta: (actualItem?.line ?? 0) - (expected[hit.expectedIndex]?.line ?? 0),
      exact: (actualItem?.line ?? 0) === (expected[hit.expectedIndex]?.line ?? 0),
    });
    usedActual.add(hit.fingerprint);
    matchedExpected.add(hit.expectedIndex);
  }

  // ── 第二轮：宽松匹配（只比维度，给「归错类」留一个可观测的位置） ──
  for (const hit of greedyMatch(expected, actual, usedActual, matchedExpected, tolerance, false)) {
    const actualItem = actual.find((item) => item.fingerprint === hit.fingerprint);
    loose.push({
      expectedIndex: hit.expectedIndex,
      fingerprint: hit.fingerprint,
      expectedCategory: expected[hit.expectedIndex]?.category ?? '',
      actualCategory: actualItem?.category ?? '',
      lineDelta: (actualItem?.line ?? 0) - (expected[hit.expectedIndex]?.line ?? 0),
    });
    usedActual.add(hit.fingerprint);
    matchedExpected.add(hit.expectedIndex);
  }

  const missed = expected.map((_, index) => index).filter((index) => !matchedExpected.has(index));
  const falsePositives = actual
    .map((item) => item.fingerprint)
    .filter((fingerprint) => !usedActual.has(fingerprint));

  // 误报里挑出「和已命中项在同一位置」的：它不是错，是重复
  const hitLines = strict
    .map((hit) => expected[hit.expectedIndex]?.line ?? 0)
    .concat(loose.map((hit) => expected[hit.expectedIndex]?.line ?? 0));

  const sameLineExtras = falsePositives.filter((fingerprint) => {
    const item = actual.find((candidate) => candidate.fingerprint === fingerprint);
    if (item === undefined) return false;
    return hitLines.some((line) => Math.abs(item.line - line) <= tolerance);
  });

  return { strict, loose, missed, falsePositives, sameLineExtras };
}

interface Candidate {
  readonly expectedIndex: number;
  readonly fingerprint: string;
  readonly distance: number;
}

function greedyMatch(
  expected: readonly ExpectedFinding[],
  actual: readonly ActualFinding[],
  usedActual: ReadonlySet<string>,
  matchedExpected: ReadonlySet<number>,
  tolerance: number,
  requireSameCategory: boolean,
): Candidate[] {
  const candidates: Candidate[] = [];

  for (let index = 0; index < expected.length; index += 1) {
    const want = expected[index];
    if (want === undefined || matchedExpected.has(index)) continue;

    for (const item of actual) {
      if (usedActual.has(item.fingerprint)) continue;
      if (item.reviewer !== want.reviewer) continue;
      if (requireSameCategory && item.category !== want.category) continue;

      const distance = Math.abs(item.line - want.line);
      if (distance > tolerance) continue;
      candidates.push({ expectedIndex: index, fingerprint: item.fingerprint, distance });
    }
  }

  // 距离近的先配；同距离时按指纹排序，保证结果与输入顺序无关（复现率才有意义）
  candidates.sort((a, b) => a.distance - b.distance || a.fingerprint.localeCompare(b.fingerprint));

  const taken = new Set(usedActual);
  const claimedExpected = new Set(matchedExpected);
  const picked: Candidate[] = [];

  for (const candidate of candidates) {
    if (taken.has(candidate.fingerprint)) continue;
    if (claimedExpected.has(candidate.expectedIndex)) continue;
    taken.add(candidate.fingerprint);
    claimedExpected.add(candidate.expectedIndex);
    picked.push(candidate);
  }

  return picked;
}
