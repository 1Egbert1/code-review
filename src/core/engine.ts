/**
 * 总控：五步流程的唯一编排点（取 → 审 → 校 → 对 → 发）。
 *
 * 这个文件里**没有模型，只有调度**。三个审核员是纯函数式的调用者：给材料、拿结论、结束。
 * 它们不能自己取数据、不能决定跳过哪个文件、不能要求再跑一次。
 *
 * 一条贯穿全文件的规则：**任何单点失败都不允许拖垮整轮**。只有「取」可以整体失败——
 * 没有原材料时，后面每一步的产出都不可信，这时候报错退出比给一份半真报告好。
 */

import type { ResolvedConfig } from '../contracts/config.js';
import type { ParsedDiff, ReviewRequest } from '../contracts/diff.js';
import type { Finding, RawFinding, Rejection, ReviewerId } from '../contracts/finding.js';
import type {
  CoverageSummary,
  DiffSnapshot,
  PublishAction,
  ReviewResult,
  ReviewWarning,
  TokenUsage,
} from '../contracts/result.js';
import type { ContextBundle, ContextSegment } from '../contracts/context.js';
import { assembleContext, selectForFile } from './context/assemble.js';
import {
  buildImportSegments,
  checkSignatureChanges,
  findSignatureChanges,
} from './context/crossfile.js';
import { buildSymbolIndex } from './context/symbols.js';
import { buildLineIndex } from './diff/index-lines.js';
import {
  CHECKPOINT_VERSION,
  computeConfigHash,
  computePromptHash,
  decideCheckpoint,
} from './reconcile/checkpoint.js';
import type { CheckpointState } from './reconcile/checkpoint.js';
import { planActions } from './reconcile/plan.js';
import { routeModel } from './routing/model-route.js';
import { renderInlineBody } from './publish/render.js';
import { renderSummary } from './publish/summary.js';
import { publish } from './publish/publisher.js';
import { shouldMuteConvention } from './reviewers/dimensions/convention/index.js';
import { routeForSecurity } from './reviewers/dimensions/security/route.js';
import { correctnessReviewer } from './reviewers/dimensions/correctness/index.js';
import { securityReviewer } from './reviewers/dimensions/security/index.js';
import { conventionReviewer } from './reviewers/dimensions/convention/index.js';
import { runReviewer, sumUsage } from './reviewers/run.js';
import type { ReviewerRunResult } from './reviewers/run.js';
import type { ReviewerInput, ReviewerSpec } from './reviewers/schema.js';
import { verifyFindings } from './verify/chain.js';
import { evaluateGate, gateTitle } from './gate/gate.js';
import type { Exemption } from './gate/gate.js';
import type { CheckPort, CommentPort } from '../platforms/types.js';
import type { LlmClient } from '../providers/types.js';

const SPECS: Readonly<Record<ReviewerId, ReviewerSpec>> = {
  correctness: correctnessReviewer,
  security: securityReviewer,
  convention: conventionReviewer,
};

export interface EngineDeps {
  readonly config: ResolvedConfig;
  readonly client: LlmClient;
  /** 取数：由平台层提供；失败即整轮失败 */
  readonly fetchSnapshot: (request: ReviewRequest) => Promise<DiffSnapshot>;
  /** 写评论端口；只打印模式下传 null */
  readonly port?: CommentPort | null;
  /** 检查运行端口；不传则不写门禁结论 */
  readonly checkPort?: CheckPort | null;
  /** 已记录的豁免。豁免绑定指纹，代码一改就自动失效 */
  readonly exemptions?: readonly Exemption[];
  readonly now?: () => string;
  /** 逐条进度回调，命令行用来打印过程 */
  readonly onProgress?: (message: string) => void;
  /**
   * 检查点依赖。默认关闭；启用时必须提供 isAncestor 与 fetchIncremental，
   * 任一环节存疑就退回全量（fail-closed）。
   */
  readonly checkpoint?: {
    readonly summary: { readonly body: string; readonly author: string } | null;
    readonly expectedAuthor: string | null;
    readonly isAncestor: (previousHead: string, currentHead: string) => Promise<boolean>;
    /** 取增量改动；返回 null 或抛错都视为不可用 */
    readonly fetchIncremental: (from: string, to: string) => Promise<ParsedDiff | null>;
  };
}

interface CallTotals {
  calls: number;
  usage: TokenUsage;
}

const ZERO: TokenUsage = {
  uncachedInput: 0,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 0,
};

/**
 * 组装送审材料。
 *
 * 拿不到完整内容时**照常送审**，只是材料变少——比整轮报错好：
 * 平台对大文件不返回补丁是常态，因此丢整轮代价太大。
 */
