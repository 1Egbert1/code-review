/**
 * 模型路由：不同的事交给不同档位的模型，同时不让质量掉下来。
 *
 * 三档的优先级是有讲究的，顺序不能反：
 *
 * 1. **文件风险**：碰钱、碰权限、碰加解密的文件，用强模型。这一类判断错了代价最大。
 * 2. **维度**：规范性本来就不需要强推理，用便宜的就够。
 * 3. **规模**：小改动降档要**默认关闭**。
 *
 * 为什么规模排最后且默认关：小改动往往恰恰最需要准确判断——一行改动可能影响全局，
 * 而模型看到的信息量也最少，正是最容易想当然的时候。「改动小所以简单」是个反直觉的错误假设。
 */

import type { RoutingConfig } from '../../contracts/config.js';
import type { ReviewerId } from '../../contracts/finding.js';

/** 路径里出现这些词，说明这块代码出错的代价高。 */
const RISK_PATH_PATTERNS: readonly {
  readonly pattern: RegExp;
  readonly score: number;
  readonly reason: string;
}[] = [
  {
    pattern: /(^|\/)(auth|authz|login|session|permission|role)(\/|\.|$)/i,
    score: 45,
    reason: '鉴权相关',
  },
  {
    pattern: /(^|\/)(payment|billing|order|refund|settle)(\/|\.|$)/i,
    score: 40,
    reason: '资金相关',
  },
  { pattern: /(^|\/)(crypto|security|secret|cert)(\/|\.|$)/i, score: 40, reason: '加解密与密钥' },
  {
    pattern: /(^|\/)(api|routes?|controllers?|handlers?|middleware)(\/|\.|$)/i,
    score: 25,
    reason: '请求入口',
  },
  {
    pattern: /(^|\/)(migrations?|schema|db|database|dao|repository)(\/|\.|$)/i,
    score: 25,
    reason: '数据层',
  },
  { pattern: /\.(sql|prisma)$/i, score: 20, reason: '数据库脚本' },
];

export interface FileRisk {
  readonly score: number;
  readonly reasons: readonly string[];
}

/**
 * 粗算文件风险。
 *
 * 只看路径与改动规模，不看内容——看内容要读文件、要调模型，那就本末倒置了。
 * 分数只用于决定路由档位，不需要精确，但必须**可解释**：报告里要能说出为什么这文件用了强模型。
 */
export function computeFileRisk(path: string, changedLines: number): FileRisk {
  const reasons: string[] = [];
  let score = 0;

  for (const { pattern, score: weight, reason } of RISK_PATH_PATTERNS) {
    if (pattern.test(path)) {
      score += weight;
      reasons.push(reason);
    }
  }

  // 改动越大，出错面越广；20 行以内不额外加分
  if (changedLines > 20) {
    const extra = Math.min(20, Math.floor((changedLines - 20) / 20) * 5);
    if (extra > 0) {
      score += extra;
      reasons.push(`改动 ${String(changedLines)} 行`);
    }
  }

  return { score: Math.min(100, score), reasons };
}

export interface RouteInput {
  readonly config: RoutingConfig;
  readonly reviewer: ReviewerId;
  readonly filePath: string | null;
  readonly changedLines: number;
}

export interface RouteDecision {
  /** 档位名，对应配置里的 tiers 键 */
  readonly tier: string;
  /** 实际要用的模型名；档位未配置时为 null，表示沿用默认模型 */
  readonly model: string | null;
  readonly reason: string;
}

/**
 * 决定某次调用用哪个档位。
 *
 * 返回 `model: null` 表示「这个档位没配模型」，调用方应回落到 `llm.model`——
 * 让一个错配的档位名变成「跑不动」，比静默用默认模型更难排查。
 */
export function routeModel(input: RouteInput): RouteDecision {
  const { config } = input;

  if (!config.enabled) {
    return { tier: 'default', model: null, reason: '路由未启用' };
  }

  // 1. 文件风险最高优先：同一维度里，碰钱碰权限的文件值得用强模型
  if (config.fileRiskThreshold > 0 && input.filePath !== null) {
    const risk = computeFileRisk(input.filePath, input.changedLines);
    if (risk.score >= config.fileRiskThreshold) {
      return pick(config, 'strong', `文件风险 ${String(risk.score)}（${risk.reasons.join('、')}）`);
    }
  }

  // 2. 规模降档默认关闭：小改动往往最需要准确判断
  if (
    config.smallChangeLines > 0 &&
    input.changedLines > 0 &&
    input.changedLines <= config.smallChangeLines
  ) {
    return pick(config, 'cheap', `改动仅 ${String(input.changedLines)} 行`);
  }

  // 3. 维度映射
  const byDimension = config.byDimension[input.reviewer];
  if (byDimension !== undefined) {
    return pick(config, byDimension, `维度 ${input.reviewer} 指定 ${byDimension}`);
  }

  return pick(config, config.defaultTier, '使用默认档位');
}

function pick(config: RoutingConfig, tier: string, reason: string): RouteDecision {
  const setting = config.tiers[tier];
  return { tier, model: setting?.model ?? null, reason };
}
