import { describe, expect, it } from 'vitest';

import type { ParsedDiff } from '../src/contracts/index.js';
import { buildLineIndex } from '../src/core/diff/index-lines.js';
import { parsePatch } from '../src/core/diff/parse.js';
import { locate } from '../src/core/verify/locate.js';

const PATCH_A = [
  '@@ -1,4 +1,5 @@',
  ' function a() {',
  '-  return old;',
  '+  const v = read();',
  '+  return v.y;',
  ' }',
].join('\n');

const PATCH_B = ['@@ -1,2 +1,3 @@', ' const b = 1;', '+const c = 2;', ' export { b, c };'].join(
  '\n',
);

const CONTENT_A = ['function a() {', '  const v = read();', '  return v.y;', '}'].join('\n');

function makeDiff(): ParsedDiff {
  return {
    files: [
      parsePatch(PATCH_A, { path: 'src/a.ts', oldPath: 'src/a.ts', status: 'modified' }),
      parsePatch(PATCH_B, { path: 'src/b.ts', oldPath: 'src/b.ts', status: 'modified' }),
    ],
    baseSha: 'base',
    headSha: 'head',
  };
}

function raw(overrides: Record<string, unknown> = {}) {
  return {
    file: 'src/a.ts',
    line: 3,
    side: 'new' as const,
    severity: 'major' as const,
    category: 'null-safety',
    title: '空值未判断',
    body: 'v 可能为 null',
    evidence: 'return v.y;',
    suggestion: null,
    confidence: 0.9,
    ...overrides,
  };
}

function run(overrides: Record<string, unknown> = {}, contents?: Record<string, string | null>) {
  const diff = makeDiff();
  const index = buildLineIndex(diff);
  const fileContents = new Map<string, string | null>(
    contents === undefined ? [['src/a.ts', CONTENT_A]] : Object.entries(contents),
  );
  return locate({ raw: raw(overrides), diff, index, fileContents });
}

describe('轨道 A：信任行号', () => {
  it('行号合法且内容一致时直接采用', () => {
    const result = run();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.origin).toBe('model-line');
    expect(result.anchor.newLine).toBe(3);
  });

  it('行号合法但内容不符时不采用，转入反查', () => {
    // 第 2 行是 const v = read()，证据却是 return v.y
    const result = run({ line: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.origin).not.toBe('model-line');
    expect(result.anchor.newLine).toBe(3);
  });
});

describe('轨道 B：证据反查', () => {
  it('行号越界时在改动块内找到位置', () => {
    const result = run({ line: 999 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.origin).toBe('evidence-hunk');
    expect(result.anchor.newLine).toBe(3);
  });

  it('证据在文件里但不在改动范围内时，明确说明不能行内评论', () => {
    const result = run(
      { line: 999, evidence: 'return secret;' },
      { 'src/a.ts': [CONTENT_A, 'function b() {', '  return secret;', '}'].join('\n') },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('unlocatable');
    expect(result.detail).toContain('不在本次改动范围内');
  });

  it('证据只存在于另一个改动文件时，整条搬移', () => {
    const result = run({ file: 'src/b.ts', line: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.origin).toBe('evidence-crossfile');
    expect(result.anchor.file).toBe('src/a.ts');
  });

  it('多个文件都命中时判为歧义，不猜', () => {
    const diff: ParsedDiff = {
      files: [
        parsePatch(PATCH_A, { path: 'src/a.ts', oldPath: 'src/a.ts', status: 'modified' }),
        parsePatch(PATCH_A, { path: 'src/c.ts', oldPath: 'src/c.ts', status: 'modified' }),
      ],
      baseSha: 'base',
      headSha: 'head',
    };
    const result = locate({
      raw: raw({ file: 'src/other.ts' }),
      diff,
      index: buildLineIndex(diff),
      fileContents: new Map(),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('unlocatable');
  });
});

describe('失败原因要分得清', () => {
  it('文件不在改动里且别处也没有 → file-not-in-diff', () => {
    const result = run({ file: 'src/nope.ts', evidence: 'nothing like this' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('file-not-in-diff');
  });

  it('文件在改动里但证据完全不存在 → evidence-mismatch', () => {
    const result = run({ evidence: 'const invented = true;' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('evidence-mismatch');
  });

  it('删除行锚在旧侧', () => {
    const result = run({ line: 2, side: 'old', evidence: '  return old;' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.anchor.kind).toBe('removed');
    expect(result.anchor.oldLine).toBe(2);
  });
});