function buildBundle(
  snapshot: DiffSnapshot,
  config: ResolvedConfig,
  filePaths: readonly string[],
): ContextBundle {
  const base = assembleContext(snapshot, {
    contextWindow: config.llm.contextWindow,
    maxOutputTokens: config.llm.maxOutputTokens,
  });

  const contents = new Map<string, string>();
  for (const [path, content] of snapshot.fileContents) {
    if (content !== null) contents.set(path, content);
  }
  if (contents.size === 0) return base;

  const index = buildSymbolIndex(contents);
  const extra: ContextSegment[] = buildImportSegments(index, filePaths, {
    depth: config.review.crossFileDepth,
    maxFiles: config.review.crossFileMaxFiles,
  });

  if (extra.length === 0) return base;
  return assembleContext(snapshot, {
    contextWindow: config.llm.contextWindow,
    maxOutputTokens: config.llm.maxOutputTokens,
    extraSegments: extra,
  });
}

/** 截断时的收缩策略：只留改动行。同一份材料重试没有意义，必须真的变少。 */
function shrinkToChangedOnly(input: {
  segments: readonly ContextSegment[];
}): readonly ContextSegment[] | null {
  const l0 = input.segments.filter((segment) => segment.tier === 'L0');
  return l0.length === input.segments.length ? null : l0;
}

