/**
 * 改动相关的契约。
 *
 * 这些类型是「取」与「校」两步之间的唯一约定：解析层产出行结构，其他所有层只读。
 * 位置信息一律用 {@link LineAnchor} 表达，不允许在下游用裸行号传递——
 * 裸行号表达不了「这一行在改动前是第几行」，那正是位置锚定最容易出错的地方。
 */

/** 一次审查的请求。凭证不在此结构中流转，由凭证模块单独解析后注入调用层。 */
export interface ReviewRequest {
  /** 仓库全名，形如 owner/repo */
  readonly repository: string;
  /** 运行模式：远端合并请求 / 本地引用对比 / 项目巡检 */
  readonly mode: 'pull-request' | 'local' | 'inspection';
  /** 合并请求号；非 pull-request 模式为 null */
  readonly pullRequestNumber: number | null;
  /** 本地模式的对比基准引用（如 origin/main）；非 local 模式为 null */
  readonly baseRef: string | null;
  /** 本地模式的头部引用（如 HEAD）；非 local 模式为 null */
  readonly headRef: string | null;
  /** 只打印不发送，不产生任何写操作 */
  readonly dryRun: boolean;
}

/** 一条改动行在文件中的三种形态。 */
export type LineKind = 'added' | 'removed' | 'context';

/**
 * 一条改动行的完整身份。由改动解析层发放，其他层只读。
 *
 * 同时保留改动前后的行号，是因为上下文行（未变动但出现在改动块里的行）在两个版本中
 * 的行号可能不相等——文件前面有增删时就会错开。只存一个行号的下游无法正确落位。
 */
export interface LineAnchor {
  /** 当前文件路径（重命名后） */
  readonly file: string;
  /** 重命名前的路径；未重命名为 null */
  readonly oldPath: string | null;
  /** 该行在改动中的形态 */
  readonly kind: LineKind;
  /** 改动后行号；kind 为 removed 时为 null */
  readonly newLine: number | null;
  /** 改动前行号；kind 为 added 时为 null */
  readonly oldLine: number | null;
}

/** 改动中的单行。 */
export interface DiffLine {
  /** 该行的位置身份 */
  readonly anchor: LineAnchor;
  /** 该行文本；removed 行为删除前的文本 */
  readonly text: string;
  /** 该行所属的最内层函数名；无法识别或尚未填充时为 null */
  readonly enclosingSymbol: string | null;
}

/** 改动中的单个文件。 */
export interface DiffFile {
  /** 当前路径 */
  readonly path: string;
  /** 重命名前的路径；未重命名为 null */
  readonly oldPath: string | null;
  readonly status: 'added' | 'modified' | 'deleted' | 'renamed';
  /** 该文件全部改动行，按在文件中出现的顺序 */
  readonly lines: readonly DiffLine[];
  /** 变更行数（新增 + 删除），用于风险打分与预算估算 */
  readonly changedCount: number;
  /** 被跳过时写明原因（如「二进制」「命中跳过清单」「平台未提供补丁」）；未跳过为 null */
  readonly skippedReason: string | null;
}

/** 解析后的完整改动。 */
export interface ParsedDiff {
  /** 全部文件，含被跳过的（跳过项 lines 为空，skippedReason 非空） */
  readonly files: readonly DiffFile[];
  /** 对比基准的提交号 */
  readonly baseSha: string;
  /** 当前头部的提交号 */
  readonly headSha: string;
}
