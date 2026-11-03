/**
 * 失败矩阵逐条验证（规格书第 11 章）。
 *
 * 这张表是项目的质量底线：每条都要有实现与用例。这里按编号组织，**一条一个用例**，
 * 保证将来改坏了能立刻看出是哪一条退化。
 */

import { describe, expect, it } from 'vitest';

import type { ResolvedConfig } from '../src/contracts/config.js';
import type { ReviewRequest } from '../src/contracts/diff.js';
import type { ExistingComment, TokenUsage } from '../src/contracts/result.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import { runReview } from '../src/core/engine.js';
import { parsePatch } from '../src/core/diff/parse.js';
import { buildLineIndex } from '../src/core/diff/index-lines.js';
import { planActions } from '../src/core/reconcile/plan.js';
import { publish } from '../src/core/publish/publisher.js';
import { locate } from '../src/core/verify/locate.js';
import type { LlmClient, LlmRequest, LlmResponse } from '../src/providers/types.js';
import type { CommentPort, WriteResult } from '../src/platforms/types.js';

const PATCH = [
  '@@ -1,3 +1,4 @@',
  ' function a() {',
  '-  return old;',
  '+  const v = read();',
  '+  return v.y;',
  ' }',
].join('\n');

const CONTENT = ['function a() {', '  const v = read();', '  return v.y;', '}'].join('\n');

const USAGE: TokenUsage = {
  uncachedInput: 1000,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 100,
};

const VALID = JSON.stringify({
  findings: [
    {
      file: 'src/a.ts',
      line: 3,
      side: 'new',
      severity: 'major',
      category: 'null-safety',
      title: 'v 可能为空',
      body: 'read() 可能返回 null',
      evidence: 'return v.y;',
      suggestion: null,
      confidence: 0.9,
    },
  ],
});

const REQUEST: ReviewRequest = {
  repository: 'acme/web',
  mode: 'pull-request',
  pullRequestNumber: 1,
  baseRef: null,
  headRef: null,
  dryRun: true,
};

function config(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    review: {
      ...DEFAULT_CONFIG.review,
      dimensions: {
        correctness: { enabled: true, severityFloor: 'nit' },
        security: { enabled: false, severityFloor: 'nit' },
        convention: { enabled: false, severityFloor: 'nit' },
      },
      ...overrides.review,
    },
  };
}

function clientOf(responses: readonly string[]): LlmClient & { calls: number } {
  let index = 0;
  const state = {
    calls: 0,
    structuredMode: () => 'json-schema' as const,
    complete(request: LlmRequest): Promise<LlmResponse> {
      state.calls += 1;
      const text = responses[Math.min(index, responses.length - 1)] ?? '';
      index += 1;
      return Promise.resolve({
        text,
        finishReason: 'stop',
        usage: USAGE,
        model: request.model,
        structuredMode: 'json-schema',
      });
    },
  };
  return state;
}

function fetchOf(
  overrides: {
    content?: string | null;
    existing?: readonly ExistingComment[];
    throwOnFetch?: boolean;
  } = {},
) {
  return (): Promise<{
    diff: { files: ReturnType<typeof parsePatch>[]; baseSha: string; headSha: string };
    fileContents: Map<string, string | null>;
    existingComments: readonly ExistingComment[];
    conventions: null;
    buildContext: null;
  }> => {
    if (overrides.throwOnFetch === true) return Promise.reject(new Error('拉取改动失败'));
    return Promise.resolve({
      diff: {
        files: [parsePatch(PATCH, { path: 'src/a.ts', oldPath: 'src/a.ts', status: 'modified' })],
        baseSha: 'base',
        headSha: 'head',
      },
      fileContents: new Map([
        ['src/a.ts', overrides.content === undefined ? CONTENT : overrides.content],
      ]),
      existingComments: overrides.existing ?? [],
      conventions: null,
      buildContext: null,
    });
  };
}

describe('F-01 改动解析出错 → 整轮失败', () => {
  it('取数抛出时整轮失败，不产出半份报告', async () => {
    await expect(
      runReview(REQUEST, {
        config: config(),
        client: clientOf([VALID]),
        fetchSnapshot: fetchOf({ throwOnFetch: true }),
        port: null,
      }),
    ).rejects.toThrow(/拉取改动失败/);
  });
});

