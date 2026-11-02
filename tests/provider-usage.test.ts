import { describe, expect, it } from 'vitest';

import { mapUsage } from '../src/providers/usage.js';

describe('用量归一', () => {
  it('OpenAI 形态：缓存命中记入 cacheRead，其余算未缓存', () => {
    const usage = mapUsage({
      prompt_tokens: 1000,
      completion_tokens: 200,
      prompt_tokens_details: { cached_tokens: 600 },
    });

    expect(usage).toEqual({
      uncachedInput: 400,
      cacheWriteShort: 0,
      cacheWriteLong: 0,
      cacheRead: 600,
      output: 200,
    });
  });

  it('DeepSeek 形态：命中与未命中分开给', () => {
    const usage = mapUsage({
      prompt_tokens: 900,
      completion_tokens: 100,
      prompt_cache_hit_tokens: 500,
    });

    expect(usage.cacheRead).toBe(500);
    expect(usage.uncachedInput).toBe(400);
  });

  it('Anthropic 形态：input_tokens 本身不含缓存部分，不能再减', () => {
    const usage = mapUsage({
      input_tokens: 300,
      output_tokens: 50,
      cache_read_input_tokens: 700,
      cache_creation_input_tokens: 200,
    });

    expect(usage.output).toBe(50);
    expect(usage.cacheRead).toBe(700);
    expect(usage.cacheWriteShort).toBe(200);
    // 若按总量口径再减一次，未缓存输入会被算成 0，成本被低估
    expect(usage.uncachedInput).toBe(300);
  });

  it('字段缺失时全零，不抛错', () => {
    expect(mapUsage(null)).toEqual({
      uncachedInput: 0,
      cacheWriteShort: 0,
      cacheWriteLong: 0,
      cacheRead: 0,
      output: 0,
    });
  });

  it('缓存数超过总输入时不出现负数', () => {
    const usage = mapUsage({
      prompt_tokens: 100,
      completion_tokens: 1,
      prompt_cache_hit_tokens: 500,
    });
    expect(usage.uncachedInput).toBe(0);
  });
});
