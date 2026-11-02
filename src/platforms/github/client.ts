/**
 * GitHub 网关。
 *
 * 设计成接口而不是直接暴露 octokit：取数逻辑要能被测试覆盖，
 * 而测试不可能打真实网络。上层只依赖这个接口，真实实现只在组装时注入。
 *
 * 原始类型刻意保持「接口返回什么就是什么」，不做加工——加工放在 fetch.ts，
 * 那里是纯函数，可以对着 fixture 断言。
 */

import { Octokit } from 'octokit';

/** 仓库标识。 */
export interface RepoRef {
  readonly owner: string;
  readonly repo: string;
}

/** 合并请求标识。 */
export interface PullRequestRef extends RepoRef {
  readonly number: number;
}

/** 平台返回的单个文件改动。字段名与 GitHub 一致，便于对照文档。 */
export interface RawFileChange {
  readonly filename: string;
  /** 重命名前的路径；未重命名为 null */
  readonly previousFilename: string | null;
  /** GitHub 的原始状态值：added / removed / modified / renamed / copied / changed */
  readonly status: string;
  /** unified diff 片段；超大文件时平台不返回，为 null */
  readonly patch: string | null;
  readonly additions: number;
  readonly deletions: number;
}

/** 平台返回的单条评审评论。 */
export interface RawReviewComment {
  readonly id: string;
  readonly body: string;
  readonly path: string;
  /** 评论锚定的行号；平台标记为过时时可能为 null */
  readonly line: number | null;
  readonly side: 'LEFT' | 'RIGHT' | null;
}

/** 仓库元信息。 */
export interface RepoInfo {
  /** 是否开启 Wiki，决定巡检报告能否写到 Wiki（见 16.3） */
  readonly hasWiki: boolean;
  readonly defaultBranch: string;
}

/** GitHub 取数网关。 */
export interface GitHubGateway {
  /** 列出合并请求改动的全部文件（自动翻页） */
  listPullRequestFiles(ref: PullRequestRef): Promise<readonly RawFileChange[]>;

  /** 取某文件在指定引用下的完整内容；取不到（超大、目录、非文本）时返回 null */
  getFileContent(ref: PullRequestRef, path: string, gitRef: string): Promise<string | null>;

  /** 列出合并请求上已有的评审评论（自动翻页） */
  listReviewComments(ref: PullRequestRef): Promise<readonly RawReviewComment[]>;

  /** 读取仓库元信息 */
  getRepoInfo(ref: RepoRef): Promise<RepoInfo>;
}

/**
 * 用令牌创建真实的 GitHub 网关。
 *
 * 注意：这里不做令牌校验——校验由凭证模块负责，本函数只负责组装。
 */
export function createGitHubGateway(token: string): GitHubGateway {
  const octokit = new Octokit({ auth: token });

  return {
    async listPullRequestFiles(ref) {
      const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
        owner: ref.owner,
        repo: ref.repo,
        pull_number: ref.number,
        per_page: 100,
      });

      return files.map((file) => ({
        filename: file.filename,
        previousFilename: file.previous_filename ?? null,
        status: file.status,
        patch: file.patch ?? null,
        additions: file.additions,
        deletions: file.deletions,
      }));
    },

    async getFileContent(ref, path, gitRef) {
      try {
        const response = await octokit.rest.repos.getContent({
          owner: ref.owner,
          repo: ref.repo,
          path,
          ref: gitRef,
        });

        const data = response.data;
        // 目录会返回数组，不是我们要的内容
        if (Array.isArray(data)) return null;
        if (data.type !== 'file') return null;

        // 超过约 1MB 的文件平台不给内容，encoding 为 "none"
        if (data.encoding !== 'base64') return null;

        return Buffer.from(data.content, 'base64').toString('utf8');
      } catch {
        // 取不到内容不是致命错误：该文件以「无完整内容」继续审，不影响其他文件
        return null;
      }
    },

    async listReviewComments(ref) {
      const comments = await octokit.paginate(octokit.rest.pulls.listReviewComments, {
        owner: ref.owner,
        repo: ref.repo,
        pull_number: ref.number,
        per_page: 100,
      });

      return comments.map((comment) => ({
        id: String(comment.id),
        body: comment.body ?? '',
        path: comment.path,
        line: comment.line ?? comment.original_line ?? null,
        side: comment.side === 'LEFT' || comment.side === 'RIGHT' ? comment.side : null,
      }));
    },

    async getRepoInfo(ref) {
      const response = await octokit.rest.repos.get({ owner: ref.owner, repo: ref.repo });
      return {
        hasWiki: response.data.has_wiki === true,
        defaultBranch: response.data.default_branch,
      };
    },
  };
}
