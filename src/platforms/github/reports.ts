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
          // 先确保标签在。少了这一步，创建时标签会被平台静默丢弃，
          // 下一轮按标签就找不到这一条，于是每轮都新建——去重彻底失效且毫无征兆。
          await gateway.ensureLabel(ref, INSPECTION_LABEL);
          const created = await gateway.createIssue(ref, {
            title,
            body: markdown,
            labels: [INSPECTION_LABEL],
          });
          // 创建后立刻关闭：报告不需要有人「处理」。
          // 关闭失败不能算整体失败——正文已经写进去了；但必须告警，
          // 否则 open 状态的条目会一直打扰人，而这正是本载体要避免的。
          const closed = await closeQuietly(gateway, ref, created.number);
          return {
            ok: true,
            reference: `#${String(created.number)}`,
            url: created.url,
            ...(closed === null ? {} : { warning: closed }),
          };
        }

        const updated = await gateway.updateIssue(ref, target.number, { title, body: markdown });
        const closed =
          updated.state === 'open' ? await closeQuietly(gateway, ref, target.number) : null;

        return {
          ok: true,
          reference: `#${String(updated.number)}`,
          url: updated.url,
          ...(closed === null ? {} : { warning: closed }),
        };
      } catch (error) {
        return {
          ok: false,
          // 统一脱敏：任何一条 git 命令都可能把带凭证的参数回显出来
          reason: redactCredentials(error instanceof Error ? error.message : String(error)),
        };
      }
    },
  };
}

/**
 * 关闭 Issue，失败时返回可读告警而不是抛错。
 *
 * 缺 `issues: write` 时关闭会 403。这个失败必须被说出来：
 * 报告留在 open 状态会持续要求注意力，比「报告没写成」更难被发现。
 */
async function closeQuietly(
  gateway: GitHubWriteGateway,
  ref: RepoRef,
  number: number,
): Promise<string | null> {
  try {
    await gateway.closeIssue(ref, number);
    return null;
  } catch (error) {
    return `报告已写入 #${String(number)}，但关闭失败（缺少 issues: write 权限？）：${redactCredentials(
      error instanceof Error ? error.message : String(error),
    )}`;
  }
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
/**
 * 把错误文本里的凭证抹掉。
 *
 * 为什么必须有这个：Wiki 的 clone URL 形如 `https://x-access-token:<token>@github.com/...`，
 * 而 `git clone` 失败时会把**整条命令**回显到 stderr。第一次真跑就撞上了——
 * 终端上直接打出了完整令牌。CI 里这条日志会被上传、公开可读。
 *
 * 抹两类：URL 里的 `user:secret@` 段，以及裸的令牌串（错误信息有时只回显令牌本身）。
 *
 * 只脱敏，不改调用方式：GitHub 官方文档给的就是把令牌放 URL 里。
 * 真正的泄露面是「日志被上传」，不是「同机同用户能看到进程参数」。
 */
export function redactCredentials(text: string): string {
  return text
    .replace(/(https?:\/\/[^\s:/@]+:)[^\s@/]+(@)/g, '$1***$2')
    .replace(
      /\b(?:github_pat_[A-Za-z0-9_]{10,}|gh[pousr]_[A-Za-z0-9]{10,}|sk-[A-Za-z0-9_-]{10,})\b/g,
      '***',
    );
}

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
        return {
          ok: false,
          // 统一脱敏：任何一条 git 命令都可能把带凭证的参数回显出来
          reason: redactCredentials(error instanceof Error ? error.message : String(error)),
        };
      }
    },
  };
}
