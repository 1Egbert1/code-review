import { describe, expect, it } from 'vitest';

import type { InspectionConfig } from '../src/contracts/config.js';
import type { Finding } from '../src/contracts/index.js';
import type { InspectionReport, ScoreBreakdown } from '../src/contracts/inspection.js';
import { chooseCarrier, findPreviousPage, writeReport } from '../src/core/inspection/carrier.js';
import type { ReportWriter } from '../src/core/inspection/carrier.js';
import { renderReport } from '../src/core/inspection/report.js';

const BREAKDOWN: readonly ScoreBreakdown[] = [
  {
    dimension: 'complexity',
    score: 11,
    maxScore: 20,
    weight: 20,
    items: [
      {
        metricId: 'avg-function-lines',
        label: '函数平均长度',
        actual: '62 行',
        threshold: '40 行',
        deduction: 3,
      },
      {
        metricId: 'avg-cyclomatic',
        label: '圈复杂度均值',
        actual: '18',
        threshold: '10',
        deduction: 6,
      },
    ],
  },
  { dimension: 'duplication', score: 20, maxScore: 20, weight: 20, items: [] },
  { dimension: 'dependency', score: 17, maxScore: 20, weight: 20, items: [] },
  { dimension: 'type-safety', score: 20, maxScore: 20, weight: 20, items: [] },
  { dimension: 'test', score: 20, maxScore: 20, weight: 20, items: [] },
];

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    fingerprint: 'fp1',
    reviewer: 'correctness',
    anchor: { file: 'src/api/upload.ts', oldPath: null, kind: 'added', newLine: 88, oldLine: null },
    positionOrigin: 'model-line',
    severity: 'blocker',
    category: 'authz',
    title: '上传接口缺少归属校验',
    body: '按 id 直接查库返回，没有判断归属',
    evidence: 'findById(id)',
    suggestion: null,
    confidence: 0.9,
    preexisting: true,
    scope: 'file',
    ...overrides,
  };
}

function report(overrides: Partial<InspectionReport> = {}): InspectionReport {
  return {
    repository: 'acme/web',
    commitSha: 'abcdef1234567890',
    inspectedAt: '2026-11-03T10:00:00Z',
    metrics: [],
    breakdown: BREAKDOWN,
    totalScore: 71,
    scores: { complexity: 11, duplication: 20, dependency: 17, 'type-safety': 20, test: 20 },
    counts: { blocker: 1, major: 2, minor: 3, nit: 0 },
    findings: [
      finding(),
      finding({ fingerprint: 'fp2', severity: 'major', title: '深合并未过滤原型链' }),
    ],
    regressions: ['fp1'],
    resolved: [],
    previousRef: null,
    location: null,
    ...overrides,
  };
}

describe('报告结构', () => {
  it('先问题后分数：必须先处理排在分数明细之前', () => {
    const text = renderReport(report());
    expect(text.indexOf('必须先处理')).toBeLessThan(text.indexOf('分数明细'));
  });

  it('分数明细能对上实际值与阈值', () => {
    const text = renderReport(report());
    expect(text).toContain('62 行');
    expect(text).toContain('40 行');
    expect(text).toContain('11 / 20');
  });

  it('权重写进报告，业务方能自己算一遍', () => {
    expect(renderReport(report())).toContain('复杂度 20%');
  });

  it('没有问题时给一句明确的话，不输出空表', () => {
    const text = renderReport(
      report({ findings: [], counts: { blocker: 0, major: 0, minor: 0, nit: 0 } }),
    );
    expect(text).toContain('没有发现需要立即处理的问题');
  });

  it('问题多时折叠次要项，不把报告撑爆', () => {
    const many = Array.from({ length: 30 }, (_unused, index) =>
      finding({
        fingerprint: `n${String(index)}`,
        severity: 'nit',
        title: `提示 ${String(index)}`,
      }),
    );
    const text = renderReport(report({ findings: many }), { maxListed: 5 });

    expect(text).toContain('<details>');
    expect(text).toContain('另有 25 项未列出');
  });
});

describe('趋势段', () => {
  it('首期不输出对比段', () => {
    expect(renderReport(report())).not.toContain('与上次对比');
  });

  it('给出总分变化与来源，而不是只报一个差', () => {
    const text = renderReport(report(), {
      previous: {
        totalScore: 76,
        scores: { complexity: 15, duplication: 20, dependency: 17, 'type-safety': 20, test: 20 },
        reference: '2026-10-01',
      },
    });

    expect(text).toContain('76 → 71');
    expect(text).toContain('复杂度');
    expect(text).toContain('↓5');
  });
});

describe('最该做的三件事', () => {
  it('不传时按扣分自动生成，且一定不为空', () => {
    const text = renderReport(report());
    expect(text).toContain('这个月最该做的三件事');
    expect(text).toContain('圈复杂度均值');
  });

  it('全部达标时明确说保持现状', () => {
    const clean = report({
      breakdown: BREAKDOWN.map((item) => ({ ...item, score: item.maxScore })),
      findings: [],
    });
    expect(renderReport(clean)).toContain('保持现状');
  });
});

