import { describe, expect, it } from 'vitest';

import { datasetHashOf, describeDataset, parseDataset } from '../src/core/eval/dataset.js';

const SAMPLE = {
  id: 'cache-boundary',
  path: 'src/cache.ts',
  status: 'added',
  patch: '@@ -0,0 +1,2 @@\n+a\n+b',
  content: 'a\nb',
  expected: [{ line: 2, category: 'boundary', reviewer: 'correctness', note: '越界' }],
};

function json(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: 1,
    name: 'unit',
    samples: [SAMPLE],
    ...overrides,
  });
}

describe('样本集解析', () => {
  it('正常样本能读出来，且字段完整', () => {
    const dataset = parseDataset(json());

    expect(dataset.name).toBe('unit');
    expect(dataset.samples).toHaveLength(1);
    expect(dataset.samples[0]?.expected[0]?.category).toBe('boundary');
  });

  it('版本不符直接报错，不尝试兼容', () => {
    expect(() => parseDataset(json({ version: 2 }))).toThrow(/版本/);
  });

  it('不是合法 JSON 时报错并带上原因', () => {
    expect(() => parseDataset('{ bad')).toThrow(/合法 JSON/);
  });

  it('顶层是数组时报错（数组也是 object，必须单独挡）', () => {
    expect(() => parseDataset('[]')).toThrow(/顶层必须是对象/);
  });

  it('没有样本时报错——空样本集会产出一份全 0 的假快照', () => {
    expect(() => parseDataset(json({ samples: [] }))).toThrow(/没有任何样本/);
  });

  it('样本 id 重复时报错', () => {
    expect(() => parseDataset(json({ samples: [SAMPLE, SAMPLE] }))).toThrow(/id 重复/);
  });

  it('status 不在契约四种里时报错', () => {
    expect(() => parseDataset(json({ samples: [{ ...SAMPLE, status: 'weird' }] }))).toThrow(
      /status 非法/,
    );
  });

  it('expected 的 line 必须是正整数', () => {
    expect(() =>
      parseDataset(
        json({
          samples: [{ ...SAMPLE, expected: [{ line: 0, category: 'x', reviewer: 'correctness' }] }],
        }),
      ),
    ).toThrow(/正整数/);
  });

  it('expected 的 reviewer 必须是三个维度之一', () => {
    expect(() =>
      parseDataset(
        json({
          samples: [{ ...SAMPLE, expected: [{ line: 1, category: 'x', reviewer: 'perf' }] }],
        }),
      ),
    ).toThrow(/reviewer 非法/);
  });

  it('报错信息带上样本标识，便于定位是哪一条写错了', () => {
    expect(() => parseDataset(json({ samples: [{ ...SAMPLE, patch: undefined }] }))).toThrow(
      /cache-boundary/,
    );
  });
});

describe('样本集指纹', () => {
  it('改样本 id 会让指纹变（换题了）', () => {
    const a = parseDataset(json());
    const b = parseDataset(json({ samples: [{ ...SAMPLE, id: 'renamed' }] }));

    expect(datasetHashOf(a)).not.toBe(datasetHashOf(b));
  });

  it('改期望条数会让指纹变（题量变了，分数不可比）', () => {
    const a = parseDataset(json());
    const b = parseDataset(
      json({
        samples: [
          {
            ...SAMPLE,
            expected: [...SAMPLE.expected, { line: 1, category: 'logic', reviewer: 'correctness' }],
          },
        ],
      }),
    );

    expect(datasetHashOf(a)).not.toBe(datasetHashOf(b));
  });

  it('只改补丁内容不改指纹：修一处笔误不该作废历史基准', () => {
    const a = parseDataset(json());
    const b = parseDataset(json({ samples: [{ ...SAMPLE, patch: '@@ -0,0 +1,2 @@\n+x\n+y' }] }));

    expect(datasetHashOf(a)).toBe(datasetHashOf(b));
  });
});

describe('样本集描述', () => {
  it('给出样本数与期望总数', () => {
    expect(describeDataset(parseDataset(json()))).toContain('1 个样本');
    expect(describeDataset(parseDataset(json()))).toContain('1 条期望');
  });
});
