import { describe, expect, it } from 'vitest';

import type { ContextSegment } from '../src/contracts/context.js';
import { buildSchema, validateRawFindings } from '../src/core/reviewers/schema.js';
import type { ReviewerSpec } from '../src/core/reviewers/schema.js';

const SPEC: ReviewerSpec = {
  id: 'security',
  promptVersion: 'v1',
  allowedCategories: ['injection', 'authz'],
  maxSeverity: 'major',
  systemPrompt: 'sys',
  schema: buildSchema(['injection', 'authz'], 'major'),
  buildUserMessage: (input): string => input.file ?? '',
};

function item(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    file: 'src/a.ts',
    line: 12,
    side: 'new',
    severity: 'major',
    category: 'authz',
    title: '越权',
    body: '这里没校验归属',
    evidence: 'findById(id)',
    suggestion: null,
    confidence: 0.8,
    ...overrides,
  };
}

describe('字段规范校验', () => {
  it('合格条目被接收', () => {
    const outcome = validateRawFindings({ findings: [item()] }, SPEC);
    expect(outcome.accepted).toHaveLength(1);
    expect(outcome.rejected).toHaveLength(0);
    expect(outcome.accepted[0]?.title).toBe('越权');
  });

  it('缺少 findings 数组时整批拒收', () => {
    const outcome = validateRawFindings({ result: 'ok' }, SPEC);
    expect(outcome.accepted).toHaveLength(0);
    expect(outcome.rejected[0]?.detail).toContain('findings');
  });

  it('越界类别被拒——维度边界靠字段规范而不是提示词', () => {
    const outcome = validateRawFindings({ findings: [item({ category: 'naming' })] }, SPEC);
    expect(outcome.accepted).toHaveLength(0);
    expect(outcome.rejected[0]?.detail).toContain('naming');
  });

  it('严重度超上限时截断到上限并计数', () => {
    const outcome = validateRawFindings({ findings: [item({ severity: 'blocker' })] }, SPEC);
    expect(outcome.accepted[0]?.severity).toBe('major');
    expect(outcome.clamped).toBe(1);
  });

  it('逐字段拒绝：缺 file / side 非法 / line 非正整数 / 置信度越界', () => {
    const cases: Record<string, unknown>[] = [
      { file: '' },
      { side: 'left' },
      { line: 0 },
      { line: 1.5 },
      { confidence: 1.2 },
      { evidence: '  ' },
      { body: '' },
      { severity: 'critical' },
    ];

    for (const patch of cases) {
      const outcome = validateRawFindings({ findings: [item(patch)] }, SPEC);
      expect(outcome.accepted).toHaveLength(0);
      expect(outcome.rejected).toHaveLength(1);
    }
  });

  it('标题超长被截到 60 字，不整条丢弃', () => {
    const outcome = validateRawFindings({ findings: [item({ title: '很'.repeat(80) })] }, SPEC);
    expect(outcome.accepted[0]?.title).toHaveLength(60);
  });

  it('空的 suggestion 归一为 null', () => {
    const outcome = validateRawFindings({ findings: [item({ suggestion: '' })] }, SPEC);
    expect(outcome.accepted[0]?.suggestion).toBeNull();
  });

  it('拒收记录带上位置，便于追溯', () => {
    const outcome = validateRawFindings({ findings: [item({ category: 'naming' })] }, SPEC);
    expect(outcome.rejected[0]?.file).toBe('src/a.ts');
    expect(outcome.rejected[0]?.line).toBe(12);
  });
});

describe('字段规范生成', () => {
  it('类别枚举与严重度上限进入 schema', () => {
    const schema = buildSchema(['authz'], 'minor') as {
      properties: { findings: { items: { properties: Record<string, { enum?: string[] }> } } };
    };
    const props = schema.properties.findings.items.properties;

    expect(props['category']?.enum).toEqual(['authz']);
    // 上限是 minor，就不允许出现 blocker / major
    expect(props['severity']?.enum).toEqual(['minor', 'nit']);
  });
});

describe('材料拼装不在这里', () => {
  it('审核员只收到被选中的段', () => {
    const segments: ContextSegment[] = [
      { tier: 'L0', path: 'a.ts', title: 't', content: 'c', estimatedTokens: 1 },
    ];
    expect(SPEC.buildUserMessage({ file: 'a.ts', segments })).toBe('a.ts');
  });
});
