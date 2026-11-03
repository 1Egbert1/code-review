import { describe, expect, it } from 'vitest';

import type { Finding } from '../src/contracts/index.js';
import type { ReviewResult } from '../src/contracts/result.js';
import { formatStats } from '../src/cli/stats.js';

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    fingerprint: 'fp1',
    reviewer: 'correctness',
    anchor: { file: 'src/a.ts', oldPath: null, kind: 'added', newLine: 10, oldLine: null },
    positionOrigin: 'model-line',
    severity: 'major',
    category: 'null-safety',
    title: '空值未判断',
    body: 'b',
    evidence: 'e',
    suggestion: null,
    confidence: 0.9,
    preexisting: false,
    scope: 'changed',
    ...overrides,
  };
}

function result(overrides: Partial<ReviewResult> = {}): ReviewResult {
  return {
    findings: [finding()],
    summaryOnly: [],
    rejections: [],
    actions: [{ kind: 'create', target: 'inline', finding: finding(), body: 'b' }],
    summaryMarkdown: '',
    coverage: { planned: 3, completed: 3, skipped: 0, failed: 0, reused: 0 },
    usage: {
      calls: 5,
      tokens: {
        uncachedInput: 41000,
        cacheWriteShort: 0,
        cacheWriteLong: 0,
        cacheRead: 0,
        output: 3200,
      },
      estimatedCostUsd: 0.06,
      truncatedByBudget: false,
    },
    warnings: [],
    gate: null,
    startedAt: '2026-11-02T00:00:00Z',
    finishedAt: '2026-11-02T00:00:10Z',
    ...overrides,
  };
}

describe('结束统计', () => {
  it('给出文件数、调用次数、token 与费用', () => {
    const text = formatStats({ result: result(), files: 3, dryRun: false });
    expect(text).toContain('文件 3 个');
    expect(text).toContain('调用 5 次');
    expect(text).toContain('41.0k');
    expect(text).toContain('$0.0600');
  });

  it('未配置单价时说无法折算，而不是显示 0', () => {
    const base = result();
    const text = formatStats({
      result: { ...base, usage: { ...base.usage, estimatedCostUsd: null } },
      files: 3,
      dryRun: false,
    });
    expect(text).toContain('无法折算');
    expect(text).not.toContain('$0.0000');
  });

  it('打印定位来源分布——它是判断提示词好不好的直接依据', () => {
    const text = formatStats({
      result: result({
        findings: [
          finding({ fingerprint: 'a', positionOrigin: 'model-line' }),
          finding({ fingerprint: 'b', positionOrigin: 'evidence-hunk' }),
          finding({ fingerprint: 'c', positionOrigin: 'evidence-hunk' }),
        ],
      }),
      files: 3,
      dryRun: false,
    });

    expect(text).toContain('定位来源：证据块内 2，模型行号 1');
  });

  it('丢弃原因要归类展示', () => {
    const text = formatStats({
      result: result({
        rejections: [
          {
            reviewer: 'correctness',
            file: 'a.ts',
            line: 1,
            title: 'x',
            reason: 'evidence-mismatch',
            detail: '',
          },
          {
            reviewer: 'correctness',
            file: 'a.ts',
            line: 1,
            title: 'y',
            reason: 'evidence-mismatch',
            detail: '',
          },
          {
            reviewer: 'correctness',
            file: 'a.ts',
            line: 1,
            title: 'z',
            reason: 'unlocatable',
            detail: '',
          },
        ],
      }),
      files: 3,
      dryRun: false,
    });

    expect(text).toContain('丢弃 3 条');
    expect(text).toContain('证据不存在 2');
  });

  it('明确告知超限只是换了位置，没有丢弃通过校验的条目', () => {
    const text = formatStats({
      result: result({
        summaryOnly: [
          finding({ fingerprint: 'x' }),
          finding({ fingerprint: 'y', scope: 'function' }),
        ],
      }),
      files: 3,
      dryRun: false,
    });
    expect(text).toContain('未丢任何通过校验的条目');
  });

  it('只打印模式在末尾点明没有发送', () => {
    const text = formatStats({ result: result(), files: 3, dryRun: true });
    expect(text).toContain('未发送到平台');
  });
});
