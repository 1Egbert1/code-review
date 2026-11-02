/**
 * 平台适配器的公共接口。
 *
 * 设计要点：位置映射的入参一律是 {@link LineAnchor}，而不是「行号 + 一侧」。
 * 因为不同平台需要的信息不同——有的只要新行号，有的要求上下文行同时给出新旧两个行号。
 * 让适配器自己从锚点里取所需字段，才能做到「加平台不改契约」。
 */

import type { LineAnchor } from '../contracts/index.js';

/** 位置映射端口。T-04 只定义这一部分，取数与发送在后续任务包补齐。 */
export interface PositionPort<Position> {
  /** 平台标识，用于诊断与日志 */
  readonly kind: string;

  /**
   * 把行标识翻译成该平台的位置参数。
   *
   * @returns 无法表达时返回 null（例如锚点缺少该侧行号），调用方应视为「不可评论」而非报错
   */
  toCommentPosition(anchor: LineAnchor): Position | null;
}

/** 行内评论的落点。平台之间字段不同，这里只保留最小共通集。 */
export interface WriteTarget {
  readonly path: string;
  readonly line: number;
  readonly side: 'new' | 'old';
}

/** 写操作失败的原因分类。区分它们是为了决定「降级」还是「重试」。 */
export interface WriteFailure {
  readonly kind: 'permission' | 'rate-limit' | 'not-found' | 'other';
  readonly message: string;
  readonly status: number | null;
}

export type WriteResult =
  | { readonly ok: true; readonly commentId: string }
  | { readonly ok: false; readonly failure: WriteFailure };

/**
 * 评论写入端口。
 *
 * 只有这一层有外部副作用，所以它必须是**唯一**能发请求的地方，
 * 且每个方法都要能返回结构化失败——上层据此决定降级、重试还是记告警。
 */
export interface CommentPort {
  readonly kind: string;
  createInline(target: WriteTarget, body: string): Promise<WriteResult>;
  /** 新建一条独立讨论（摘要用） */
  createThread(body: string): Promise<WriteResult>;
  update(commentId: string, body: string): Promise<WriteResult>;
  /** 标记会话已解决；权限不足时由上层降级为编辑 */
  resolve(commentId: string): Promise<WriteResult>;
  remove(commentId: string): Promise<WriteResult>;
  /** 回读评论正文，用于校验平台没有静默改写内容 */
  read(commentId: string): Promise<{ readonly body: string } | null>;
  /** 找到已有的摘要评论（按标记识别），用于「有则更新」 */
  findThread(
    markerText: string,
  ): Promise<{ readonly commentId: string; readonly body: string } | null>;
}