describe('载体选择', () => {
  const config = (carrier: InspectionConfig['carrier']): InspectionConfig => ({
    enabled: true,
    weights: { complexity: 20, duplication: 20, dependency: 20, 'type-safety': 20, test: 20 },
    maxScorePerDimension: 20,
    sampleSize: 60,
    carrier,
    wikiPagePrefix: '',
    historyDepth: 12,
  });

  it('auto 且有 Wiki 时用 Wiki', () => {
    expect(chooseCarrier(config('auto'), true)).toBe('wiki');
  });

  it('auto 且没有 Wiki 时用常设 Issue', () => {
    expect(chooseCarrier(config('auto'), false)).toBe('issue');
  });

  it('显式指定时照办', () => {
    expect(chooseCarrier(config('issue'), true)).toBe('issue');
  });
});

describe('写入与降级', () => {
  function writer(kind: 'wiki' | 'issue', ok: boolean): ReportWriter {
    return {
      kind,
      write: () =>
        Promise.resolve(
          ok
            ? { ok: true, reference: kind === 'wiki' ? '2026-11-03' : '#12', url: 'https://x' }
            : { ok: false, reason: '权限不足' },
        ),
    };
  }

  const config: InspectionConfig = {
    enabled: true,
    weights: { complexity: 20, duplication: 20, dependency: 20, 'type-safety': 20, test: 20 },
    maxScorePerDimension: 20,
    sampleSize: 60,
    carrier: 'auto',
    wikiPagePrefix: '',
    historyDepth: 12,
  };

  it('Wiki 写成功就用 Wiki', async () => {
    const result = await writeReport({
      config,
      hasWiki: true,
      pageName: '2026-11-03',
      markdown: '# r',
      writers: { wiki: writer('wiki', true), issue: writer('issue', true) },
    });

    expect(result.location?.carrier).toBe('wiki');
    expect(result.warning).toBeNull();
  });

  it('Wiki 失败时降级到 Issue，并说明原因', async () => {
    const result = await writeReport({
      config,
      hasWiki: true,
      pageName: '2026-11-03',
      markdown: '# r',
      writers: { wiki: writer('wiki', false), issue: writer('issue', true) },
    });

    expect(result.location?.carrier).toBe('issue');
    expect(result.warning).toContain('权限不足');
  });

  it('两个载体都失败时返回 null 并留原因，不抛异常', async () => {
    const result = await writeReport({
      config,
      hasWiki: true,
      pageName: '2026-11-03',
      markdown: '# r',
      writers: { wiki: writer('wiki', false), issue: writer('issue', false) },
    });

    expect(result.location).toBeNull();
    expect(result.warning).not.toBeNull();
  });
});

describe('上一期定位', () => {
  it('页面名以日期开头，字母序就是时间序', () => {
    expect(findPreviousPage(['2026-09-30', '2026-11-03', '2026-10-31'], '2026-11-03')).toBe(
      '2026-10-31',
    );
  });

  it('首期没有更早的页面时返回 null', () => {
    expect(findPreviousPage(['2026-11-03'], '2026-11-03')).toBeNull();
  });
});

describe('载体告警：不能只报第一条', () => {
  const config = {
    enabled: true,
    weights: { complexity: 20, duplication: 20, dependency: 20, 'type-safety': 20, test: 20 },
    maxScorePerDimension: 20,
    sampleSize: 60,
    carrier: 'auto' as const,
    wikiPagePrefix: '',
    historyDepth: 12,
  };

  const failing = (reason: string) => ({
    kind: 'issue' as const,
    write: () => Promise.resolve({ ok: false as const, reason }),
  });

  it('两个载体都失败时，两条原因都要出现在告警里', async () => {
    const result = await writeReport({
      config,
      hasWiki: true,
      pageName: '2026-11-04',
      markdown: '# 报告',
      writers: {
        wiki: {
          kind: 'wiki',
          write: () => Promise.resolve({ ok: false as const, reason: 'CONNECT tunnel failed' }),
        },
        issue: failing('Resource not accessible'),
      },
    });

    expect(result.location).toBeNull();
    // 旧实现只保留第一条：用户看到「Wiki 失败」会以为 Issue 成功了
    expect(result.warning).toContain('CONNECT tunnel failed');
    expect(result.warning).toContain('Resource not accessible');
  });

  it('主目标成功但附带动作失败时，返回成功并带告警', async () => {
    const result = await writeReport({
      config,
      hasWiki: false,
      pageName: '2026-11-04',
      markdown: '# 报告',
      writers: {
        issue: {
          kind: 'issue',
          write: () =>
            Promise.resolve({
              ok: true as const,
              reference: '#7',
              url: 'https://example.com/7',
              warning: '报告已写入 #7，但关闭失败',
            }),
        },
      },
    });

    expect(result.location?.reference).toBe('#7');
    expect(result.warning).toContain('关闭失败');
  });
});
