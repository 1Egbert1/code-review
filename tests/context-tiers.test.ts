import { describe, expect, it } from 'vitest';

import type { DiffFile, DiffLine, LineKind } from '../src/contracts/index.js';
import {
  annotateEnclosingSymbols,
  buildFileSegments,
  findEnclosingRegion,
} from '../src/core/context/tiers.js';

const TS_SOURCE = [
  "import { x } from './x';", // 1
  '', // 2
  'export function alpha(a: number) {', // 3
  '  return a + 1;', // 4
  '}', // 5
  '', // 6
  'export function beta(input: string) {', // 7
  '  if (!input) {', // 8
  "    return '';", // 9
  '  }', // 10
  '  return input.trim();', // 11
  '}', // 12
  '', // 13
  'export const tail = 1;', // 14
].join('\n');

const PY_SOURCE = [
  'def alpha(a):', // 1
  '    return a + 1', // 2
  '', // 3
  'def beta(data):', // 4
  '    if not data:', // 5
  "        return ''", // 6
  '    return data.strip()', // 7
  '', // 8
  'tail = 1', // 9
].join('\n');

function diffLine(
  kind: LineKind,
  newLine: number | null,
  oldLine: number | null,
  text: string,
): DiffLine {
  return {
    anchor: { file: 'src/a.ts', oldPath: null, kind, newLine, oldLine },
    text,
    enclosingSymbol: null,
  };
}

function diffFile(lines: DiffLine[]): DiffFile {
  return {
    path: 'src/a.ts',
    oldPath: null,
    status: 'modified',
    lines,
    changedCount: lines.filter((line) => line.anchor.kind !== 'context').length,
    skippedReason: null,
  };
}

describe('函数边界识别', () => {
  it('花括号法认出包含目标行的函数', () => {
    const region = findEnclosingRegion(TS_SOURCE.split('\n'), 11);
    expect(region).toEqual({ startLine: 7, endLine: 12, name: 'beta' });
  });

  it('控制流不算函数：if 块内的行仍归属外层函数', () => {
    const region = findEnclosingRegion(TS_SOURCE.split('\n'), 9);
    expect(region?.name).toBe('beta');
    expect(region?.startLine).toBe(7);
  });

  it('顶层语句不属于任何函数', () => {
    expect(findEnclosingRegion(TS_SOURCE.split('\n'), 14)).toBeNull();
  });

  it('缩进法认得 Python 函数', () => {
    const region = findEnclosingRegion(PY_SOURCE.split('\n'), 7);
    expect(region?.name).toBe('beta');
    expect(region?.startLine).toBe(4);
    expect(region?.endLine).toBe(7);
  });

  it('行号越界返回 null', () => {
    expect(findEnclosingRegion(TS_SOURCE.split('\n'), 0)).toBeNull();
    expect(findEnclosingRegion(TS_SOURCE.split('\n'), 999)).toBeNull();
  });
});

describe('回填函数名', () => {
  it('新增行与上下文行能填上，删除行留空', () => {
    const file = diffFile([
      diffLine('context', 3, 3, 'export function alpha(a: number) {'),
      diffLine('added', 4, null, '  return a + 2;'),
      diffLine('removed', null, 5, '}'),
    ]);

    const annotated = annotateEnclosingSymbols(file, TS_SOURCE);
    expect(annotated.lines[0]?.enclosingSymbol).toBe('alpha');
    expect(annotated.lines[1]?.enclosingSymbol).toBe('alpha');
    // 删除行在新内容里没有对应位置，宁可留空也不猜
    expect(annotated.lines[2]?.enclosingSymbol).toBeNull();
  });

  it('取不到文件内容时原样返回', () => {
    const file = diffFile([diffLine('added', 4, null, '  return a + 2;')]);
    expect(annotateEnclosingSymbols(file, null)).toBe(file);
  });
});

describe('文件分层', () => {
  it('L0 只含改动行，且远处改动之间有分隔', () => {
    const file = diffFile([
      diffLine('added', 4, null, '  return a + 2;'),
      diffLine('added', 11, null, '  return input.trim().toLowerCase();'),
    ]);

    const segments = buildFileSegments(file, TS_SOURCE);
    const l0 = segments.find((segment) => segment.tier === 'L0');

    expect(l0?.content).toContain('return a + 2;');
    expect(l0?.content).toContain('return input.trim().toLowerCase();');
    // 两处相隔 7 行，不连续，必须让模型看出这是两个位置
    expect(l0?.content).toContain('···');
  });

  it('同一函数里改多行只产出一个 L1', () => {
    const file = diffFile([
      diffLine('added', 4, null, '  return a + 2;'),
      diffLine('added', 5, null, '  // 说明'),
    ]);

    const l1 = buildFileSegments(file, TS_SOURCE).filter((segment) => segment.tier === 'L1');
    expect(l1).toHaveLength(1);
    expect(l1[0]?.title).toContain('alpha');
  });

  it('L4 与 L1 互补，不重复给同一段代码', () => {
    const file = diffFile([diffLine('added', 4, null, '  return a + 2;')]);
    const segments = buildFileSegments(file, TS_SOURCE);
    const l1 = segments.find((segment) => segment.tier === 'L1');
    const l4 = segments.find((segment) => segment.tier === 'L4');

    // 函数体在 L1 里，就不能再出现在 L4 里——否则同一段代码被计两次费
    expect(l1?.content).toContain('return a + 1;');
    expect(l4?.content).not.toContain('return a + 1;');
    // 但函数外的内容应该在 L4 里，存量问题需要它
    expect(l4?.content).toContain("import { x } from './x';");
  });

  it('取不到文件内容时只产出 L0', () => {
    const file = diffFile([diffLine('added', 4, null, '  return a + 2;')]);
    const segments = buildFileSegments(file, null);
    expect(segments.map((segment) => segment.tier)).toEqual(['L0']);
  });

  it('L4 行数受上限约束，且优先保留离改动近的行', () => {
    const file = diffFile([diffLine('added', 11, null, '  return input.trim().toLowerCase();')]);
    const segments = buildFileSegments(file, TS_SOURCE, { l4MaxLines: 2 });
    const l4 = segments.find((segment) => segment.tier === 'L4');

    const lineCount = (l4?.content ?? '').split('\n').filter((text) => text.trim() !== '').length;
    expect(lineCount).toBeLessThanOrEqual(2);
    // 改动在 11 行，最近的非函数内容是 13-14 行，不该去取文件头部
    expect(l4?.content).toContain('tail');
  });
});
