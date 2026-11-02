/**
 * 上下文分层抽取：把「一个文件 + 一段改动」变成若干可裁剪的段。
 *
 * **准确率声明**：函数边界识别是**启发式**的，不是语法分析。它按花括号配平识别 C 系语言，
 * 按缩进识别 Python 系语言，遇到宏、模板、代码生成产物会失效。
 * 因此它**只用于决定「给模型看哪些材料」**，任何结论性的判断都不许依赖它——
 * 报告里的行号一律来自改动解析层，不来自这里。
 *
 * SPEC-GAP：规格书 9.5 列了五层，但没说 L4 与 L1 的关系。若两者都放整文件内容，
 * 同一段代码会被计两次费。这里让 L4 取「L1 之外的部分」，互补而不重叠。
 */

import type { DiffFile, DiffLine } from '../../contracts/diff.js';
import type { ContextSegment } from '../../contracts/context.js';
import { estimateTokens } from './tokens.js';

/** 文件中的一段连续区域，行号 1 起、闭区间。 */
export interface Region {
  readonly startLine: number;
  readonly endLine: number;
  /** 函数或类名；识别不出时为 '(anonymous)' */
  readonly name: string;
}

/** 以 `{` / `}` 配平的语言里，哪些行首关键字表示「这是控制流而不是函数定义」。 */
const CONTROL_KEYWORDS = new Set([
  'if',
  'for',
  'while',
  'switch',
  'catch',
  'else',
  'do',
  'try',
  'return',
  'finally',
  'with',
]);

/** Python 系语言的函数/类定义。 */
const INDENT_DEF = /^\s*(?:async\s+)?(?:def|class)\s+([A-Za-z_]\w*)/;
/** 其他语言的显式定义关键字。 */
const KEYWORD_DEF = /\b(?:function|func|fn|fun|sub|proc)\s+([A-Za-z_]\w*)/;

function indentOf(line: string): number {
  let width = 0;
  for (const char of line) {
    if (char === ' ') width += 1;
    else if (char === '\t') width += 4;
    else break;
  }
  return width;
}

function leadingWord(line: string): string {
  const match = /^\s*([A-Za-z_]\w*)/.exec(line);
  return match?.[1] ?? '';
}

/** 从一行里找出可读的名字：优先显式定义关键字，其次「标识符(...)」。 */
function nameOfHeader(line: string): string | null {
  const indentDef = INDENT_DEF.exec(line);
  if (indentDef?.[1] !== undefined) return indentDef[1];
  const keywordDef = KEYWORD_DEF.exec(line);
  if (keywordDef?.[1] !== undefined) return keywordDef[1];
  const call = /([A-Za-z_$][\w$]*)\s*\([^;]*\)\s*(?::[^{]*)?\{?\s*$/.exec(line);
  if (call?.[1] !== undefined && !CONTROL_KEYWORDS.has(call[1])) return call[1];
  return null;
}

/**
 * 判断某行是否是「一个块的头部」。
 *
 * 只看这一行的形态，不回溯上下文——回溯会让误判顺着缩进链传播。
 */
function isBlockHeader(line: string, nextLine: string | null): boolean {
  const trimmed = line.trim();
  if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('#')) return false;
  if (leadingWord(line) && CONTROL_KEYWORDS.has(leadingWord(line))) return false;

  const hasOpen = trimmed.includes('{');
  if (hasOpen) {
    // 头部必须同时像「带参数」或「显式定义」，否则可能是对象字面量
    return /[()]/.test(trimmed) || KEYWORD_DEF.test(trimmed) || INDENT_DEF.test(trimmed);
  }
  // 花括号在下一行（常见于 C 系风格）
  if (nextLine !== null && nextLine.trim().startsWith('{')) {
    return /[()]/.test(trimmed) || KEYWORD_DEF.test(trimmed);
  }
  return false;
}

/** 花括号配平法。返回所有识别到的块。 */
function braceRegions(lines: readonly string[]): Region[] {
  const regions: Region[] = [];
  /** 每行处理后的深度 */
  const depthAfter: number[] = [];
  /** 打开的块：行号、深度基线、名字 */
  const stack: { line: number; base: number; name: string }[] = [];
  let depth = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const header = isBlockHeader(line, lines[index + 1] ?? null);

    if (header) {
      stack.push({ line: index + 1, base: depth, name: nameOfHeader(line) ?? '(anonymous)' });
    }

    for (const char of line) {
      if (char === '{') depth += 1;
      else if (char === '}') depth = Math.max(0, depth - 1);
    }
    depthAfter.push(depth);

    // 深度回落到块的基线，说明块结束
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top === undefined) break;
      if (depth > top.base) break;
      regions.push({ startLine: top.line, endLine: index + 1, name: top.name });
      stack.pop();
    }
  }

  // 文件结尾仍未闭合的块，按最后一行收尾
  for (const open of stack) {
    regions.push({ startLine: open.line, endLine: lines.length, name: open.name });
  }

  return regions;
}