describe('F-02 单文件取内容失败 → 继续审', () => {
  it('内容为 null 时仍然送审，只是材料变少', async () => {
    const fake = clientOf([VALID]);
    const result = await runReview(REQUEST, {
      config: config(),
      client: fake,
      fetchSnapshot: fetchOf({ content: null }),
      port: null,
    });

    expect(fake.calls).toBe(1);
    expect(result.coverage.failed).toBe(0);
  });
});

describe('F-03 输出结构非法 → 重试一次', () => {
  it('第一次输出不是 JSON 时会重试，第二次成功则照常采信', async () => {
    const fake = clientOf(['这不是 JSON', VALID]);
    const result = await runReview(REQUEST, {
      config: config(),
      client: fake,
      fetchSnapshot: fetchOf(),
      port: null,
    });

    expect(fake.calls).toBe(2);
    expect(result.findings).toHaveLength(1);
  });

  it('两次都非法时丢弃该文件结果，并留原因', async () => {
    const fake = clientOf(['仍然不是 JSON']);
    const result = await runReview(REQUEST, {
      config: config(),
      client: fake,
      fetchSnapshot: fetchOf(),
      port: null,
    });

    expect(result.findings).toHaveLength(0);
    expect(result.rejections.some((rejection) => rejection.detail.includes('JSON'))).toBe(true);
  });
});

describe('F-04 空数组 → 正常', () => {
  it('没有发现时不报错，也不编造', async () => {
    const result = await runReview(REQUEST, {
      config: config(),
      client: clientOf(['{"findings":[]}']),
      fetchSnapshot: fetchOf(),
      port: null,
    });

    expect(result.findings).toHaveLength(0);
    expect(result.rejections).toHaveLength(0);
  });
});

describe('F-05 输出被截断 → 缩范围重试', () => {
  it('截断时带上告警，说明结论可能不完整', async () => {
    const truncated: LlmClient = {
      structuredMode: () => 'json-schema',
      complete: (request) =>
        Promise.resolve({
          text: '{"findings":[',
          finishReason: 'length',
          usage: USAGE,
          model: request.model,
          structuredMode: 'json-schema',
        }),
    };

    const result = await runReview(REQUEST, {
      config: config(),
      client: truncated,
      fetchSnapshot: fetchOf(),
      port: null,
    });
    expect(result.warnings.some((warning) => warning.kind === 'truncated')).toBe(true);
  });
});

