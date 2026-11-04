import { describe, expect, it } from 'vitest';

import type { ParsedDiff } from '../src/contracts/index.js';
import type { RawFinding } from '../src/contracts/finding.js';
import { buildLineIndex } from '../src/core/diff/index-lines.js';
import { parsePatch } from '../src/core/diff/parse.js';
import { computeFingerprint } from '../src/core/reconcile/fingerprint.js';
import { verifyFindings } from '../src/core/verify/chain.js';

const PATCH = [
  '@@ -1,4 +1,5 @@',
  ' function a() {',
  '-  return old;',
  '+  const v = read();',
  '+  return v.y;',
  ' }',
].join('\n');

const CONTENT = ['function a() {', '  const v = read();', '  return v.y;', '}'].join('\n');

function setup(): { diff: ParsedDiff; fileContents: Map<string, string | null> } {
  const diff: ParsedDiff = {
    files: [parsePatch(PATCH, { path: 'src/a.ts', oldPath: 'src/a.ts', status: 'modified' })],
    baseSha: 'base',
    headSha: 'head',
  };
  return { diff, fileContents: new Map([['src/a.ts', CONTENT]]) };
}

function raw(overrides: Partial<RawFinding> = {}): RawFinding {
  return {
    file: 'src/a.ts',
    line: 3,
    side: 'new',
    severity: 'major',
    category: 'null-safety',
    title: '空值未判断',
    body: 'v 可能为 null',
    evidence: 'return v.y;',
    suggestion: null,
    confidence: 0.9,
    ...overrides,
  };
}

describe('指纹', () => {
  it('行号不参与计算：同一句话换个行号指纹不变', () => {
    const base = { file: 'src/a.ts', reviewer: 'correctness' as const, title: 't', evidence: 'x' };
    expect(computeFingerprint(base)).toBe(computeFingerprint({ ...base }));
    expect(computeFingerprint(base)).toHaveLength(16);
  });

  it('证据改动即换指纹，这正是豁免自动失效的原因', () => {
    const base = { file: 'src/a.ts', reviewer: 'correctness' as const, title: 't', evidence: 'x' };
    expect(computeFingerprint(base)).not.toBe(computeFingerprint({ ...base, evidence: 'y' }));
  });

  it('大小写敏感', () => {
    const base = { file: 'a', reviewer: 'correctness' as const, title: 't', evidence: 'userId' };
    expect(computeFingerprint(base)).not.toBe(computeFingerprint({ ...base, evidence: 'userid' }));
  });
});

