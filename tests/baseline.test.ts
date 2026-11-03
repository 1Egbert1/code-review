import { describe, expect, it } from 'vitest';

import type { CostBreakdown } from '../src/contracts/result.js';
import {
  compareBaselines,
  computeDatasetHash,
  isBaselineSnapshot,
  summarize,
} from '../src/core/eval/baseline.js';
import type { BaselineMetrics, BaselineSnapshot } from '../src/core/eval/baseline.js';

const COST = (total: number): CostBreakdown => ({
  uncachedInput: total / 2,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: total / 2,
  total,
});

function snapshot(overrides: Partial<BaselineSnapshot> = {}): BaselineSnapshot {
  const metrics: BaselineMetrics = {
    recall: 0.72,
    precision: 0.81,
    avgLatencyMs: 41_000,
    reproducibility: 1,
    samples: 12,
    ...(overrides.metrics ?? {}),
  };

  return {
    version: 1,
    label: 'v1.2.0',
    createdAt: '2026-11-03T00:00:00Z',
    codeVersion: 'abc1234',
    promptVersions: { correctness: 'v1.0', security: 'v1.0' },
    model: 'model-a',
    configHash: 'cfg1',
    datasetHash: 'ds1',
    cost: COST(0.062),
    ...overrides,
    metrics,
  };
}

describe('样本集指纹', () => {
  it('同一样本集得到同一指纹，与顺序无关', () => {
    const a = computeDatasetHash([
      { id: 'a', expected: 2 },
      { id: 'b', expected: 1 },
    ]);
    const b = computeDatasetHash([
      { id: 'b', expected: 1 },
      { id: 'a', expected: 2 },
    ]);
    expect(a).toBe(b);
  });

  it('加一条样本或改一条标注都会变', () => {
    const base = computeDatasetHash([{ id: 'a', expected: 2 }]);
    expect(computeDatasetHash([{ id: 'a', expected: 3 }])).not.toBe(base);
    expect(
      computeDatasetHash([
        { id: 'a', expected: 2 },
        { id: 'b', expected: 1 },
      ]),
    ).not.toBe(base);
  });
});

describe('指标汇总', () => {
  it('召回与精确分别按期望数与上报数算', () => {
    const metrics = summarize(
      [
        { id: 'a', expected: 2, hit: 1, falsePositives: 1 },
        { id: 'b', expected: 2, hit: 2, falsePositives: 0 },
      ],
      { avgLatencyMs: 1000, reproducibility: 1 },
    );

    expect(metrics.recall).toBeCloseTo(3 / 4);
    expect(metrics.precision).toBeCloseTo(3 / 4);
    expect(metrics.samples).toBe(2);
  });

  it('样本全空时不出现除零', () => {
    const metrics = summarize([], { avgLatencyMs: 0, reproducibility: 1 });
    expect(metrics.recall).toBe(0);
    expect(metrics.precision).toBe(1);
  });
});

describe('可比性', () => {
  it('样本集不同时拒绝对比，不给出误导性的百分比', () => {
    const result = compareBaselines(snapshot(), snapshot({ datasetHash: 'ds2' }));
    expect(result.comparable).toBe(false);
    if (result.comparable) return;
    expect(result.reason).toContain('样本集');
  });

  it('模型不同时允许比，但标注跨模型', () => {
    const result = compareBaselines(snapshot(), snapshot({ model: 'model-b' }));
    expect(result.comparable).toBe(true);
    if (!result.comparable) return;
    expect(result.crossModel).toBe(true);
  });

  it('提示词版本变了允许比，但要列出改了哪些维度', () => {
    const result = compareBaselines(
      snapshot(),
      snapshot({ promptVersions: { correctness: 'v1.1', security: 'v1.0' } }),
    );
    expect(result.comparable).toBe(true);
    if (!result.comparable) return;
    // 优化往往就是改提示词，这不是异常，是重点观察对象
    expect(result.changedPrompts).toEqual(['correctness']);
  });
});

describe('结论由规则生成', () => {
  it('召回掉超过 2 个点就明确不建议采用', () => {
    const result = compareBaselines(
      snapshot(),
      snapshot({ metrics: { ...snapshot().metrics, recall: 0.65 } }),
    );
    if (!result.comparable) throw new Error('应当可比');
    expect(result.verdict).toContain('召回');
  });

  it('成本降 15% 以上且召回没退，判为净收益', () => {
    const result = compareBaselines(
      snapshot(),
      snapshot({ cost: COST(0.04), metrics: { ...snapshot().metrics, recall: 0.73 } }),
    );
    if (!result.comparable) throw new Error('应当可比');
    expect(result.verdict).toContain('净收益');
  });

  it('变化不大时不给强结论', () => {
    const result = compareBaselines(snapshot(), snapshot());
    if (!result.comparable) throw new Error('应当可比');
    expect(result.verdict).toContain('不显著');
  });
});

describe('快照校验', () => {
  it('坏文件立刻判为无效，不当成空数据', () => {
    expect(isBaselineSnapshot(null)).toBe(false);
    expect(isBaselineSnapshot({ version: 2 })).toBe(false);
    expect(isBaselineSnapshot(snapshot())).toBe(true);
  });
});
