import { describe, expect, it } from 'vitest';

import type { Finding, LineAnchor } from '../src/contracts/index.js';
import type { ExistingComment } from '../src/contracts/result.js';
import { planActions, resolvedNotice } from '../src/core/reconcile/plan.js';

function finding(overrides: Partial<Finding> = {}): Finding {
  const anchor: LineAnchor = {
    file: 'src/a.ts',
    oldPath: null,
    kind: 'added',
    newLine: 10,
    oldLine: null,
  };

  return {
    fingerprint: 'fp1',
    reviewer: 'correctness',
    anchor,
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

function comment(overrides: Partial<ExistingComment> = {}): ExistingComment {
  return {
    commentId: 'c1',
    marker: {
      version: 'v1',
      fingerprint: 'fp1',
      reviewer: 'correctness',
      scope: 'changed',
      promptVersion: 'v1.0',
      model: 'm',
    },
    line: 10,
    side: 'new',
    path: 'src/a.ts',
    resolved: false,
    outdated: false,
    ...overrides,
  };
}

function plan(inline: Finding[], existing: ExistingComment[], all = inline) {
  return planActions({ findings: all, inline, existing });
}

describe('七种组合', () => {
  it('有 → 有，位置未变：保持不动', () => {
    const original = finding();
    const outcome = plan([original], [comment()]);
    expect(outcome.actions).toEqual([{ kind: 'keep', commentId: 'c1', finding: original }]);
  });

  it('有 → 有，位置变了且是 major：删旧发新', () => {
    const moved = finding({
      anchor: { file: 'src/a.ts', oldPath: null, kind: 'added', newLine: 42, oldLine: null },
    });
    const outcome = plan([moved], [comment()]);

    expect(outcome.actions[0]?.kind).toBe('replace');
    expect(outcome.actions).toHaveLength(1);
  });

  it('有 → 有，位置变了但只是 minor：保留旧评论并告警', () => {
    const moved = finding({
      severity: 'minor',
      anchor: { file: 'src/a.ts', oldPath: null, kind: 'added', newLine: 42, oldLine: null },
    });
    const outcome = plan([moved], [comment()]);

    expect(outcome.actions[0]?.kind).toBe('keep');
    expect(outcome.outdatedKept).toBe(1);
    expect(outcome.warnings[0]?.message).toContain('位置已变动');
  });

  it('有 → 无：标记为已修复', () => {
    const outcome = plan([], [comment()]);
    expect(outcome.actions).toEqual([{ kind: 'resolve', commentId: 'c1', finding: null }]);
  });

  it('有 → 无，但人工已解决：不产生任何动作', () => {
    const outcome = plan([], [comment({ resolved: true })]);
    expect(outcome.actions).toEqual([]);
  });

  it('无 → 有：新建', () => {
    const outcome = plan([finding()], []);
    expect(outcome.actions[0]?.kind).toBe('create');
  });

  it('人工已解决但这一轮又出现：尊重人工判断，不重发', () => {
    const outcome = plan([finding()], [comment({ resolved: true })]);
    expect(outcome.actions[0]?.kind).toBe('keep');
  });
});

describe('几个必须区分的边界', () => {
  it('没有标记的评论是人写的，永不触碰', () => {
    const human = comment({ marker: null, commentId: 'human' });
    const outcome = plan([finding()], [human]);

    expect(outcome.actions.map((action) => action.kind)).toEqual(['create']);
  });

  it('仍然存在但被路由到摘要的条目，不算已修复', () => {
    // 结论没变，只是出口从行内变成摘要——这时把旧评论标成已修复是错的
    const outcome = plan([], [comment()], [finding()]);
    expect(outcome.actions).toEqual([]);
  });

  it('删除行按旧侧比较位置', () => {
    const removed = finding({
      anchor: { file: 'src/a.ts', oldPath: null, kind: 'removed', newLine: null, oldLine: 7 },
    });
    const previous = comment({ line: 7, side: 'old' });

    expect(plan([removed], [previous]).actions[0]?.kind).toBe('keep');
  });

  it('同一指纹的新建正文可注入渲染函数', () => {
    const outcome = planActions({
      findings: [finding()],
      inline: [finding()],
      existing: [],
      renderBody: (item) => `自定义:${item.title}`,
    });
    expect(outcome.actions[0]).toMatchObject({ body: '自定义:空值未判断' });
  });
});

describe('已修复提示', () => {
  it('带上时间，且可嵌在正文最前面', () => {
    const notice = resolvedNotice('2026-11-02T10:00:00Z');

    expect(notice).toContain('2026-11-02T10:00:00Z');
    // 措辞不能断言成「已修复」：模型每轮定位有波动，「本轮没报」不等于问题消失，
    // 写成肯定句会让作者以为问题没了，而它还在
    expect(notice).toContain('本轮未再发现此问题');
    expect(notice).not.toContain('已在后续提交中修复');
  });
});
