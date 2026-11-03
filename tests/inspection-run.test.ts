import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import { runInspection } from '../src/core/inspection/run.js';
import { main } from '../src/cli/main.js';
import { collectSourceFiles, isSourceFile } from '../src/cli/walk.js';

const CLEAN_FILES = [
  {
    path: 'src/math.ts',
    content: ['export function add(a: number, b: number) {', '  return a + b;', '}'].join('\n'),
  },
  {
    path: 'src/math.test.ts',
    content: ['test("add", () => {', '  expect(add(1, 2)).toBe(3);', '});'].join('\n'),
  },
];

const CONFIG = { ...DEFAULT_CONFIG.inspection, enabled: true };

describe('巡检编排', () => {
  it('干净项目拿高分且不产出问题', () => {
    const report = runInspection({
      repository: 'acme/web',
      commitSha: 'abc123',
      files: CLEAN_FILES,
      config: CONFIG,
      coveragePercent: 90,
      now: () => '2026-11-03T00:00:00Z',
    });

    expect(report.totalScore).toBeGreaterThanOrEqual(80);
    expect(report.findings).toEqual([]);
    expect(report.inspectedAt).toBe('2026-11-03T00:00:00Z');
  });

  it('文件级问题进 findings，且标为早就在', () => {
    const report = runInspection({
      repository: 'acme/web',
      commitSha: 'abc123',
      files: [{ path: 'src/a.ts', content: ['try {', '  run();', '} catch (e) {}'].join('\n') }],
      config: CONFIG,
    });

    const emptyCatch = report.findings.find((finding) => finding.category === 'empty-catch');
    expect(emptyCatch).toBeDefined();
    expect(emptyCatch?.preexisting).toBe(true);
    expect(emptyCatch?.scope).toBe('file');
  });

  it('首期不把全部问题算成「新增」', () => {
    const report = runInspection({
      repository: 'a/b',
      commitSha: 'c',
      files: [{ path: 'src/a.ts', content: ['try {', '} catch (e) {}'].join('\n') }],
      config: CONFIG,
    });

    // 上期数据不存在时，regressions 应为空而不是把所有问题都算成新增
    expect(report.regressions).toEqual([]);
  });

  it('有上期指纹时能算出新增与已修复', () => {
    const files = [{ path: 'src/a.ts', content: ['try {', '} catch (e) {}'].join('\n') }];
    const first = runInspection({ repository: 'a/b', commitSha: 'c1', files, config: CONFIG });

    const second = runInspection({
      repository: 'a/b',
      commitSha: 'c2',
      files: CLEAN_FILES,
      config: CONFIG,
      previousFingerprints: first.findings.map((finding) => finding.fingerprint),
    });

    expect(second.regressions).toEqual([]);
    expect(second.resolved.length).toBe(first.findings.length);
  });

  it('五个维度都有分数与明细', () => {
    const report = runInspection({
      repository: 'a/b',
      commitSha: 'c',
      files: CLEAN_FILES,
      config: CONFIG,
    });
    expect(report.breakdown).toHaveLength(5);
    expect(Object.keys(report.scores)).toHaveLength(5);
  });
});

describe('目录遍历', () => {
  it('只收源码文件，跳过依赖与产物目录', () => {
    expect(isSourceFile('a.ts')).toBe(true);
    expect(isSourceFile('a.png')).toBe(false);
    expect(isSourceFile('README')).toBe(false);
  });

  it('递归收集并按路径排序，路径统一用正斜杠', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acr-walk-'));
    await mkdir(join(root, 'src'), { recursive: true });
    await mkdir(join(root, 'node_modules', 'x'), { recursive: true });
    await writeFile(join(root, 'src', 'b.ts'), 'export const b = 1;', 'utf8');
    await writeFile(join(root, 'src', 'a.ts'), 'export const a = 1;', 'utf8');
    await writeFile(join(root, 'node_modules', 'x', 'evil.ts'), 'should be skipped', 'utf8');

    const files = await collectSourceFiles(root);
    expect(files.map((file) => file.path)).toEqual(['src/a.ts', 'src/b.ts']);
  });
});

describe('inspect 子命令', () => {
  it('在空目录也能出报告，不因没有源码而报错', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acr-inspect-'));
    const out = join(root, 'report.md');
    const box = { cwd: root, env: {} as NodeJS.ProcessEnv, stdout: () => {}, stderr: () => {} };

    expect(await main(['inspect', '--out', out], box)).toBe(0);
  });

  it('--coverage 不是数字时返回 2', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acr-inspect2-'));
    const box = { cwd: root, env: {} as NodeJS.ProcessEnv, stdout: () => {}, stderr: () => {} };

    expect(await main(['inspect', '--coverage', 'abc'], box)).toBe(2);
  });

  it('输出包含六段结构中的关键段', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acr-inspect3-'));
    await writeFile(join(root, 'a.ts'), 'export function f() {\n  return 1;\n}', 'utf8');

    let output = '';
    const box = {
      cwd: root,
      env: { GITHUB_REPOSITORY: 'acme/web' } as NodeJS.ProcessEnv,
      stdout: (text: string) => {
        output += text;
      },
      stderr: () => {},
    };

    expect(await main(['inspect'], box)).toBe(0);
    expect(output).toContain('代码巡检报告');
    expect(output).toContain('分数明细');
    expect(output).toContain('最该做的三件事');
  });
});
