/**
 * GitHub 门禁端口：把审查结论写成「能被分支保护识别的状态」。
 *
 * 为什么必须有它：评论只是通知，**不会让合并按钮变红**。要让门禁真的挡住人，
 * 只能把结论写成检查运行或提交状态，再由仓库管理员在分支保护里设为必需。
 *
 * 两条路的分工不是风格问题，是**令牌类型**决定的：
 *
 * | 方式 | 谁能写 | 行级注解 | 分支保护可用 |
 * | --- | --- | --- | --- |
 * | 检查运行（check run） | **只有 GitHub App**（含 Action 里的内置令牌） | 有，上限 50 条 | 是 |
 * | 提交状态（commit status） | fine-grained PAT 也行 | 没有 | 是 |
 *
 * 官方文档原话：创建 check run 必须用 GitHub App，「OAuth apps and authenticated users
 * are not able to create a check suite」。所以本地用个人令牌跑时，check run 一定是 403——
 * 这不是权限没配对，是**这条路根本不对个人令牌开放**。
 *
 * 因此这里做降级：先试 check run（有注解，体验好），403/404 时改用 commit status。
 * 两者都能被分支保护设为必需，**挡住合并的能力是等价的**，差别只在注解会丢。
 * 降级必须说出来（写进返回的 commentId 前缀），否则用户会以为注解只是没显示。
 */

import type { CheckPort, CheckRunInput, WriteResult } from '../types.js';
import type { GitHubWriteGateway, PullRequestRef } from './client.js';

/** 结论到提交状态的映射。neutral 落在 success 上：它本意就是「不阻塞」。 */
function stateOf(conclusion: CheckRunInput['conclusion']): 'failure' | 'success' {
  return conclusion === 'failure' ? 'failure' : 'success';
}

function statusCodeOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  return Number((error as { status?: unknown }).status ?? 0) || null;
}

export function createGitHubCheckPort(
  gateway: GitHubWriteGateway,
  ref: PullRequestRef,
  defaultName = 'AI 代码审查',
): CheckPort {
  return {
    kind: 'github',

    async publish(input: CheckRunInput): Promise<WriteResult> {
      const name = input.name === '' ? defaultName : input.name;
      const overflow = input.annotations.length - 50;

      try {
        const id = await gateway.createCheckRun(ref, {
          ...input,
          name,
          annotations: input.annotations.slice(0, 50),
          title: input.title,
          summary:
            overflow > 0
              ? `${input.summary}\n\n另有 ${String(overflow)} 个问题未在注解中列出（平台单次上限 50 条）`
              : input.summary,
        });
        return { ok: true, commentId: id };
      } catch (error) {
        const status = statusCodeOf(error);

        // 403/404 说明这个令牌写不了 check run（个人令牌注定如此）。
        // 换 commit status 重试——它一样能被分支保护设为必需。
        if (status === 403 || status === 404 || status === 401) {
          return await publishStatus(gateway, ref, input, name, status);
        }

        return {
          ok: false,
          failure: {
            kind: 'other',
            message: error instanceof Error ? error.message : String(error),
            status,
          },
        };
      }
    },
  };
}

async function publishStatus(
  gateway: GitHubWriteGateway,
  ref: PullRequestRef,
  input: CheckRunInput,
  name: string,
  deniedStatus: number | null,
): Promise<WriteResult> {
  try {
    // 提交状态只需要 owner/repo，与 PR 号无关
    const id = await gateway.createCommitStatus(
      { owner: ref.owner, repo: ref.repo },
      {
        sha: input.headSha,
        state: stateOf(input.conclusion),
        context: name,
        description: input.title,
      },
    );

    // 前缀标注实际用的是哪种方式：注释里说「注解会丢」，不然用户会以为是自己没看到
    return { ok: true, commentId: `status:${id}` };
  } catch (error) {
    const status = statusCodeOf(error);
    return {
      ok: false,
      failure: {
        kind: status === 403 || status === 401 ? 'permission' : 'other',
        message:
          `检查运行与提交状态都写不了。\n` +
          `检查运行需要 GitHub App（个人令牌不支持，第一次返回 ${String(deniedStatus)}）；` +
          `提交状态需要令牌具备 Commit statuses: write。\n` +
          `原错误：${error instanceof Error ? error.message : String(error)}`,
        status,
      },
    };
  }
}
