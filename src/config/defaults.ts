/**
 * 内置默认配置。
 *
 * 两条刻意的「空」：
 * - `llm.pricing` 为 null：**不内置任何价格数字**。价格会变，写死就是错的；
 *   未配置时费用一律显示「未配置单价，无法折算」，不用 0 代替。
 * - `routing.tiers` 为空：档位对应的具体模型由用户填，预设只提供结构。
 *
 * 其余默认值都能被配置文件覆盖。合并顺序见 {@link ../config/merge.ts}。
 */

import type { ResolvedConfig } from '../contracts/config.js';

/** 默认跳过的文件。锁文件、产物、压缩文件对审查没有价值，只会烧 token。 */
const DEFAULT_SKIP_PATHS: readonly string[] = [
  '**/*.lock',
  '**/dist/**',
  '**/*.min.js',
  '**/vendor/**',
];

/** 默认配置。任何一层都没有提供时使用。 */
export const DEFAULT_CONFIG: ResolvedConfig = {
  configVersion: 1,

  platform: {
    kind: 'github',
    repository: null,
    tokenEnv: 'GITHUB_TOKEN',
  },

  llm: {
    preset: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKeyEnv: 'AI_REVIEW_API_KEY',
    temperature: 0.2,
    maxOutputTokens: 4096,
    contextWindow: 65536,
    pricing: null,
    headers: {},
    structuredOutput: 'auto',
  },

  routing: {
    enabled: true,
    tiers: {},
    byDimension: {
      correctness: 'strong',
      security: 'strong',
      convention: 'cheap',
    },
    fileRiskThreshold: 60,
    // 0 表示不启用规模级路由。见规格书 20.2：小改动往往影响全局，不该自动降档。
    smallChangeLines: 0,
    defaultTier: 'standard',
  },

  review: {
    dimensions: {
      correctness: { enabled: true, severityFloor: 'minor' },
      security: { enabled: true, severityFloor: 'minor' },
      // 规范性问题噪声最大，默认关闭；检出仓库已有静态检查时也会自动静音。
      convention: { enabled: false, severityFloor: 'minor' },
    },
    maxInlineComments: 15,
    maxSummaryPreexisting: 3,
    maxSummaryFileLevel: 3,
    checkpoint: false,
    skipPaths: DEFAULT_SKIP_PATHS,
    maxBudgetUsd: 0.5,
    crossFileDepth: 1,
    crossFileMaxFiles: 30,
    concurrency: 4,
    respectLintConfig: true,
  },

  gate: {
    enabled: false,
    blockingSeverity: 'blocker',
    blockingCategories: ['security', 'crash', 'data-loss', 'resource-leak'],
    confidenceThreshold: 0.8,
    exemptionStore: 'issue-comment',
  },

  inspection: {
    enabled: false,
    weights: {
      complexity: 20,
      duplication: 20,
      dependency: 20,
      'type-safety': 20,
      test: 20,
    },
    maxScorePerDimension: 20,
    sampleSize: 60,
    carrier: 'auto',
    wikiPagePrefix: '',
    historyDepth: 12,
  },

  output: {
    inline: true,
    summary: true,
    language: 'zh-CN',
    resolveMode: 'edit',
  },
};
