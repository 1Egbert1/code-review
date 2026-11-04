import { describe, expect, it } from 'vitest';

import { createGitHubCheckPort } from '../src/platforms/github/checks.js';
import type { GitHubWriteGateway, PullRequestRef } from '../src/platforms/github/client.js';
import type { CheckRunInput } from '../src/platforms/types.js';

const REF: PullRequestRef = { owner: 'o', repo: 'r', number: 1 };

const INPUT: CheckRunInput = {
  name: 'AI 代码审查',
  headSha: 'abc123',
  conclusion: 'failure',
  title: '发现 1 个阻塞问题',
  summary: '- src/a.ts: 越界',
  annotations: [
    {
      path: 'src/a.ts',
      startLine: 1,
      endLine: 1,
      level: 'failure',
      title: '越界',
      message: '下标越界',
    },
  ],
};

function httpError(status: number): Error & { status: number } {
  const error = new Error(`HTTP ${String(status)}`) as Error & { status: number };
  error.status = status;
  return error;
}

interface Recorded {
  checkRunSummary?: string;
  checkRunAnnotations?: number;
  statusState?: string;
  statusContext?: string;
}

/** 只实现被用到的两个方法；其余成员靠断言绕过。 */
function gateway(
  behaviour: {
    checkRun?: () => Promise<string>;
    commitStatus?: () => Promise<string>;
  },
  log: Recorded = {},
): GitHubWriteGateway {
  return {
    createCheckRun: (
      _ref: unknown,
      input: { summary: string; annotations: readonly unknown[] },
    ) => {
      log.checkRunSummary = input.summary;
      log.checkRunAnnotations = input.annotations.length;
      return behaviour.checkRun?.() ?? Promise.resolve('check-1');
    },
    createCommitStatus: (_ref: unknown, input: { state: string; context: string }) => {
      log.statusState = input.state;
      log.statusContext = input.context;
      return behaviour.commitStatus?.() ?? Promise.resolve('status-1');
    },
  } as unknown as GitHubWriteGateway;
}

describe('门禁端口：检查运行优先', () => {
  it('能写检查运行时用它', async () => {
    const result = await createGitHubCheckPort(gateway({}), REF).publish(INPUT);

    expect(result).toEqual({ ok: true, commentId: 'check-1' });
  });

  it('注解超过 50 条时截断，并在摘要里说明还有多少', async () => {
    const log: Recorded = {};
    const many: CheckRunInput = {
      ...INPUT,
      annotations: Array.from({ length: 60 }, (_, i) => ({
        path: `src/f${String(i)}.ts`,
        startLine: 1,
        endLine: 1,
        level: 'failure' as const,
        title: 't',
        message: 'm',
      })),
    };

    await createGitHubCheckPort(gateway({}, log), REF).publish(many);

    expect(log.checkRunAnnotations).toBe(50);
    expect(log.checkRunSummary).toContain('另有 10 个问题未在注解中列出');
  });
});

describe('门禁端口：个人令牌写不了检查运行', () => {
  it('403 时降级到提交状态，仍然算成功', async () => {
    const result = await createGitHubCheckPort(
      gateway({
        checkRun: () => Promise.reject(httpError(403)),
        commitStatus: () => Promise.resolve('status-9'),
      }),
      REF,
    ).publish(INPUT);

    expect(result.ok).toBe(true);
    // 前缀标注实际用的是哪一种：不然用户会以为注解只是没显示
    expect(result).toMatchObject({ commentId: 'status:status-9' });
  });

  it('failure 映射成 failure，neutral 映射成 success（它本意就是不阻塞）', async () => {
    const failLog: Recorded = {};
    await createGitHubCheckPort(
      gateway({ checkRun: () => Promise.reject(httpError(403)) }, failLog),
      REF,
    ).publish(INPUT);
    expect(failLog.statusState).toBe('failure');

    const neutralLog: Recorded = {};
    await createGitHubCheckPort(
      gateway({ checkRun: () => Promise.reject(httpError(403)) }, neutralLog),
      REF,
    ).publish({ ...INPUT, conclusion: 'neutral' });
    expect(neutralLog.statusState).toBe('success');
  });

  it('降级时 context 用同一个名字，分支保护里才能对上', async () => {
    const log: Recorded = {};
    await createGitHubCheckPort(
      gateway({ checkRun: () => Promise.reject(httpError(403)) }, log),
      REF,
    ).publish(INPUT);

    expect(log.statusContext).toBe('AI 代码审查');
  });

  it('500 这类服务端错误不降级：换条路也一样失败，只会掩盖真错误', async () => {
    let statusCalled = false;
    const result = await createGitHubCheckPort(
      gateway({
        checkRun: () => Promise.reject(httpError(500)),
        commitStatus: () => {
          statusCalled = true;
          return Promise.resolve('s');
        },
      }),
      REF,
    ).publish(INPUT);

    expect(result.ok).toBe(false);
    expect(statusCalled).toBe(false);
  });

  it('两条路都失败时，错误信息说清各自要什么', async () => {
    const result = await createGitHubCheckPort(
      gateway({
        checkRun: () => Promise.reject(httpError(403)),
        commitStatus: () => Promise.reject(httpError(403)),
      }),
      REF,
    ).publish(INPUT);

    if (result.ok) throw new Error('应当失败');

    expect(result.failure.kind).toBe('permission');
    expect(result.failure.message).toContain('GitHub App');
    expect(result.failure.message).toContain('Commit statuses');
  });
});
