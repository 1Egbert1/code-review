/**
 * 双轨定位。
 *
 * 轨道 A：信任模型给的行号，但要求该位置的代码与证据逐字一致。
 * 轨道 B：行号不可用时，拿证据去反查位置。
 *
 * **核心判断：模型数行号不可靠，它逐字引用的代码相对可靠。** 所以行号错了不等于结论错了，
 * 直接丢弃等于把已经花钱发现的问题扔掉。但反查必须是纯代码、可复现的——
 * 一旦定位链路里出现模型，这一整条链就无法单测，也无法解释「为什么这条贴在这里」。
 *
 * 每一级都要区分三种结果：命中、没命中、命中多处。**命中多处不能当没命中处理**——
 * 前者是歧义（该报 `unlocatable`），后者是证据不存在（该报 `evidence-mismatch`），
 * 混在一起会让排查方向完全错位。
 */

import type { LineAnchor, ParsedDiff } from '../../contracts/diff.js';
import type { PositionOrigin, RawFinding, RejectionReason } from '../../contracts/finding.js';
import { lookupAnchor } from '../diff/index-lines.js';
import type { LineIndex } from '../diff/index-lines.js';
import { findEvidence, matchesAt } from './evidence.js';

export interface LocateInput {
  readonly raw: RawFinding;
  readonly diff: ParsedDiff;
  readonly index: LineIndex;
  /** 文件 → 改动后完整内容；取不到为 null */
  readonly fileContents: ReadonlyMap<string, string | null>;
}

export type LocateResult =
  | { readonly ok: true; readonly anchor: LineAnchor; readonly origin: PositionOrigin }
  | { readonly ok: false; readonly reason: RejectionReason; readonly detail: string };

/** 单级搜索结果。区分「没找到」与「找到多处」是这一层的全部意义。 */
type ProbeResult =
  | { readonly kind: 'hit'; readonly anchor: LineAnchor; readonly origin: PositionOrigin }
  | { readonly kind: 'outside' }
  | { readonly kind: 'ambiguous'; readonly count: number }
  | { readonly kind: 'miss' };

/** 取某文件改动后的内容行；没有则 null。 */
function contentLines(input: LocateInput, path: string): string[] | null {
  const content = input.fileContents.get(path) ?? null;
  return content === null ? null : content.split('\n');
}

/** 取某文件在改动中的行文本，按侧分开。 */
function diffTexts(input: LocateInput, path: string, side: 'new' | 'old'): Map<number, string> {
  const map = new Map<number, string>();
  const file = input.diff.files.find((item) => item.path === path);
  if (file === undefined) return map;

  for (const line of file.lines) {
    const number = side === 'new' ? line.anchor.newLine : line.anchor.oldLine;
    if (number === null) continue;
    map.set(number, line.text);
  }
  return map;
}

/** 轨道 A：行号合法且内容一致。 */
function tryModelLine(input: LocateInput): LineAnchor | null {
  const { raw, index } = input;
  const anchor = lookupAnchor(index, raw.file, raw.line, raw.side);
  if (anchor === null) return null;

  if (anchor.kind === 'removed') {
    // 删除行没有「改动后内容」，只能比改动前那一行
    const text = diffTexts(input, raw.file, 'old').get(raw.line);
    return text !== undefined && matchesAt([text], 1, raw.evidence) ? anchor : null;
  }

  const lines = contentLines(input, raw.file);
  if (lines === null) {
    // 拿不到完整内容时退化为比对改动行文本本身
    const text = diffTexts(input, raw.file, 'new').get(raw.line);
    return text !== undefined && matchesAt([text], 1, raw.evidence) ? anchor : null;
  }

  return matchesAt(lines, raw.line, raw.evidence) ? anchor : null;
}

/** 轨道 B1：在该文件的改动块内按证据搜索。先新侧，再旧侧。 */
function tryHunk(input: LocateInput): ProbeResult {
  let sawAmbiguous = 0;

  for (const side of ['new', 'old'] as const) {
    const texts = diffTexts(input, input.raw.file, side);
    if (texts.size === 0) continue;

    // 块内行号不连续：用「按行号排序的文本序列」做池，命中位置再映射回真实行号
    const numbers = [...texts.keys()].sort((a, b) => a - b);
    const haystack = numbers.map((number) => texts.get(number) ?? '');
    const hits = findEvidence(haystack, input.raw.evidence);

    if (hits.length > 1) {
      sawAmbiguous = Math.max(sawAmbiguous, hits.length);
      continue;
    }
    if (hits.length === 0) continue;

    const lineNumber = numbers[(hits[0] ?? 0) - 1];
    if (lineNumber === undefined) continue;

    const anchor = lookupAnchor(input.index, input.raw.file, lineNumber, side);
    if (anchor !== null) return { kind: 'hit', anchor, origin: 'evidence-hunk' };
  }

  return sawAmbiguous > 0 ? { kind: 'ambiguous', count: sawAmbiguous } : { kind: 'miss' };
}

