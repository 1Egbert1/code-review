/**
 * GitHub 检查运行适配器。
 *
 * 为什么必须有它：评论只是通知，**不会让合并按钮变红**。要让门禁真的挡住人，
 * 只能把结论写成一次检查运行，并由仓库管理员在分支保护里把它设为必需。
 *
 * 一个容易踩的限制：单次检查运行能带的注解有条数上限（50），超了整次请求失败。
 * 所以这里截断并**在摘要里说明还有多少条**——静默截断会让人以为只有 50 个问题。
 */

import type { CheckPort, CheckRunInput, WriteResult } from '../types.js';
import type { GitHubWriteGateway, PullRequestRef } from './client.js';

export function createGitHubCheckPort(
  gateway: GitHubWriteGateway,
  ref: PullRequestRef,
  defaultName = 'AI 代码审查',
): CheckPort {
  return {
    kind: 'github',

    async publish(input: CheckRunInput): Promise<WriteResult> {
      const overflow = input.annotations.length - 50;

      try {
        const id = await gateway.createCheckRun(ref, {
          ...input,
          name: input.name === '' ? defaultName : input.name,
          annotations: input.annotations.slice(0, 50),
          title: input.title,
          summary:
            overflow > 0
              ? `${input.summary}\n\n另有 ${String(overflow)} 个问题未在注解中列出（平台单次上限 50 条）`
              : input.summary,
        });
        return { ok: true, commentId: id };
      } catch (error) {
        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? Number((error as { status?: unknown }).status ?? 0) || null
            : null;

        return {
          ok: false,
          failure: {
            kind: status === 403 || status === 401 ? 'permission' : 'other',
            message: error instanceof Error ? error.message : String(error),
            status,
          },
        };
      }
    },
  };
}
