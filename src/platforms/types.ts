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
