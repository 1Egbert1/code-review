/**
 * 证据匹配。
 *
 * 「模型给的行号可能错，但它逐字引用的代码通常是真的」——这是双轨定位的前提。
 * 因此匹配必须是**整行相等**，不做编辑距离、不做模糊匹配：
 * 模糊匹配在「找到了但找错了」时会静默给出一个合法位置，比直接失败糟得多。
 *
 * 归一化只做三件事（见规格书 4.3.1）：去行首 +/- 标记、去首尾空白、折叠连续空白。
 * **不做大小写转换**——代码大小写敏感，`userId` 与 `userid` 是两个东西。
 */

/** 归一化一行。 */
export function normalizeLine(text: string): string {
  let value = text;
  if (value.startsWith('+') || value.startsWith('-')) value = value.slice(1);
  return value.replace(/\s+/g, ' ').trim();
}

/** 把证据拆成归一化后的有效行（空行丢弃——空行在匹配时跳过且不中断）。 */
export function evidenceLines(evidence: string): string[] {
  return evidence
    .split('\n')
    .map((line) => normalizeLine(line))
    .filter((line) => line !== '');
}

export interface SignificantLine {
  /** 在原文中的行号，1 起 */
  readonly line: number;
  readonly text: string;
}

/**
 * 抽出有效行。空行不进列表，这样滑动窗口天然实现「空行不中断连续性」。
 */
export function significantLines(lines: readonly string[]): SignificantLine[] {
  const result: SignificantLine[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const text = normalizeLine(lines[index] ?? '');
    if (text === '') continue;
    result.push({ line: index + 1, text });
  }
  return result;
}

/**
 * 在给定文本里找证据，返回所有命中的**起始行号**（1 起）。
 *
 * 返回数组而不是单个结果：多处命中时必须能看出歧义，由调用方决定是继续往下一级找还是判为
 * `unlocatable`。悄悄取第一个命中是最容易埋雷的写法。
 */
export function findEvidence(lines: readonly string[], evidence: string): number[] {
  const wanted = evidenceLines(evidence);
  if (wanted.length === 0) return [];

  const pool = significantLines(lines);
  if (pool.length < wanted.length) return [];

  const hits: number[] = [];
  for (let start = 0; start + wanted.length <= pool.length; start += 1) {
    let matched = true;
    for (let offset = 0; offset < wanted.length; offset += 1) {
      if (pool[start + offset]?.text !== wanted[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) hits.push(pool[start]?.line ?? 0);
  }

  return hits;
}

/**
 * 判断某个位置上的代码是否与证据一致（轨道 A 用）。
 *
 * 只允许跳过**紧邻的空行**：模型给的行号落在空行上时，指向的是下一条有内容的行。
 * 但绝不能「往下找最近的一个匹配」——那等于承认它的行号随便写，轨道 A 就失去意义了。
 */
export function matchesAt(lines: readonly string[], startLine: number, evidence: string): boolean {
  const wanted = evidenceLines(evidence);
  if (wanted.length === 0) return false;

  const pool = significantLines(lines);
  const index = pool.findIndex((item) => item.line >= startLine);
  if (index < 0) return false;

  const actual = pool[index]?.line ?? 0;
  if (actual > startLine) {
    const between = lines.slice(startLine - 1, actual - 1);
    if (!between.every((line) => normalizeLine(line) === '')) return false;
  }

  for (let offset = 0; offset < wanted.length; offset += 1) {
    if (pool[index + offset]?.text !== wanted[offset]) return false;
  }
  return true;
}