/** 轨道 B2：在该文件完整内容中搜索，但只有落在改动范围内才能落位。 */
function tryWholeFile(input: LocateInput): ProbeResult {
  const lines = contentLines(input, input.raw.file);
  if (lines === null) return { kind: 'miss' };

  const hits = findEvidence(lines, input.raw.evidence);
  if (hits.length === 0) return { kind: 'miss' };

  const anchorable = hits
    .map((line) => lookupAnchor(input.index, input.raw.file, line, 'new'))
    .filter((anchor): anchor is LineAnchor => anchor !== null);

  if (anchorable.length === 1 && anchorable[0] !== undefined) {
    return { kind: 'hit', anchor: anchorable[0], origin: 'evidence-file' };
  }
  if (anchorable.length > 1) return { kind: 'ambiguous', count: anchorable.length };

  // 证据确实在文件里，但不在改动范围内 —— 不能进行内评论，必须与「找不到」区分开
  return hits.length >= 1 ? { kind: 'outside' } : { kind: 'miss' };
}

/** 轨道 B3：在其他改动文件中搜索，只有全局唯一命中才搬移。 */
function tryOtherFiles(input: LocateInput): ProbeResult {
  const candidates: LineAnchor[] = [];

  for (const file of input.diff.files) {
    if (file.path === input.raw.file) continue;
    if (file.skippedReason !== null) continue;

    const texts = diffTexts(input, file.path, 'new');
    const numbers = [...texts.keys()].sort((a, b) => a - b);
    const haystack = numbers.map((number) => texts.get(number) ?? '');

    for (const hit of findEvidence(haystack, input.raw.evidence)) {
      const lineNumber = numbers[hit - 1];
      if (lineNumber === undefined) continue;
      const anchor = lookupAnchor(input.index, file.path, lineNumber, 'new');
      if (anchor !== null) candidates.push(anchor);
    }
  }

  if (candidates.length === 1 && candidates[0] !== undefined) {
    return { kind: 'hit', anchor: candidates[0], origin: 'evidence-crossfile' };
  }
  if (candidates.length > 1) return { kind: 'ambiguous', count: candidates.length };
  return { kind: 'miss' };
}

/** 定位一条原始问题项。 */
export function locate(input: LocateInput): LocateResult {
  const { raw, index } = input;
  const fileKnown = index.files.has(raw.file);

  const trusted = tryModelLine(input);
  if (trusted !== null) return { ok: true, anchor: trusted, origin: 'model-line' };

  let ambiguous = 0;
  let sawOutside = false;

  if (fileKnown) {
    const hunk = tryHunk(input);
    if (hunk.kind === 'hit') return { ok: true, anchor: hunk.anchor, origin: hunk.origin };
    if (hunk.kind === 'ambiguous') ambiguous = Math.max(ambiguous, hunk.count);

    const whole = tryWholeFile(input);
    if (whole.kind === 'hit') return { ok: true, anchor: whole.anchor, origin: whole.origin };
    if (whole.kind === 'ambiguous') ambiguous = Math.max(ambiguous, whole.count);
    if (whole.kind === 'outside') sawOutside = true;
  }

  const crossfile = tryOtherFiles(input);
  if (crossfile.kind === 'hit')
    return { ok: true, anchor: crossfile.anchor, origin: crossfile.origin };
  if (crossfile.kind === 'ambiguous') ambiguous = Math.max(ambiguous, crossfile.count);

  if (ambiguous > 1) {
    return {
      ok: false,
      reason: 'unlocatable',
      detail: `证据文本命中 ${String(ambiguous)} 处，无法确定唯一位置（不猜）`,
    };
  }

  if (sawOutside) {
    return {
      ok: false,
      reason: 'unlocatable',
      detail: '证据文本存在于该文件，但不在本次改动范围内，无法落行内评论',
    };
  }

  if (!fileKnown) {
    return {
      ok: false,
      reason: 'file-not-in-diff',
      detail: `文件 ${raw.file} 不在本次改动中，且其他改动文件里没有唯一匹配`,
    };
  }

  return {
    ok: false,
    reason: 'evidence-mismatch',
    detail: '证据文本在本文件与其他改动文件中都找不到（可能被改写或编造）',
  };
}