export async function runReview(request: ReviewRequest, deps: EngineDeps): Promise<ReviewResult> {
  const startedAt = new Date().toISOString();
  const warnings: ReviewWarning[] = [];
  const progress = deps.onProgress ?? ((): void => {});

  // ── 取 ────────────────────────────────────────────────────────────────
  const snapshot = await deps.fetchSnapshot(request);
  let diff: ParsedDiff = snapshot.diff;

  const promptVersions = {
    correctness: correctnessReviewer.promptVersion,
    security: securityReviewer.promptVersion,
    convention: conventionReviewer.promptVersion,
  };
  const configHash = computeConfigHash(deps.config);
  const promptHash = computePromptHash(promptVersions);

  // 检查点只决定「审哪一段」，行号仍然按最新改动重算（见规格书 8.6 末段）
  if (deps.config.review.checkpoint && deps.checkpoint !== undefined) {
    const decision = await decideCheckpoint({
      enabled: true,
      summary: deps.checkpoint.summary,
      expectedAuthor: deps.checkpoint.expectedAuthor,
      current: { headSha: diff.headSha, baseSha: diff.baseSha, configHash, promptHash },
      isAncestor: deps.checkpoint.isAncestor,
    });

    if (decision.use) {
      try {
        const incremental = await deps.checkpoint.fetchIncremental(decision.from, decision.to);
        if (incremental !== null) {
          diff = incremental;
          progress(
            `检查点命中，只审 ${decision.from.slice(0, 7)}..${decision.to.slice(0, 7)} 的增量`,
          );
        } else {
          warnings.push({
            kind: 'other',
            message: '取增量改动失败，已退回全量审查',
            target: null,
          });
        }
      } catch (error) {
        warnings.push({
          kind: 'other',
          message: `取增量改动失败，已退回全量审查：${asMessage(error)}`,
          target: null,
        });
      }
    } else if (
      decision.reason === 'foreign-author' ||
      decision.reason === 'unparsable' ||
      decision.reason === 'not-ancestor' ||
      decision.reason === 'basis-changed' ||
      decision.reason === 'base-moved'
    ) {
      // 这些情况说明「本该能增量却没敢用」，用户需要知道为什么这轮又全量了
      warnings.push({ kind: 'other', message: `未使用检查点：${decision.detail}`, target: null });
    }
  }

  const index = buildLineIndex(diff);
  progress(
    `取到 ${String(diff.files.length)} 个文件，基准 ${diff.baseSha.slice(0, 7)} → ${diff.headSha.slice(0, 7)}`,
  );

  const reviewable = diff.files.filter(
    (file) => file.skippedReason === null && file.lines.length > 0,
  );
  const paths = reviewable.map((file) => file.path);

  // 跨文件索引是锦上添花：建不出来就退回单文件上下文，不能让整轮挂掉
  let bundle: ContextBundle;
  try {
    bundle = buildBundle(snapshot, deps.config, paths);
  } catch (error) {
    bundle = assembleContext(snapshot, {
      contextWindow: deps.config.llm.contextWindow,
      maxOutputTokens: deps.config.llm.maxOutputTokens,
    });
    warnings.push({
      kind: 'other',
      message: `跨文件展开失败，已退回单文件上下文：${asMessage(error)}`,
      target: null,
    });
  }

  // ── 审 ────────────────────────────────────────────────────────────────
  const collected: { raw: RawFinding; reviewer: ReviewerId }[] = [];
  const rejections: Rejection[] = [];
  const totals: CallTotals = { calls: 0, usage: ZERO };
  let completed = 0;
  let failed = 0;
  let truncatedCount = 0;
  /** 费用触顶后停止后续调用，但已得结果照常渲染 */
  let budgetExhausted = false;

  const dimensions = deps.config.review.dimensions;
  const changedByPath = new Map(diff.files.map((file) => [file.path, file.changedCount]));

  /**
   * 按维度与文件风险选模型。
   *
   * 这里每次都重算而不是缓存：它必须是确定性的纯函数，这样评论标记里记的模型
   * 与调用时用的模型永远一致——两者一旦对不上，「这条结论是哪档模型给的」就说不清了。
   */
  const modelFor = (reviewer: ReviewerId, filePath: string | null): string => {
    const decision = routeModel({
      config: deps.config.routing,
      reviewer,
      filePath,
      changedLines: filePath === null ? 0 : (changedByPath.get(filePath) ?? 0),
    });
    return decision.model ?? deps.config.llm.model;
  };

  for (const file of reviewable) {
    const segments = selectForFile(bundle, file.path);

    if (dimensions.correctness.enabled && !budgetExhausted) {
      try {
        const result = await runWithRetry(
          deps,
          SPECS.correctness,
          { file: file.path, segments },
          modelFor('correctness', file.path),
          (input) => {
            const shrunk = shrinkToChangedOnly(input);
            return shrunk === null ? null : { ...input, segments: shrunk };
          },
        );

        totals.calls += result.calls;
        totals.usage = sumUsage(totals.usage, result.usage);
        rejections.push(...result.rejections);
        if (result.truncated) truncatedCount += 1;
        for (const raw of result.findings) collected.push({ raw, reviewer: 'correctness' });
        budgetExhausted = isOverBudget(totals.usage, deps.config);
      } catch (error) {
        failed += 1;
        warnings.push({
          kind: 'other',
          message: `正确性审查失败：${asMessage(error)}`,
          target: file.path,
        });
      }
    }

    if (dimensions.security.enabled) {
      const decision = routeForSecurity({
        path: file.path,
        content: snapshot.fileContents.get(file.path) ?? null,
      });

      if (decision.send && !budgetExhausted) {
        try {
          const result = await runWithRetry(
            deps,
            SPECS.security,
            {
              file: file.path,
              segments,
              note: `安全审查原因：${decision.reasons.join('、')}`,
            },
            modelFor('security', file.path),
          );

          totals.calls += result.calls;
          totals.usage = sumUsage(totals.usage, result.usage);
          rejections.push(...result.rejections);
          if (result.truncated) truncatedCount += 1;
          for (const raw of result.findings) collected.push({ raw, reviewer: 'security' });
          budgetExhausted = isOverBudget(totals.usage, deps.config);
        } catch (error) {
          failed += 1;
          warnings.push({
            kind: 'other',
            message: `安全审查失败：${asMessage(error)}`,
            target: file.path,
          });
        }
      }
    }

    completed += 1;
  }

  // ── 第二遍：规范性（全局一次）+ 免费的跨文件规则 ──────────────────────
  if (dimensions.convention.enabled) {
    const muted = shouldMuteConvention(
      diff.files.map((file) => file.path),
      deps.config.review.respectLintConfig,
    );

    if (muted) {
      progress('检测到静态检查配置，规范性维度已静音');
    } else {
      try {
        const globalSegments = bundle.segments.filter(
          (segment) => segment.tier === 'L0' || segment.tier === 'L3',
        );
        const result = await runReviewer({
          client: deps.client,
          spec: SPECS.convention,
          input: {
            file: null,
            segments: globalSegments,
            note: '这是全局视角，请比较不同文件之间的写法是否一致',
          },
          model: modelFor('convention', null),
          temperature: deps.config.llm.temperature,
          maxOutputTokens: deps.config.llm.maxOutputTokens,
        });

        totals.calls += result.calls;
        totals.usage = sumUsage(totals.usage, result.usage);
        rejections.push(...result.rejections);
        for (const raw of result.findings) collected.push({ raw, reviewer: 'convention' });
      } catch (error) {
        warnings.push({
          kind: 'other',
          message: `规范性审查失败：${asMessage(error)}`,
          target: null,
        });
      }
    }
  }

  // 规则检查：零模型成本、100% 可复现，先于模型结论进入校验链
  const contents = new Map<string, string>();
  for (const [path, content] of snapshot.fileContents) {
    if (content !== null) contents.set(path, content);
  }
  try {
    const symbolIndex = buildSymbolIndex(contents);
    const ruleOutcome = checkSignatureChanges(findSignatureChanges(diff), symbolIndex);
    for (const raw of ruleOutcome.findings) collected.push({ raw, reviewer: 'correctness' });
  } catch (error) {
    // 这条规则是「免费得到的」，坏了不该影响主链路
    warnings.push({
      kind: 'other',
      message: `签名变化检查未执行：${asMessage(error)}`,
      target: null,
    });
  }

  // ── 校 ────────────────────────────────────────────────────────────────
  const verified = verifyFindings(collected, {
    diff,
    index,
    fileContents: snapshot.fileContents,
    severityFloors: {
      correctness: dimensions.correctness.severityFloor,
      security: dimensions.security.severityFloor,
      convention: dimensions.convention.severityFloor,
    },
    maxInline: deps.config.review.maxInlineComments,
  });
  const allRejections = [...rejections, ...verified.rejections];

  if (budgetExhausted) {
    warnings.push({
      kind: 'budget',
      message: `本轮因费用上限（$${String(deps.config.review.maxBudgetUsd)}）提前中止，结果不完整`,
      target: null,
    });
  }

  if (truncatedCount > 0) {
    warnings.push({
      kind: 'truncated',
      message: `有 ${String(truncatedCount)} 次调用因输出超长被截断，相关文件的结论可能不完整`,
      target: null,
    });
  }

  // ── 对 ────────────────────────────────────────────────────────────────
  const plan = planActions({
    findings: verified.findings,
    inline: verified.inline,
    existing: snapshot.existingComments,
    renderBody: (finding) =>
      renderInlineBody(finding, {
        promptVersion: SPECS[finding.reviewer].promptVersion,
        // 标记里记的是**实际使用的模型**：被路由降档时它与默认模型不同，
        // 这正是事后解释「为什么这条结论变了」需要的证据
        model: modelFor(finding.reviewer, finding.anchor.file),
      }),
  });

  const summaryMarkdown = renderSummary({
    findings: verified.findings,
    summaryOnly: verified.summaryOnly,
    inlineCount: verified.inline.length,
    baseSha: diff.baseSha,
    headSha: diff.headSha,
    trimmedSegments: bundle.trim.dropped.length,
    promptVersions,
    warnings: [...warnings, ...plan.warnings],
    rejectedCount: allRejections.length,
    ...(deps.config.review.checkpoint
      ? { checkpoint: buildCheckpointState(diff, configHash, promptHash) }
      : {}),
  });

  const gateOutcome = deps.config.gate.enabled
    ? evaluateGate({
        findings: verified.findings,
        config: deps.config.gate,
        exemptions: deps.exemptions ?? [],
      })
    : null;

  // ── 发 ────────────────────────────────────────────────────────────────
  if (deps.port !== null && deps.port !== undefined && !request.dryRun) {
    const outcome = await publish({
      port: deps.port,
      actions: plan.actions,
      summaryBody: deps.config.output.summary ? summaryMarkdown : null,
      resolveMode: deps.config.output.resolveMode,
      now: deps.now,
    });

    warnings.push(...outcome.warnings);
    if (outcome.summary === 'failed') {
      warnings.push({ kind: 'other', message: '摘要评论写入失败', target: null });
    }
    for (const failure of outcome.failed) {
      warnings.push({
        kind: 'other',
        message: `${failure.action} 失败：${failure.detail}`,
        target: null,
      });
    }
  }

  if (
    gateOutcome !== null &&
    deps.checkPort !== undefined &&
    deps.checkPort !== null &&
    !request.dryRun
  ) {
    const annotations = gateOutcome.blockers.slice(0, 50).map((finding) => ({
      path: finding.anchor.file,
      // 注解要求起止行都存在；删除行用旧侧行号，平台接受
      startLine: finding.anchor.newLine ?? finding.anchor.oldLine ?? 1,
      endLine: finding.anchor.newLine ?? finding.anchor.oldLine ?? 1,
      level: 'failure' as const,
      title: finding.title,
      message: finding.body,
    }));

    const result = await deps.checkPort.publish({
      name: 'AI 代码审查',
      headSha: diff.headSha,
      conclusion: gateOutcome.conclusion,
      title: gateTitle(gateOutcome),
      summary: gateOutcome.blockers
        .map((finding) => `- ${finding.anchor.file}: ${finding.title}`)
        .join('\n'),
      annotations,
    });

    if (!result.ok) {
      warnings.push({
        kind: 'permission',
        message: `写检查运行失败，本轮不会阻止合并：${result.failure.message}`,
        target: null,
      });
    }
  }

  const coverage: CoverageSummary = {
    planned: reviewable.length,
    completed,
    skipped: diff.files.length - reviewable.length,
    failed,
    reused: 0,
  };

  return {
    findings: verified.findings,
    summaryOnly: verified.summaryOnly,
    rejections: allRejections,
    actions: deps.config.output.inline
      ? plan.actions
      : plan.actions.filter((action) => action.kind !== 'create'),
    summaryMarkdown,
    coverage,
    usage: {
      calls: totals.calls,
      tokens: totals.usage,
      estimatedCostUsd: estimateCost(totals.usage, deps.config),
      truncatedByBudget: budgetExhausted,
    },
    warnings,
    gate:
      gateOutcome === null
        ? null
        : {
            conclusion: gateOutcome.conclusion,
            blockers: gateOutcome.blockers.length,
            exempted: gateOutcome.exempted.length,
            title: gateTitle(gateOutcome),
          },
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}

/** 按配置单价折算费用；未配单价时返回 null——**不得用 0 代替**，0 会让人以为免费。 */
function estimateCost(usage: TokenUsage, config: ResolvedConfig): number | null {
  const pricing = config.llm.pricing;
  if (pricing === null) return null;

  const input = pricing.inputPerMTok / 1_000_000;
  const output = pricing.outputPerMTok / 1_000_000;

  return (
    usage.uncachedInput * input +
    usage.cacheWriteShort * input * pricing.cacheWriteShortMultiplier +
    usage.cacheWriteLong * input * pricing.cacheWriteLongMultiplier +
    usage.cacheRead * input * pricing.cacheReadMultiplier +
    usage.output * output
  );
}

/**
 * 结构性失败的兜底重试。
 *
 * 只对「输出无法解析 / 缺少 findings 数组」重试一次——这类失败常常是模型偶发的格式抖动，
 * 再问一次往往就好了。**截断不在此列**，它已经在审核员内部按「缩材料重试一次」处理过，
 * 再重试同一份材料必然是同样的结果。
 */
async function runWithRetry(
  deps: EngineDeps,
  spec: ReviewerSpec,
  input: ReviewerInput,
  model: string,
  shrink?: (input: ReviewerInput) => ReviewerInput | null,
): Promise<ReviewerRunResult> {
  const call = (): Promise<ReviewerRunResult> =>
    runReviewer({
      client: deps.client,
      spec,
      input,
      model,
      temperature: deps.config.llm.temperature,
      maxOutputTokens: deps.config.llm.maxOutputTokens,
      shrink,
    });

  const first = await call();
  const structural = first.rejections.some(
    (rejection) => rejection.title === '(输出无法解析)' || rejection.title === '(整批)',
  );
  if (!structural || first.findings.length > 0) return first;

  const second = await call();
  return {
    ...second,
    calls: first.calls + second.calls,
    usage: sumUsage(first.usage, second.usage),
  };
}

function buildCheckpointState(
  diff: ParsedDiff,
  configHash: string,
  promptHash: string,
): CheckpointState {
  return {
    version: CHECKPOINT_VERSION,
    headSha: diff.headSha,
    baseSha: diff.baseSha,
    configHash,
    promptHash,
    reviewedAt: new Date().toISOString(),
  };
}

/** 累计费用是否已超上限。未配单价时无法判定，一律视为未超。 */
function isOverBudget(usage: TokenUsage, config: ResolvedConfig): boolean {
  const cost = estimateCost(usage, config);
  return cost !== null && cost > config.review.maxBudgetUsd;
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 只打印模式下的输出：让人看清「如果真发会发出什么」。 */
export function describeActions(actions: readonly PublishAction[]): string[] {
  return actions
    .filter((action) => action.kind !== 'keep')
    .map((action) => {
      if (action.kind === 'create') {
        return `+ ${action.finding.anchor.file}:${String(action.finding.anchor.newLine ?? action.finding.anchor.oldLine ?? 0)} ${action.finding.title}`;
      }
      if (action.kind === 'replace') return `~ ${action.finding.title}`;
      return `✓ 标记已修复 ${action.commentId}`;
    });
}

/** 供命令行统计使用：定位来源分布。 */
export function positionOriginCounts(findings: readonly Finding[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const finding of findings) {
    counts[finding.positionOrigin] = (counts[finding.positionOrigin] ?? 0) + 1;
  }
  return counts;
}
