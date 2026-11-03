/**
 * 巡检报告的两种 GitHub 载体。
 *
 * 载体选择的分工见 carrier.ts，这里只管「怎么写到平台上」。两件必须做对的事：
 *
 * 1. **常设单条 Issue，且创建后立即关闭。** 报告是周期快照，不是待办。留在 open 状态
 *    会让每次打开仓库都看到它，用户很快学会无视它——那时预警就失效了。
 * 2. **Wiki 走 git，失败原因比 HTTP 多。** 所以写入失败必须返回结构化失败，
 *    由上层降级到 Issue，而不是抛异常把整轮巡检打掉。
 */

import type { ReportWriter, WriteOutcome } from '../../core/inspection/carrier.js';
import type { GitHubWriteGateway, RawIssue, RepoRef } from './client.js';

/** 用来识别「这就是我们的报告」的标签。换标签会导致旧报告认不出来，不要随便改。 */
export const INSPECTION_LABEL = 'acr-inspection';

export interface IssueWriterOptions {
  /** 报告标题前缀，日期会拼在后面 */
  readonly titlePrefix?: string;
}

/**
 * Issue 载体。
 *
 * 找已有的报告 Issue：有则更新正文（并确保关闭），无则新建后立刻关闭。
 * 不新建第二条，否则一年下来会有几十条报告 issue。
 */
export function createGitHubIssueWriter(
  gateway: GitHubWriteGateway,
  ref: RepoRef,
  options: IssueWriterOptions = {},
): ReportWriter {
  const prefix = options.titlePrefix ?? '代码巡检报告';

  return {
    kind: 'issue',

    async write(pageName: string, markdown: string): Promise<WriteOutcome> {
      try {
        const title = `${prefix} ${pageName}`;
        const existing = await gateway.listIssuesByLabel(ref, INSPECTION_LABEL);
        const target = pickLatest(existing);

        if (target === undefined) {
          const created = await gateway.createIssue(ref, {
            title,
            body: markdown,
            labels: [INSPECTION_LABEL],
          });
          // 创建后立刻关闭：报告不需要有人「处理」
          await gateway.closeIssue(ref, created.number);
          return { ok: true, reference: `#${String(created.number)}`, url: created.url };
        }

        const updated = await gateway.updateIssue(ref, target.number, { title, body: markdown });
        if (updated.state === 'open') await gateway.closeIssue(ref, target.number);

        return { ok: true, reference: `#${String(updated.number)}`, url: updated.url };
      } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
      }
    },
  };
}

/** 有多条时取编号最大的那条：编号单调递增，等价于「最近创建」。 */
function pickLatest(issues: readonly RawIssue[]): RawIssue | undefined {
  return [...issues].sort((a, b) => b.number - a.number)[0];
}

/** 执行一条外部命令。抽出来是为了让 Wiki 写入能测而不真的碰 git。 */
export type CommandRunner = (
  command: string,
  args: readonly string[],
  cwd: string,
) => Promise<void>;

export interface WikiWriterOptions {
  /** wiki 仓库的 clone 地址，形如 https://x-access-token:TOKEN@github.com/o/r.wiki.git */
  readonly cloneUrl: string;
  readonly workDir: string;
  readonly run: CommandRunner;
  /** 提交作者，默认用 Action 机器人 */
  readonly authorName?: string;
  readonly authorEmail?: string;
}

/**
 * Wiki 载体：clone → 写页面 → 提交 → 推送。
 *
 * 三条实现细节：
 * - 每次先 `pull --rebase`：wiki 也可能被别人编辑，不拉就推会被拒
 * - 写文件用页面名做文件名，日期前缀让侧边栏的字母序等于时间序
 * - 任何一步失败都返回结构化失败，交给上层降级
 */
export function createGitWikiWriter(options: WikiWriterOptions): ReportWriter {
  const authorName = options.authorName ?? 'acr-bot';
  const authorEmail = options.authorEmail ?? 'acr-bot@users.noreply.github.com';

  return {
    kind: 'wiki',

    async write(pageName: string, markdown: string): Promise<WriteOutcome> {
      const { run, workDir, cloneUrl } = options;

      try {
        const { mkdir, writeFile } = await import('node:fs/promises');
        const { join } = await import('node:path');

        await mkdir(workDir, { recursive: true });

        // 已 clone 过就更新，否则克隆。用 `.git` 是否存在判断，比 try/catch 更清楚
        const { existsSync } = await import('node:fs');
        if (existsSync(join(workDir, '.git'))) {
          await run('git', ['pull', '--rebase', '--quiet'], workDir);
        } else {
          await run('git', ['clone', '--depth', '1', cloneUrl, workDir], workDir);
        }

        await writeFile(join(workDir, `${pageName}.md`), markdown, 'utf8');
        await run('git', ['add', `${pageName}.md`], workDir);
        await run(
          'git',
          [
            '-c',
            `user.name=${authorName}`,
            '-c',
            `user.email=${authorEmail}`,
            'commit',
            '-m',
            `巡检报告 ${pageName}`,
          ],
          workDir,
        );
        await run('git', ['push', '--quiet', 'origin', 'HEAD'], workDir);

        return {
          ok: true,
          reference: pageName,
          url: `${cloneUrl.replace(/\.wiki\.git$/, '')}/wiki/${pageName}`,
        };
      } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
      }
    },
  };
}
