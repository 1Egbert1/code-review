import { describe, expect, it } from 'vitest';

import type { ResolvedConfig } from '../src/contracts/config.js';
import { deepMerge, type ResolveOutcome, resolveConfig } from '../src/config/merge.js';
import { validateConfig } from '../src/config/validate.js';

/** 断言合并成功并取出配置，失败时把全部错误打进断言消息。 */
function expectOk(outcome: ResolveOutcome): ResolvedConfig {
  if (!outcome.ok) {
    const detail = outcome.errors.map((e) => `${e.path || '(根)'}: ${e.message}`).join('; ');
    throw new Error(`配置应当合法，但报了错: ${detail}`);
  }
  return outcome.config;
}

/** 断言校验失败，并返回错误路径集合，便于精确断言是哪条拦下的。 */
function expectFail(outcome: ResolveOutcome): readonly string[] {
  if (outcome.ok) {
    throw new Error('配置应当非法，但通过了校验');
  }
  return outcome.errors.map((e) => e.path);
}

describe('默认配置', () => {
  it('内置默认值本身必须能通过校验', () => {
    const config = expectOk(resolveConfig([]));
    expect(config.configVersion).toBe(1);
    expect(config.review.maxInlineComments).toBe(15);
    expect(config.output.resolveMode).toBe('edit');
  });

  it('默认不内置任何价格：pricing 为 null', () => {
    const config = expectOk(resolveConfig([]));
    // 价格会变，写死就是错的。未配置时应为 null，由展示层显示「无法折算」。
    expect(config.llm.pricing).toBeNull();
  });

  it('默认不启用规模级路由，避免小改动被降档', () => {
    const config = expectOk(resolveConfig([]));
    expect(config.routing.smallChangeLines).toBe(0);
  });

  it('规范性维度默认关闭', () => {
    const config = expectOk(resolveConfig([]));
    expect(config.review.dimensions.convention.enabled).toBe(false);
  });
});

describe('深合并', () => {
  it('只覆盖指定字段，其余保留默认值', () => {
    const config = expectOk(resolveConfig([{ review: { maxInlineComments: 30 } }]));
    expect(config.review.maxInlineComments).toBe(30);
    // 同一节里没提到的字段不能被清空
    expect(config.review.concurrency).toBe(4);
    expect(config.review.maxBudgetUsd).toBe(0.5);
  });

  it('嵌套对象逐字段合并，未提及的键保留', () => {
    const config = expectOk(
      resolveConfig([{ review: { dimensions: { correctness: { enabled: false } } } }]),
    );
    expect(config.review.dimensions.correctness.enabled).toBe(false);
    // 同节里没提到的 severityFloor 要保持
    expect(config.review.dimensions.correctness.severityFloor).toBe('minor');
    // 另外两个维度完全不受影响
    expect(config.review.dimensions.security.enabled).toBe(true);
  });

  it('多层按顺序覆盖，后者优先', () => {
    const config = expectOk(
      resolveConfig([{ review: { maxInlineComments: 30 } }, { review: { maxInlineComments: 5 } }]),
    );
    expect(config.review.maxInlineComments).toBe(5);
  });

  it('数组是整体替换，不是拼接', () => {
    const config = expectOk(resolveConfig([{ review: { skipPaths: ['**/*.snap'] } }]));
    // 拼接的话这里会有 5 个元素，用户就无法「清空默认清单」了
    expect(config.review.skipPaths).toEqual(['**/*.snap']);
  });

  it('deepMerge 对数组返回新数组，不共享引用', () => {
    const base = { list: ['a'] };
    const merged = deepMerge(base, { list: ['b'] }) as { list: string[] };
    expect(merged.list).toEqual(['b']);
  });

  it('传 null 或 undefined 的层被跳过', () => {
    const config = expectOk(resolveConfig([null, undefined, { review: { concurrency: 8 } }]));
    expect(config.review.concurrency).toBe(8);
  });
});

describe('校验：拒绝拼写错误', () => {
  it('未知字段报错，而不是静默忽略', () => {
    // 少一个 s 的真实场景：配置看着生效了，实际没生效
    const paths = expectFail(resolveConfig([{ review: { maxInlineComment: 20 } }]));
    expect(paths).toContain('review.maxInlineComment');
  });

  it('顶层未知字段同样报错', () => {
    const paths = expectFail(resolveConfig([{ reveiw: {} }]));
    expect(paths).toContain('reveiw');
  });

  it('校验错误带完整路径，便于定位', () => {
    const errors = validateConfig({ review: { concurrency: 0 } });
    expect(errors[0]?.path).toBe('review.concurrency');
  });
});

describe('校验：取值范围', () => {
  it('temperature 超出 0~2 报错', () => {
    expect(expectFail(resolveConfig([{ llm: { temperature: 3 } }]))).toContain('llm.temperature');
  });

  it('并发数为 0 报错', () => {
    expect(expectFail(resolveConfig([{ review: { concurrency: 0 } }]))).toContain(
      'review.concurrency',
    );
  });

  it('跨文件深度只能是 0/1/2', () => {
    expect(expectFail(resolveConfig([{ review: { crossFileDepth: 3 } }]))).toContain(
      'review.crossFileDepth',
    );
  });

  it('语言只接受 zh-CN 与 en', () => {
    expect(expectFail(resolveConfig([{ output: { language: 'ja' } }]))).toContain(
      'output.language',
    );
  });
});

describe('校验：跨字段一致性', () => {
  it('五维权重合计不为 100 时报错', () => {
    const paths = expectFail(
      resolveConfig([
        {
          inspection: {
            weights: {
              complexity: 30,
              duplication: 30,
              dependency: 20,
              'type-safety': 20,
              test: 20,
            },
          },
        },
      ]),
    );
    expect(paths).toContain('inspection.weights');
  });

  it('路由的默认档位必须在 tiers 里定义', () => {
    const paths = expectFail(
      resolveConfig([
        {
          routing: {
            defaultTier: 'standard',
            tiers: { strong: { model: 'x', maxOutputTokens: 1024, contextWindow: 8192 } },
          },
        },
      ]),
    );
    expect(paths).toContain('routing.defaultTier');
  });

  it('维度引用了未定义的档位时报错', () => {
    const paths = expectFail(
      resolveConfig([
        {
          routing: {
            defaultTier: 'strong',
            tiers: { strong: { model: 'x', maxOutputTokens: 1024, contextWindow: 8192 } },
            byDimension: { correctness: 'missing' },
          },
        },
      ]),
    );
    expect(paths).toContain('routing.byDimension.correctness');
  });
});

describe('校验：合法的边界情况', () => {
  it('pricing 显式为 null 是合法的（表示未配置单价）', () => {
    const config = expectOk(resolveConfig([{ llm: { pricing: null } }]));
    expect(config.llm.pricing).toBeNull();
  });

  it('完整配置 pricing 可被接受', () => {
    const config = expectOk(
      resolveConfig([
        {
          llm: {
            pricing: {
              inputPerMTok: 1,
              outputPerMTok: 4,
              cacheWriteShortMultiplier: 1.25,
              cacheWriteLongMultiplier: 2,
              cacheReadMultiplier: 0.1,
            },
          },
        },
      ]),
    );
    expect(config.llm.pricing?.inputPerMTok).toBe(1);
    expect(config.llm.pricing?.cacheReadMultiplier).toBe(0.1);
  });

  it('门禁只允许 blocker 作为阻塞级别', () => {
    expect(expectFail(resolveConfig([{ gate: { blockingSeverity: 'major' } }]))).toContain(
      'gate.blockingSeverity',
    );
  });
});
