import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

  it('inspect 已实现：空目录也能出报告', async () => {
    const { mkdtemp } = await import('node:fs/promises');
    const root = await mkdtemp(join(tmpdir(), 'acr-cli-inspect-'));
    const box = harness();
    expect(await main(['inspect'], { ...box.deps, cwd: root })).toBe(0);
    expect(box.stdout()).toContain('代码巡检报告');
  });

  it('--help 子命令级别也返回用法', async () => {
    const box = harness();
    expect(await main(['review', '--help'], box.deps)).toBe(0);
    expect(box.stdout()).toContain('子命令');
  });
});

describe('eval 子命令', () => {
  const SNAPSHOT = (datasetHash: string, recall: number): Record<string, unknown> => ({
    version: 1,
    label: 'v1',
    createdAt: '2026-11-03T00:00:00Z',
    codeVersion: 'abc',
    promptVersions: { correctness: 'v1.0' },
    model: 'm',
    configHash: 'c',
    datasetHash,
    metrics: { recall, precision: 0.8, avgLatencyMs: 1000, reproducibility: 1, samples: 5 },
    cost: null,
  });

  async function writeFixture(name: string, content: unknown): Promise<string> {
    const { writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const path = join(tmpdir(), name);
    await writeFile(path, JSON.stringify(content), 'utf8');
    return path;
  }

  it('缺参数时返回 2 并说明用法', async () => {
    const box = harness();
    expect(await main(['eval'], box.deps)).toBe(2);
    expect(box.stderr()).toContain('--baseline');
  });

  it('样本集相同则给出对比表', async () => {
    const box = harness();
    const a = await writeFixture('acr-base.json', SNAPSHOT('ds1', 0.7));
    const b = await writeFixture('acr-cur.json', SNAPSHOT('ds1', 0.75));

    expect(await main(['eval', '--baseline', a, '--current', b], box.deps)).toBe(0);
    expect(box.stdout()).toContain('召回率');
    expect(box.stdout()).toContain('结论');
  });

  it('样本集不同时拒绝对比并用非零退出', async () => {
    const box = harness();
    const a = await writeFixture('acr-base2.json', SNAPSHOT('ds1', 0.7));
    const b = await writeFixture('acr-cur2.json', SNAPSHOT('ds2', 0.7));

    expect(await main(['eval', '--baseline', a, '--current', b], box.deps)).toBe(1);
    expect(box.stdout()).toContain('无法对比');
  });

  it('文件不是快照时报错，而不是当成空数据', async () => {
    const box = harness();
    const a = await writeFixture('acr-bad.json', { hello: 'world' });
    const b = await writeFixture('acr-cur3.json', SNAPSHOT('ds1', 0.7));

    expect(await main(['eval', '--baseline', a, '--current', b], box.deps)).toBe(1);
    expect(box.stderr()).toContain('不是有效的基准快照');
  });
});

describe('审查对象参数', () => {
  it('既没有 --pr 也没有 --commit 时返回 3，并说明两种用法', async () => {
    const box = harness();
    expect(await main(['dry-run', '--repo', 'a/b'], box.deps)).toBe(3);
    expect(box.stderr()).toContain('--commit');
  });

  it('--commit 配 review 子命令被拒绝：提交没有评论区可贴', async () => {
    const box = harness();
    // 用 2（用法错误）而不是 3（缺信息）：这不是少给了东西，是这个组合本身不成立
    expect(await main(['review', '--repo', 'a/b', '--commit', 'abc123'], box.deps)).toBe(2);
    expect(box.stderr()).toContain('不支持发评论');
  });

  it('--commit 配 dry-run 可以通过参数校验，卡在缺模型密钥', async () => {
    const box = harness();
    expect(await main(['dry-run', '--repo', 'a/b', '--commit', 'abc123'], box.deps)).toBe(3);
    expect(box.stderr()).toContain('缺少模型密钥');
  });

  it('没有平台令牌时只告警不阻断（公开仓库可匿名读）', async () => {
    const box = harness();
    await main(['dry-run', '--repo', 'a/b', '--commit', 'abc123'], box.deps);
    expect(box.stderr()).toContain('匿名');
  });
});
