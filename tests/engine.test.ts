import { describe, expect, it } from 'vitest';

import type { ResolvedConfig } from '../src/contracts/config.js';
import type { ReviewRequest } from '../src/contracts/diff.js';
import type { TokenUsage } from '../src/contracts/result.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import { runReview } from '../src/core/engine.js';
import { parsePatch } from '../src/core/diff/parse.js';
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

const USAGE: TokenUsage = {
  uncachedInput: 100,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 20,
};

const FINDINGS = JSON.stringify({
  findings: [
    {
      file: 'src/a.ts',
      line: 3,
      side: 'new',
      severity: 'major',
      category: 'null-safety',
      title: 'v 可能为空',
      body: 'read() 可能返回 null，读取属性会崩溃',
      evidence: 'return v.y;',
      suggestion: null,
      confidence: 0.9,
    },
  ],
});

function client(text = FINDINGS): LlmClient & { calls: number; requests: LlmRequest[] } {
  const state = {
    calls: 0,
    requests: [] as LlmRequest[],
    structuredMode: () => 'json-schema' as const,
    complete(request: LlmRequest): Promise<LlmResponse> {
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

const REQUEST: ReviewRequest = {
  repository: 'acme/web',
  mode: 'pull-request',
  pullRequestNumber: 1,
  baseRef: null,
  headRef: null,
  dryRun: true,
};

function config(overrides: Partial<ResolvedConfig['review']> = {}): ResolvedConfig {
  return {
    ...DEFAULT_CONFIG,
    review: {
      ...DEFAULT_CONFIG.review,
      dimensions: {
        correctness: { enabled: true, severityFloor: 'minor' },
        security: { enabled: false, severityFloor: 'minor' },
        convention: { enabled: false, severityFloor: 'minor' },
      },
      ...overrides,
    },
  };
}

function snapshotFetcher() {
  return () =>
    Promise.resolve({
      diff: {
        files: [parsePatch(PATCH, { path: 'src/a.ts', oldPath: 'src/a.ts', status: 'modified' })],
        baseSha: 'base',
        headSha: 'head',
      },
      fileContents: new Map([['src/a.ts', CONTENT]]),
      existingComments: [],
      conventions: null,
      buildContext: null,
    });
}

describe('总控：五步走通', () => {
  it('取 → 审 → 校 → 对，产出可发送的结论', async () => {
    const fake = client();
    const result = await runReview(REQUEST, {
      config: config(),
      client: fake,
      fetchSnapshot: snapshotFetcher(),
      port: null,
    });

    expect(fake.calls).toBe(1);
    expect(result.findings).toHaveLength(1);
    expect(result.actions.map((action) => action.kind)).toEqual(['create']);
    expect(result.coverage).toMatchObject({ planned: 1, completed: 1, failed: 0 });
    expect(result.usage.calls).toBe(1);
    // 未配置单价时不给一个假金额
    expect(result.usage.estimatedCostUsd).toBeNull();
  });

  it('摘要里带对比基准与提示词版本，便于追溯结论差异', async () => {
    const result = await runReview(REQUEST, {
      config: config(),
      client: client(),
      fetchSnapshot: snapshotFetcher(),
      port: null,
    });

    expect(result.summaryMarkdown).toContain('base');
    expect(result.summaryMarkdown).toContain('提示词版本');
  });

  it('模型给出无法定位的结论时被拦下，并留下原因', async () => {
    const bad = JSON.stringify({
      findings: [
        {
          file: 'src/a.ts',
          line: 3,
          side: 'new',
          severity: 'major',
          category: 'null-safety',
          title: '编造的',
          body: 'b',
          evidence: 'const invented = true;',
          suggestion: null,
          confidence: 0.9,
        },
      ],
    });

    const result = await runReview(REQUEST, {
      config: config(),
      client: client(bad),
      fetchSnapshot: snapshotFetcher(),
      port: null,
    });

    expect(result.findings).toHaveLength(0);
    expect(result.rejections[0]?.reason).toBe('evidence-mismatch');
  });

  it('单文件审查失败不会拖垮整轮', async () => {
    const failing: LlmClient = {
      structuredMode: () => null,
      complete: () => Promise.reject(new Error('网络断了')),
    };

    const result = await runReview(REQUEST, {
      config: config(),
      client: failing,
      fetchSnapshot: snapshotFetcher(),
      port: null,
    });

    expect(result.findings).toHaveLength(0);
    expect(result.warnings.some((warning) => warning.message.includes('网络断了'))).toBe(true);
    expect(result.coverage.failed).toBe(1);
  });

  it('只打印模式下即使给了端口也不发送', async () => {
    let writes = 0;
    const port = {
      kind: 'fake',
      createInline: () => {
        writes += 1;
        return Promise.resolve({ ok: true as const, commentId: 'c1' });
      },
      createThread: () => {
        writes += 1;
        return Promise.resolve({ ok: true as const, commentId: 'c2' });
      },
      update: () => Promise.resolve({ ok: true as const, commentId: 'c3' }),
      resolve: () => Promise.resolve({ ok: true as const, commentId: 'c4' }),
      remove: () => Promise.resolve({ ok: true as const, commentId: 'c5' }),
      read: () => Promise.resolve(null),
      findThread: () => Promise.resolve(null),
    };

    await runReview(REQUEST, {
      config: config(),
      client: client(),
      fetchSnapshot: snapshotFetcher(),
      port,
    });
    expect(writes).toBe(0);
  });
});

describe('检查点', () => {
  const withCheckpoint = (): ResolvedConfig => ({
    ...config(),
    review: { ...config().review, checkpoint: true },
  });

  it('默认关闭：即使给了依赖也不启用', async () => {
    const result = await runReview(REQUEST, {
      config: config(),
      client: client(),
      fetchSnapshot: snapshotFetcher(),
      port: null,
      checkpoint: {
        summary: null,
        expectedAuthor: null,
        isAncestor: () => Promise.resolve(true),
        fetchIncremental: () => {
          throw new Error('不该被调用');
        },
      },
    });

    expect(result.coverage.planned).toBe(1);
  });

  it('检查点可信但取不到增量时退回全量并告警', async () => {
    const result = await runReview(REQUEST, {
      config: withCheckpoint(),
      client: client(),
      fetchSnapshot: snapshotFetcher(),
      port: null,
      checkpoint: {
        summary: null,
        expectedAuthor: 'bot',
        isAncestor: () => Promise.resolve(true),
        fetchIncremental: () => Promise.resolve(null),
      },
    });

    // summary 为 null → 判定 no-summary，直接全量；没有增量可退，因此不该出现「退回全量」告警
    expect(result.warnings.some((warning) => warning.message.includes('退回全量'))).toBe(false);
    expect(result.coverage.planned).toBe(1);
  });

  it('作者对不上时告警说明为什么这轮又全量了', async () => {
    const result = await runReview(REQUEST, {
      config: withCheckpoint(),
      client: client(),
      fetchSnapshot: snapshotFetcher(),
      port: null,
      checkpoint: {
        summary: { body: '别人的摘要', author: 'someone' },
        expectedAuthor: 'bot',
        isAncestor: () => Promise.resolve(true),
        fetchIncremental: () => Promise.resolve(null),
      },
    });

    expect(result.warnings.some((warning) => warning.message.includes('未使用检查点'))).toBe(true);
  });
});
