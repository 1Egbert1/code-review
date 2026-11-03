/**
 * 摘要评论渲染。
 *
 * 摘要的价值不在「又列了一遍意见」，而在做行内评论做不到的三件事：
 *
 * 1. **把「不是本次引入的」单列一区**。否则作者会以为存量问题是他写的，第一反应是抵触。
 * 2. **交代本轮的限制**（裁剪了多少上下文、预算是否触顶）。结论变窄时用户得知道为什么。
 * 3. **让下一轮的差异可追溯**：对比基准、提示词版本都写进来，否则「这次为什么少报了一条」
 *    只能靠猜。
 */

import type { Finding, ReviewerId, Severity } from '../../contracts/finding.js';
import type { ReviewWarning } from '../../contracts/result.js';
import { renderCheckpoint } from '../reconcile/checkpoint.js';
import type { CheckpointState } from '../reconcile/checkpoint.js';
import { SUMMARY_MARKER } from '../reconcile/markers.js';
import { REVIEWER_LABEL, severityLabel } from './render.js';

/** 统计用的严重度顺序：重的在前。 */
const SEVERITY_ORDER: readonly Severity[] = ['blocker', 'major', 'minor', 'nit'];

export interface SummaryInput {
  /** 本轮全部通过校验的条目 */
  readonly findings: readonly Finding[];
  /** 只进摘要的条目 */
  readonly summaryOnly: readonly Finding[];
  /** 已贴在行内的条数 */
  readonly inlineCount: number;
  readonly baseSha: string;
  readonly headSha: string;
  /** 因预算被裁剪的上下文段数 */
  readonly trimmedSegments: number;
  /** 各维度实际使用的提示词版本 */
  readonly promptVersions: Readonly<Partial<Record<ReviewerId, string>>>;
  readonly warnings: readonly ReviewWarning[];
  /** 被校验拦下的条数，只报数不列明细 */
  readonly rejectedCount: number;
  /** 启用检查点时写入本轮覆盖到的提交，供下一轮做增量 */
  readonly checkpoint?: CheckpointState;
}

function countBySeverity(findings: readonly Finding[]): Map<Severity, number> {
  const counts = new Map<Severity, number>();
  for (const finding of findings) {
    counts.set(finding.severity, (counts.get(finding.severity) ?? 0) + 1);
  }
  return counts;
}

function formatLocation(finding: Finding): string {
  const { anchor } = finding;
  const line = anchor.kind === 'removed' ? anchor.oldLine : anchor.newLine;
  return `\`${anchor.file}${line === null ? '' : `:${String(line)}`}\``;
}

function bulletList(findings: readonly Finding[]): string[] {
  return findings.map((finding) => `- ${formatLocation(finding)} ${finding.title}`);
}

/** 渲染完整摘要。段落顺序固定，便于用户形成阅读习惯。 */
export function renderSummary(input: SummaryInput): string {
  const blocks: string[] = [];

  blocks.push('## 本次改动审查');

  const counts = countBySeverity(input.findings);
  if (input.findings.length === 0) {
    blocks.push('本次改动未发现问题。');
  } else {
    const rows = SEVERITY_ORDER.filter((severity) => (counts.get(severity) ?? 0) > 0).map(
      (severity) => `| ${severityLabel(severity)} | ${String(counts.get(severity) ?? 0)} |`,
    );
    blocks.push(['| 严重度 | 条数 |', '| --- | --- |', ...rows].join('\n'));
    blocks.push(
      input.inlineCount > 0
        ? `已贴在改动行的意见见上方行内评论（${String(input.inlineCount)} 条）。`
        : '本轮没有可贴在改动行的意见。',
    );
  }

  const preexisting = input.summaryOnly.filter((finding) => finding.preexisting);
  const introduced = input.summaryOnly.filter((finding) => !finding.preexisting);

  if (introduced.length > 0) {
    blocks.push(
      ['## 其他问题（本次改动引入，但不宜行内评论）', ...bulletList(introduced)].join('\n'),
    );
  }

  if (preexisting.length > 0) {
    // 这一区的标题必须明确写「不是本次改动引入」，否则作者会当成对他新代码的指责
    blocks.push(['## 顺带发现（**不是本次改动引入**）', ...bulletList(preexisting)].join('\n'));
  }

  const notes: string[] = [`- 对比基准：\`${input.baseSha}\` → \`${input.headSha}\``];
  if (input.trimmedSegments > 0) {
    notes.push(`- 因预算裁剪了 ${String(input.trimmedSegments)} 处上下文，结论可能偏窄`);
  }
  const versions = Object.entries(input.promptVersions)
    .map(([reviewer, version]) => `${REVIEWER_LABEL[reviewer as ReviewerId]} ${version ?? ''}`)
    .join(' / ');
  if (versions !== '') notes.push(`- 提示词版本：${versions}`);

  if (input.rejectedCount > 0) {
    notes.push(`- 有 ${String(input.rejectedCount)} 条结论未通过校验（行号或证据对不上），已丢弃`);
  }
  for (const warning of input.warnings) {
    notes.push(`- ${warning.message}`);
  }

  blocks.push(['## 本轮说明', ...notes].join('\n'));
  if (input.checkpoint !== undefined) blocks.push(renderCheckpoint(input.checkpoint));
  blocks.push(SUMMARY_MARKER);

  return blocks.join('\n\n');
}
