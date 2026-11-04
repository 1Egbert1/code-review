/**
 * OpenAI 兼容协议的调用客户端：拼请求、退避重试、结构化能力自适应降级、用量归一。
 *
 * ## 为什么不做「启动时发一个探测请求」
 *
 * 规格书原文写的是启动时探测。实现改成**首次真实调用时自适应降级**，理由是：
 * 探测请求本身要花钱，而且探测成功也不保证下一次成功（服务端灰度、模型改名都会让它变）。
 * 改成「第一次带 schema 的请求被拒 → 立刻用 json_object 重发 → 再被拒就退回纯提示词」，
 * 结果一样，少一次调用，且降级发生在真正需要它的那一刻。判定结果缓存到实例上，
 * 后续请求直接用确定下来的模式。
 *
 * ## 重试必须区分「值得重试」与「重试也没用」
 *
 * 429 与 5xx 是暂时性故障，重试有意义；401/403/404 重试一百次也一样。把后者也重试，
 * 只会让一个配置错误看起来像网络抖动，排查时间被拉长。
 */

import type { TokenUsage } from '../contracts/result.js';
import { buildResponseFormat, isSchemaRejection, parseJsonPayload } from './structured.js';
import type {
  FinishReason,
  HttpTransport,
  LlmClient,
  LlmRequest,
  LlmResponse,
  StructuredMode,
} from './types.js';
import { mapUsage } from './usage.js';

export interface ClientOptions {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly headers?: Readonly<Record<string, string>>;
  /** 初始结构化模式；'auto' 表示先试 json-schema */
  readonly structuredOutput?: 'auto' | StructuredMode;
  /** 最大尝试次数（含首次），默认 3 */
  readonly maxAttempts?: number;
  /** 单次重试的基础退避，默认 500ms；测试可传 0 */
  readonly baseDelayMs?: number;
  /** 注入的等待函数，测试用来跳过真实等待 */
  readonly sleep?: (ms: number) => Promise<void>;
  /** 注入的 HTTP 传输，默认用全局 fetch */
  readonly transport?: HttpTransport;
  /**
   * 单次请求的超时（毫秒），默认 180 秒。
   *
   * 默认必须有一个：没有超时的 fetch 在连接被中间设备挂住时会**永远不返回**，
   * 整轮审查就停在那里——命令行看起来在跑，CI 一直占着 runner，日志里什么都没有。
   * 这比报错难排查得多，因为没有任何可看的东西。
   */
  readonly timeoutMs?: number;
}

/** 值得重试的状态码：限流与服务端临时故障。 */
const RETRYABLE = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const DEFAULT_SLEEP = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** 默认传输：直接用全局 fetch。不引 SDK——多一层依赖就多一层版本与凭证处理的不确定性。 */
function createFetchTransport(
  apiKey: string,
  extra: Readonly<Record<string, string>>,
  timeoutMs: number,
): HttpTransport {
  return async (url, init) => {
    let response: Response;
    try {
      response = await fetch(url, {
        method: init.method,
        headers: { ...init.headers, ...extra, authorization: `Bearer ${apiKey}` },
        body: init.body,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      // 超时要转成有话说、且**可重试**的错误。原样的 AbortError 既没有状态码也没有说明，
      // 上层只能看到一个光秃秃的 name；这里补上「多久没响应」和提示
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new Error(`模型请求超时：${String(Math.round(timeoutMs / 1000))} 秒内没有响应`, {
          cause: error,
        });
      }
      throw error;
    }

    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      // 非 JSON 响应（网关错误页）原样保留，供报错时显示
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return { status: response.status, headers, body };
  };
}

function toFinishReason(raw: unknown): FinishReason {
  if (raw === 'stop' || raw === 'end_turn') return 'stop';
  if (raw === 'length' || raw === 'max_tokens') return 'length';
  if (raw === 'content_filter') return 'content-filter';
  return 'other';
}

/** 从响应体里取第一段文本。兼容 content 为字符串与分片数组两种形态。 */
function extractText(body: unknown): string {
  if (typeof body !== 'object' || body === null) return '';
  const choices = (body as Record<string, unknown>)['choices'];
  if (!Array.isArray(choices) || choices.length === 0) return '';

  const first: unknown = (choices as unknown[])[0];
  if (typeof first !== 'object' || first === null) return '';
  const message = (first as Record<string, unknown>)['message'];
  if (typeof message !== 'object' || message === null) return '';

  const content = (message as Record<string, unknown>)['content'];
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === 'object' &&
        part !== null &&
        typeof (part as Record<string, unknown>)['text'] === 'string'
          ? ((part as Record<string, unknown>)['text'] as string)
          : '',
      )
      .join('');
  }
  return '';
}

