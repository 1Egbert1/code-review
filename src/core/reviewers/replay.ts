/**
 * 录制回放。
 *
 * 模型输出没法写确定性断言，所以测试分两套：确定性层用 fixture 单测，模型层用录制回放。
 * 回放的意义不是「验证模型答对」，而是**验证我们喂进去的东西稳定、解析稳定、边界稳定**。
 *
 * 三条纪律：
 * 1. 回放键由**请求内容**算出，不是序号。改了提示词就会失配——这正是我们要的信号
 * 2. 缺失的键**直接报错**，不返回空结果。静默通过会让一次提示词事故被当成「模型没发现问题」
 * 3. 回放客户端不持有任何网络能力，配合 {@link installNetworkGuard} 可证明测试全程零请求
 */

import type { TokenUsage } from '../../contracts/result.js';
import type {
  FinishReason,
  LlmClient,
  LlmRequest,
  LlmResponse,
  StructuredMode,
} from '../../providers/types.js';

/** 一条录制。`response.text` 就是当时模型返回的原文，不做任何清洗。 */
export interface ReplayRecord {
  readonly requestKey: string;
  readonly response: {
    readonly text: string;
    readonly finishReason: FinishReason;
    readonly usage: TokenUsage;
    readonly model: string;
    readonly structuredMode: StructuredMode;
  };
}

/** 一组录制，按请求键索引。 */
export interface ReplayFile {
  readonly version: 1;
  readonly reviewer: string;
  readonly promptVersion: string;
  readonly records: readonly ReplayRecord[];
}

const ZERO: TokenUsage = {
  uncachedInput: 0,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 0,
};

/**
 * 算请求键。
 *
 * 不用加密哈希：这里只需要稳定与短，碰撞风险由「同一次运行内键唯一」保证。
 * 用 FNV-1a，实现十行、无依赖、跨平台一致。
 */
export function requestKey(request: LlmRequest): string {
  const payload = JSON.stringify({
    model: request.model,
    messages: request.messages,
    temperature: request.temperature,
    maxOutputTokens: request.maxOutputTokens,
    schema: request.schema,
  });

  let hash = 0x811c9dc5;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** 回放时缺失键的错误。单独一个类型，便于测试断言。 */
export class ReplayMissError extends Error {
  constructor(public readonly key: string) {
    super(`回放记录里没有键 ${key} 的响应：提示词或材料已变更，需要重新录制`);
    this.name = 'ReplayMissError';
  }
}

/**
 * 用录制构造一个假客户端。
 *
 * `override` 用于测试特定分支（例如模拟截断），不参与录制文件本身。
 */
export function createReplayClient(
  file: ReplayFile,
  override?: Partial<ReplayRecord['response']>,
): LlmClient & { readonly used: string[] } {
  const byKey = new Map(file.records.map((record) => [record.requestKey, record]));
  const used: string[] = [];

  return {
    used,
    structuredMode() {
      return null;
    },
    complete(request: LlmRequest): Promise<LlmResponse> {
      const key = requestKey(request);
      used.push(key);

      const record = byKey.get(key);
      if (record === undefined && override === undefined) {
        return Promise.reject(new ReplayMissError(key));
      }

      const response = record?.response ?? {
        text: '',
        finishReason: 'stop' as FinishReason,
        usage: ZERO,
        model: request.model,
        structuredMode: 'json-schema' as StructuredMode,
        ...override,
      };

      return Promise.resolve(response);
    },
  };
}

/** 从 JSON 文本装载录制。解析失败直接抛，不做容错——录制文件坏了要立刻知道。 */
export function loadReplay(text: string): ReplayFile {
  const parsed = JSON.parse(text) as ReplayFile;
  if (parsed.version !== 1) throw new Error(`不支持的录制版本：${String(parsed.version)}`);
  return parsed;
}
