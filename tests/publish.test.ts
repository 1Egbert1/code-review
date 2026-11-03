import { describe, expect, it } from 'vitest';

import type { Finding } from '../src/contracts/index.js';
import type { PublishAction, ReviewWarning } from '../src/contracts/result.js';
import { renderInlineBody } from '../src/core/publish/render.js';
import { renderSummary } from '../src/core/publish/summary.js';
import { publish } from '../src/core/publish/publisher.js';
import type { CommentPort, WriteResult } from '../src/platforms/types.js';

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    fingerprint: 'fp1',
    reviewer: 'correctness',
    anchor: { file: 'src/a.ts', oldPath: null, kind: 'added', newLine: 10, oldLine: null },
    positionOrigin: 'model-line',
    severity: 'major',
    category: 'null-safety',
    title: '空值未判断',
    body: 'v 可能是 null，读取属性时崩溃',
    evidence: 'return v.y;',
    suggestion: '判空后再取',
    confidence: 0.9,
    preexisting: false,
    scope: 'changed',
    ...overrides,
  };
}

describe('行内评论渲染', () => {
  it('标题、证据、建议都在，标记在最后一行', () => {
    const body = renderInlineBody(finding(), { promptVersion: 'v1.0', model: 'm' });
    const lines = body.split('\n');

    expect(body).toContain('空值未判断');
    expect(body).toContain('return v.y;');
    expect(body).toContain('建议');
    // 标记必须在末尾：平台可能吞掉开头的内容，吞掉就认不出是谁发的了
    expect(lines[lines.length - 1]).toContain('acr:v1');
    expect(lines[lines.length - 1]).toContain('fp1');
  });

  it('没有建议时不渲染建议段', () => {
    const body = renderInlineBody(finding({ suggestion: null }), {
      promptVersion: 'v1.0',
      model: 'm',
    });
    expect(body).not.toContain('**建议**');
  });
});

describe('摘要渲染', () => {
  const base = {
    baseSha: 'base123',
    headSha: 'head456',
    trimmedSegments: 0,
    promptVersions: { correctness: 'v1.0' },
    warnings: [] as ReviewWarning[],
    rejectedCount: 0,
  };

  it('按严重度统计，并说明行内条数', () => {
    const text = renderSummary({
      ...base,
      findings: [finding(), finding({ fingerprint: 'fp2', severity: 'minor' })],
      summaryOnly: [],
      inlineCount: 2,
    });

    expect(text).toContain('| 主要 | 1 |');
    expect(text).toContain('| 次要 | 1 |');
    expect(text).toContain('2 条');
  });

  it('存量问题单列一区，标题写明不是本次引入', () => {
    const text = renderSummary({
      ...base,
      findings: [finding({ preexisting: true })],
      summaryOnly: [finding({ preexisting: true })],
      inlineCount: 0,
    });

    expect(text).toContain('不是本次改动引入');
  });

  it('没有问题时给一句明确的话，而不是空表', () => {
    const text = renderSummary({ ...base, findings: [], summaryOnly: [], inlineCount: 0 });
    expect(text).toContain('未发现问题');
    expect(text).not.toContain('| 严重度 |');
  });

  it('裁剪过上下文要写进来，否则用户不知道为什么结论偏窄', () => {
    const text = renderSummary({
      ...base,
      trimmedSegments: 3,
      findings: [],
      summaryOnly: [],
      inlineCount: 0,
    });
    expect(text).toContain('裁剪了 3 处');
  });

  it('摘要带固定标记，用于下一轮原地更新', () => {
    const text = renderSummary({ ...base, findings: [], summaryOnly: [], inlineCount: 0 });
    expect(text.endsWith('<!-- acr:v1|kind=summary -->')).toBe(true);
  });
});

interface FakePort extends CommentPort {
  readonly calls: string[];
  maxConcurrent: number;
  failResolve: boolean;
  failReadback: boolean;
  existingSummary: boolean;
}

function fakePort(): FakePort {
  let seq = 0;
  let inFlight = 0;
  const state: FakePort = {
    kind: 'fake',
    calls: [],
    maxConcurrent: 0,
    failResolve: false,
    failReadback: false,
    existingSummary: false,
    async createInline(target, _body) {
      inFlight += 1;
      state.maxConcurrent = Math.max(state.maxConcurrent, inFlight);
      seq += 1;
      state.calls.push(`create:${target.path}:${String(target.line)}`);
      await Promise.resolve();
      inFlight -= 1;
      return { ok: true, commentId: `c${String(seq)}` } satisfies WriteResult;
    },
    async createThread() {
      state.calls.push('thread:create');
      return { ok: true, commentId: 'summary1' };
    },
    async update(id) {
      state.calls.push(`update:${id}`);
      return { ok: true, commentId: id };
    },
    async resolve(id) {
      state.calls.push(`resolve:${id}`);
      return state.failResolve
        ? { ok: false, failure: { kind: 'permission', message: 'no write access', status: 403 } }
        : { ok: true, commentId: id };
    },
    async remove(id) {
      state.calls.push(`remove:${id}`);
      return { ok: true, commentId: id };
    },
    async read(id) {
      state.calls.push(`read:${id}`);
      return { body: state.failReadback ? '正文被改写' : `正文 fp1 ${id}` };
    },
    async findThread() {
      state.calls.push('find');
      return state.existingSummary ? { commentId: 'summary1', body: '旧摘要' } : null;
    },
  };
  return state;
}