function extractRawUsage(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) return null;
  return (body as Record<string, unknown>)['usage'] ?? null;
}

function extractFinish(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) return undefined;
  const choices = (body as Record<string, unknown>)['choices'];
  if (!Array.isArray(choices) || choices.length === 0) return undefined;
  const first: unknown = (choices as unknown[])[0];
  if (typeof first !== 'object' || first === null) return undefined;
  return (first as Record<string, unknown>)['finish_reason'];
}

function extractModel(body: unknown, fallback: string): string {
  if (typeof body !== 'object' || body === null) return fallback;
  const model = (body as Record<string, unknown>)['model'];
  return typeof model === 'string' ? model : fallback;
}

/** 厂商在拒绝 schema 时给的说明，用于报错与排查。 */
function describeError(status: number, body: unknown): string {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return `模型接口返回 ${String(status)}：${text.slice(0, 300)}`;
}

const EMPTY_USAGE: TokenUsage = {
  uncachedInput: 0,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 0,
};

/** 把一次失败响应转成可重试与否的判断。 */
function isRetryable(status: number): boolean {
  return RETRYABLE.has(status);
}

export function createOpenAiCompatClient(options: ClientOptions): LlmClient {
  const sleep = options.sleep ?? DEFAULT_SLEEP;
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelay = options.baseDelayMs ?? 500;
  const transport =
    options.transport ??
    createFetchTransport(options.apiKey, options.headers ?? {}, options.timeoutMs ?? 180_000);
  const endpoint = `${options.baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const initial: StructuredMode =
    options.structuredOutput === undefined || options.structuredOutput === 'auto'
      ? 'json-schema'
      : options.structuredOutput;

  let mode: StructuredMode | null = initial === 'none' ? 'none' : initial;

  const send = async (
    request: LlmRequest,
    activeMode: StructuredMode,
  ): Promise<LlmResponse | { rejected: true; status: number; body: unknown }> => {
    const payload: Record<string, unknown> = {
      model: request.model,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: request.temperature,
      max_tokens: request.maxOutputTokens,
    };

    const format = buildResponseFormat(
      activeMode,
      request.schema,
      request.schemaName ?? 'finding_list',
    );
    if (format !== null) payload['response_format'] = format;

    const response = await transport(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // schema 被拒不是故障，是能力不具备：交给上层降级，不重试
    if (activeMode !== 'none' && isSchemaRejection(response.status, response.body)) {
      return { rejected: true, status: response.status, body: response.body };
    }

    if (response.status < 200 || response.status >= 300) {
      const error = new Error(describeError(response.status, response.body));
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return {
      text: extractText(response.body),
      finishReason: toFinishReason(extractFinish(response.body)),
      usage: mapUsage(extractRawUsage(response.body)),
      model: extractModel(response.body, request.model),
      structuredMode: activeMode,
    };
  };

  return {
    structuredMode() {
      return mode;
    },

    async complete(request: LlmRequest): Promise<LlmResponse> {
      // 只统计**失败**次数。能力降级不是失败，不能吃掉重试配额——
      // 否则一个需要降两级的环境，降级完就没有重试余量了
      let failures = 0;

      for (;;) {
        try {
          const result = await send(request, mode ?? 'none');

          if ('rejected' in result) {
            // 降级链：json-schema → json-object → none
            mode = mode === 'json-schema' ? 'json-object' : 'none';
            continue;
          }

          return result;
        } catch (error) {
          failures += 1;
          const status = (error as Error & { status?: number }).status;
          const retryable = status === undefined || isRetryable(status);

          if (!retryable || failures >= maxAttempts) throw error;
          // 指数退避：500 → 1000 → 2000，上限 8 秒
          await sleep(Math.min(baseDelay * 2 ** (failures - 1), 8000));
        }
      }
    },
  };
}

/** 供上层做「截断后重试」判断用：截断时 JSON 一定不完整，不能当成格式错误。 */
export function isTruncated(response: LlmResponse): boolean {
  return response.finishReason === 'length';
}

export { parseJsonPayload };
export const ZERO_USAGE: TokenUsage = EMPTY_USAGE;
