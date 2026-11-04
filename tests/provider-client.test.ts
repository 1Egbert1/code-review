import { describe, expect, it } from 'vitest';

import { createOpenAiCompatClient } from '../src/providers/openai-compat.js';
import type { HttpResponse, LlmRequest, HttpTransport } from '../src/providers/types.js';

const REQUEST: LlmRequest = {
  model: 'test-model',
  messages: [{ role: 'user', content: 'hi' }],
  temperature: 0.2,
  maxOutputTokens: 100,
  schema: { type: 'object' },
};

function ok(body: unknown): HttpResponse {
  return { status: 200, headers: {}, body };
}

function content(text: string, finish: string = 'stop'): HttpResponse {
  return ok({
    model: 'test-model',
    choices: [{ message: { content: text }, finish_reason: finish }],
    usage: { prompt_tokens: 100, completion_tokens: 20 },
  });
}

/** 记录请求体，按顺序回放响应。 */
function fakeTransport(responses: (HttpResponse | Error)[]): {
  transport: HttpTransport;
  bodies: Record<string, unknown>[];
  calls: () => number;
} {
  let index = 0;
  const bodies: Record<string, unknown>[] = [];

  const transport: HttpTransport = async (_url, init) => {
    bodies.push(JSON.parse(init.body) as Record<string, unknown>);
    const next = responses[index];
    index += 1;
    if (next === undefined) throw new Error('响应队列耗尽');
    if (next instanceof Error) throw next;
    return next;
  };

  return { transport, bodies, calls: () => index };
}

