/**
 * 模型调用层的契约。
 *
 * 这一层只做四件事：拼请求、发请求、退避重试、把用量如实带回来。
 * **它不认识「审核」「提示词」「问题项」**——把业务概念放进来，换模型或换厂商时就得连带改业务。
 */

import type { TokenUsage } from '../contracts/result.js';

/** 强制结构化输出的三种做法，能力从强到弱。 */
export type StructuredMode =
  /** 用 JSON Schema 约束（最可靠，模型无法越界） */
  | 'json-schema'
  /** 只能要求「输出 JSON」，结构靠提示词 + 事后校验 */
  | 'json-object'
  /** 厂商不支持任何结构化输出，只能全凭提示词 */
  | 'none';

export interface LlmMessage {
  readonly role: 'system' | 'user';
  readonly content: string;
}

export interface LlmRequest {
  readonly model: string;
  readonly messages: readonly LlmMessage[];
  readonly temperature: number;
  readonly maxOutputTokens: number;
  /** 期望输出的 JSON Schema；null 表示只要自由文本 */
  readonly schema: Readonly<Record<string, unknown>> | null;
  /** schema 的名字，部分厂商要求必填 */
  readonly schemaName?: string;
}

/** 结束原因。`length` 必须单独识别：截断的 JSON 解析失败会被误判成「模型不会输出」 */
export type FinishReason = 'stop' | 'length' | 'content-filter' | 'other';

export interface LlmResponse {
  readonly text: string;
  readonly finishReason: FinishReason;
  readonly usage: TokenUsage;
  readonly model: string;
  /** 这次实际用了哪种结构化模式，需要记进评论标记以便追溯 */
  readonly structuredMode: StructuredMode;
}

export interface LlmClient {
  complete(request: LlmRequest): Promise<LlmResponse>;
  /** 当前生效的结构化模式；尚未发生过调用时为 null */
  structuredMode(): StructuredMode | null;
}

/** 一次 HTTP 交互的结果。抽出来是为了让重试与降级可以不碰真实网络。 */
export interface HttpResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: unknown;
}

export type HttpTransport = (
  url: string,
  init: {
    readonly method: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
  },
) => Promise<HttpResponse>;