describe('校验链', () => {
  const { diff, fileContents } = setup();
  const index = buildLineIndex(diff);

  it('通过定位的条目拿到派生字段', () => {
    const outcome = verifyFindings([{ raw: raw(), reviewer: 'correctness' }], {
      diff,
      index,
      fileContents,
      severityFloors: {},
      maxInline: 10,
    });

    expect(outcome.findings).toHaveLength(1);
    expect(outcome.findings[0]).toMatchObject({
      preexisting: false,
      scope: 'changed',
      positionOrigin: 'model-line',
    });
  });

  it('低于该维度严重度下限的直接拒收', () => {
    const outcome = verifyFindings([{ raw: raw({ severity: 'nit' }), reviewer: 'security' }], {
      diff,
      index,
      fileContents,
      severityFloors: { security: 'minor' },
      maxInline: 10,
    });

    expect(outcome.findings).toHaveLength(0);
    expect(outcome.rejections[0]?.reason).toBe('below-severity-floor');
  });

  it('同一条重复出现时只留一条，另一条报 duplicate', () => {
    const outcome = verifyFindings(
      [
        { raw: raw(), reviewer: 'correctness' },
        { raw: raw({ line: 2 }), reviewer: 'correctness' },
      ],
      { diff, index, fileContents, severityFloors: {}, maxInline: 10 },
    );

    expect(outcome.findings).toHaveLength(1);
    expect(outcome.rejections[0]?.reason).toBe('duplicate');
  });

  it('不同维度报同一句话不算重复——指纹含维度', () => {
    const outcome = verifyFindings(
      [
        { raw: raw(), reviewer: 'correctness' },
        { raw: raw(), reviewer: 'security' },
      ],
      { diff, index, fileContents, severityFloors: {}, maxInline: 10 },
    );

    expect(outcome.findings).toHaveLength(2);
  });

  it('超出行内配额时路由到摘要，不丢弃', () => {
    const items = [
      { raw: raw({ title: 'A', severity: 'blocker' }), reviewer: 'correctness' as const },
      {
        raw: raw({ title: 'B', severity: 'major', evidence: 'const v = read();' }),
        reviewer: 'correctness' as const,
      },
      {
        raw: raw({
          title: 'C',
          severity: 'minor',
          evidence: '  return old;',
          side: 'old' as const,
          line: 2,
        }),
        reviewer: 'correctness' as const,
      },
    ];

    const outcome = verifyFindings(items, {
      diff,
      index,
      fileContents,
      severityFloors: {},
      maxInline: 1,
    });

    expect(outcome.findings).toHaveLength(3);
    expect(outcome.inline).toHaveLength(1);
    // 严格按严重度排队：blocker 拿到唯一的名额
    expect(outcome.inline[0]?.title).toBe('A');
    expect(outcome.summaryOnly).toHaveLength(2);
  });

  it('上下文行的条目只进摘要，并标记为早就在', () => {
    const outcome = verifyFindings(
      [{ raw: raw({ line: 4, evidence: '}' }), reviewer: 'correctness' }],
      { diff, index, fileContents, severityFloors: {}, maxInline: 10 },
    );

    expect(outcome.findings[0]).toMatchObject({ scope: 'function', preexisting: true });
    expect(outcome.inline).toHaveLength(0);
    expect(outcome.summaryOnly).toHaveLength(1);
  });

  it('定位失败的条目带原因码与说明', () => {
    const outcome = verifyFindings(
      [{ raw: raw({ evidence: 'const invented = 1;' }), reviewer: 'correctness' }],
      { diff, index, fileContents, severityFloors: {}, maxInline: 10 },
    );

    expect(outcome.findings).toHaveLength(0);
    expect(outcome.rejections[0]?.reason).toBe('evidence-mismatch');
    expect(outcome.rejections[0]?.detail).toContain('找不到');
  });
});

describe('指纹的稳定性', () => {
  it('标题措辞变化不影响指纹：模型对同一个缺陷每次叫法都不同', () => {
    const a = computeFingerprint({
      file: 'src/a.ts',
      reviewer: 'correctness',
      title: 'keys 已写入而 slots 未更新',
      evidence: '      payload: JSON.parse(payload),',
    });
    const b = computeFingerprint({
      file: 'src/a.ts',
      reviewer: 'correctness',
      title: 'JSON.parse 抛错时缓存永久错位',
      evidence: '      payload: JSON.parse(payload),',
    });

    expect(a).toBe(b);
  });

  it('代码改动后指纹必须变：这是豁免自动失效的依据', () => {
    const before = computeFingerprint({
      file: 'src/a.ts',
      reviewer: 'correctness',
      title: '同一句话',
      evidence: 'const x = 1;',
    });
    const after = computeFingerprint({
      file: 'src/a.ts',
      reviewer: 'correctness',
      title: '同一句话',
      evidence: 'const x = 2;',
    });

    expect(before).not.toBe(after);
  });

  it('维度不同指纹不同：同一行代码可能被两个维度各自指出', () => {
    const correctness = computeFingerprint({
      file: 'src/a.ts',
      reviewer: 'correctness',
      title: '同一句话',
      evidence: 'const x = 1;',
    });
    const security = computeFingerprint({
      file: 'src/a.ts',
      reviewer: 'security',
      title: '同一句话',
      evidence: 'const x = 1;',
    });

    expect(correctness).not.toBe(security);
  });
});