describe('F-06 行号不可用 → 证据反查', () => {
  it('行号越界但证据能对上时，采用反查出来的位置', () => {
    const diff = {
      files: [parsePatch(PATCH, { path: 'src/a.ts', oldPath: 'src/a.ts', status: 'modified' })],
      baseSha: 'b',
      headSha: 'h',
    };
    const result = locate({
      raw: {
        file: 'src/a.ts',
        line: 99,
        side: 'new',
        severity: 'major',
        category: 'null-safety',
        title: 't',
        body: 'b',
        evidence: 'return v.y;',
        suggestion: null,
        confidence: 0.9,
      },
      diff,
      index: buildLineIndex(diff),
      fileContents: new Map([['src/a.ts', CONTENT]]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.origin).toBe('evidence-hunk');
  });
});

describe('F-07 证据完全不存在 → 丢弃', () => {
  it('报 evidence-mismatch', async () => {
    const invented = JSON.stringify({
      findings: [
        {
          ...(JSON.parse(VALID) as { findings: Record<string, unknown>[] }).findings[0],
          evidence: 'const 编造的 = 1;',
        },
      ],
    });
    const result = await runReview(REQUEST, {
      config: config(),
      client: clientOf([invented]),
      fetchSnapshot: fetchOf(),
      port: null,
    });

    expect(result.findings).toHaveLength(0);
    expect(result.rejections[0]?.reason).toBe('evidence-mismatch');
  });
});

describe('F-08 证据命中多处 → 不猜', () => {
  it('报 unlocatable', () => {
    const diff = {
      files: [
        parsePatch(PATCH, { path: 'src/a.ts', oldPath: 'src/a.ts', status: 'modified' }),
        parsePatch(PATCH, { path: 'src/b.ts', oldPath: 'src/b.ts', status: 'modified' }),
      ],
      baseSha: 'b',
      headSha: 'h',
    };

    const result = locate({
      raw: {
        file: 'src/unknown.ts',
        line: 1,
        side: 'new',
        severity: 'major',
        category: 'null-safety',
        title: 't',
        body: 'b',
        evidence: 'return v.y;',
        suggestion: null,
        confidence: 0.9,
      },
      diff,
      index: buildLineIndex(diff),
      fileContents: new Map(),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('unlocatable');
  });
});

describe('F-09 超过费用上限 → 停止后续调用', () => {
  it('费用触顶后标记中断，并给出告警', async () => {
    const priced = config({
      llm: {
        ...DEFAULT_CONFIG.llm,
        pricing: {
          inputPerMTok: 1000,
          outputPerMTok: 1000,
          cacheWriteShortMultiplier: 1,
          cacheWriteLongMultiplier: 1,
          cacheReadMultiplier: 1,
        },
      },
      review: { ...DEFAULT_CONFIG.review, maxBudgetUsd: 0.0001 },
    });

    const result = await runReview(REQUEST, {
      config: priced,
      client: clientOf([VALID]),
      fetchSnapshot: fetchOf(),
      port: null,
    });

    expect(result.usage.truncatedByBudget).toBe(true);
    expect(result.warnings.some((warning) => warning.kind === 'budget')).toBe(true);
  });
});

describe('F-10 平台限流 → 退避重试', () => {
  it('限流后重试成功，不把这条丢掉', async () => {
    let attempts = 0;
    const port: CommentPort = {
      kind: 'fake',
      createInline: (): Promise<WriteResult> => {
        attempts += 1;
        return Promise.resolve(
          attempts === 1
            ? { ok: false, failure: { kind: 'rate-limit', message: 'slow down', status: 429 } }
            : { ok: true, commentId: 'c1' },
        );
      },
      createThread: () => Promise.resolve({ ok: true, commentId: 't1' }),
      update: () => Promise.resolve({ ok: true, commentId: 'x' }),
      resolve: () => Promise.resolve({ ok: true, commentId: 'x' }),
      remove: () => Promise.resolve({ ok: true, commentId: 'x' }),
      read: () => Promise.resolve({ body: 'fp1' }),
      findThread: () => Promise.resolve(null),
    };

    const outcome = await publish({
      port,
      actions: [
        {
          kind: 'create',
          target: 'inline',
          body: 'b',
          finding: {
            fingerprint: 'fp1',
            reviewer: 'correctness',
            anchor: { file: 'a.ts', oldPath: null, kind: 'added', newLine: 1, oldLine: null },
            positionOrigin: 'model-line',
            severity: 'major',
            category: 'null-safety',
            title: 't',
            body: 'b',
            evidence: 'e',
            suggestion: null,
            confidence: 0.9,
            preexisting: false,
            scope: 'changed',
          },
        },
      ],
      summaryBody: null,
      sleep: async () => {},
    });

    expect(attempts).toBe(2);
    expect(outcome.created).toBe(1);
  });
});

describe('F-12 标记解析失败 → 永不动它', () => {
  it('没有标记的评论不产生任何动作', () => {
    const human: ExistingComment = {
      commentId: 'human',
      marker: null,
      line: 3,
      side: 'new',
      path: 'src/a.ts',
      resolved: false,
      outdated: false,
    };

    const outcome = planActions({ findings: [], inline: [], existing: [human] });
    expect(outcome.actions).toEqual([]);
  });
});

describe('F-15 跨文件索引失败 → 关闭展开', () => {
  it('索引建不出来时整轮仍能完成', async () => {
    // 内容是合法的空串时索引为空，但流程不该中断
    const result = await runReview(REQUEST, {
      config: config(),
      client: clientOf(['{"findings":[]}']),
      fetchSnapshot: fetchOf({ content: '' }),
      port: null,
    });

    expect(result.coverage.failed).toBe(0);
  });
});
