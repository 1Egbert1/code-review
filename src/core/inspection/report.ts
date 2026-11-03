/**
 * 巡检报告渲染。
 *
 * 结构不是审美问题，是**阅读顺序问题**。用户打开报告只想知道三件事：
 * 有没有必须马上处理的、这周该做什么、项目在变好还是变坏。分数排在最后。
 *
 * 一份「你的项目 71 分」的报告没人会看；一份「掉了 5 分，主要掉在依赖健康」的报告
 * 才会有人去处理。所以趋势段必须写清「降在哪一项」，而不是只给总分差。
 */

import type { Finding, Severity } from '../../contracts/finding.js';
import type { InspectionReport, ScoreDimension } from '../../contracts/inspection.js';
import { formatUsd } from '../cost/pricing.js';

const DIMENSION_LABEL: Readonly<Record<ScoreDimension, string>> = {
  complexity: '复杂度',
  duplication: '重复度',
  dependency: '依赖健康',
  'type-safety': '类型安全',
  test: '测试',
};

const SEVERITY_LABEL: Readonly<Record<Severity, string>> = {
  blocker: '严重',
  major: '主要',
  minor: '次要',
  nit: '提示',
};

/** 上一期的关键数字，用于趋势段。 */
export interface PreviousSnapshot {
  readonly totalScore: number;
  readonly scores: Readonly<Record<ScoreDimension, number>>;
  readonly reference: string;
}

export interface RenderReportOptions {
  /** 上一期数据；首期为 null */
  readonly previous?: PreviousSnapshot | null;
  /** 「最该做的三件事」；不传时按扣分从多到少自动生成 */
  readonly actions?: readonly string[];
  /** 报告里最多展开多少条明细，默认 20 */
  readonly maxListed?: number;
}

function location(finding: Finding): string {
  const line = finding.anchor.kind === 'removed' ? finding.anchor.oldLine : finding.anchor.newLine;
  return `\`${finding.anchor.file}${line === null ? '' : `:${String(line)}`}\``;
}

function bySeverity(findings: readonly Finding[], severity: Severity): Finding[] {
  return findings.filter((finding) => finding.severity === severity);
}

/** 分数明细表：每维一行，并把扣分项列在下面。 */
function scoreSection(report: InspectionReport): string[] {
  const blocks: string[] = ['## 分数明细（可核对）'];

  const header = ['| 维度 | 得分 | 扣分明细 |', '| --- | --- | --- |'];
  const rows = report.breakdown.map((item) => {
    const detail = item.items
      .filter((entry) => entry.deduction > 0)
      .map(
        (entry) =>
          `${entry.label} ${entry.actual}（阈值 ${entry.threshold}）−${String(entry.deduction)}`,
      )
      .join('<br>');
    return `| ${DIMENSION_LABEL[item.dimension]} | ${String(item.score)} / ${String(item.maxScore)} | ${detail === '' ? '—' : detail} |`;
  });

  blocks.push([...header, ...rows].join('\n'));
  blocks.push(
    `> 总分 = Σ（各维得分 ÷ 满分 × 权重）。当前权重：${report.breakdown
      .map((item) => `${DIMENSION_LABEL[item.dimension]} ${String(item.weight)}%`)
      .join('、')}`,
  );

  return blocks;
}

/** 趋势段：只说「变了多少、变在哪」，不复述全量。 */
function trendSection(report: InspectionReport, previous: PreviousSnapshot | null): string[] {
  if (previous === null) return [];

  const delta = report.totalScore - previous.totalScore;
  const arrow = delta === 0 ? '持平' : delta > 0 ? `↑${String(delta)}` : `↓${String(-delta)}`;

  const changed = report.breakdown
    .map((item) => ({
      dimension: item.dimension,
      diff: item.score - (previous.scores[item.dimension] ?? item.score),
    }))
    .filter((entry) => entry.diff !== 0)
    .sort((a, b) => a.diff - b.diff)
    .map(
      (entry) =>
        `${DIMENSION_LABEL[entry.dimension]} ${entry.diff > 0 ? '+' : '−'}${String(Math.abs(entry.diff))}`,
    );

  const lines = [
    `## 与上次对比`,
    '',
    `总分 ${String(previous.totalScore)} → ${String(report.totalScore)}（${arrow}）`,
  ];

  if (changed.length > 0) lines.push('', `变化来自：${changed.join('、')}`);
  if (report.regressions.length > 0)
    lines.push('', `新增或恶化 ${String(report.regressions.length)} 项`);
  if (report.resolved.length > 0) lines.push(`已修复 ${String(report.resolved.length)} 项`);

  return lines;
}

