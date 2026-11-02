/**
 * 跑一次审核员。
 *
 * 这里是「模型」与「确定性代码」的接缝，四条边界必须守住：
 * 1. 模型只产出原始问题项，**不产出**指纹、是否本次引入、出口（行内还是摘要）
 * 2. 模型说什么都不影响控制流——它没有工具、不能要求再读一次文件
 * 3. 任何失败只影响这一个文件这一维，不能拖垮整轮
 * 4. 截断要单独处理：先缩材料重试一次，仍截断就放弃并留痕，**不能当成格式错误**
 */

import type { ContextSegment } from '../../contracts/context.js';
import type { RawFinding, Rejection } from '../../contracts/finding.js';
import type { TokenUsage } from '../../contracts/result.js';
import { parseJsonPayload } from '../../providers/structured.js';
import type { LlmClient, StructuredMode } from '../../providers/types.js';
import { validateRawFindings } from './schema.js';
import type { ReviewerInput, ReviewerSpec } from './schema.js';

export interface RunReviewerOptions {
  readonly client: LlmClient;
  readonly spec: ReviewerSpec;
  readonly input: ReviewerInput;
  readonly model: string;
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
  /**
   * 输出被截断时的收缩策略。
   * 返回 null 表示无法再收缩——此时放弃，不要反复重试同一份材料。
   */
  readonly shrink?: (input: ReviewerInput) => ReviewerInput | null;
}

export interface ReviewerRunResult {
  readonly findings: readonly RawFinding[];
  readonly rejections: readonly Rejection[];
  readonly usage: TokenUsage;
  /** 因长度上限被截断且收缩后仍截断 */
  readonly truncated: boolean;
  /** 被截到严重度上限的条数 */
  readonly clamped: number;
  readonly structuredMode: StructuredMode | null;
  /** 一次完成的模型调用次数（含截断重试） */
  readonly calls: number;
}

const ZERO: TokenUsage = {
  uncachedInput: 0,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 0,
};

export function sumUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    uncachedInput: a.uncachedInput + b.uncachedInput,
    cacheWriteShort: a.cacheWriteShort + b.cacheWriteShort,
    cacheWriteLong: a.cacheWriteLong + b.cacheWriteLong,
    cacheRead: a.cacheRead + b.cacheRead,
    output: a.output + b.output,
  };
}

/** 把上下文段拼成一段可读文本。顺序由装配层决定，这里不重排——重排会破坏缓存命中。 */
export function renderSegments(segments: readonly ContextSegment[]): string {
  return segments
    .map((segment) => [`### ${segment.title}`, segment.content].join('\n'))
    .join('\n\n');
}

export async function runReviewer(options: RunReviewerOptions): Promise<ReviewerRunResult> {
  const { client, spec } = options;
  let input = options.input;
  let usage = ZERO;
  let calls = 0;

  const request = (current: ReviewerInput): Parameters<LlmClient['complete']>[0] => ({
    model: options.model,
    messages: [
      { role: 'system', content: spec.systemPrompt },
      { role: 'user', content: spec.buildUserMessage(current) },
    ],
    temperature: options.temperature ?? 0.2,
    maxOutputTokens: options.maxOutputTokens ?? 4096,
    schema: spec.schema,
    schemaName: spec.id,
  });

  let response = await client.complete(request(input));
  calls += 1;
  usage = sumUsage(usage, response.usage);

  // 截断优先判断：半截 JSON 解析必然失败，先当格式错误会把归因带偏
  if (response.finishReason === 'length') {
    const shrunk = options.shrink?.(input) ?? null;
    if (shrunk === null) {
      return {
        findings: [],
        rejections: [
          {
            reviewer: spec.id,
            file: input.file ?? '(全局)',
            line: 0,
            title: '(输出被截断)',
            reason: 'schema-invalid',
            detail: '输出达到长度上限，且无法进一步收缩材料',
          },
        ],
        usage,
        truncated: true,
        clamped: 0,
        structuredMode: response.structuredMode,
        calls,
      };
    }

    input = shrunk;
    response = await client.complete(request(input));
    calls += 1;
    usage = sumUsage(usage, response.usage);

    if (response.finishReason === 'length') {
      return {
        findings: [],
        rejections: [
          {
            reviewer: spec.id,
            file: input.file ?? '(全局)',
            line: 0,
            title: '(输出被截断)',
            reason: 'schema-invalid',
            detail: '收缩材料后仍达到长度上限',
          },
        ],
        usage,
        truncated: true,
        clamped: 0,
        structuredMode: response.structuredMode,
        calls,
      };
    }
  }

  const parsed = parseJsonPayload(response.text);
  if (!parsed.ok) {
    return {
      findings: [],
      rejections: [
        {
          reviewer: spec.id,
          file: input.file ?? '(全局)',
          line: 0,
          title: '(输出无法解析)',
          reason: 'schema-invalid',
          detail: parsed.reason === 'empty' ? '模型返回空内容' : '输出中找不到合法 JSON',
        },
      ],
      usage,
      truncated: false,
      clamped: 0,
      structuredMode: response.structuredMode,
      calls,
    };
  }

  const outcome = validateRawFindings(parsed.value, spec);

  const rejections: Rejection[] = outcome.rejected.map((item) => ({
    reviewer: spec.id,
    file: item.file ?? input.file ?? '(全局)',
    line: item.line ?? 0,
    title: item.title,
    reason: item.reason,
    detail: item.detail,
  }));

  return {
    findings: outcome.accepted,
    rejections,
    usage,
    truncated: false,
    clamped: outcome.clamped,
    structuredMode: response.structuredMode,
    calls,
  };
}
