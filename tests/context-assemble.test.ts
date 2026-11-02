import { describe, expect, it } from 'vitest';

import type { DiffFile, DiffLine, ParsedDiff } from '../src/contracts/index.js';
import type { DiffSnapshot } from '../src/contracts/result.js';
import { assembleContext, computeBudget, selectForFile } from '../src/core/context/assemble.js';

function diffLine(
  kind: DiffLine['anchor']['kind'],
  newLine: number | null,
  text: string,
): DiffLine {
  return {
    anchor: {
      file: 'src/a.ts',
      oldPath: null,
      kind,
      newLine,
      oldLine: kind === 'added' ? null : newLine,
    },
    text,
    enclosingSymbol: null,
  };
}

function file(path: string, skippedReason: string | null = null): DiffFile {
  return {
    path,
    oldPath: null,
    status: 'modified',
    lines: skippedReason === null ? [diffLine('added', 2, '  return 42;')] : [],
    changedCount: 1,
    skippedReason,
  };
}

function snapshot(
  files: DiffFile[],
  contents: Record<string, string | null>,
  conventions: string | null = null,
): DiffSnapshot {
  const diff: ParsedDiff = { files, baseSha: 'base', headSha: 'head' };
  return {
    diff,
    fileContents: new Map(Object.entries(contents)),
    existingComments: [],
    conventions,
    buildContext: null,
  };
}

describe('预算计算', () => {
  it('从窗口里扣掉输出与提示词开销', () => {
    // (10000 - 2000) × 0.7 = 5600，再扣提示词开销 1000
    const budget = computeBudget({
      contextWindow: 10000,
      maxOutputTokens: 2000,
      promptOverheadTokens: 1000,
    });
    expect(budget).toBe(4600);
  });

  it('窗口过小时不下探到负数', () => {
    expect(computeBudget({ contextWindow: 100, maxOutputTokens: 2000 })).toBe(0);
  });
});

describe('全局装配', () => {
  it('被跳过的文件不产出任何段', () => {
    const bundle = assembleContext(
      snapshot([file('src/a.ts'), file('src/skip.ts', '二进制文件')], {
        'src/a.ts': 'const a = 1;\n  return 42;\n',
        'src/skip.ts': null,
      }),
      { contextWindow: 100000, maxOutputTokens: 4096 },
    );

    expect(bundle.segments.every((segment) => segment.path !== 'src/skip.ts')).toBe(true);
    expect(bundle.segments.some((segment) => segment.path === 'src/a.ts')).toBe(true);
  });

  it('仓库约定记为 L3，path 为 null', () => {
    const bundle = assembleContext(
      snapshot(
        [file('src/a.ts')],
        { 'src/a.ts': 'const a = 1;\n  return 42;\n' },
        '# 贡献指南\n用两个空格缩进',
      ),
      { contextWindow: 100000, maxOutputTokens: 4096 },
    );

    const conventions = bundle.segments.find((segment) => segment.title.includes('仓库约定'));
    expect(conventions?.tier).toBe('L3');
    expect(conventions?.path).toBeNull();
  });

  it('依赖与构建配置放在 L2，比仓库约定更晚被砍', () => {
    const base = snapshot(
      [file('src/a.ts')],
      { 'src/a.ts': 'const a = 1;\n  return 42;\n' },
      '# 约定',
    );
    const bundle = assembleContext(
      { ...base, buildContext: 'dependencies:\n  lodash: 4.17.20' },
      { contextWindow: 100000, maxOutputTokens: 4096 },
    );

    expect(bundle.segments.find((segment) => segment.title.includes('依赖清单'))?.tier).toBe('L2');
  });

  it('单文件视图包含仓库级段', () => {
    const bundle = assembleContext(
      snapshot(
        [file('src/a.ts'), file('src/b.ts')],
        {
          'src/a.ts': 'const a = 1;\n  return 42;\n',
          'src/b.ts': 'const b = 1;\n  return 42;\n',
        },
        '# 约定',
      ),
      { contextWindow: 100000, maxOutputTokens: 4096 },
    );

    const view = selectForFile(bundle, 'src/a.ts');
    expect(view.some((segment) => segment.path === 'src/b.ts')).toBe(false);
    expect(view.some((segment) => segment.path === null)).toBe(true);
  });

  it('预算紧张时先砍仓库约定，改动行仍在', () => {
    const bundle = assembleContext(
      snapshot(
        [file('src/a.ts')],
        { 'src/a.ts': 'const a = 1;\n  return 42;\n' },
        'x'.repeat(4000),
      ),
      { contextWindow: 3000, maxOutputTokens: 2000, promptOverheadTokens: 100, l4MaxLines: 0 },
    );

    expect(bundle.trim.dropped.some((item) => item.tier === 'L3')).toBe(true);
    expect(bundle.segments.some((segment) => segment.tier === 'L0')).toBe(true);
    expect(bundle.trim.overBudget).toBe(false);
  });
});
