/**
 * GitHub 的行内评论位置参数。
 *
 * 映射规则（规格书 6.4）：
 * - 新增行 → 用改动后行号，一侧为 RIGHT
 * - 删除行 → 用改动前行号，一侧为 LEFT
 * - 上下文行 → 用改动后行号，一侧为 RIGHT
 *
 * 注意上下文行虽然在两个版本中都存在，但行内评论只能锚在「改动后」那一侧——
 * 锚在 LEFT 会指向用户看不见的旧文件版本。
 */

import type { LineAnchor } from '../../contracts/index.js';
import type { PositionPort } from '../types.js';

/** GitHub review comment 的位置参数。 */
export interface GitHubCommentPosition {
  readonly path: string;
  /** 行号：侧为 RIGHT 时是新文件行号，LEFT 时是旧文件行号 */
  readonly line: number;
  /** RIGHT = 改动后一侧，LEFT = 改动前一侧 */
  readonly side: 'LEFT' | 'RIGHT';
}

/**
 * 把行标识翻译成 GitHub 位置参数。
 *
 * @returns 锚点缺少该侧行号时返回 null（理论上不该发生，但契约允许 null，必须处理）
 */
export function toCommentPosition(anchor: LineAnchor): GitHubCommentPosition | null {
  switch (anchor.kind) {
    case 'added':
      return anchor.newLine === null
        ? null
        : { path: anchor.file, line: anchor.newLine, side: 'RIGHT' };

    case 'removed':
      return anchor.oldLine === null
        ? null
        : { path: anchor.file, line: anchor.oldLine, side: 'LEFT' };

    case 'context':
      // 上下文行优先落在新版本上：用户看的是改动后的文件
      return anchor.newLine === null
        ? null
        : { path: anchor.file, line: anchor.newLine, side: 'RIGHT' };
  }
}

/** GitHub 位置映射端口。 */
export const githubPositionPort: PositionPort<GitHubCommentPosition> = {
  kind: 'github',
  toCommentPosition,
};
