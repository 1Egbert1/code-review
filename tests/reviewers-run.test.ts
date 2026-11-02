import { afterEach, describe, expect, it } from 'vitest';

import type { ContextSegment } from '../src/contracts/context.js';
import type { TokenUsage } from '../src/contracts/result.js';
import { installNetworkGuard } from '../src/core/reviewers/network-guard.js';
import { runReviewer } from '../src/core/reviewers/run.js';
import { buildSchema } from '../src/core/reviewers/schema.js';
import type { ReviewerSpec } from '../src/core/reviewers/schema.js';
import type { LlmClient, LlmRequest, LlmResponse } from '../src/providers/types.js';

const SPEC: ReviewerSpec = {
  id: 'correctness',
  promptVersion: 'v1',
  allowedCategories: ['logic'],
  maxSeverity: 'blocker',
  systemPrompt: 'sys',
  schema: buildSchema(['logic'], 'blocker'),
  buildUserMessage: (input) =>
    `${input.file ?? '(全局)'}\n${input.segments.map((s) => s.content).join('\n')}`,
};

const SEG: ContextSegment = {
  tier: 'L0',
  path: 'a.ts',
  title: 't',
  content: 'old',
  estimatedTokens: 1,
};

const USAGE: TokenUsage = {
  uncachedInput: 10,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 5,
};

function response(text: string, finish: LlmResponse['finishReason'] = 'stop'): LlmResponse {
  return { text, finishReason: finish, usage: USAGE, model: 'm', structuredMode: 'json-schema' };
}

/** 按顺序回放响应的假客户端。 */
function client(responses: LlmResponse[]): LlmClient & { calls: number; requests: LlmRequest[] } {
  let index = 0;
  const state = {
    calls: 0,
    requests: [] as LlmRequest[],
    structuredMode: () => null,
    async complete(request: LlmRequest): Promise<LlmResponse> {
      state.requests.push(request);
      const next = responses[index];
      index += 1;
      state.calls += 1;
      if (next === undefined) throw new Error('响应耗尽');
      return next;
    },
  };
  return state;
}

const VALID = JSON.stringify({
  findings: [
    {
      file: 'a.ts',
      line: 3,
      side: 'new',
      severity: 'major',
      category: 'logic',
      title: '空指针',
      body: '输入为空时崩溃',
      evidence: 'return x.y',
      suggestion: null,
      confidence: 0.9,
    },
  ],
});

const INPUT = { file: 'a.ts', segments: [SEG] };

describe('跑一次审核员', () => {
  it('正常输出被解析成原始问题项', async () => {
    const fake = client([response(VALID)]);
    const result = await runReviewer({ client: fake, spec: SPEC, input: INPUT, model: 'm' });

    expect(result.findings).toHaveLength(1);
    expect(result.rejections).toHaveLength(0);
    expect(result.calls).toBe(1);
    expect(result.truncated).toBe(false);
  });

  it('系统提示与用户材料分别放在两条消息里', async () => {
    const fake = client([response(VALID)]);
    await runReviewer({ client: fake, spec: SPEC, input: INPUT, model: 'm' });

    expect(fake.requests[0]?.messages[0]).toEqual({ role: 'system', content: 'sys' });
  });

  it('输出被截断时先收缩材料重试一次', async () => {
    const fake = client([response('{"findings":[', 'length'), response(VALID)]);
    const result = await runReviewer({
      client: fake,
      spec: SPEC,
      input: INPUT,
      model: 'm',
      shrink: () => ({ file: 'a.ts', segments: [] }),
    });

    expect(result.calls).toBe(2);
    expect(result.findings).toHaveLength(1);
    // 第二次请求里材料确实被换掉了
    expect(fake.requests[1]?.messages[1]?.content).toBe('a.ts\n');
  });

  it('收缩后仍截断则放弃并留痕，不无限重试', async () => {
    const fake = client([response('{"a":', 'length'), response('{"b":', 'length')]);
    const result = await runReviewer({
      client: fake,
      spec: SPEC,
      input: INPUT,
      model: 'm',
      shrink: () => ({ file: 'a.ts', segments: [] }),
    });

    expect(result.calls).toBe(2);
    expect(result.truncated).toBe(true);
    expect(result.findings).toHaveLength(0);
    expect(result.rejections[0]?.detail).toContain('长度上限');
  });

  it('没有收缩策略时截断直接放弃，不重复请求', async () => {
    const fake = client([response('{"a":', 'length')]);
    const result = await runReviewer({ client: fake, spec: SPEC, input: INPUT, model: 'm' });

    expect(result.calls).toBe(1);
    expect(result.truncated).toBe(true);
  });

  it('三次调用的用量要累加', async () => {
    const fake = client([response('{"findings":[]}', 'length'), response(VALID)]);
    const result = await runReviewer({
      client: fake,
      spec: SPEC,
      input: INPUT,
      model: 'm',
      shrink: () => ({ file: 'a.ts', segments: [] }),
    });

    // 第一次截断 + 第二次成功，共两次调用
    expect(result.calls).toBe(2);
    // 两次调用各 10 个未缓存输入，必须累加而不是覆盖
    expect(result.usage.uncachedInput).toBe(20);
    expect(result.usage.output).toBe(10);
  });

  it('空输出与非法 JSON 分别给出可读原因', async () => {
    const empty = await runReviewer({
      client: client([response('   ')]),
      spec: SPEC,
      input: INPUT,
      model: 'm',
    });
    expect(empty.rejections[0]?.detail).toContain('空');

    const broken = await runReviewer({
      client: client([response('这不是 JSON')]),
      spec: SPEC,
      input: INPUT,
      model: 'm',
    });
    expect(broken.rejections[0]?.detail).toContain('JSON');
  });

  it('字段不合规的条目被拒，但同批其他条目照常通过', async () => {
    const validItem = (JSON.parse(VALID) as { findings: unknown[] }).findings[0];
    const mixed = JSON.stringify({
      findings: [
        validItem,
        {
          file: 'a.ts',
          line: 0,
          side: 'new',
          severity: 'major',
          category: 'logic',
          title: 'x',
          body: 'b',
          evidence: 'e',
          confidence: 0.5,
        },
      ],
    });

    const result = await runReviewer({
      client: client([response(mixed)]),
      spec: SPEC,
      input: INPUT,
      model: 'm',
    });
    expect(result.findings).toHaveLength(1);
    expect(result.rejections).toHaveLength(1);
  });
});

describe('网络拦截', () => {
  let dispose: (() => void) | null = null;
  afterEach(() => {
    dispose?.();
    dispose = null;
  });

  it('装上之后任何真实请求立即失败', async () => {
    dispose = installNetworkGuard();
    await expect(fetch('https://api.example.com/v1/chat/completions')).rejects.toThrow(
      /禁止真实网络请求/,
    );
  });

  it('卸载之后恢复原状', async () => {
    const before = globalThis.fetch;
    const off = installNetworkGuard();
    off();
    expect(globalThis.fetch).toBe(before);
  });
});