function inlineCreate(fingerprint = 'fp1'): PublishAction {
  return { kind: 'create', target: 'inline', finding: finding({ fingerprint }), body: 'body' };
}

describe('发送', () => {
  it('创建后回读，四步都走到', async () => {
    const port = fakePort();
    const outcome = await publish({
      port,
      actions: [inlineCreate()],
      summaryBody: null,
      sleep: async () => {},
    });

    expect(outcome.created).toBe(1);
    expect(port.calls).toEqual(['create:src/a.ts:10', 'read:c1']);
    expect(outcome.readbackFailures).toBe(0);
  });

  it('回读发现内容被改写时告警，但不影响其他条目', async () => {
    const port = fakePort();
    port.failReadback = true;
    const outcome = await publish({
      port,
      actions: [inlineCreate()],
      summaryBody: null,
      sleep: async () => {},
    });

    expect(outcome.readbackFailures).toBe(1);
    expect(outcome.warnings[0]?.kind).toBe('readback');
  });

  it('串行发送：任何时刻只有一个写请求在飞', async () => {
    const port = fakePort();
    await publish({
      port,
      actions: [inlineCreate('a'), inlineCreate('b'), inlineCreate('c')],
      summaryBody: null,
      sleep: async () => {},
    });

    expect(port.maxConcurrent).toBe(1);
  });

  it('条数多时按批暂停，且全部发完', async () => {
    const port = fakePort();
    const waits: number[] = [];
    const actions = Array.from({ length: 12 }, (_unused, index) =>
      inlineCreate(`fp${String(index)}`),
    );

    const outcome = await publish({
      port,
      actions,
      summaryBody: null,
      batchSize: 5,
      intervalMs: 300,
      sleep: async (ms) => {
        waits.push(ms);
      },
    });

    expect(outcome.created).toBe(12);
    // 每次之间一次 + 每满一批再多一次
    expect(waits.filter((ms) => ms === 300).length).toBeGreaterThanOrEqual(11);
  });

  it('replace 先发新的再删旧的：顺序反了会丢掉这条意见', async () => {
    const port = fakePort();
    const outcome = await publish({
      port,
      actions: [{ kind: 'replace', commentId: 'old1', finding: finding(), body: 'body' }],
      summaryBody: null,
      sleep: async () => {},
    });

    expect(outcome.replaced).toBe(1);
    expect(port.calls).toEqual(['create:src/a.ts:10', 'remove:old1']);
  });

  it('没有解决权限时降级为编辑加说明，并告警', async () => {
    const port = fakePort();
    port.failResolve = true;

    const outcome = await publish({
      port,
      actions: [{ kind: 'resolve', commentId: 'old1', finding: null }],
      summaryBody: null,
      sleep: async () => {},
      now: () => '2026-11-02T00:00:00Z',
    });

    expect(outcome.resolved).toBe(1);
    expect(port.calls).toContain('update:old1');
    expect(outcome.warnings[0]?.kind).toBe('permission');
  });

  it('摘要：没有则新建，有则更新，绝不重复发', async () => {
    const fresh = fakePort();
    const createdOutcome = await publish({
      port: fresh,
      actions: [],
      summaryBody: '摘要正文',
      sleep: async () => {},
    });
    expect(createdOutcome.summary).toBe('created');

    const existing = fakePort();
    existing.existingSummary = true;
    const updatedOutcome = await publish({
      port: existing,
      actions: [],
      summaryBody: '摘要正文',
      sleep: async () => {},
    });
    expect(updatedOutcome.summary).toBe('updated');
    expect(existing.calls).toContain('update:summary1');
    expect(existing.calls).not.toContain('thread:create');
  });

  it('keep 不产生任何写操作', async () => {
    const port = fakePort();
    await publish({
      port,
      actions: [{ kind: 'keep', commentId: 'c1', finding: finding() }],
      summaryBody: null,
      sleep: async () => {},
    });

    expect(port.calls).toEqual([]);
  });
});
