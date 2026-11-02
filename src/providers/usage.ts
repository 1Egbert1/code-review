/**
 * 把各厂商的用量字段归一成五类 token。
 *
 * 为什么必须拆开：五类的单价不同（缓存读取常见是输入价的十分之一，写入反而更贵）。
 * 只留「输入 / 输出」两个数，事后无法回答「这次到底省在哪」——而这正是优化提示词
 * 与验证缓存是否真的命中时唯一需要的证据。
 *
 * 各家的字段名不一样，这里是**已知形态的映射表**，不是猜测：
 * - OpenAI 系：`prompt_tokens` / `completion_tokens` / `prompt_tokens_details.cached_tokens`
 * - DeepSeek：额外给 `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`
 * - Anthropic 系：`input_tokens` / `output_tokens` / `cache_read_input_tokens` / `cache_creation_input_tokens`
 *
 * 认不出的字段一律按 0 处理，并靠 `uncachedInput` 的差额兜底——
 * 宁可把「本该更便宜」算成「原价」，也不能把用量算少（那会低估成本，比高估危险）。
 */

import type { TokenUsage } from '../contracts/result.js';

function num(source: unknown, key: string): number {
  if (typeof source !== 'object' || source === null) return 0;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function obj(source: unknown, key: string): unknown {
  if (typeof source !== 'object' || source === null) return null;
  return (source as Record<string, unknown>)[key] ?? null;
}

/** 解析一次响应的用量。入参是厂商返回的原始 usage 对象。 */
export function mapUsage(raw: unknown): TokenUsage {
  const completion = num(raw, 'completion_tokens') || num(raw, 'output_tokens');
  const prompt = num(raw, 'prompt_tokens') || num(raw, 'input_tokens');

  const details = obj(raw, 'prompt_tokens_details');
  const cacheRead =
    num(details, 'cached_tokens') ||
    num(raw, 'cache_read_input_tokens') ||
    num(raw, 'prompt_cache_hit_tokens');

  const cacheWriteShort = num(raw, 'cache_creation_input_tokens');
  // 部分厂商区分 5 分钟与 1 小时缓存，未区分时一律记为短有效期
  const cacheWriteLong = num(raw, 'cache_creation_input_tokens_1h');

  // 两种口径必须分开处理，否则会把未缓存输入算成 0，进而低估成本：
  // - 总量口径（OpenAI / DeepSeek）：prompt_tokens 含缓存命中部分，要减出来
  // - 增量口径（Anthropic）：input_tokens 本身就不含缓存部分
  const incremental = num(raw, 'cache_read_input_tokens') > 0 || cacheWriteShort > 0;
  const uncachedInput = incremental
    ? prompt
    : Math.max(0, prompt - cacheRead - cacheWriteShort - cacheWriteLong);

  return {
    uncachedInput,
    cacheWriteShort,
    cacheWriteLong,
    cacheRead,
    output: completion,
  };
}