/** 缩进法：仅当花括号法什么都没找到时使用（Python 系语言）。 */
function indentRegions(lines: readonly string[]): Region[] {
  const regions: Region[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const match = INDENT_DEF.exec(line);
    if (match === null) continue;

    const base = indentOf(line);
    let lastContent = index + 1;
    for (let next = index + 1; next < lines.length; next += 1) {
      const candidate = lines[next] ?? '';
      if (candidate.trim() === '') continue;
      if (indentOf(candidate) <= base) break;
      lastContent = next + 1;
    }
    regions.push({
      startLine: index + 1,
      endLine: Math.max(index + 1, lastContent),
      name: match[1] ?? '(anonymous)',
    });
  }
  return regions;
}

/** 找出包含指定行的最内层区域。行号 1 起。 */
export function findEnclosingRegion(lines: readonly string[], targetLine: number): Region | null {
  if (targetLine < 1 || targetLine > lines.length) return null;

  const regions = braceRegions(lines);
  const pool = regions.length > 0 ? regions : indentRegions(lines);

  let best: Region | null = null;
  for (const region of pool) {
    if (region.startLine > targetLine || region.endLine < targetLine) continue;
    // 最内层 = 起点最靠后的那个
    if (best === null || region.startLine > best.startLine) best = region;
  }
  return best;
}

/** 把改动行所属的函数名填进 DiffLine.enclosingSymbol。取不到内容的行保持 null。 */
export function annotateEnclosingSymbols(file: DiffFile, content: string | null): DiffFile {
  if (content === null) return file;
  const lines = content.split('\n');

  return {
    ...file,
    lines: file.lines.map((line) => {
      // 删除行在新内容里找不到对应位置，无法可靠识别，保持 null 而不是猜
      if (line.anchor.kind === 'removed' || line.anchor.newLine === null) {
        return { ...line, enclosingSymbol: null };
      }
      const region = findEnclosingRegion(lines, line.anchor.newLine);
      return { ...line, enclosingSymbol: region?.name ?? null };
    }),
  };
}

/** 渲染一行改动，带行号与标记，模型据此就能引用具体位置。 */
function renderDiffLine(line: DiffLine): string {
  const mark = line.anchor.kind === 'added' ? '+' : line.anchor.kind === 'removed' ? '-' : ' ';
  const number = line.anchor.newLine ?? line.anchor.oldLine ?? 0;
  return `${String(number).padStart(5, ' ')} ${mark} ${line.text}`;
}

/**
 * 渲染 L0：改动行本身。
 *
 * 不连续的位置之间插入分隔线——否则模型会把两个相距很远的改动块当成连在一起的，
 * 进而误判「这两个变量在同一个作用域里」。
 */
function renderChangedLines(lines: readonly DiffLine[]): string {
  const out: string[] = [];
  let lastNew: number | null = null;
  let lastOld: number | null = null;

  for (const line of lines) {
    const { kind, newLine, oldLine } = line.anchor;
    const reference = kind === 'removed' ? oldLine : newLine;
    const lastReference = kind === 'removed' ? lastOld : lastNew;

    if (reference !== null && lastReference !== null && reference !== lastReference + 1) {
      out.push('      ···');
    }
    out.push(renderDiffLine(line));

    if (newLine !== null) lastNew = newLine;
    if (oldLine !== null) lastOld = oldLine;
  }

  return out.join('\n');
}

/** 把区间列表取补集（相对于 1..totalLines）。 */
function complementRanges(totalLines: number, covered: readonly Region[]): Region[] {
  const sorted = [...covered].sort((a, b) => a.startLine - b.startLine);
  const result: Region[] = [];
  let cursor = 1;

  for (const region of sorted) {
    if (region.startLine > cursor) {
      result.push({ startLine: cursor, endLine: region.startLine - 1, name: '' });
    }
    cursor = Math.max(cursor, region.endLine + 1);
  }
  if (cursor <= totalLines) result.push({ startLine: cursor, endLine: totalLines, name: '' });

  return result;
}

/** 带行号渲染一段区域。 */
function renderRegion(lines: readonly string[], region: Region): string {
  const out: string[] = [];
  for (let line = region.startLine; line <= region.endLine; line += 1) {
    out.push(`${String(line).padStart(5, ' ')} | ${lines[line - 1] ?? ''}`);
  }
  return out.join('\n');
}

