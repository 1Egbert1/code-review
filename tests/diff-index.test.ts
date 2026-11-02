import { describe, expect, it } from 'vitest';

import type { ParsedDiff } from '../src/contracts/index.js';
import { buildLineIndex, isCommentable, lookupAnchor } from '../src/core/diff/index-lines.js';
import { parsePatch } from '../src/core/diff/parse.js';

/** 用若干单文件补丁拼出一个完整改动。 */
function makeDiff(...files: Parameters<typeof parsePatch>[]): ParsedDiff {
  return {
    files: files.map(([patch, meta]) => parsePatch(patch, meta)),
    baseSha: 'base',
    headSha: 'head',
  };
}

const MODIFIED = { path: 'src/a.ts', oldPath: 'src/a.ts', status: 'modified' as const };

describe('行索引', () => {
  it('按新行号与旧行号分别建表', () => {
    const diff = makeDiff([['@@ -1,2 +1,3 @@', ' a', '+b', ' c'].join('\n'), MODIFIED]);
    const index = buildLineIndex(diff);

    expect(index.byNewLine.get('src/a.ts')?.size).toBe(3);
    // 旧侧只有 a 与 c 两行：新增行在旧文件里不存在
    expect(index.byOldLine.get('src/a.ts')?.size).toBe(2);
  });

  it('上下文行同时出现在两张表，且指向同一个对象', () => {
    const diff = makeDiff([['@@ -1,1 +1,1 @@', ' same'].join('\n'), MODIFIED]);
    const index = buildLineIndex(diff);

    const fromNew = lookupAnchor(index, 'src/a.ts', 1, 'new');
    const fromOld = lookupAnchor(index, 'src/a.ts', 1, 'old');

    expect(fromNew).not.toBeNull();
    expect(fromNew).toBe(fromOld);
    expect(fromNew?.kind).toBe('context');
  });

  it('上下文行新旧行号错开时，两侧都能查到', () => {
    const diff = makeDiff([['@@ -10,2 +10,3 @@', ' a', '+b', ' c'].join('\n'), MODIFIED]);
    const index = buildLineIndex(diff);

    // a 在两侧都是第 10 行
    expect(lookupAnchor(index, 'src/a.ts', 10, 'new')?.kind).toBe('context');
    expect(lookupAnchor(index, 'src/a.ts', 10, 'old')?.kind).toBe('context');
    // c 在新文件是 12、旧文件是 11——这正是「不能只存一个行号」的原因
    expect(lookupAnchor(index, 'src/a.ts', 12, 'new')?.kind).toBe('context');
    expect(lookupAnchor(index, 'src/a.ts', 11, 'old')?.kind).toBe('context');
  });

  it('删除行只有旧行号，新侧不存在这个行号', () => {
    const diff = makeDiff([['@@ -1,2 +1,1 @@', '-gone', ' keep'].join('\n'), MODIFIED]);
    const index = buildLineIndex(diff);

    const removed = lookupAnchor(index, 'src/a.ts', 1, 'old');
    expect(removed?.kind).toBe('removed');
    // 删除行没有新行号，这是它不能作为行内评论落点的原因
    expect(removed?.newLine).toBeNull();

    // 注意新侧第 1 行是保留下来的 keep，不是被删的那行——两者行号巧合相同
    expect(lookupAnchor(index, 'src/a.ts', 1, 'new')?.kind).toBe('context');
  });

  it('新增行只有新行号，旧侧查不到', () => {
    const diff = makeDiff([['@@ -1,1 +1,2 @@', ' keep', '+fresh'].join('\n'), MODIFIED]);
    const index = buildLineIndex(diff);

    expect(lookupAnchor(index, 'src/a.ts', 2, 'new')?.kind).toBe('added');
    expect(lookupAnchor(index, 'src/a.ts', 2, 'old')).toBeNull();
  });

  it('被跳过的文件不建表，但路径仍算在改动里', () => {
    const diff = makeDiff(
      [null, { path: 'big.ts', oldPath: null, status: 'added' }],
      [['@@ -0,0 +1,1 @@', '+x'].join('\n'), { path: 'ok.ts', oldPath: null, status: 'added' }],
    );
    const index = buildLineIndex(diff);

    // 文件在改动中，所以能通过「文件是否存在」这一关
    expect(index.files.has('big.ts')).toBe(true);
    // 但没有内容，所以任何行号都查不到——这会正确地触发定位失败
    expect(index.byNewLine.has('big.ts')).toBe(false);
    expect(lookupAnchor(index, 'big.ts', 1, 'new')).toBeNull();
  });

  it('纯重命名：新旧路径都登记，索引为空', () => {
    const diff = makeDiff(['', { path: 'b.ts', oldPath: 'a.ts', status: 'renamed' }]);
    const index = buildLineIndex(diff);

    expect(index.files.has('b.ts')).toBe(true);
    expect(index.files.has('a.ts')).toBe(true);
    expect(index.byNewLine.size).toBe(0);
  });

  it('多文件之间互不干扰', () => {
    const diff = makeDiff(
      [
        ['@@ -1,1 +1,1 @@', '-a', '+b'].join('\n'),
        { path: 'x.ts', oldPath: 'x.ts', status: 'modified' },
      ],
      [
        ['@@ -1,1 +1,1 @@', '-c', '+d'].join('\n'),
        { path: 'y.ts', oldPath: 'y.ts', status: 'modified' },
      ],
    );
    const index = buildLineIndex(diff);

    expect(lookupAnchor(index, 'x.ts', 1, 'new')?.file).toBe('x.ts');
    expect(lookupAnchor(index, 'y.ts', 1, 'new')?.file).toBe('y.ts');
  });
});

describe('可评论判断', () => {
  it('行号存在于改动中才可评论', () => {
    const diff = makeDiff([['@@ -1,1 +1,1 @@', '-a', '+b'].join('\n'), MODIFIED]);
    const index = buildLineIndex(diff);

    expect(isCommentable(index, 'src/a.ts', 1, 'new')).toBe(true);
    expect(isCommentable(index, 'src/a.ts', 1, 'old')).toBe(true);
    // 第 2 行不在改动范围内
    expect(isCommentable(index, 'src/a.ts', 2, 'new')).toBe(false);
    // 未参加改动的文件
    expect(isCommentable(index, 'src/other.ts', 1, 'new')).toBe(false);
  });
});
