/**
 * 结束统计。
 *
 * 这一屏信息比评论本身更有价值：它回答「这次到底做了什么、哪些没做成、为什么」。
 *
 * 两组数字不能省：
 * - **定位来源分布**：模型行号占绝大多数说明提示词里的行号指示有效；证据反查很多说明模型
 *   在数行号上不可靠，正在靠兜底——那就该去改提示词，而不是继续依赖兜底。
 * - **丢弃原因**：它是排查问题的唯一入口。证据不存在多 = 模型在编造；命中多处多 = 改动里
 *   有大量重复代码。
 */

import type { Finding, RejectionReason } from '../contracts/finding.js';
import type { ReviewResult } from '../contracts/result.js';
import { formatUsd } from '../core/cost/pricing.js';
import type { BaselineComparison } from '../core/eval/baseline.js';

const ORIGIN_LABEL: Readonly<Record<string, string>> = {
  'model-line': '模型行号',
  'evidence-hunk': '证据块内',
  'evidence-file': '证据全文',
  'evidence-crossfile': '跨文件搬移',
};

const REASON_LABEL: Readonly<Record<RejectionReason, string>> = {
  'file-not-in-diff': '文件不在改动中',
  'evidence-mismatch': '证据不存在',
  unlocatable: '证据命中多处',
  'schema-invalid': '输出不合规范',
  duplicate: '重复',
  'below-severity-floor': '低于严重度下限',
};

export interface StatsInput {
  readonly result: ReviewResult;
  readonly files: number;
  readonly dryRun: boolean;
}

function formatTokens(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1)}k`;
}

function costLine(result: ReviewResult): string {
  const cost = result.usage.estimatedCostUsd;
  if (cost === null) return '费用：未配置单价，无法折算';
  // 金额很小，保留四位有效数字才有意义
  return `≈ $${cost.toFixed(4)}`;
}

function originSection(findings: readonly Finding[]): string {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    counts.set(finding.positionOrigin, (counts.get(finding.positionOrigin) ?? 0) + 1);
  }
  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([origin, count]) => `${ORIGIN_LABEL[origin] ?? origin} ${String(count)}`);

  return `定位来源：${parts.length === 0 ? '（无）' : parts.join('，')}`;
}

/**
 * 丢弃记录。
 *
 * `verbose` 为真时输出每条明细。这不是「调试日志」——dry-run 的核心用途就是
 * 回答「它为什么没报出我看到的问题」，没有明细的时候，这句话只能靠猜。
 */
function rejectionSection(result: ReviewResult, verbose: boolean): string[] {
  if (result.rejections.length === 0) return [];

  const counts = new Map<RejectionReason, number>();
  for (const rejection of result.rejections) {
    counts.set(rejection.reason, (counts.get(rejection.reason) ?? 0) + 1);
  }

  const detail = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${REASON_LABEL[reason]} ${String(count)}`)
    .join('，');

  const lines = [`丢弃 ${String(result.rejections.length)} 条`, `  丢弃原因：${detail}`];

  if (verbose) {
    for (const rejection of result.rejections.slice(0, 10)) {
      const where = `${rejection.file}:${String(rejection.line)}`;
      lines.push(`  · [${rejection.reviewer}] ${where} ${rejection.title.slice(0, 50)}`);
      lines.push(`    原因：${rejection.detail}`);
    }
    if (result.rejections.length > 10) {
      lines.push(`  · 另有 ${String(result.rejections.length - 10)} 条未列出`);
    }
  }

  return lines;
}

/** 生成结束统计。纯函数，便于对着固定输入断言。 */
export function formatStats(input: StatsInput): string {
  const { result } = input;
  const tokens = result.usage.tokens;
  const routed = result.summaryOnly.filter((finding) => finding.scope === 'changed').length;

  const lines: string[] = [];

  lines.push(
    `文件 ${String(input.files)} 个 / 调用 ${String(result.usage.calls)} 次 / 输入 ${formatTokens(
      tokens.uncachedInput + tokens.cacheRead + tokens.cacheWriteShort + tokens.cacheWriteLong,
    )} tok 输出 ${formatTokens(tokens.output)} tok ${costLine(result)}`,
  );

  lines.push(
    `行内 ${String(result.actions.filter((action) => action.kind === 'create').length)} 条，摘要 ${String(
      result.summaryOnly.length,
    )} 条${routed > 0 ? `（其中 ${String(routed)} 条因行内已满被路由）` : ''}`,
  );

  // 成本构成：只报总额看不出省在哪
  if (
    tokens.uncachedInput + tokens.cacheRead + tokens.cacheWriteShort + tokens.cacheWriteLong >
    0
  ) {
    lines.push(
      `token 构成：未缓存 ${formatTokens(tokens.uncachedInput)} / 缓存读 ${formatTokens(tokens.cacheRead)} / 缓存写 ${formatTokens(
        tokens.cacheWriteShort + tokens.cacheWriteLong,
      )} / 输出 ${formatTokens(tokens.output)}`,
    );
  }

  if (result.usage.breakdown !== null) {
    const parts = [
      ['未缓存', result.usage.breakdown.uncachedInput],
      ['缓存写', result.usage.breakdown.cacheWriteShort + result.usage.breakdown.cacheWriteLong],
      ['缓存读', result.usage.breakdown.cacheRead],
      ['输出', result.usage.breakdown.output],
    ]
      .filter(([, value]) => (value as number) > 0)
      .map(([label, value]) => `${String(label)} ${formatUsd(value as number)}`);

    lines.push(`成本构成：${parts.join(' · ')}`);
  }

  lines.push(originSection(result.findings));
  lines.push(...rejectionSection(result, input.dryRun));

  // 这句必须打印：让用户知道超限只是换了位置，没有任何通过校验的条目被丢弃
  lines.push('行内 + 摘要合计未丢任何通过校验的条目');

  lines.push(
    `覆盖率：计划 ${String(result.coverage.planned)} / 完成 ${String(result.coverage.completed)} / 跳过 ${String(result.coverage.skipped)}`,
  );

  if (result.warnings.length > 0) {
    lines.push(`告警 ${String(result.warnings.length)} 条：`);
    for (const warning of result.warnings) {
      lines.push(`  · [${warning.kind}] ${warning.message}`);
    }
  }

  if (input.dryRun) {
    lines.push('');
    lines.push('（只打印模式：以上内容未发送到平台）');
  }

  return lines.join('\n');
}

/** 基准对比的可读输出。 */
export function formatComparison(comparison: BaselineComparison): string {
  if (!comparison.comparable) return `无法对比：${comparison.reason}`;

  const lines: string[] = [];
  lines.push('指标          基准        本次        变化');

  for (const metric of comparison.metrics) {
    const format = (value: number): string =>
      metric.name.includes('延迟')
        ? `${(value / 1000).toFixed(1)}s`
        : metric.name.includes('成本')
          ? formatUsd(value)
          : value.toFixed(3);

    const arrow = metric.delta === 0 ? '—' : metric.delta > 0 ? '↑' : '↓';
    lines.push(
      `${metric.name.padEnd(10, ' ')}  ${format(metric.before).padStart(8, ' ')}  ${format(metric.after).padStart(8, ' ')}  ${arrow} ${format(
        Math.abs(metric.delta),
      )}`,
    );
  }

  if (comparison.changedPrompts.length > 0) {
    lines.push(`\n变更的维度：${comparison.changedPrompts.join('、')}`);
  }
  if (comparison.crossModel) {
    lines.push('注意：两次使用的模型不同，结论仅供参考');
  }

  lines.push(`\n结论：${comparison.verdict}`);
  return lines.join('\n');
}
