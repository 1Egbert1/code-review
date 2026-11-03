import { describe, expect, it } from 'vitest';

import type { ResolvedConfig } from '../src/contracts/config.js';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import {
  computeConfigHash,
  computePromptHash,
  decideCheckpoint,
  parseCheckpoint,
  renderCheckpoint,
} from '../src/core/reconcile/checkpoint.js';
import type { CheckpointState } from '../src/core/reconcile/checkpoint.js';

const STATE: CheckpointState = {
  version: 'v1',
  headSha: 'aaaa1111',
  baseSha: 'bbbb2222',
  configHash: 'cccc3333',
  promptHash: 'dddd4444',
  reviewedAt: '2026-11-03T00:00:00Z',
};

const CURRENT = {
  headSha: 'eeee5555',
  baseSha: 'bbbb2222',
  configHash: 'cccc3333',
  promptHash: 'dddd4444',
};

function input(overrides: Partial<Parameters<typeof decideCheckpoint>[0]> = {}) {
  return {
    enabled: true,
    summary: { body: `摘要正文\n${renderCheckpoint(STATE)}`, author: 'acr-bot' },
    expectedAuthor: 'acr-bot',
    current: CURRENT,
    isAncestor: () => Promise.resolve(true),
    ...overrides,
  };
}

describe('检查点标记', () => {
  it('渲染后能原样读回', () => {
    expect(parseCheckpoint(renderCheckpoint(STATE))).toEqual(STATE);
  });

  it('读不出时返回 null，而不是硬解析出一个半成品', () => {
    expect(parseCheckpoint('只有摘要没有检查点')).toBeNull();
    expect(parseCheckpoint('<!-- acr:v1|kind=checkpoint|head=abc -->')).toBeNull();
  });
});

describe('六种存疑情况一律退回全量', () => {
  it('未启用', async () => {
    const decision = await decideCheckpoint(input({ enabled: false }));
    expect(decision).toMatchObject({ use: false, reason: 'disabled' });
  });

  it('摘要不存在', async () => {
    const decision = await decideCheckpoint(input({ summary: null }));
    expect(decision).toMatchObject({ use: false, reason: 'no-summary' });
  });

  it('摘要不是本令牌发的', async () => {
    const decision = await decideCheckpoint(
      input({ summary: { body: renderCheckpoint(STATE), author: 'someone-else' } }),
    );
    expect(decision).toMatchObject({ use: false, reason: 'foreign-author' });
  });

  it('无法确认作者时同样退回——判断不了就是存疑', async () => {
    const decision = await decideCheckpoint(input({ expectedAuthor: null }));
    expect(decision).toMatchObject({ use: false, reason: 'foreign-author' });
  });

  it('标记读不出', async () => {
    const decision = await decideCheckpoint(
      input({ summary: { body: '没有标记', author: 'acr-bot' } }),
    );
    expect(decision).toMatchObject({ use: false, reason: 'unparsable' });
  });

  it('基准分支已移动', async () => {
    const decision = await decideCheckpoint(input({ current: { ...CURRENT, baseSha: 'zzzz' } }));
    expect(decision).toMatchObject({ use: false, reason: 'base-moved' });
  });

  it('配置或提示词版本变了', async () => {
    const byConfig = await decideCheckpoint(
      input({ current: { ...CURRENT, configHash: 'other' } }),
    );
    expect(byConfig).toMatchObject({ use: false, reason: 'basis-changed' });

    const byPrompt = await decideCheckpoint(
      input({ current: { ...CURRENT, promptHash: 'other' } }),
    );
    expect(byPrompt).toMatchObject({ use: false, reason: 'basis-changed' });
  });

  it('无法证明祖先关系', async () => {
    const decision = await decideCheckpoint(input({ isAncestor: () => Promise.resolve(false) }));
    expect(decision).toMatchObject({ use: false, reason: 'not-ancestor' });
  });

  it('祖先判断抛错时也退回，不因一次抖动就默认成立', async () => {
    const decision = await decideCheckpoint(
      input({ isAncestor: () => Promise.reject(new Error('接口挂了')) }),
    );
    expect(decision).toMatchObject({ use: false, reason: 'not-ancestor' });
  });
});

describe('可信时给出增量区间', () => {
  it('全部检查通过才使用检查点', async () => {
    const decision = await decideCheckpoint(input());
    expect(decision).toEqual({ use: true, from: STATE.headSha, to: CURRENT.headSha });
  });

  it('头部没变时不算命中，避免空跑', async () => {
    const decision = await decideCheckpoint(
      input({ current: { ...CURRENT, headSha: STATE.headSha } }),
    );
    expect(decision).toMatchObject({ use: false, reason: 'nothing-new' });
  });
});

describe('指纹只取影响结论的部分', () => {
  it('维度开关或严重度下限变化会改变配置指纹', () => {
    const a = computeConfigHash(DEFAULT_CONFIG);
    const changed: ResolvedConfig = {
      ...DEFAULT_CONFIG,
      review: {
        ...DEFAULT_CONFIG.review,
        dimensions: {
          ...DEFAULT_CONFIG.review.dimensions,
          convention: { enabled: true, severityFloor: 'nit' },
        },
      },
    };
    expect(computeConfigHash(changed)).not.toBe(a);
  });

  it('只改行内条数上限不该触发全量重审', () => {
    const a = computeConfigHash(DEFAULT_CONFIG);
    const changed: ResolvedConfig = {
      ...DEFAULT_CONFIG,
      review: { ...DEFAULT_CONFIG.review, maxInlineComments: 99 },
    };
    expect(computeConfigHash(changed)).toBe(a);
  });

  it('提示词版本顺序不影响指纹', () => {
    expect(computePromptHash({ a: 'v1', b: 'v2' })).toBe(computePromptHash({ b: 'v2', a: 'v1' }));
  });
});
