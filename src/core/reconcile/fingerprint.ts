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
  /**
   * 保留字段，**不参与指纹计算**。
   *
   * 留着是为了让调用方不必改签名，也让日志里能看到「这一轮它把问题叫什么」。
   * 它不能参与身份判定：模型措辞每轮都不同。
   */
  readonly title: string;
  readonly evidence: string;
}

/** 证据归一化：去首尾空白、折叠连续空白；不做大小写转换。 */
function normalize(evidence: string): string {
  return evidence.replace(/\s+/g, ' ').trim();
}

/**
 * 算指纹：`文件 \0 维度 \0 证据` 取 SHA-256 前 16 位十六进制。
 *
 * 用 `\0` 作分隔符而不是 `|`：代码里可能出现 `|`，用它会制造人为碰撞。
 *
 * **标题不参与计算，这是实测改过来的。** 最初把标题也算进去，理由是「同一条代码可能
 * 有两个不同的问题」。真实跑两轮 PR 后发现代价远大于收益：模型对同一个缺陷每次措辞都不同，
 * 上一轮「keys 未更新」，这一轮「keys 未写」，标题一变指纹就变，于是旧评论被判成
 * 「已修复」、新评论再发一遍——同一句话在 PR 里出现两次，这是这类工具最快失去信任的方式。
 *
 * 判断依据换成「位置 + 证据代码」后，措辞怎么变都认得出是同一条。
 * 代价是：同一行代码上的两个不同问题会合并成一条。这个代价可以接受——
 * 行内评论本来就该指向一处具体代码，两点合并成一段说明比拆成两条更好读。
 */
export function computeFingerprint(input: FingerprintInput): string {
  const payload = [input.file, input.reviewer, normalize(input.evidence)].join('\u0000');
  return createHash('sha256').update(payload, 'utf8').digest('hex').slice(0, 16);
}
