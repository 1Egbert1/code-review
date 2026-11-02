/**
 * 跨轮次稳定的身份指纹。
 *
 * **行号绝对不参与计算。** 这是整个项目最容易写错的一条：一旦行号进指纹，
 * 代码往上挪 5 行就会被当成新问题重发一遍评论；而用户看到的是同一句话出现了两次。
 *
 * 反过来，代码一旦改动指纹就变，这带来一个很实用的副作用：
 * **被人工豁免的问题在代码改动后自动失效**，不需要任何清理逻辑。
 */

import { createHash } from 'node:crypto';

import type { ReviewerId } from '../../contracts/finding.js';

export interface FingerprintInput {
  readonly file: string;
  readonly reviewer: ReviewerId;
  readonly title: string;
  readonly evidence: string;
}

/** 证据归一化：去首尾空白、折叠连续空白；不做大小写转换。 */
function normalize(evidence: string): string {
  return evidence.replace(/\s+/g, ' ').trim();
}

/**
 * 算指纹：`文件 \0 维度 \0 标题 \0 证据` 取 SHA-256 前 16 位十六进制。
 *
 * 用 `\0` 作分隔符而不是 `|`：代码与标题里都可能出现 `|`，用它会制造人为碰撞。
 */
export function computeFingerprint(input: FingerprintInput): string {
  const payload = [input.file, input.reviewer, input.title, normalize(input.evidence)].join(
    '\u0000',
  );
  return createHash('sha256').update(payload, 'utf8').digest('hex').slice(0, 16);
}
