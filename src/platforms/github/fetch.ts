/**
 * 「取」这一步：把一次审查需要的原材料拿回来，并组装成 {@link DiffSnapshot}。
 *
 * 分两个子步骤，边界必须清楚：
 * 1. 调平台接口拿文本（本文件上半部分）——平台相关，靠网关抽象，测试用假实现；
 * 2. 把文本解析成行结构（parse.ts）——平台无关，纯函数。
 *
 * 接口只给 unified diff 文本，不给行结构；行结构得自己算，这不是重复劳动。
 */

import type {
  DiffFile,
  DiffSnapshot,
  ExistingComment,
  ReviewWarning,
} from '../../contracts/index.js';
import { parseMarker } from '../../core/reconcile/markers.js';
import { matchesAny } from '../../core/path-glob.js';
import { parsePatch } from '../../core/diff/parse.js';

import type {
  GitHubGateway,
  PullRequestRef,
  RawFileChange,
  RawReviewComment,
  RepoRef,
} from './client.js';

/** 取数的完整结果：快照 + 过程中产生的告警。 */
export interface SnapshotResult {
  readonly snapshot: DiffSnapshot;
  readonly warnings: readonly ReviewWarning[];
}

/** 把平台的原始状态值映射成我们的四种状态。 */
function mapStatus(raw: string): DiffFile['status'] {
  switch (raw) {
    case 'added':
    case 'copied':
      return 'added';
    case 'removed':
      return 'deleted';
    case 'renamed':
      return 'renamed';
    default:
      // modified / changed / unchanged 一律按修改处理
      return 'modified';
  }
}

/** 平台评论 → 我们认识的已有评论。 */
function toExistingComment(raw: RawReviewComment): ExistingComment {
  return {
    commentId: raw.id,
    // 解析不出标记就是别人发的，后续任何生命周期操作都不能碰它
    marker: parseMarker(raw.body),
    line: raw.line,
    side: raw.side === 'LEFT' ? 'old' : 'new',
    path: raw.path,
    // SPEC-GAP：平台不同接口才给这两个状态，T-05 先固定为 false，
    // 由 T-12（生命周期比对）补上真实读取。
    resolved: false,
    outdated: false,
  };
}

/**
 * 组装单个文件的改动。
 *
 * 跳过优先级：用户配置的跳过清单 > 平台给出的跳过原因（二进制 / 未提供补丁）。
 * 两者都保留在 skippedReason 里，便于统计时区分「为什么没审这个文件」。
 */
function toDiffFile(raw: RawFileChange, skipPaths: readonly string[]): DiffFile {
  const status = mapStatus(raw.status);

  const parsed = parsePatch(raw.patch, {
    path: raw.filename,
    // 只有重命名与修改才有旧路径意义；新增文件的旧路径应为 null
    oldPath: status === 'renamed' ? raw.previousFilename : null,
    status,
  });

  if (matchesAny(raw.filename, skipPaths)) {
    return { ...parsed, skippedReason: '命中跳过清单' };
  }

  return parsed;
}

/**
 * 取数并组装快照。
 *
 * 失败策略（规格书 11 章）：
 * - 列文件失败 → 抛出，由调用方判定整轮失败（没有原材料，后续都不可信）
 * - 单文件取内容失败 → 该文件内容记为 null，不影响其他文件
 * - 已有评论读取失败 → 按「无历史」处理并告警（会导致本轮重复发评论，必须让人看见）
 *
 * @param skipPaths 跳过清单，命中则标为跳过但仍计入改动
 */
export async function fetchSnapshot(
  gateway: GitHubGateway,
  ref: PullRequestRef,
  headSha: string,
  skipPaths: readonly string[] = [],
  baseSha = '',
): Promise<SnapshotResult> {
  const warnings: ReviewWarning[] = [];

  const rawFiles = await gateway.listPullRequestFiles(ref);
  const files = rawFiles.map((raw) => toDiffFile(raw, skipPaths));

  const fileContents = new Map<string, string | null>();
  for (const file of files) {
    if (file.skippedReason !== null) continue;
    // 取不到内容不是错误：该文件以「无完整内容」继续审
    fileContents.set(file.path, await gateway.getFileContent(ref, file.path, headSha));
  }

  let existingComments: ExistingComment[] = [];
  try {
    const rawComments = await gateway.listReviewComments(ref);
    existingComments = rawComments.map(toExistingComment);
  } catch (error) {
    // 读不到历史会导致重复发评论，必须显式告警而不是静默当成「没有历史」
    warnings.push({
      kind: 'history',
      message: `读取已有评论失败，本轮可能产生重复评论：${error instanceof Error ? error.message : String(error)}`,
      target: null,
    });
  }

  return {
    snapshot: {
      diff: { files, baseSha, headSha },
      fileContents,
      existingComments,
      // SPEC-GAP：仓库约定文件与构建上下文在 T-06（上下文装配）补齐
      conventions: null,
      buildContext: null,
    },
    warnings,
  };
}

/**
 * 取「一笔提交」的改动，供 `acr dry-run --commit <sha>` 使用。
 *
 * 与 PR 取数的三点不同：
 * 1. **基准不是分支，是父提交。** 提交没有「目标分支」这个概念，能对比的只有它的父亲。
 * 2. **没有已有评论。** 提交没有评论区，所以历史比对、已修复标记这些全部不适用——
 *    这条路径只能跑 dry-run，`review` 模式会在 CLI 层被拒绝。
 * 3. **文件数受 compare 端点限制。** 它一次最多给 100 个文件且不能翻页，超出的必须告警，
 *    不能静默截断——用户会以为「其余文件没问题」。
 */
export async function fetchCommitSnapshot(
  gateway: GitHubGateway,
  repoRef: RepoRef,
  sha: string,
  skipPaths: readonly string[] = [],
): Promise<SnapshotResult> {
  const warnings: ReviewWarning[] = [];
  const commit = await gateway.getCommit(repoRef, sha);

  if (commit.parentSha === null) {
    throw new Error(`提交 ${sha.slice(0, 7)} 是根提交，没有可对比的父提交`);
  }

  const rawFiles = await gateway.compareCommits(repoRef, commit.parentSha, commit.sha);

  // 顶到上限说明很可能被截断了。宁可让用户知道「没审全」，也不能让他以为审全了
  if (rawFiles.length >= 100) {
    warnings.push({
      kind: 'other',
      message: '改动文件达到平台单次上限 100 个，超出的文件未纳入本次审查',
      target: null,
    });
  }

  const files = rawFiles.map((raw) => toDiffFile(raw, skipPaths));

  const fileContents = new Map<string, string | null>();
  for (const file of files) {
    if (file.skippedReason !== null) continue;
    fileContents.set(file.path, await gateway.getFileContent(repoRef, file.path, commit.sha));
  }

  return {
    snapshot: {
      diff: { files, baseSha: commit.parentSha, headSha: commit.sha },
      fileContents,
      // 提交没有评论区，这里恒为空数组——不是「没读到」，是「不存在」
      existingComments: [],
      conventions: null,
      buildContext: null,
    },
    warnings,
  };
}
