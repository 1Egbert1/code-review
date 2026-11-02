import { describe, expect, it } from 'vitest';

import type { DiffFile } from '../src/contracts/index.js';
import { type FileMeta, parsePatch, parseUnifiedDiff } from '../src/core/diff/parse.js';

/** 构造单文件元信息，默认是普通修改。 */
function meta(overrides: Partial<FileMeta> = {}): FileMeta {
  return { path: 'src/a.ts', oldPath: 'src/a.ts', status: 'modified', ...overrides };
}

/** 用数组拼补丁，避免模板字符串吃掉行首空格。 */
function patch(...lines: string[]): string {
  return lines.join('\n');
}

/** 取出某一行的行号快照，便于整体断言。 */
function anchorOf(file: DiffFile, index: number): readonly [string, number | null, number | null] {
  const line = file.lines[index];
  if (line === undefined) throw new Error(`第 ${String(index)} 行不存在`);
  return [line.anchor.kind, line.anchor.oldLine, line.anchor.newLine];
}

describe('单文件补丁解析', () => {
  it('按标记识别三种行，并各自维护新旧行号', () => {
    const file = parsePatch(
      patch('@@ -1,4 +1,5 @@', ' line1', '-old2', '+new2', '+new2b', ' line3', ' line4'),
      meta(),
    );

    expect(file.lines).toHaveLength(6);
    expect(anchorOf(file, 0)).toEqual(['context', 1, 1]);
    expect(anchorOf(file, 1)).toEqual(['removed', 2, null]);
    expect(anchorOf(file, 2)).toEqual(['added', null, 2]);
    expect(anchorOf(file, 3)).toEqual(['added', null, 3]);
    // 关键：这里是 old=3 / new=4，同一个上下文行在两个版本里的行号已经错开
    expect(anchorOf(file, 4)).toEqual(['context', 3, 4]);
    expect(anchorOf(file, 5)).toEqual(['context', 4, 5]);
  });

  it('上下文行的新旧行号必须独立递增，不能共用一个变量', () => {
    const file = parsePatch(patch('@@ -10,3 +10,4 @@', ' a', '+b', ' c', ' d'), meta());

    // 若实现用同一个计数变量，c 会被算成 old=11/new=11，这里就会失败
    expect(anchorOf(file, 2)).toEqual(['context', 11, 12]);
    expect(anchorOf(file, 3)).toEqual(['context', 12, 13]);
  });

  it('多个改动块各自以块头的行号为起点', () => {
    const file = parsePatch(
      patch('@@ -1,2 +1,2 @@', ' a', '-b', '+c', '@@ -10,2 +10,2 @@', ' j', '-k', '+l'),
      meta(),
    );

    expect(anchorOf(file, 0)).toEqual(['context', 1, 1]);
    expect(anchorOf(file, 3)).toEqual(['context', 10, 10]);
    expect(anchorOf(file, 4)).toEqual(['removed', 11, null]);
    expect(anchorOf(file, 5)).toEqual(['added', null, 11]);
  });

  it('块头省略计数时按 1 处理', () => {
    const file = parsePatch(patch('@@ -5 +5 @@', '-x', '+y'), meta());
    expect(anchorOf(file, 0)).toEqual(['removed', 5, null]);
    expect(anchorOf(file, 1)).toEqual(['added', null, 5]);
  });

  it('统计新增与删除的行数，不计上下文行', () => {
    const file = parsePatch(patch('@@ -1,3 +1,4 @@', ' a', '-b', '+c', '+d', ' e'), meta());
    expect(file.changedCount).toBe(3);
  });

  it('行文本不含标记字符', () => {
    const file = parsePatch(patch('@@ -1,1 +1,1 @@', '-const a=1;', '+const a=2;'), meta());
    expect(file.lines[0]?.text).toBe('const a=1;');
    expect(file.lines[1]?.text).toBe('const a=2;');
  });
});

