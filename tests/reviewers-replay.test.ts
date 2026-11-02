import { describe, expect, it } from 'vitest';

import {
  createReplayClient,
  loadReplay,
  requestKey,
  ReplayMissError,
} from '../src/core/reviewers/replay.js';
import type { ReplayFile } from '../src/core/reviewers/replay.js';
import type { LlmRequest } from '../src/providers/types.js';

const REQUEST: LlmRequest = {
  model: 'm',
  messages: [{ role: 'user', content: '审这个文件' }],
  temperature: 0.2,
  maxOutputTokens: 100,
  schema: { type: 'object' },
};

function file(records: ReplayFile['records'], promptVersion = 'v1'): ReplayFile {
  return { version: 1, reviewer: 'correctness', promptVersion, records };
}

const USAGE = { uncachedInput: 1, cacheWriteShort: 0, cacheWriteLong: 0, cacheRead: 0, output: 1 };

describe('回放', () => {
  it('命中键时原样返回录制内容', async () => {
    const client = createReplayClient(
      file([
        {
          requestKey: requestKey(REQUEST),
          response: {
            text: '{"findings":[]}',
            finishReason: 'stop',
            usage: USAGE,
            model: 'm',
            structuredMode: 'json-schema',
          },
        },
      ]),
    );

    const response = await client.complete(REQUEST);
    expect(response.text).toBe('{"findings":[]}');
    expect(client.used).toEqual([requestKey(REQUEST)]);
  });

  it('请求变了就失配并报错，不静默返回空结果', async () => {
    const client = createReplayClient(
      file([
        {
          requestKey: requestKey(REQUEST),
          response: {
            text: '{}',
            finishReason: 'stop',
            usage: USAGE,
            model: 'm',
            structuredMode: 'json-schema',
          },
        },
      ]),
    );

    const changed: LlmRequest = { ...REQUEST, messages: [{ role: 'user', content: '改了提示词' }] };
    await expect(client.complete(changed)).rejects.toBeInstanceOf(ReplayMissError);
  });

  it('键只由内容决定：字段顺序不同但内容相同仍然命中', () => {
    const a = requestKey({ ...REQUEST });
    const b = requestKey({
      schema: { type: 'object' },
      maxOutputTokens: 100,
      temperature: 0.2,
      messages: [{ role: 'user', content: '审这个文件' }],
      model: 'm',
    });
    expect(a).toBe(b);
  });

  it('改了模型或温度就会变键', () => {
    expect(requestKey({ ...REQUEST, temperature: 0.3 })).not.toBe(requestKey(REQUEST));
    expect(requestKey({ ...REQUEST, model: 'other' })).not.toBe(requestKey(REQUEST));
  });

  it('回放端可以覆盖响应，用于构造截断等分支', async () => {
    const client = createReplayClient(file([]), { text: '{"a":', finishReason: 'length' });
    const response = await client.complete(REQUEST);
    expect(response.finishReason).toBe('length');
  });

  it('装载时校验录制版本', () => {
    expect(() => loadReplay('{"version":2,"records":[]}')).toThrow(/版本/);
  });
});