describe('模型客户端', () => {
  it('成功调用：带回文本、结束原因与用量', async () => {
    const fake = fakeTransport([content('{"a":1}')]);
    const client = createOpenAiCompatClient({
      baseUrl: 'https://x/v1',
      apiKey: 'k',
      transport: fake.transport,
      sleep: async () => {},
    });

    const response = await client.complete(REQUEST);
    expect(response.text).toBe('{"a":1}');
    expect(response.finishReason).toBe('stop');
    expect(response.usage.uncachedInput).toBe(100);
    expect(response.usage.output).toBe(20);
    expect(response.structuredMode).toBe('json-schema');
  });

  it('schema 被拒时依次降级到 json-object 再到 none', async () => {
    const reject = ok({ error: { message: 'response_format json_schema not supported' } });
    const fake = fakeTransport([
      { ...reject, status: 400 },
      { ...reject, status: 400 },
      content('{"a":1}'),
    ]);
    const client = createOpenAiCompatClient({
      baseUrl: 'https://x/v1',
      apiKey: 'k',
      transport: fake.transport,
      sleep: async () => {},
    });

    const response = await client.complete(REQUEST);
    expect(response.structuredMode).toBe('none');
    // 三次请求的 response_format 形态不同
    expect(fake.bodies[0]?.['response_format']).toMatchObject({ type: 'json_schema' });
    expect(fake.bodies[1]?.['response_format']).toEqual({ type: 'json_object' });
    expect(fake.bodies[2]?.['response_format']).toBeUndefined();
    // 降级结果被记住
    expect(client.structuredMode()).toBe('none');
  });

  it('降级不吃重试配额：降级两次后仍能重试', async () => {
    const reject = { status: 400, headers: {}, body: { error: { message: 'response_format' } } };
    const rateLimited = { status: 429, headers: {}, body: { error: 'slow down' } };
    const fake = fakeTransport([reject, reject, rateLimited, content('{"ok":true}')]);
    const client = createOpenAiCompatClient({
      baseUrl: 'https://x/v1',
      apiKey: 'k',
      transport: fake.transport,
      sleep: async () => {},
      maxAttempts: 2,
    });

    const response = await client.complete(REQUEST);
    expect(response.text).toBe('{"ok":true}');
  });

  it('429 会退避重试，且退避时间递增', async () => {
    const waits: number[] = [];
    const fake = fakeTransport([
      { status: 429, headers: {}, body: { error: 'slow down' } },
      { status: 503, headers: {}, body: { error: 'unavailable' } },
      content('{"a":1}'),
    ]);
    const client = createOpenAiCompatClient({
      baseUrl: 'https://x/v1',
      apiKey: 'k',
      transport: fake.transport,
      baseDelayMs: 100,
      sleep: async (ms) => {
        waits.push(ms);
      },
    });

    await client.complete(REQUEST);
    expect(waits).toEqual([100, 200]);
  });

  it('401 立即失败，不重试', async () => {
    const fake = fakeTransport([{ status: 401, headers: {}, body: { error: 'bad key' } }]);
    const client = createOpenAiCompatClient({
      baseUrl: 'https://x/v1',
      apiKey: 'k',
      transport: fake.transport,
      sleep: async () => {},
    });

    await expect(client.complete(REQUEST)).rejects.toThrow(/401/);
    expect(fake.calls()).toBe(1);
  });

  it('重试达上限后抛出最后一次错误', async () => {
    const fake = fakeTransport([
      { status: 500, headers: {}, body: { error: 'boom' } },
      { status: 500, headers: {}, body: { error: 'boom' } },
      { status: 500, headers: {}, body: { error: 'boom' } },
    ]);
    const client = createOpenAiCompatClient({
      baseUrl: 'https://x/v1',
      apiKey: 'k',
      transport: fake.transport,
      sleep: async () => {},
      maxAttempts: 3,
    });

    await expect(client.complete(REQUEST)).rejects.toThrow(/500/);
    expect(fake.calls()).toBe(3);
  });

  it('长度截断被单独标记，不与格式错误混为一谈', async () => {
    const fake = fakeTransport([content('{"findings":[{"file":', 'length')]);
    const client = createOpenAiCompatClient({
      baseUrl: 'https://x/v1',
      apiKey: 'k',
      transport: fake.transport,
      sleep: async () => {},
    });

    const response = await client.complete(REQUEST);
    expect(response.finishReason).toBe('length');
  });

  it('baseUrl 末尾斜杠不会拼出双斜杠', async () => {
    const urls: string[] = [];
    const transport: HttpTransport = async (url) => {
      urls.push(url);
      return content('{}');
    };
    const client = createOpenAiCompatClient({
      baseUrl: 'https://x/v1///',
      apiKey: 'k',
      transport,
      sleep: async () => {},
    });

    await client.complete(REQUEST);
    expect(urls[0]).toBe('https://x/v1/chat/completions');
  });

  it('显式指定 none 时完全不发 response_format', async () => {
    const fake = fakeTransport([content('plain text')]);
    const client = createOpenAiCompatClient({
      baseUrl: 'https://x/v1',
      apiKey: 'k',
      structuredOutput: 'none',
      transport: fake.transport,
      sleep: async () => {},
    });

    await client.complete(REQUEST);
    expect(fake.bodies[0]?.['response_format']).toBeUndefined();
  });
});

describe('请求超时', () => {
  it('连接被挂住时在超时后失败，并说清「多久没响应」', async () => {
    // 没有超时的 fetch 在中间设备挂住连接时会永远不返回：命令行看起来在跑，
    // CI 一直占着 runner，日志一片空白。这里用「只认 abort 信号」的假 fetch 复现那个状态。
    const original = globalThis.fetch;
    globalThis.fetch = ((_url: unknown, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const error = new Error('The operation was aborted');
          error.name = 'TimeoutError';
          reject(error);
        });
      })) as typeof fetch;

    try {
      const client = createOpenAiCompatClient({
        baseUrl: 'https://x/v1',
        apiKey: 'k',
        timeoutMs: 20,
        maxAttempts: 1,
        sleep: async () => {},
      });

      await expect(client.complete(REQUEST)).rejects.toThrow(/超时/);
    } finally {
      globalThis.fetch = original;
    }
  });
});
