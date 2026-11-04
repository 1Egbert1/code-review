import { describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import type { ResolvedConfig } from '../src/contracts/config.js';
import type { TokenUsage } from '../src/contracts/result.js';
import { parseDataset } from '../src/core/eval/dataset.js';
import { runEval } from '../src/core/eval/runner.js';
import type { LlmClient, LlmRequest, LlmResponse } from '../src/providers/types.js';

const PATCH = [
  '@@ -1,3 +1,4 @@',
  ' function a() {',
  '-  return old;',
  '+  const v = read();',
  '+  return v.y;',
  ' }',
].join('\n');

const CONTENT = ['function a() {', '  const v = read();', '  return v.y;', '}'].join('\n');

// 路径放在鉴权目录下：安全维度有风险路由，普通工具函数不会送审，
// 样本放在这里才能验证「评测不受配置开关影响，三个维度都跑」
const PATH = 'src/auth/login.ts';

const USAGE: TokenUsage = {
  uncachedInput: 100,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 20,
};

function findingJson(category = 'null-safety', line = 3): string {
  return JSON.stringify({
    findings: [
      {
        file: PATH,
        line,
        side: 'new',
        severity: 'major',
        category,
        title: 'v 可能为空',
        body: 'read() 可能返回 null，读取属性会崩溃',
        evidence: 'return v.y;',
        suggestion: null,
        confidence: 0.9,
      },
    ],
  });
}

/** 依次返回给定文本；用完之后一直返回最后一个。 */
function client(texts: readonly string[]): LlmClient & { calls: number; requests: LlmRequest[] } {
  const state = {
    calls: 0,
    requests: [] as LlmRequest[],
    structuredMode: () => 'json-schema' as const,
    complete(request: LlmRequest): Promise<LlmResponse> {
      const text = texts[Math.min(state.calls, texts.length - 1)] ?? '{"findings":[]}';
      state.calls += 1;
      state.requests.push(request);
      return Promise.resolve({
        text,
        finishReason: 'stop',
        usage: USAGE,
        model: 'm',
        structuredMode: 'json-schema',
      });
    },
  };
  return state;
}

function config(): ResolvedConfig {
  return {
    ...DEFAULT_CONFIG,
    llm: {
      ...DEFAULT_CONFIG.llm,
      model: 'test-model',
      // 单价就是「每 100 万 token 多少美元」，1 表示 $1/M
      pricing: {
        inputPerMTok: 1,
        outputPerMTok: 2,
        cacheWriteShortMultiplier: 1,
        cacheWriteLongMultiplier: 2,
        cacheReadMultiplier: 0.1,
      },
    },
    // 默认配置里 security 是开的、convention 是关的；这里故意全关，
    // 用来验证「评测强制三开」——否则会漏测两个维度还不自知
    review: {
      ...DEFAULT_CONFIG.review,
      dimensions: {
        correctness: { enabled: false, severityFloor: 'minor' },
        security: { enabled: false, severityFloor: 'minor' },
        convention: { enabled: false, severityFloor: 'minor' },
      },
    },
  };
}

function dataset(
  expected: readonly { line: number; category: string }[] = [{ line: 3, category: 'null-safety' }],
) {
  return parseDataset(
    JSON.stringify({
      version: 1,
      name: 'unit',
      samples: [
        {
          id: 'null-check',
          path: PATH,
          status: 'modified',
          patch: PATCH,
          content: CONTENT,
          expected: expected.map((item) => ({ ...item, reviewer: 'correctness' })),
        },
      ],
    }),
  );
}

describe('跑分：指标', () => {
  it('模型报对了 → 召回与精确率都是 1', async () => {
    const result = await runEval({
      dataset: dataset(),
      config: config(),
      client: client([findingJson()]),
      label: 'v1',
      codeVersion: 'abc',
    });

    expect(result.snapshot.metrics.recall).toBe(1);
    expect(result.snapshot.metrics.precision).toBe(1);
    expect(result.detail.samples[0]?.strictHit).toBe(1);
    expect(result.detail.samples[0]?.exactLine).toBe(1);
  });

  it('类别报错 → 召回为 0，但不算误报，单列在宽松命中里', async () => {
    const result = await runEval({
      dataset: dataset(),
      config: config(),
      client: client([findingJson('logic')]),
      label: 'v1',
      codeVersion: 'abc',
    });

    expect(result.snapshot.metrics.recall).toBe(0);
    // 精确率仍为 1：它确实指出了真实存在的一处问题，只是归类不同
    expect(result.snapshot.metrics.precision).toBe(1);
    expect(result.detail.samples[0]?.looseHit).toBe(1);
    expect(result.detail.samples[0]?.falsePositives).toBe(0);
  });

  it('模型什么都不报 → 召回 0、精确率 1，漏报明细可读', async () => {
    const result = await runEval({
      dataset: dataset(),
      config: config(),
      client: client(['{"findings":[]}']),
      label: 'v1',
      codeVersion: 'abc',
    });

    expect(result.snapshot.metrics.recall).toBe(0);
    expect(result.snapshot.metrics.precision).toBe(1);
    expect(result.detail.samples[0]?.missedItems[0]?.category).toBe('null-safety');
  });
});

describe('跑分：维度策略', () => {
  it('配置里全关，正确性与安全性仍会被调用（规范性不强制）', async () => {
    const fake = client([findingJson()]);

    await runEval({
      dataset: dataset(),
      config: config(),
      client: fake,
      label: 'v1',
      codeVersion: 'abc',
      repeats: 2,
    });

    // 1 个样本 × 2 轮 × 2 个维度。
    // 规范性不强制：它判断「不同文件间写法是否一致」，单文件样本给不出这个上下文，
    // 硬跑只会产出 consistency / duplication 这类噪声（实测把精确率压到 29%）
    expect(fake.calls).toBe(4);
  });
});

describe('跑分：成本与复现率', () => {
  it('成本只算首轮：调高轮次不该让平均成本变大', async () => {
    const two = await runEval({
      dataset: dataset(),
      config: config(),
      client: client([findingJson()]),
      label: 'v1',
      codeVersion: 'abc',
      repeats: 2,
    });

    const three = await runEval({
      dataset: dataset(),
      config: config(),
      client: client([findingJson()]),
      label: 'v1',
      codeVersion: 'abc',
      repeats: 3,
    });

    // 首轮 2 次调用 × (100 未缓存输入 + 20 输出)
    // 输入 200/1M × $1 = $0.0002；输出 40/1M × $2 = $0.00008
    expect(two.snapshot.cost?.total).toBeCloseTo(0.00028, 8);
    expect(three.snapshot.cost?.total).toBeCloseTo(two.snapshot.cost?.total ?? 0, 10);
    // 额外的轮次单独记，不进成本指标
    expect(three.detail.extraUsage.uncachedInput).toBeGreaterThan(
      two.detail.extraUsage.uncachedInput,
    );
  });

  it('两轮结论不同 → 复现率小于 1', async () => {
    const first = findingJson();
    const second = JSON.stringify({
      findings: [
        {
          file: PATH,
          line: 1,
          side: 'new',
          severity: 'major',
          category: 'boundary',
          title: '函数边界',
          body: '另一个问题',
          evidence: 'function a() {',
          suggestion: null,
          confidence: 0.9,
        },
      ],
    });

    const result = await runEval({
      dataset: dataset(),
      config: config(),
      // 第 1 轮两个维度都返回 first；第 2 轮返回 second
      client: client([first, first, second, second]),
      label: 'v1',
      codeVersion: 'abc',
    });

    expect(result.snapshot.metrics.reproducibility).toBeLessThan(1);
    expect(result.detail.reproducibilityMeasured).toBe(true);
  });

  it('两轮完全一致 → 复现率为 1', async () => {
    const result = await runEval({
      dataset: dataset(),
      config: config(),
      client: client([findingJson()]),
      label: 'v1',
      codeVersion: 'abc',
    });

    expect(result.snapshot.metrics.reproducibility).toBe(1);
  });
});

describe('跑分：快照字段', () => {
  it('带上提示词版本、模型与样本集指纹', async () => {
    const result = await runEval({
      dataset: dataset(),
      config: config(),
      client: client([findingJson()]),
      label: 'v1.1',
      codeVersion: 'abc1234',
    });

    expect(result.snapshot.label).toBe('v1.1');
    expect(result.snapshot.model).toBe('test-model');
    expect(result.snapshot.promptVersions['correctness']).toBeTruthy();
    expect(result.snapshot.datasetHash).toHaveLength(16);
  });
});
