import { describe, expect, it } from 'vitest';

import { checkFileRules } from '../src/core/inspection/file-rules.js';
import {
  computeComplexity,
  computeDependencies,
  computeDuplication,
  computeTests,
  computeTypeSafety,
  countCircularDependencies,
} from '../src/core/inspection/metrics.js';
import type { SourceFile } from '../src/core/inspection/metrics.js';

function file(path: string, lines: readonly string[]): SourceFile {
  return { path, content: lines.join('\n') };
}

describe('复杂度', () => {
  it('统计函数数量与平均长度', () => {
    const source = file('src/a.ts', [
      'function a() {',
      '  return 1;',
      '}',
      'function b() {',
      '  return 2;',
      '}',
    ]);
    const stats = computeComplexity([source], 10);

    expect(stats.functions).toBe(2);
    expect(stats.avgFunctionLines).toBe(3);
    expect(stats.maxFunctionLines).toBe(3);
  });

  it('圈复杂度按分支点累加', () => {
    const source = file('src/a.ts', [
      'function f(a) {',
      '  if (a) {',
      '    return 1;',
      '  }',
      '  return a && 2;',
      '}',
    ]);
    const stats = computeComplexity([source], 10);

    // if 一次 + && 一次，加基准 1
    expect(stats.maxCyclomatic).toBeGreaterThanOrEqual(3);
  });

  it('没有函数时不出现除零', () => {
    const stats = computeComplexity([file('src/a.ts', ['const a = 1;'])], 10);
    expect(stats.functions).toBe(0);
    expect(stats.avgFunctionLines).toBe(0);
    expect(stats.avgCyclomatic).toBe(0);
  });

  it('记录最长文件行数', () => {
    const stats = computeComplexity([file('src/a.ts', new Array(120).fill('const a = 1;'))], 10);
    expect(stats.maxFileLines).toBe(120);
  });
});

describe('重复代码', () => {
  const block = [
    'function a() {',
    '  const x = 1;',
    '  const y = 2;',
    '  const z = 3;',
    '  return x + y + z;',
    '}',
  ];

  it('同样六行出现两次即判为重复', () => {
    const stats = computeDuplication([file('src/a.ts', block), file('src/b.ts', block)]);

    expect(stats.ratio).toBeGreaterThan(0);
    expect(stats.blocks).toBeGreaterThan(0);
  });

  it('只出现一次的内容不算重复', () => {
    const stats = computeDuplication([file('src/a.ts', block)]);
    expect(stats.ratio).toBe(0);
  });

  it('空文件不出现除零', () => {
    expect(computeDuplication([file('src/a.ts', [''])]).ratio).toBe(0);
  });
});

describe('依赖', () => {
  it('统计依赖总数与宽松版本占比', () => {
    const manifest = file('package.json', [
      JSON.stringify({ dependencies: { a: '^1.0.0', b: '1.2.3', c: '~2.0.0' } }),
    ]);
    const stats = computeDependencies([manifest]);

    expect(stats.total).toBe(3);
    expect(stats.loose).toBe(2);
    expect(stats.checkedOutdated).toBe(false);
  });

  it('清单坏掉时按无法统计处理，不抛错', () => {
    const stats = computeDependencies([file('package.json', ['{ 不是 JSON'])]);
    expect(stats.total).toBe(0);
  });

  it('认出相对引用的循环', () => {
    const circular = countCircularDependencies([
      file('src/a.ts', ["import { b } from './b';", 'export const a = 1;']),
      file('src/b.ts', ["import { a } from './a';", 'export const b = 1;']),
    ]);
    expect(circular).toBeGreaterThan(0);
  });

  it('单向引用不算循环', () => {
    const circular = countCircularDependencies([
      file('src/a.ts', ["import { b } from './b';"]),
      file('src/b.ts', ['export const b = 1;']),
    ]);
    expect(circular).toBe(0);
  });
});

describe('类型安全', () => {
  it('统计 any 密度与忽略检查的注释', () => {
    const stats = computeTypeSafety([
      file('src/a.ts', [
        'const a: any = 1;',
        '// 这里不要用 any',
        '// @ts-ignore',
        'const b: string = "x";',
      ]),
    ]);

    expect(stats.anyCount).toBe(1);
    expect(stats.ignoredChecks).toBe(1);
    expect(stats.anyDensity).toBeGreaterThan(0);
  });

  it('注释里提到 any 不算逃逸', () => {
    const stats = computeTypeSafety([file('src/a.ts', ['// 不要用 any', '* any 会关闭检查'])]);
    expect(stats.anyCount).toBe(0);
  });
});

describe('测试', () => {
  it('按文件名认出测试文件并算比例', () => {
    const stats = computeTests([
      file('src/a.ts', ['export const a = 1;']),
      file('src/a.test.ts', ['test("a", () => {});']),
    ]);

    expect(stats.testFiles).toBe(1);
    expect(stats.sourceFiles).toBe(1);
    expect(stats.ratio).toBe(1);
  });

  it('没有覆盖率数据时为 null，不填 0', () => {
    expect(computeTests([]).coveragePercent).toBeNull();
  });
});

describe('文件级规则', () => {
  it('空 catch 被报出来', () => {
    const issues = checkFileRules([file('src/a.ts', ['try {', '  run();', '} catch (e) {}'])]);
    expect(issues.some((issue) => issue.rule === 'empty-catch')).toBe(true);
  });

  it('写死的密钥被报出来', () => {
    const issues = checkFileRules([file('src/a.ts', ["const apiKey = 'abcdef12345678';"])]);
    expect(issues.some((issue) => issue.rule === 'hardcoded-secret')).toBe(true);
  });

  it('类型声明里的 password 不算写死凭证', () => {
    const issues = checkFileRules([file('src/a.ts', ['interface User { password: string }'])]);
    expect(issues.some((issue) => issue.rule === 'hardcoded-secret')).toBe(false);
  });

  it('复杂函数带行号', () => {
    const lines = ['function f(a) {'];
    for (let index = 0; index < 12; index += 1)
      lines.push(`  if (a > ${String(index)}) { a += 1; }`);
    lines.push('}');

    const issues = checkFileRules([file('src/a.ts', lines)]);
    const complex = issues.find((issue) => issue.rule === 'complex-function');
    expect(complex?.line).toBe(1);
  });

  it('默认阈值下普通文件不产生噪音', () => {
    const issues = checkFileRules([
      file('src/a.ts', ['export function add(a: number, b: number) {', '  return a + b;', '}']),
    ]);
    expect(issues).toEqual([]);
  });
});
