import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { main } from '../src/cli/main.js';

/** 收集输出，避免污染终端。 */
function harness() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    deps: {
      cwd: tmpdir(),
      env: {} as NodeJS.ProcessEnv,
      stdout: (text: string) => out.push(text),
      stderr: (text: string) => err.push(text),
    },
    stdout: () => out.join(''),
    stderr: () => err.join(''),
  };
}

describe('命令行入口', () => {
  it('无参数时打印用法并返回 0', async () => {
    const box = harness();
    expect(await main([], box.deps)).toBe(0);
    expect(box.stdout()).toContain('用法');
  });

  it('--version 输出版本号', async () => {
    const box = harness();
    expect(await main(['--version'], box.deps)).toBe(0);
    expect(box.stdout().trim()).toBe('0.1.0');
  });

  it('未知命令返回 2，并在标准错误说明', async () => {
    const box = harness();
    expect(await main(['nope'], box.deps)).toBe(2);
    expect(box.stderr()).toContain('未知命令');
  });

  it('缺少仓库时返回 3，并说清怎么补', async () => {
    const box = harness();
    expect(await main(['review'], box.deps)).toBe(3);
    expect(box.stderr()).toContain('--repo');
  });

  it('有仓库但缺编号时返回 3', async () => {
    const box = harness();
    expect(await main(['review', '--repo', 'a/b'], box.deps)).toBe(3);
    expect(box.stderr()).toContain('--pr');
  });

  it('有仓库与编号但缺令牌时返回 3，且提示变量名', async () => {
    const box = harness();
    expect(await main(['review', '--repo', 'a/b', '--pr', '1'], box.deps)).toBe(3);
    expect(box.stderr()).toContain('GITHUB_TOKEN');
  });

  it('dry-run 缺参数时同样返回 3，不假装成功', async () => {
    const box = harness();
    expect(await main(['dry-run', '--repo', 'a/b'], box.deps)).toBe(3);
  });

  it('cost 能给出预估，未配单价时明确说无法折算', async () => {
    const box = harness();
    expect(await main(['cost', '--files', '10', '--lines', '400'], box.deps)).toBe(0);
    expect(box.stdout()).toContain('预计');
    expect(box.stdout()).toContain('未配置单价');
  });

  it('inspect 尚未实现时返回 3', async () => {
    const box = harness();
    expect(await main(['inspect'], box.deps)).toBe(3);
    expect(box.stderr()).toContain('尚未实现');
  });

  it('--help 子命令级别也返回用法', async () => {
    const box = harness();
    expect(await main(['review', '--help'], box.deps)).toBe(0);
    expect(box.stdout()).toContain('子命令');
  });
});