describe('特殊文件与边界情况', () => {
  it('新增文件：全部为 added，没有旧行号', () => {
    const file = parsePatch(
      patch('@@ -0,0 +1,3 @@', '+a', '+b', '+c'),
      meta({ path: 'new.ts', oldPath: null, status: 'added' }),
    );

    expect(file.lines.every((line) => line.anchor.kind === 'added')).toBe(true);
    expect(file.lines.every((line) => line.anchor.oldLine === null)).toBe(true);
    expect(anchorOf(file, 0)).toEqual(['added', null, 1]);
  });

  it('删除文件：全部为 removed，没有新行号', () => {
    const file = parsePatch(
      patch('@@ -1,3 +0,0 @@', '-a', '-b', '-c'),
      meta({ path: 'gone.ts', status: 'deleted' }),
    );

    expect(file.lines.every((line) => line.anchor.kind === 'removed')).toBe(true);
    expect(file.lines.every((line) => line.anchor.newLine === null)).toBe(true);
    expect(anchorOf(file, 2)).toEqual(['removed', 3, null]);
  });

  it('纯重命名没有 hunk，属于正常情况而不是「跳过」', () => {
    // 真实行为：只改文件名的 diff 里没有任何行内容，规格书 6.3 写的「行全部为 context」不成立
    const file = parsePatch('', meta({ path: 'b.ts', oldPath: 'a.ts', status: 'renamed' }));

    expect(file.lines).toHaveLength(0);
    expect(file.changedCount).toBe(0);
    expect(file.skippedReason).toBeNull();
    expect(file.oldPath).toBe('a.ts');
  });

  it('平台未提供补丁（null）要标为跳过，不能等同于「没有改动」', () => {
    const file = parsePatch(null, meta());
    expect(file.skippedReason).toBe('平台未提供补丁内容');
    expect(file.lines).toHaveLength(0);
  });

  it('二进制文件标为跳过', () => {
    const file = parsePatch('Binary files a/logo.png and b/logo.png differ', meta());
    expect(file.skippedReason).toBe('二进制文件');
  });

  it('忽略「文件末尾无换行」标记，不产生多余行也不丢行', () => {
    const file = parsePatch(
      patch(
        '@@ -1,2 +1,2 @@',
        ' a',
        '-b',
        '\\ No newline at end of file',
        '+c',
        '\\ No newline at end of file',
      ),
      meta(),
    );

    expect(file.lines).toHaveLength(3);
    expect(anchorOf(file, 0)).toEqual(['context', 1, 1]);
    expect(anchorOf(file, 1)).toEqual(['removed', 2, null]);
    expect(anchorOf(file, 2)).toEqual(['added', null, 2]);
  });

  it('CRLF 与 LF 不能产生不同的解析结果', () => {
    const lines = ['@@ -1,2 +1,2 @@', ' a', '-b', '+c'];
    const lf = parsePatch(lines.join('\n'), meta());
    const crlf = parsePatch(lines.join('\r\n'), meta());

    expect(crlf.lines.map((line) => line.anchor)).toEqual(lf.lines.map((line) => line.anchor));
    expect(crlf.lines.map((line) => line.text)).toEqual(lf.lines.map((line) => line.text));
  });

  it('末尾多余的空行不会变成虚假的上下文行', () => {
    const withTrailing = `${patch('@@ -1,1 +1,1 @@', '-a', '+b')}\n`;
    const file = parsePatch(withTrailing, meta());
    expect(file.lines).toHaveLength(2);
  });

  it('上下文行的空内容（被裁掉行尾空格）仍按上下文处理', () => {
    const file = parsePatch(patch('@@ -1,2 +1,2 @@', ' a', '', '+b'), meta());
    expect(file.lines).toHaveLength(3);
    expect(anchorOf(file, 1)).toEqual(['context', 2, 2]);
    expect(file.lines[1]?.text).toBe('');
  });
});

describe('完整 diff 解析（本地模式）', () => {
  it('按 diff --git 切分多个文件', () => {
    const text = [
      'diff --git a/src/a.ts b/src/a.ts',
      'index 111..222 100644',
      '--- a/src/a.ts',
      '+++ b/src/a.ts',
      '@@ -1,1 +1,1 @@',
      '-old',
      '+new',
      'diff --git a/src/b.ts b/src/b.ts',
      '--- a/src/b.ts',
      '+++ b/src/b.ts',
      '@@ -1,1 +1,1 @@',
      '-x',
      '+y',
    ].join('\n');

    const diff = parseUnifiedDiff(text);
    expect(diff.files).toHaveLength(2);
    expect(diff.files[0]?.path).toBe('src/a.ts');
    expect(diff.files[1]?.path).toBe('src/b.ts');
  });

  it('识别新增文件为 added 状态', () => {
    const text = [
      'diff --git a/n.ts b/n.ts',
      'new file mode 100644',
      '--- /dev/null',
      '+++ b/n.ts',
      '@@ -0,0 +1,1 @@',
      '+hello',
    ].join('\n');

    const diff = parseUnifiedDiff(text);
    expect(diff.files[0]?.status).toBe('added');
    expect(diff.files[0]?.oldPath).toBeNull();
  });

  it('识别删除文件与重命名', () => {
    const text = [
      'diff --git a/old.ts b/old.ts',
      'deleted file mode 100644',
      '--- a/old.ts',
      '+++ /dev/null',
      '@@ -1,1 +0,0 @@',
      '-bye',
      'diff --git a/x.ts b/y.ts',
      'similarity index 100%',
      'rename from x.ts',
      'rename to y.ts',
    ].join('\n');

    const diff = parseUnifiedDiff(text);
    expect(diff.files[0]?.status).toBe('deleted');
    expect(diff.files[1]?.status).toBe('renamed');
    expect(diff.files[1]?.path).toBe('y.ts');
    expect(diff.files[1]?.oldPath).toBe('x.ts');
  });
});
