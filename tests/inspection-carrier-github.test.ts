import { describe, expect, it } from 'vitest';

import type { RawIssue } from '../src/platforms/github/client.js';
import type { GitHubWriteGateway, RepoRef } from '../src/platforms/github/client.js';
import {
  createGitHubIssueWriter,
  createGitWikiWriter,
  INSPECTION_LABEL,
} from '../src/platforms/github/reports.js';

const REF: RepoRef = { owner: 'acme', repo: 'web' };

interface FakeGateway {
  issues: RawIssue[];
  created: { title: string; body: string; labels: readonly string[] }[];
  updated: { number: number; title?: string; body?: string }[];
  closed: number[];
  /** 标签是否已确保存在；创建前必须有一次 */
  ensured: string[];
  failCreate: boolean;
}

function issue(number: number, state: 'open' | 'closed' = 'closed'): RawIssue {
  return {
    number,
    title: `报告 ${String(number)}`,
    body: 'old',
    url: `https://x/${String(number)}`,
    state,
  };
}

function gateway(state: FakeGateway): GitHubWriteGateway {
  return {
    async listIssuesByLabel() {
      return state.issues;
    },
    async ensureLabel(_ref: RepoRef, label: string) {
      state.ensured.push(label);
    },
    async createIssue(
      _ref: RepoRef,
      input: { title: string; body: string; labels: readonly string[] },
    ) {
      if (state.failCreate) throw new Error('权限不足');
      state.created.push(input);
      const number = 100 + state.created.length;
      state.issues.push(issue(number, 'open'));
      return issue(number, 'open');
    },
    async updateIssue(_ref: RepoRef, number: number, input: { title?: string; body?: string }) {
      state.updated.push({ number, ...input });
      const current = state.issues.find((item) => item.number === number);
      return {
        ...issue(number, current?.state ?? 'closed'),
        ...(input.title === undefined ? {} : { title: input.title }),
      };
    },
    async closeIssue(_ref: RepoRef, number: number) {
      state.closed.push(number);
    },
  } as unknown as GitHubWriteGateway;
}

function emptyState(): FakeGateway {
  return { issues: [], created: [], updated: [], closed: [], ensured: [], failCreate: false };
}

describe('Issue 载体', () => {
  it('首次写入：创建后立刻关闭，不留 open 条目', async () => {
    const state = emptyState();
    const writer = createGitHubIssueWriter(gateway(state), REF);

    const outcome = await writer.write('2026-11-03', '# 报告');
    expect(outcome.ok).toBe(true);
    expect(state.created[0]?.labels).toEqual([INSPECTION_LABEL]);
    // 编号由平台生成，这里只关心「创建后确实关掉了」
    expect(state.closed).toHaveLength(1);
  });

  it('新建前先确保标签存在：否则平台会静默丢掉标签，去重从此失效', async () => {
    const state = emptyState();
    const writer = createGitHubIssueWriter(gateway(state), REF);

    await writer.write('2026-11-03', '# 报告');
    // 这条断言守的是「去重能不能持续成立」：标签没建出来，下一轮按标签查就是空集，
    // 于是每轮新建一条，而任何一次写入的返回值都是 ok——线上看不出来。
    expect(state.ensured).toEqual([INSPECTION_LABEL]);
  });

  it('复用已有报告时不再重复建标签', async () => {
    const state = emptyState();
    state.issues.push(issue(7));
    const writer = createGitHubIssueWriter(gateway(state), REF);

    await writer.write('2026-11-03', '# 报告');
    expect(state.ensured).toHaveLength(0);
  });

  it('已有报告时更新同一条，不新建第二条', async () => {
    const state = emptyState();
    state.issues.push(issue(7));
    const writer = createGitHubIssueWriter(gateway(state), REF);

    await writer.write('2026-11-03', '# 新报告');
    expect(state.created).toHaveLength(0);
    expect(state.updated[0]?.number).toBe(7);
  });

  it('旧报告若处于 open，更新后补一次关闭', async () => {
    const state = emptyState();
    state.issues.push(issue(7, 'open'));
    const writer = createGitHubIssueWriter(gateway(state), REF);

    await writer.write('2026-11-03', '# 新报告');
    expect(state.closed).toEqual([7]);
  });

  it('多条时取编号最大的那条', async () => {
    const state = emptyState();
    state.issues.push(issue(3), issue(9), issue(5));
    const writer = createGitHubIssueWriter(gateway(state), REF);

    await writer.write('2026-11-03', '# 新报告');
    expect(state.updated[0]?.number).toBe(9);
  });

  it('失败时返回结构化失败，不抛异常', async () => {
    const state = emptyState();
    state.failCreate = true;
    const writer = createGitHubIssueWriter(gateway(state), REF);

    const outcome = await writer.write('2026-11-03', '# 报告');
    expect(outcome.ok).toBe(false);
  });
});

describe('Wiki 载体', () => {
  interface Fake {
    commands: string[];
    failAt: number;
  }

  async function run(state: Fake) {
    const writer = createGitWikiWriter({
      cloneUrl: 'https://x-access-token:t@github.com/acme/web.wiki.git',
      workDir: '/tmp/acr-wiki-test',
      run: (command, args, cwd) => {
        state.commands.push(`${command} ${args.join(' ')} @${cwd}`);
        if (state.commands.length === state.failAt)
          return Promise.reject(new Error('push rejected'));
        return Promise.resolve();
      },
    });
    return writer.write('2026-11-03', '# 报告');
  }

  it('按 clone → pull → 提交 → 推送的顺序执行', async () => {
    const state: Fake = { commands: [], failAt: 0 };
    const outcome = await run(state);

    expect(outcome.ok).toBe(true);
    // 首次没有 .git，走 clone
    expect(state.commands[0]).toContain('git clone');
    expect(state.commands.some((command) => command.includes('commit'))).toBe(true);
    expect(state.commands.some((command) => command.includes('push'))).toBe(true);
  });

  it('推送被拒时返回结构化失败，交给上层降级', async () => {
    const state: Fake = { commands: [], failAt: 4 };
    const outcome = await run(state);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toContain('push rejected');
  });
});