export interface FileSegmentOptions {
  /** L4（文件其余部分）最多给多少行，默认 400 */
  readonly l4MaxLines?: number;
}

/**
 * 抽取单个文件的分层材料。
 *
 * 产出 L0（改动行）、L1（改动所在的完整函数）、L4（文件其余部分，与 L1 互补）。
 * L2（被引用符号签名）由跨文件展开填充，L3（仓库约定）不属于单个文件，都不在这里产出。
 */
export function buildFileSegments(
  file: DiffFile,
  content: string | null,
  options: FileSegmentOptions = {},
): ContextSegment[] {
  const segments: ContextSegment[] = [];

  const changed = file.lines.filter((line) => line.anchor.kind !== 'context');
  const l0Content = renderChangedLines(changed.length > 0 ? changed : file.lines);
  segments.push({
    tier: 'L0',
    path: file.path,
    title: `${file.path} 的改动（${changed.length} 行）`,
    content: l0Content,
    estimatedTokens: estimateTokens(l0Content),
  });

  if (content === null) return segments;

  const lines = content.split('\n');

  // L1：改动行所在函数，按区域去重（同一函数里改了 5 行只给一次）
  const seen = new Set<string>();
  const regions: Region[] = [];
  for (const line of changed) {
    const target = line.anchor.newLine;
    if (target === null) continue;
    const region = findEnclosingRegion(lines, target);
    if (region === null) continue;
    const key = `${region.startLine}:${region.endLine}`;
    if (seen.has(key)) continue;
    seen.add(key);
    regions.push(region);
  }

  for (const region of regions) {
    const body = renderRegion(lines, region);
    segments.push({
      tier: 'L1',
      path: file.path,
      title: `${file.path} 的 ${region.name}() 第 ${region.startLine}-${region.endLine} 行`,
      content: body,
      estimatedTokens: estimateTokens(body),
    });
  }

  // L4：文件其余部分。与 L1 互补，避免同一段代码被计两次费
  const l4Max = options.l4MaxLines ?? 400;
  const rest = complementRanges(lines.length, regions);
  const anchors = changed
    .map((line) => line.anchor.newLine)
    .filter((value): value is number => value !== null);

  const picked = pickNearest(rest, anchors, l4Max);
  if (picked.length > 0) {
    const kept = picked.reduce((sum, region) => sum + (region.endLine - region.startLine + 1), 0);
    const body = picked.map((region) => renderRegion(lines, region)).join('\n      ···\n');
    segments.push({
      tier: 'L4',
      path: file.path,
      title: `${file.path} 的其余部分（${kept} 行）`,
      content: body,
      estimatedTokens: estimateTokens(body),
    });
  }

  return segments;
}

/** 一个区域到最近的改动行的距离；无改动行时按区域起点算。 */
function distanceToChanges(region: Region, anchors: readonly number[]): number {
  if (anchors.length === 0) return region.startLine;
  let best = Number.POSITIVE_INFINITY;
  for (const anchor of anchors) {
    if (anchor >= region.startLine && anchor <= region.endLine) return 0;
    const distance =
      anchor < region.startLine ? region.startLine - anchor : anchor - region.endLine;
    if (distance < best) best = distance;
  }
  return best;
}

/**
 * 从候选区域里挑出不超过预算的行数，优先挑离改动最近的。
 *
 * 为什么不按文件顺序取前 N 行：存量问题大多在改动附近（同一个函数、相邻定义），
 * 文件头部通常是 import 和常量，信息密度最低。按距离取能把有限预算花在刀刃上。
 */
function pickNearest(
  regions: readonly Region[],
  anchors: readonly number[],
  maxLines: number,
): Region[] {
  if (maxLines <= 0) return [];

  const ordered = [...regions].sort(
    (a, b) => distanceToChanges(a, anchors) - distanceToChanges(b, anchors),
  );
  const picked: Region[] = [];
  let budget = maxLines;

  for (const region of ordered) {
    if (budget <= 0) break;
    const size = region.endLine - region.startLine + 1;
    if (size <= budget) {
      picked.push(region);
      budget -= size;
      continue;
    }
    // 整段放不下，就截取离改动最近的那一段
    const anchor = anchors.length > 0 ? anchors[0] : region.startLine;
    if (anchor === undefined) break;
    const centre = Math.min(Math.max(anchor, region.startLine), region.endLine);
    const half = Math.floor(budget / 2);
    const start = Math.max(region.startLine, centre - half);
    const end = Math.min(region.endLine, start + budget - 1);
    if (end >= start) picked.push({ startLine: start, endLine: end, name: '' });
    budget = 0;
  }

  return picked.sort((a, b) => a.startLine - b.startLine);
}
