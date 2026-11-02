import { describe, expect, it } from 'vitest';

import {
  buildResponseFormat,
  isSchemaRejection,
  parseJsonPayload,
} from '../src/providers/structured.js';

describe('结构化模式拼装', () => {
  const schema = { type: 'object', properties: { a: { type: 'string' } } };

  it('json-schema 模式把 schema 放进 response_format', () => {
    const format = buildResponseFormat('json-schema', schema, 'findings');
    expect(format).toEqual({
      type: 'json_schema',
      json_schema: { name: 'findings', schema, strict: false },
    });
  });

  it('json-object 模式只要求返回 JSON，不带结构', () => {
    expect(buildResponseFormat('json-object', schema, 'x')).toEqual({ type: 'json_object' });
  });

  it('none 模式什么都不发', () => {
    expect(buildResponseFormat('none', schema, 'x')).toBeNull();
  });

  it('没有 schema 时不发 response_format', () => {
    expect(buildResponseFormat('json-schema', null, 'x')).toBeNull();
  });
});

describe('JSON 抠取', () => {
  it('纯 JSON 直接解析', () => {
    const result = parseJsonPayload('{"a":1}');
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it('带代码围栏也能抠出来', () => {
    const text = ['```json', '{"findings":[]}', '```'].join('\n');
    const result = parseJsonPayload(text);
    expect(result.ok).toBe(true);
  });

  it('前后有解释文字也能抠出来', () => {
    const text = '好的，以下是结果：\n{"findings":[{"a":1}]}\n希望有帮助。';
    const result = parseJsonPayload(text);
    expect(result).toEqual({ ok: true, value: { findings: [{ a: 1 }] } });
  });

  it('字符串里的花括号不会提前截断', () => {
    const text = '{"body":"if (x) { return }"}';
    const result = parseJsonPayload(text);
    expect(result).toEqual({ ok: true, value: { body: 'if (x) { return }' } });
  });

  it('截断的半截 JSON 报 not-json，而不是崩溃', () => {
    const result = parseJsonPayload('{"findings":[{"file":"a.ts","line":1');
    expect(result).toEqual({ ok: false, reason: 'not-json' });
  });

  it('空输出单独区分', () => {
    expect(parseJsonPayload('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('不做容错修补：尾逗号仍然失败', () => {
    // 一旦开始修补，就分不清「模型错了」还是「我们改对了」
    expect(parseJsonPayload('{"a":1,}').ok).toBe(false);
  });
});

describe('schema 被拒的判定', () => {
  it('400 且提到 response_format 才算不支持', () => {
    expect(isSchemaRejection(400, { error: { message: 'response_format is not supported' } })).toBe(
      true,
    );
    expect(isSchemaRejection(422, { error: { message: 'invalid json_schema' } })).toBe(true);
  });

  it('400 但与结构化无关时不降级，避免把配置错误藏起来', () => {
    expect(isSchemaRejection(400, { error: { message: 'invalid api key' } })).toBe(false);
  });

  it('401 不降级', () => {
    expect(isSchemaRejection(401, { error: { message: 'response_format' } })).toBe(false);
  });
});
