/**
 * 配置相关的契约。
 *
 * 两条硬规则：
 * 1. 配置文件里**只存环境变量名，不存密钥值**（{@link LlmConfig.apiKeyEnv} 是名字不是值）；
 * 2. 单价与倍率**不写死**，全部走 {@link PricingConfig}——价格会变，写死必错。
 */

import type { ReviewerId, Severity } from './finding.js';
import type { ReportCarrier, ScoreDimension } from './inspection.js';

/** 合并后的最终配置。四层合并（命令行 > 环境变量 > 本地覆盖 > 主配置 > 默认值）后的产物。 */
export interface ResolvedConfig {
  readonly configVersion: 1;
  readonly platform: PlatformConfig;
  readonly llm: LlmConfig;
  readonly routing: RoutingConfig;
  readonly review: ReviewConfig;
  readonly gate: GateConfig;
  readonly inspection: InspectionConfig;
  readonly output: OutputConfig;
}

export interface PlatformConfig {
  readonly kind: 'github';
  /** 仓库全名 owner/repo；为空则从运行环境推断 */
  readonly repository: string | null;
  /** 平台令牌的**环境变量名**，不是令牌本身 */
  readonly tokenEnv: string;
}

export interface LlmConfig {
  /** 内置预设名，只提供 baseUrl 与默认模型的形状，不含价格 */
  readonly preset: string;
  readonly baseUrl: string;
  readonly model: string;
  /** 密钥的**环境变量名** */
  readonly apiKeyEnv: string;
  readonly temperature: number;
  readonly maxOutputTokens: number;
  /** 上下文窗口，预算按它计算 */
  readonly contextWindow: number;
  /** 计价参数；未配为 null，此时费用显示为「无法折算」而不是 0 */
  readonly pricing: PricingConfig | null;
  /** 自定义请求头，用于接入内部网关 */
  readonly headers: Readonly<Record<string, string>>;
  /** 结构化输出能力；auto 表示启动时探测 */
  readonly structuredOutput: 'auto' | 'json-schema' | 'json-object' | 'none';
}

/** 计价参数。倍率相对于「输入单价」，不同厂商差异极大，不可硬编码。 */
export interface PricingConfig {
  /** 每百万输入 token 的单价 */
  readonly inputPerMTok: number;
  /** 每百万输出 token 的单价 */
  readonly outputPerMTok: number;
  /** 缓存写入倍率（短有效期）；不支持缓存写费的厂商填 0 */
  readonly cacheWriteShortMultiplier: number;
  /** 缓存写入倍率（长有效期）；不支持时填 0 */
  readonly cacheWriteLongMultiplier: number;
  /** 缓存读取倍率；不支持缓存时填 1 */
  readonly cacheReadMultiplier: number;
}

/** 模型路由：按维度、文件风险、规模决定用哪一档模型，降本而不降精度。 */
export interface RoutingConfig {
  readonly enabled: boolean;
  /** 档位名 → 具体模型 */
  readonly tiers: Readonly<Record<string, RoutingTier>>;
  /** 维度 → 档位名；未列出的维度用 defaultTier */
  readonly byDimension: Readonly<Partial<Record<ReviewerId, string>>>;
  /** 文件风险分达到该值时使用高档位；0 表示不启用文件级路由 */
  readonly fileRiskThreshold: number;
  /** 改动行数低于该值时可降档；0 表示不启用规模级路由（默认关闭，见规格书 20.2） */
  readonly smallChangeLines: number;
  readonly defaultTier: string;
}

export interface RoutingTier {
  readonly model: string;
  /**
   * 以下三项都可省略，省略时回落到 llm 里的同名配置。
   *
   * 只有 model 是必填的：多数人配路由只想换个模型名，逼他填上下文窗口和单价
   * 只会让人干脆不开路由。真需要区分时再补。
   */
  readonly maxOutputTokens?: number;
  readonly contextWindow?: number;
  /** 该档位的计价；未配则回落到 llm.pricing */
  readonly pricing?: PricingConfig | null;
}

export interface ReviewConfig {
  readonly dimensions: Readonly<Record<ReviewerId, DimensionConfig>>;
  /** 行内评论总条数上限。超出部分路由到摘要，**不丢弃** */
  readonly maxInlineComments: number;
  /** 摘要区展开显示几条存量问题；超出折叠为计数 */
  readonly maxSummaryPreexisting: number;
  /** 摘要区展开显示几条文件级问题；超出折叠为计数 */
  readonly maxSummaryFileLevel: number;
  /** 是否启用跨轮次检查点（只审增量），失败即退回全量 */
  readonly checkpoint: boolean;
  readonly skipPaths: readonly string[];
  /** 单次审查费用硬上限（美元） */
  readonly maxBudgetUsd: number;
  /** 跨文件展开深度：0 / 1 / 2 */
  readonly crossFileDepth: 0 | 1 | 2;
  /** 跨文件展开的文件数上限 */
  readonly crossFileMaxFiles: number;
  /** 并发调用数 */
  readonly concurrency: number;
  /** 检出仓库已配置格式化或静态检查时，是否让规范性维度整体静音 */
  readonly respectLintConfig: boolean;
}

export interface DimensionConfig {
  readonly enabled: boolean;
  /** 低于此严重度的问题项直接丢弃 */
  readonly severityFloor: Severity;
}

/** 门禁：只有满足全部合取条件的问题项才阻塞合并。 */
export interface GateConfig {
  readonly enabled: boolean;
  /** 允许阻塞的严重度；当前只支持致命 */
  readonly blockingSeverity: 'blocker';
  /** 允许阻塞的问题类别（安全、崩溃、数据丢失、资源泄漏等） */
  readonly blockingCategories: readonly string[];
  /** 模型发现的置信度门槛，低于此值不阻塞 */
  readonly confidenceThreshold: number;
  /** 豁免记录的存放位置；null 表示不启用豁免 */
  readonly exemptionStore: 'issue-comment' | null;
}

/** 巡检配置。 */
export interface InspectionConfig {
  readonly enabled: boolean;
  /** 五维权重，合计 100 */
  readonly weights: Readonly<Record<ScoreDimension, number>>;
  /** 各维度满分，默认 20 */
  readonly maxScorePerDimension: number;
  /** 抽样送审的文件数上限；指标计算不受此限（零成本） */
  readonly sampleSize: number;
  /** 报告载体；auto 表示按可用性自动选择 */
  readonly carrier: 'auto' | ReportCarrier;
  /** Wiki 页面名的日期前缀格式，默认年-月-日 */
  readonly wikiPagePrefix: string;
  /** 保留最近几期用于趋势对比 */
  readonly historyDepth: number;
}

export interface OutputConfig {
  readonly inline: boolean;
  readonly summary: boolean;
  readonly language: 'zh-CN' | 'en';
  /** 问题被修复后如何处理旧评论：编辑原评论（保留讨论）或删除 */
  readonly resolveMode: 'edit' | 'delete';
}
