/**
 * 上下文装配：把「取的快照」变成「喂给审核员的一堆段」。
 *
 * 三个约束：
 *
 * 1. **预算是全局算的，不是每个文件各算一份。** 仓库约定、依赖清单这类材料被所有文件共用，
 *    若按文件重复计入预算，会被算成 N 倍，把预算迅速吃光。
 * 2. **按文件取用时再切。** {@link selectForFile} 从同一个全局结果里切出单文件视图，
 *    保证第一遍（逐文件）与第二遍（全局）看到的是同一份材料。
 * 3. **裁剪必须留痕。** {@link ContextBundle.trim} 会进最终报告，用户能看到「这次砍了什么」。
 */

import type { ContextSegment } from '../../contracts/context.js';
import type { ContextBundle } from '../../contracts/context.js';
import type { DiffSnapshot } from '../../contracts/result.js';
import { applyBudget } from './budget.js';
import { buildFileSegments } from './tiers.js';
import { estimateTokens } from './tokens.js';

export interface AssembleOptions {
  /** 模型的上下文窗口 */
  readonly contextWindow: number;
  /** 为输出预留的 token 数 */
  readonly maxOutputTokens: number;
  /** 提示词模板本身的固定开销，默认 2500 */
  readonly promptOverheadTokens?: number;
  /** 输入可用比例，默认 0.7（其余留给输出抖动与协议开销） */
  readonly inputRatio?: number;
  /** 单文件 L4 最多给多少行，默认 400 */
  readonly l4MaxLines?: number;
  /** 跨文件展开产出的段（L2），由 T-07 注入 */
  readonly extraSegments?: readonly ContextSegment[];
}

/** 计算本次可用于上下文的 token 预算。 */
export function computeBudget(options: AssembleOptions): number {
  const ratio = options.inputRatio ?? 0.7;
  const overhead = options.promptOverheadTokens ?? 2500;
  const raw = Math.floor((options.contextWindow - options.maxOutputTokens) * ratio) - overhead;
  return Math.max(0, raw);
}

/**
 * 装配全局上下文。
 *
 * 被跳过的文件（`skippedReason` 非空）不产出任何段——它们的 `lines` 本来就是空的，
 * 放进去只会占预算而没有任何信息。
 */
export function assembleContext(snapshot: DiffSnapshot, options: AssembleOptions): ContextBundle {
  const segments: ContextSegment[] = [];

  for (const file of snapshot.diff.files) {
    if (file.skippedReason !== null) continue;
    const content = snapshot.fileContents.get(file.path) ?? null;
    segments.push(...buildFileSegments(file, content, { l4MaxLines: options.l4MaxLines ?? 400 }));
  }

  // L3：仓库约定。属于整个仓库，path 为 null
  if (snapshot.conventions !== null && snapshot.conventions.trim() !== '') {
    segments.push({
      tier: 'L3',
      path: null,
      title: '仓库约定（贡献指南）',
      content: snapshot.conventions,
      estimatedTokens: estimateTokens(snapshot.conventions),
    });
  }

  // 依赖清单与构建配置放在 L2 而不是 L3。
  // 理由：安全审核缺了它会明显降质（例如判断不出哪些环境变量会被打进前端产物），
  // 不该和「可选的仓库约定」一起最先被砍。
  if (snapshot.buildContext !== null && snapshot.buildContext.trim() !== '') {
    segments.push({
      tier: 'L2',
      path: null,
      title: '依赖清单与构建配置（安全审核依据）',
      content: snapshot.buildContext,
      estimatedTokens: estimateTokens(snapshot.buildContext),
    });
  }

  if (options.extraSegments !== undefined) {
    segments.push(...options.extraSegments);
  }

  return applyBudget(segments, {
    budgetTokens: computeBudget(options),
    reservedTokens: options.promptOverheadTokens ?? 2500,
  });
}

/**
 * 从全局上下文里切出「审这个文件」需要的段。
 *
 * 单文件视图 = 该文件的段 + 全部仓库级段（path 为 null）。
 * 仓库级段被每个文件共用，这正是预算必须全局算的原因。
 */
export function selectForFile(bundle: ContextBundle, path: string): ContextSegment[] {
  return bundle.segments.filter((segment) => segment.path === null || segment.path === path);
}

/** 本轮实际送给模型的 token 估算，用于结束统计里的「输入」一栏。 */
export function estimateBundleTokens(bundle: ContextBundle): number {
  return bundle.segments.reduce((sum, segment) => sum + segment.estimatedTokens, 0);
}