/** 「最该做的三件事」：不传就按扣分排序，保证一定有内容且可复现。 */
function actionsSection(report: InspectionReport, explicit?: readonly string[]): string[] {
  if (explicit !== undefined && explicit.length > 0) {
    return [
      '## 这个月最该做的三件事',
      '',
      ...explicit.map((text, index) => `${String(index + 1)}. ${text}`),
    ];
  }

  const ranked = report.breakdown
    .map((item) => ({
      dimension: item.dimension,
      lost: item.maxScore - item.score,
      worst: [...item.items].sort((a, b) => b.deduction - a.deduction)[0],
    }))
    .filter((entry) => entry.lost > 0)
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 3);

  if (ranked.length === 0)
    return ['## 这个月最该做的三件事', '', '各项指标都在阈值内，保持现状即可。'];

  return [
    '## 这个月最该做的三件事',
    '',
    ...ranked.map(
      (entry, index) =>
        `${String(index + 1)}. **${DIMENSION_LABEL[entry.dimension]}**：${entry.worst?.label ?? ''} ${entry.worst?.actual ?? ''}（阈值 ${entry.worst?.threshold ?? ''}）`,
    ),
  ];
}

/** 渲染完整报告。六段顺序固定，便于用户形成阅读习惯。 */
export function renderReport(report: InspectionReport, options: RenderReportOptions = {}): string {
  const blocks: string[] = [];
  const maxListed = options.maxListed ?? 20;
  const blockers = [
    ...bySeverity(report.findings, 'blocker'),
    ...bySeverity(report.findings, 'major'),
  ];
  const suggestions = bySeverity(report.findings, 'minor');
  const rest = [...bySeverity(report.findings, 'nit')];

  blocks.push(
    [
      `# 代码巡检报告 · ${report.inspectedAt.slice(0, 10)}`,
      '',
      `**仓库** ${report.repository} **提交** \`${report.commitSha.slice(0, 7)}\``,
      `**总分 ${String(report.totalScore)} / 100** **问题 ${String(report.findings.length)} 个**（严重 ${String(
        report.counts.blocker,
      )} · 主要 ${String(report.counts.major)} · 次要 ${String(report.counts.minor)}）`,
    ].join('\n'),
  );

  if (blockers.length === 0) {
    blocks.push('## 必须先处理\n\n本轮没有发现需要立即处理的问题。');
  } else {
    blocks.push(
      [
        '## 必须先处理',
        '',
        ...blockers
          .slice(0, maxListed)
          .map((finding, index) =>
            [
              `### ${String(index + 1)}. ${finding.title}`,
              `${location(finding)} · ${SEVERITY_LABEL[finding.severity]} · ${finding.category}`,
              '',
              finding.body,
            ].join('\n'),
          ),
      ].join('\n\n'),
    );
  }

  if (suggestions.length > 0) {
    const rows = suggestions
      .slice(0, maxListed)
      .map((finding) => `| ${location(finding)} | ${finding.title} | ${finding.category} |`);
    blocks.push(
      [
        '## 建议本次迭代处理',
        '',
        ['| 位置 | 问题 | 类别 |', '| --- | --- | --- |', ...rows].join('\n'),
      ].join('\n'),
    );
  }

  if (rest.length > 0) {
    const listed = rest.slice(0, maxListed);
    blocks.push(
      [
        `## 其余（${String(rest.length)} 项）`,
        '',
        '<details>',
        '<summary>展开查看</summary>',
        '',
        ...listed.map((finding) => `- ${location(finding)} ${finding.title}`),
        ...(rest.length > listed.length
          ? ['', `另有 ${String(rest.length - listed.length)} 项未列出`]
          : []),
        '',
        '</details>',
      ].join('\n'),
    );
  }

  blocks.push(scoreSection(report).join('\n\n'));
  blocks.push(trendSection(report, options.previous ?? null).join('\n'));
  blocks.push(actionsSection(report, options.actions).join('\n'));

  return blocks.filter((block) => block.trim() !== '').join('\n\n') + '\n';
}

/** 报告用的成本说明（若有）。 */
export function formatInspectionCost(total: number | null): string {
  return total === null ? '费用：未配置单价，无法折算' : `巡检花费 ≈ ${formatUsd(total)}`;
}
