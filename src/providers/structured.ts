/**
 * 结构化输出的拼装与解析。
 *
 * 两条经验写进实现：
 *
 * 1. **别指望模型只输出 JSON。** 即使要求了「只输出 JSON」，它仍会包代码围栏、加一句
 *    「好的，以下是结果」。解析必须能从中抠出 JSON 主体，而不是 JSON.parse 整段。
 * 2. **截断和格式错误必须分开报。** 上下文被长度上限截断时，文本是半截 JSON，
 *    解析同样失败。若统一报「模型不会输出 JSON」，就会去改提示词——而真正该做的是缩小范围。
 *    所以判断顺序永远是：先看结束原因，再看内容。
 */

import type { StructuredMode } from './types.js';

/** 按模式拼出 `response_format` 字段；none 模式返回 null。 */
export function buildResponseFormat(
  mode: StructuredMode,
  schema: Readonly<Record<string, unknown>> | null,
  schemaName: string,
): Record<string, unknown> | null {
  if (mode === 'none' || schema === null) return null;

  if (mode === 'json-object') {
    return { type: 'json_object' };
  }

  return {
    type: 'json_schema',
    json_schema: { name: schemaName, schema, strict: false },
  };
}

export type ParseResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly reason: 'empty' | 'not-json' };

/**
 * 从模型输出里抠出 JSON 主体。
 *
 * 允许前后有解释文字与代码围栏，但**不允许修补内容**——不做尾逗号容错、不补引号。
 * 一旦开始修补，就无法区分「模型输出错了」和「我们改对了」。
 */
export function parseJsonPayload(text: string): ParseResult {
  const trimmed = text.trim();
  if (trimmed === '') return { ok: false, reason: 'empty' };

  const direct = tryParse(trimmed);
  if (direct !== null) return { ok: true, value: direct };

  const start = firstJsonStart(trimmed);
  if (start < 0) return { ok: false, reason: 'not-json' };

  const closing = trimmed[start] === '{' ? '}' : ']';
  const end = findMatching(trimmed, start, closing);
  if (end < 0) return { ok: false, reason: 'not-json' };

  const sliced = tryParse(trimmed.slice(start, end + 1));
  return sliced === null ? { ok: false, reason: 'not-json' } : { ok: true, value: sliced };
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** 第一个 `{` 或 `[` 的位置，且在它之前不能有等量的闭合——避免抓到解释文字里的括号。 */
function firstJsonStart(text: string): number {
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '{' || char === '[') return index;
  }
  return -1;
}

/** 找到与起始括号配对的闭合位置；跳过字符串内部。 */
function findMatching(text: string, start: number, closing: string): number {
  const opening = text[start] ?? '';
  let depth = 0;
  let quote: string | null = null;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index] ?? '';

    if (quote !== null) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"') {
      quote = char;
      continue;
    }
    if (char === opening) depth += 1;
    else if (char === closing) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

/**
 * 判断这次失败是不是「厂商不接受 response_format」。
 *
 * 只看状态码与错误文本里是否提到 response_format / json_schema。不做「400 就当不支持」的
 * 粗暴判断——400 也可能是密钥错了，那样降级只会把错误藏起来。
 */
export function isSchemaRejection(status: number, body: unknown): boolean {
  if (status !== 400 && status !== 422) return false;
  const text = JSON.stringify(body).toLowerCase();
  return (
    text.includes('response_format') || text.includes('json_schema') || text.includes('json schema')
  );
}
