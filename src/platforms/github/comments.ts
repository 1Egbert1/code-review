/**
 * GitHub 评论写入适配器。
 *
 * **这一层把平台差异关在里面。** 上层只认「行内 / 摘要 / 更新 / 解决 / 删除」五个动作，
 * 换平台时只换这个文件，发送层的分批、限速、回读校验一行都不用动。
 *
 * 一个必须承认的限制：GitHub 的「标记会话已解决」没有对应的 REST 接口，只有 GraphQL 的
 * `resolveReviewThread`，而它要的是**会话 id**而不是评论 id。这里用「取评论 → 拿 node_id →
 * 查会话 → 解决」四步实现，代价是三次请求；失败一律返回 permission，让上层降级为编辑。
 * 宁可降级并告警，也不要静默什么都没做。
 */

import type { CommentPort, WriteResult, WriteTarget } from '../types.js';
import type { GitHubFullGateway, PullRequestRef } from './client.js';

/**
 * 用网关组装评论写入端口。
 *
 * @param commitId 本次审查对应的头部提交号。GitHub 创建行内评论时**必须**带上它，
 *                 否则行号会被解释到别的提交上。
 */
export function createGitHubCommentPort(
  gateway: GitHubFullGateway,
  ref: PullRequestRef,
  commitId: string,
): CommentPort {
  function toResult(id: string): WriteResult {
    return { ok: true, commentId: id };
  }

  function failure(
    kind: 'permission' | 'rate-limit' | 'not-found' | 'other',
    error: unknown,
  ): WriteResult {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status?: unknown }).status ?? 0) || null
        : null;

    if (status === 403 || status === 401)
      return { ok: false, failure: { kind: 'permission', message: text(error), status } };
    if (status === 429)
      return { ok: false, failure: { kind: 'rate-limit', message: text(error), status } };
    if (status === 404)
      return { ok: false, failure: { kind: 'not-found', message: text(error), status } };
    return { ok: false, failure: { kind, message: text(error), status } };
  }

  return {
    kind: 'github',

    async createInline(target: WriteTarget, body: string) {
      try {
        const comment = await gateway.createReviewComment(ref, {
          body,
          commitId,
          path: target.path,
          line: target.line,
          // 平台用 LEFT / RIGHT 表示改动前 / 改动后，与我们内部的 old / new 一一对应
          side: target.side === 'old' ? 'LEFT' : 'RIGHT',
        });
        return toResult(comment.id);
      } catch (error) {
        return failure('other', error);
      }
    },

    async createThread(body: string) {
      try {
        const comment = await gateway.createIssueComment(ref, body);
        return toResult(comment.id);
      } catch (error) {
        return failure('other', error);
      }
    },

    async update(commentId: string, body: string) {
      try {
        await gateway.updateReviewComment(ref, commentId, body);
        return toResult(commentId);
      } catch (reviewError) {
        // 摘要评论是普通评论，不在评审评论的接口范围内，退一步试普通评论
        try {
          await gateway.updateIssueComment(ref, commentId, body);
          return toResult(commentId);
        } catch {
          return failure('other', reviewError);
        }
      }
    },

    async resolve(commentId: string) {
      try {
        const comment = await gateway.getReviewComment(ref, commentId);
        if (comment === null) {
          return {
            ok: false,
            failure: { kind: 'not-found', message: '评论不存在或已被删除', status: 404 },
          };
        }
        // 没有 GraphQL 能力时如实降级，而不是假装成功
        if (gateway.resolveThread === undefined) {
          return {
            ok: false,
            failure: { kind: 'permission', message: '当前网关不支持标记会话已解决', status: null },
          };
        }
        await gateway.resolveThread(ref, commentId);
        return toResult(commentId);
      } catch (error) {
        return failure('permission', error);
      }
    },

    async remove(commentId: string) {
      try {
        await gateway.deleteReviewComment(ref, commentId);
        return toResult(commentId);
      } catch (error) {
        return failure('other', error);
      }
    },

    async read(commentId: string) {
      const comment = await gateway.getReviewComment(ref, commentId);
      if (comment !== null) return { body: comment.body };

      const issues = await gateway.listIssueComments(ref);
      const found = issues.find((item) => item.id === commentId);
      return found === undefined ? null : { body: found.body };
    },

    async findThread(markerText: string) {
      const issues = await gateway.listIssueComments(ref);
      const found = issues.find((item) => item.body.includes(markerText));
      return found === undefined ? null : { commentId: found.id, body: found.body };
    },
  };
}

function text(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
