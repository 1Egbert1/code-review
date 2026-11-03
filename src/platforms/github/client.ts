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

  /**
   * 取合并请求当前的头部提交号。
   *
   * 创建行内评论与取文件内容都要用它，且必须**当场取**——用上一轮缓存的值
   * 在新提交推上来之后会把评论贴到错误的提交上。
   */
  getPullRequestHeadSha(ref: PullRequestRef): Promise<string>;
}

/**
 * 写操作单独一个接口。
 *
 * 与读分开的理由很实际：测试里的假网关只实现读，不该被迫写六个空方法；
 * 而发送层只依赖写接口，能一眼看出「这个模块有副作用」。
 */
export interface GitHubWriteGateway {
  /** 在改动行上新建评审评论 */
  createReviewComment(
    ref: PullRequestRef,
    input: {
      readonly body: string;
      readonly commitId: string;
      readonly path: string;
      readonly line: number;
      readonly side: 'LEFT' | 'RIGHT';
    },
  ): Promise<RawReviewComment>;

  updateReviewComment(ref: PullRequestRef, commentId: string, body: string): Promise<void>;

  deleteReviewComment(ref: PullRequestRef, commentId: string): Promise<void>;

  getReviewComment(ref: PullRequestRef, commentId: string): Promise<RawReviewComment | null>;

  /** 合并请求下的普通评论（摘要用它：它不属于任何一行） */
  listIssueComments(ref: PullRequestRef): Promise<readonly RawIssueComment[]>;

  createIssueComment(ref: PullRequestRef, body: string): Promise<RawIssueComment>;

  updateIssueComment(ref: RepoRef, commentId: string, body: string): Promise<void>;

  /**
   * 标记会话已解决。GitHub 只有 GraphQL 接口，因此实现要「取评论 → 查会话 → 解决」三步。
   * 网关不具备该能力时**省略这个方法**，发送层会据此降级为编辑评论。
   */
  resolveThread?(ref: PullRequestRef, commentId: string): Promise<void>;

  /** 写一次检查运行，返回其 id。这是「阻止合并」唯一的技术落点。 */
  createCheckRun(
    ref: PullRequestRef,
    input: {
      readonly name: string;
      readonly headSha: string;
      readonly conclusion: 'success' | 'failure' | 'neutral';
      readonly title: string;
      readonly summary: string;
      readonly annotations: readonly {
        readonly path: string;
        readonly startLine: number;
        readonly endLine: number;
        readonly level: 'notice' | 'warning' | 'failure';
        readonly title: string;
        readonly message: string;
      }[];
    },
  ): Promise<string>;
}

/** 读写齐全的网关。真实实现同时满足两个接口。 */
export type GitHubFullGateway = GitHubGateway & GitHubWriteGateway;

/** 普通评论（非行内）。摘要评论就是它。 */
export interface RawIssueComment {
  readonly id: string;
  readonly body: string;
}

/**
 * 用令牌创建真实的 GitHub 网关。
 *
 * 注意：这里不做令牌校验——校验由凭证模块负责，本函数只负责组装。
 */
export function createGitHubGateway(token: string): GitHubFullGateway {
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

    async getPullRequestHeadSha(ref) {
      const response = await octokit.rest.pulls.get({
        owner: ref.owner,
        repo: ref.repo,
        pull_number: ref.number,
      });
      return response.data.head.sha;
    },

    async createReviewComment(ref, input) {
      const response = await octokit.rest.pulls.createReviewComment({
        owner: ref.owner,
        repo: ref.repo,
        pull_number: ref.number,
        body: input.body,
        commit_id: input.commitId,
        path: input.path,
        line: input.line,
        side: input.side,
      });

      return {
        id: String(response.data.id),
        body: response.data.body,
        path: response.data.path,
        line: response.data.line ?? null,
        side:
          response.data.side === 'LEFT' || response.data.side === 'RIGHT'
            ? response.data.side
            : null,
      };
    },

    async updateReviewComment(ref, commentId, body) {
      await octokit.rest.pulls.updateReviewComment({
        owner: ref.owner,
        repo: ref.repo,
        comment_id: Number(commentId),
        body,
      });
    },

    async deleteReviewComment(ref, commentId) {
      await octokit.rest.pulls.deleteReviewComment({
        owner: ref.owner,
        repo: ref.repo,
        comment_id: Number(commentId),
      });
    },

    async getReviewComment(ref, commentId) {
      try {
        const response = await octokit.rest.pulls.getReviewComment({
          owner: ref.owner,
          repo: ref.repo,
          comment_id: Number(commentId),
        });
        return {
          id: String(response.data.id),
          body: response.data.body,
          path: response.data.path,
          line: response.data.line ?? null,
          side:
            response.data.side === 'LEFT' || response.data.side === 'RIGHT'
              ? response.data.side
              : null,
        };
      } catch {
        return null;
      }
    },

    async listIssueComments(ref) {
      const comments = await octokit.paginate(octokit.rest.issues.listComments, {
        owner: ref.owner,
        repo: ref.repo,
        issue_number: ref.number,
        per_page: 100,
      });

      return comments.map((comment) => ({ id: String(comment.id), body: comment.body ?? '' }));
    },

    async createIssueComment(ref, body) {
      const response = await octokit.rest.issues.createComment({
        owner: ref.owner,
        repo: ref.repo,
        issue_number: ref.number,
        body,
      });
      return { id: String(response.data.id), body: response.data.body ?? body };
    },

    async updateIssueComment(ref, commentId, body) {
      await octokit.rest.issues.updateComment({
        owner: ref.owner,
        repo: ref.repo,
        comment_id: Number(commentId),
        body,
      });
    },

    async createCheckRun(ref, input) {
      const response = await octokit.rest.checks.create({
        owner: ref.owner,
        repo: ref.repo,
        name: input.name,
        head_sha: input.headSha,
        status: 'completed',
        conclusion: input.conclusion,
        output: {
          title: input.title,
          summary: input.summary,
          // 平台限制单次注解条数，超了整次请求会失败
          annotations: input.annotations.slice(0, 50).map((annotation) => ({
            path: annotation.path,
            start_line: annotation.startLine,
            end_line: annotation.endLine,
            annotation_level: annotation.level,
            title: annotation.title,
            message: annotation.message,
          })),
        },
      });

      return String(response.data.id);
    },

    async resolveThread(ref, commentId) {
      const comment = await octokit.rest.pulls.getReviewComment({
        owner: ref.owner,
        repo: ref.repo,
        comment_id: Number(commentId),
      });

      // 会话 id 只能从 GraphQL 拿，REST 只给评论的 node_id
      const query = `query($id: ID!) {
        node(id: $id) {
          ... on PullRequestReviewComment {
            pullRequestReviewThread { id }
          }
        }
      }`;
      const found = await octokit.graphql<{
        node: { pullRequestReviewThread?: { id: string } } | null;
      }>(query, {
        id: comment.data.node_id,
      });

      const threadId = found.node?.pullRequestReviewThread?.id;
      if (threadId === undefined) throw new Error('找不到该评论所属的会话');

      const mutation = `mutation($threadId: ID!) {
        resolveReviewThread(input: { threadId: $threadId }) { thread { isResolved } }
      }`;
      await octokit.graphql(mutation, { threadId });
    },
  };
}
