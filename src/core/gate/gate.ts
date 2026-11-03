/**
 * 门禁：决定「这一轮要不要阻止合并」。
 *
 * 这是整个产品里唯一会挡住人的地方，所以判定必须**保守且可解释**：
 *
 * - 阻塞条件是**合取**，缺一条就只做 advisory。最廉价的动作就是给问题标一个「致命」，
 *   拿它当唯一条件，等于把门禁交给模型的措辞习惯。
 * - 规则算出来的事实（签名改了没改调用方）可以阻塞：那是客观事实，不是观点。
 * - 被阻塞时必须能申诉。没有申诉通道的门禁一定会被绕过——要么关功能，要么改权限。
 *
 * 豁免绑定的是**指纹**，而指纹包含证据文本、不含行号。这带来一个不需要任何清理逻辑的性质：
 * 代码一改，指纹就变，豁免自动失效。
 */

import type { GateConfig } from '../../contracts/config.js';
import type { Finding, Severity } from '../../contracts/finding.js';

/** 一条豁免记录。 */
export interface Exemption {
  readonly fingerprint: string;
  readonly reason: string;
  readonly by: string;
  readonly at: string;
}

export interface GateDecision {
  /** 是否阻塞合并 */
  readonly block: boolean;
  /** 阻塞原因；不阻塞时为 null */
  readonly reason: string | null;
}

export interface GateOutcome {
  /** 检查运行的结论 */
  readonly conclusion: 'success' | 'failure' | 'neutral';
  readonly blockers: readonly Finding[];
  /** 本可以阻塞但被豁免的条目，进报告统计 */
  readonly exempted: readonly Finding[];
  /** 本可以阻塞但条件不足（置信度、类别不符）的条目，用于解释「为什么没挡住」 */
  readonly demoted: readonly { readonly finding: Finding; readonly reason: string }[];
}

function severityRank(severity: Severity): number {
  return ['blocker', 'major', 'minor', 'nit'].indexOf(severity);
}

/** 单条判定。 */
export function decideGate(
  finding: Finding,
  config: GateConfig,
  isRuleFact: boolean,
  exemptions: readonly Exemption[],
): GateDecision {
  if (!config.enabled) return { block: false, reason: '门禁未启用' };

  if (severityRank(finding.severity) > severityRank(config.blockingSeverity)) {
    return { block: false, reason: `严重度 ${finding.severity} 未达阻塞门槛` };
  }

  if (!config.blockingCategories.includes(finding.category)) {
    return { block: false, reason: `类别不在允许阻塞的范围（${finding.category}）` };
  }

  // 规则事实不看置信度；模型结论必须过门槛
  if (!isRuleFact && finding.confidence < config.confidenceThreshold) {
    return {
      block: false,
      reason: `置信度 ${finding.confidence.toFixed(2)} 低于门槛 ${String(config.confidenceThreshold)}`,
    };
  }

  if (exemptions.some((exemption) => exemption.fingerprint === finding.fingerprint)) {
    return { block: false, reason: '已豁免' };
  }

  return { block: true, reason: `严重度 ${finding.severity} + 类别 ${finding.category}` };
}

export interface GateInput {
  readonly findings: readonly Finding[];
  readonly config: GateConfig;
  readonly exemptions: readonly Exemption[];
  /** 规则类事实的指纹集合；这些条目不受置信度门槛约束 */
  readonly ruleFingerprints?: ReadonlySet<string>;
}

/** 汇总判定。 */
export function evaluateGate(input: GateInput): GateOutcome {
  if (!input.config.enabled) {
    return { conclusion: 'neutral', blockers: [], exempted: [], demoted: [] };
  }

  const blockers: Finding[] = [];
  const exempted: Finding[] = [];
  const demoted: { finding: Finding; reason: string }[] = [];

  for (const finding of input.findings) {
    // 规则事实不看置信度：确定性代码没有「把握」这回事，它只有对与错
    const ruleFact = input.ruleFingerprints?.has(finding.fingerprint) ?? false;
    const decision = decideGate(finding, input.config, ruleFact, input.exemptions);

    if (decision.block) {
      blockers.push(finding);
      continue;
    }

    if (decision.reason === '已豁免') {
      exempted.push(finding);
      continue;
    }

    // 只记录「本可以挡但差一点」的，避免把普通问题也算进 demoted
    if (severityRank(finding.severity) <= severityRank(input.config.blockingSeverity)) {
      demoted.push({ finding, reason: decision.reason ?? '未达阻塞条件' });
    }
  }

  return {
    conclusion: blockers.length > 0 ? 'failure' : 'success',
    blockers,
    exempted,
    demoted,
  };
}

/** 门禁结果的一句话摘要，用于检查运行的标题。 */
export function gateTitle(outcome: GateOutcome): string {
  if (outcome.blockers.length === 0) {
    return outcome.exempted.length > 0
      ? `通过（${String(outcome.exempted.length)} 条已豁免）`
      : '通过';
  }
  return `阻止合并：${String(outcome.blockers.length)} 个致命问题`;
}
