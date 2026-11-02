/**
 * 行索引：把改动行按「新行号」和「旧行号」两个方向建表。
 *
 * 这是整个位置锚定的地基。下游判断「这个行号能不能评论」时，只需要查表，
 * 不需要再理解 diff 结构。
 *
 * 注意上下文行会**同时**出现在两张表里，且指向同一个 anchor 对象——
 * 因为它在改动前后都存在，只是行号可能不同。
 */

import type { LineAnchor, ParsedDiff } from '../../contracts/index.js';

/** 行索引。 */
export interface LineIndex {
  /** 文件路径 → 改动后行号 → 行标识 */
  readonly byNewLine: ReadonlyMap<string, ReadonlyMap<number, LineAnchor>>;
  /** 文件路径 → 改动前行号 → 行标识 */
  readonly byOldLine: ReadonlyMap<string, ReadonlyMap<number, LineAnchor>>;
  /** 本次改动涉及的路径（含重命名前的旧路径） */
  readonly files: ReadonlySet<string>;
}

/**
 * 建立行索引。
 *
 * 被跳过的文件（二进制、平台未提供补丁等）不参与索引——它们没有可评论的行，
 * 但路径仍会进 `files` 之外的判断由调用方负责，这里只索引真正有内容的文件。
 */
export function buildLineIndex(diff: ParsedDiff): LineIndex {
  const byNewLine = new Map<string, Map<number, LineAnchor>>();
  const byOldLine = new Map<string, Map<number, LineAnchor>>();
  const files = new Set<string>();

  for (const file of diff.files) {
    // 路径始终登记：即使文件被跳过，"这个文件在本次改动里"这个事实仍成立
    files.add(file.path);
    if (file.oldPath !== null) files.add(file.oldPath);

    if (file.skippedReason !== null || file.lines.length === 0) continue;

    let newSide = byNewLine.get(file.path);
    if (newSide === undefined) {
      newSide = new Map<number, LineAnchor>();
      byNewLine.set(file.path, newSide);
    }

    let oldSide = byOldLine.get(file.path);
    if (oldSide === undefined) {
      oldSide = new Map<number, LineAnchor>();
      byOldLine.set(file.path, oldSide);
    }

    for (const line of file.lines) {
      const { anchor } = line;
      if (anchor.newLine !== null) newSide.set(anchor.newLine, anchor);
      if (anchor.oldLine !== null) oldSide.set(anchor.oldLine, anchor);
    }
  }

  return { byNewLine, byOldLine, files };
}

/**
 * 按行号查行标识。
 *
 * SPEC-GAP：规格书 6.3 只定义了 buildLineIndex，没定义查询函数。
 * 但索引的全部用途就是查询，因此这里提供唯一入口，避免下游各写一套遍历。
 *
 * @returns 命中返回行标识，否则 null
 */
export function lookupAnchor(
  index: LineIndex,
  file: string,
  line: number,
  side: 'new' | 'old',
): LineAnchor | null {
  const table = side === 'new' ? index.byNewLine : index.byOldLine;
  return table.get(file)?.get(line) ?? null;
}

/** 判断某个位置是否可评论（行号确实存在于本次改动中）。 */
export function isCommentable(
  index: LineIndex,
  file: string,
  line: number,
  side: 'new' | 'old',
): boolean {
  return lookupAnchor(index, file, line, side) !== null;
}
