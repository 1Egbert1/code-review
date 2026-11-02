import { describe, expect, it } from 'vitest';

import { compileGlob, matchesAny, matchesGlob } from '../src/core/path-glob.js';

describe('glob 匹配', () => {
  it('**/ 能同时命中根目录与子目录', () => {
    expect(matchesGlob('package-lock.lock', '**/*.lock')).toBe(true);
    expect(matchesGlob('a/b/c.lock', '**/*.lock')).toBe(true);
  });

  it('** 匹配任意层级', () => {
    expect(matchesGlob('dist/index.js', '**/dist/**')).toBe(true);
    expect(matchesGlob('packages/app/dist/out.js', '**/dist/**')).toBe(true);
    expect(matchesGlob('src/dist.js', '**/dist/**')).toBe(false);
  });

  it('单星号不跨斜杠', () => {
    expect(matchesGlob('a.min.js', '*.min.js')).toBe(true);
    expect(matchesGlob('dir/a.min.js', '*.min.js')).toBe(false);
  });

  it('问号匹配单个非斜杠字符', () => {
    expect(matchesGlob('a1.ts', 'a?.ts')).toBe(true);
    expect(matchesGlob('a/.ts', 'a?.ts')).toBe(false);
  });

  it('点号按字面处理，不是通配', () => {
    // 若转义错了，`*.js` 会匹配到 `ajs`
    expect(matchesGlob('ajs', '*.js')).toBe(false);
    expect(matchesGlob('a.js', '*.js')).toBe(true);
  });

  it('反斜杠路径先归一化成正斜杠', () => {
    expect(matchesGlob('src\\a\\b.lock', '**/*.lock')).toBe(true);
  });

  it('编译结果是锚定的，不做子串匹配', () => {
    const re = compileGlob('*.ts');
    expect(re.test('a.ts')).toBe(true);
    expect(re.test('a.ts.bak')).toBe(false);
  });

  it('空模式列表不跳过任何文件', () => {
    expect(matchesAny('anything/at/all.ts', [])).toBe(false);
  });

  it('命中任意一条即算跳过', () => {
    expect(matchesAny('a/b.min.js', ['**/*.lock', '**/*.min.js'])).toBe(true);
  });
});
