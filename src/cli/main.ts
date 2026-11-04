/**
 * 命令行的纯逻辑层。
 *
 * 这里不产生任何顶层副作用，因此可以被测试直接 import。
 * 真正的可执行入口在 `index.ts`，它只负责调用 main 并落退出码。
 *
 * 退出码约定（CI 会依赖它，不能随意改）：
 * - 0 成功
 * - 1 配置错误（字段写错、缺少必填）
 * - 2 命令或参数用法错误
 * - 3 缺少凭证或仓库信息
 * - 4 运行期失败（取数失败等）
 */

import type { ResolvedConfig } from '../contracts/config.js';
import type { ReviewRequest } from '../contracts/diff.js';
import type { ReviewResult } from '../contracts/result.js';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { loadConfig } from '../config/load.js';
import { describeActions, runReview } from '../core/engine.js';
import { createGitHubCommentPort } from '../platforms/github/comments.js';
import { createGitHubGateway } from '../platforms/github/client.js';
import {
  createGitHubIssueWriter,
  createGitWikiWriter,
  INSPECTION_LABEL,
} from '../platforms/github/reports.js';
import { fetchCommitSnapshot, fetchSnapshot } from '../platforms/github/fetch.js';
import { createOpenAiCompatClient } from '../providers/openai-compat.js';
import { compareBaselines, isBaselineSnapshot } from '../core/eval/baseline.js';
import { writeReport } from '../core/inspection/carrier.js';
import {
  appendHistory,
  EMPTY_HISTORY,
  extractEmbeddedHistory,
  parseHistory,
  previousOf,
  serializeHistory,
} from '../core/inspection/history.js';
import type { HistoryEntry } from '../core/inspection/history.js';
import { renderReport } from '../core/inspection/report.js';
import { runInspection } from '../core/inspection/run.js';
import { collectSourceFiles, readOptional } from './walk.js';
import { formatComparison, formatStats } from './stats.js';

const COMMANDS = ['review', 'dry-run', 'inspect', 'cost', 'eval'] as const;

type CommandName = (typeof COMMANDS)[number];

const USAGE = `acr — AI 代码审查

用法:
  acr <子命令> [选项]

子命令:
  review     审查一次代码改动并发送评论
  dry-run    同上，但只打印结果，不发送任何写请求
  inspect    巡检整个仓库并出报告
  cost       预估一次审查的花费
  eval       跑评估集并与基准对比

常用选项:
  --repo <owner/name>   仓库；也可用环境变量 ACR_REPOSITORY
  --pr <编号>           合并请求编号
  --commit <sha>        审查单笔提交（与父提交对比）；只支持 dry-run，因为没有评论区可贴
  --files <数量>        cost 用：预计改动文件数
  --lines <数量>        cost 用：预计改动行数

  acr <子命令> --help   查看子命令选项
`;

/** 依赖注入，便于测试时不落到真实网络与真实文件系统。 */
export interface MainDeps {
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

interface Flags {
  readonly [key: string]: string | undefined;
}

/** 解析 `--key value` 与 `--flag` 两种形式。 */
function parseFlags(args: readonly string[]): Flags {
  const flags: Record<string, string | undefined> = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index] ?? '';
    if (!token.startsWith('--')) continue;

    const name = token.slice(2);
    const next = args[index + 1];

    if (next === undefined || next.startsWith('--')) {
      flags[name] = '';
      continue;
    }
    flags[name] = next;
    index += 1;
  }

  return flags;
}

function isCommand(value: string): value is CommandName {
  return (COMMANDS as readonly string[]).includes(value);
}

const execFileAsync = promisify(execFile);

/** 执行外部命令。Wiki 写入用它，测试时注入替代实现。 */
async function runCommand(command: string, args: readonly string[], cwd: string): Promise<void> {
  await execFileAsync(command, [...args], { cwd });
}

/** 读历史文件。文件不存在是首期，损坏则报错——把坏历史当空历史会写出「全是新增」的错误结论。 */
async function readHistory(path: string): Promise<ReturnType<typeof parseHistory>> {
  try {
    return parseHistory(await readFile(path, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return EMPTY_HISTORY;
    throw error;
  }
}

/** 从 `owner/name` 拆出仓库标识。 */
function parseRepo(value: string): { owner: string; repo: string } | null {
  const parts = value.split('/');
  if (parts.length !== 2) return null;
  const [owner, repo] = parts;
  if (owner === undefined || repo === undefined || owner === '' || repo === '') return null;
  return { owner, repo };
}

/** 预估花费：按「每文件一次调用 + 全局一次」粗算，目的是让人跑之前心里有数。 */
function estimateCostText(config: ResolvedConfig, files: number, lines: number): string {
  // 每个文件约 6.5k 输入（含可缓存的固定开销），其中固定开销约 2.5k
  const perFileInput = 6500;
  const fixedPerFile = 2500;
  const calls = Math.ceil(files * 1.3) + 2;
  const uncached = files * (perFileInput - fixedPerFile) + lines * 4;
  const cached = files * fixedPerFile;
  const output = calls * 300;

  const pricing = config.llm.pricing;
  const tokens = `预计 ${String(calls)} 次调用 / 输入约 ${String(Math.round(uncached / 1000))}k + 缓存 ${String(
    Math.round(cached / 1000),
  )}k tok / 输出约 ${String(Math.round(output / 1000))}k tok`;

  if (pricing === null) {
    return `${tokens}\n费用：未配置单价，无法折算（在配置里填 llm.pricing 后可估算）`;
  }

  const inputPrice = pricing.inputPerMTok / 1_000_000;
  const cost =
    uncached * inputPrice +
    cached * inputPrice * pricing.cacheReadMultiplier +
    output * (pricing.outputPerMTok / 1_000_000);
  const noCacheCost =
    uncached * inputPrice + cached * inputPrice + output * (pricing.outputPerMTok / 1_000_000);

  return `${tokens}\n预计费用 ≈ $${cost.toFixed(4)}（命中提示词缓存；未命中约 $${noCacheCost.toFixed(
    4,
  )}）\n当前预算上限：$${String(config.review.maxBudgetUsd)}`;
}

async function runReviewCommand(
  flags: Flags,
  deps: {
    cwd: string;
    env: NodeJS.ProcessEnv;
    stdout: (text: string) => void;
    stderr: (text: string) => void;
  },
  dryRun: boolean,
): Promise<number> {
  const loaded = await loadConfig(deps.cwd);
  if (!loaded.ok) {
    deps.stderr('配置有误：\n');
    for (const error of loaded.errors) {
      deps.stderr(`  ${error.path === '' ? '(根)' : error.path}：${error.message}\n`);
    }
    return 1;
  }
  const config = loaded.config;

  const repoText = flags['repo'] ?? config.platform.repository ?? deps.env['ACR_REPOSITORY'];
  const repo = repoText === undefined || repoText === null ? null : parseRepo(repoText);
  if (repo === null) {
    deps.stderr('缺少仓库：请用 --repo owner/name 指定，或设置 ACR_REPOSITORY\n');
    return 3;
  }

  // 两种输入二选一：PR 号，或一笔提交的 sha
  const commitText = flags['commit'] ?? '';
  const isCommitMode = commitText !== '';

  if (isCommitMode && !dryRun) {
    // 提交没有评论区，行内评论无处可贴。与其给一个含糊的失败，不如在入口就说清楚
    deps.stderr('按提交审查不支持发评论（提交没有评论区），请改用 dry-run\n');
    return 2;
  }

  const prText = flags['pr'] ?? deps.env['ACR_PULL_REQUEST'];
  const prNumber = prText === undefined || prText === '' ? Number.NaN : Number(prText);

  if (!isCommitMode && (!Number.isInteger(prNumber) || prNumber <= 0)) {
    deps.stderr('缺少审查对象：用 --pr <编号> 审合并请求，或 --commit <sha> 审单笔提交\n');
    return 3;
  }

  const token = deps.env[config.platform.tokenEnv] ?? deps.env['GITHUB_TOKEN'] ?? '';
  if (token === '' && !dryRun) {
    deps.stderr(`缺少平台令牌：请设置环境变量 ${config.platform.tokenEnv}\n`);
    return 3;
  }
  if (token === '') {
    // 公开仓库可以匿名读，但限速 60 次/小时；一次审查十几个请求，很容易刚好不够
    deps.stderr('告警：未提供平台令牌，将以匿名身份读取（限速 60 次/小时，可能中途被拦）\n');
  }

  const apiKey = deps.env[config.llm.apiKeyEnv];
  if (apiKey === undefined || apiKey === '') {
    deps.stderr(`缺少模型密钥：请设置环境变量 ${config.llm.apiKeyEnv}\n`);
    return 3;
  }

  const ref = { ...repo, number: prNumber };
  const gateway = createGitHubGateway(token);

  const request: ReviewRequest = isCommitMode
    ? {
        repository: `${repo.owner}/${repo.repo}`,
        mode: 'commit',
        pullRequestNumber: null,
        baseRef: null,
        headRef: commitText,
        dryRun,
      }
    : {
        repository: `${repo.owner}/${repo.repo}`,
        mode: 'pull-request',
        pullRequestNumber: prNumber,
        baseRef: null,
        headRef: null,
        dryRun,
      };

  const client = createOpenAiCompatClient({
    baseUrl: config.llm.baseUrl,
    apiKey,
    headers: config.llm.headers,
    structuredOutput: config.llm.structuredOutput,
  });

  // 头部提交号必须在**创建写入端口之前**取到。
  //
  // 之前是在 fetchSnapshot 里取的，而 port 是作为参数先求值的——等到真正发评论时，
  // 传进 port 的还是初始化时的空字符串，平台直接拒收：「commit_id is not part of
  // the pull request」。dry-run 不创建 port，所以单测和干跑都碰不到这条路径。
  const shas = isCommitMode ? { head: '', base: '' } : await gateway.getPullRequestShas(ref);
  const headSha = shas.head;

  const result: ReviewResult = await runReview(request, {
    config,
    client,
    fetchSnapshot: async () => {
      const fetched = isCommitMode
        ? await fetchCommitSnapshot(gateway, repo, commitText, config.review.skipPaths)
        : await fetchSnapshot(gateway, ref, headSha, config.review.skipPaths, shas.base);

      for (const warning of fetched.warnings) deps.stderr(`告警：${warning.message}\n`);
      return fetched.snapshot;
    },
    // 只打印模式不创建写入端口：没有端口就不可能发出写请求
    port: dryRun || isCommitMode ? null : createGitHubCommentPort(gateway, ref, headSha),
    onProgress: (message) => {
      deps.stdout(`${message}\n`);
    },
  });

  deps.stdout('\n');
  if (dryRun) {
    const lines = describeActions(result.actions);
    deps.stdout(lines.length === 0 ? '（本轮没有需要发送的评论）\n' : `${lines.join('\n')}\n`);
    deps.stdout('\n--- 摘要 ---\n');
    deps.stdout(`${result.summaryMarkdown}\n\n`);
  }

  deps.stdout(`${formatStats({ result, files: result.coverage.planned, dryRun })}\n`);
  return 0;
}

/**
 * 入口主函数。
 *
 * @param argv 已去掉 node 与脚本路径的参数列表
 */
export async function main(argv: readonly string[], deps: MainDeps = {}): Promise<number> {
  const stdout = deps.stdout ?? ((text: string): void => void process.stdout.write(text));
  const stderr = deps.stderr ?? ((text: string): void => void process.stderr.write(text));
  const resolved = {
    cwd: deps.cwd ?? process.cwd(),
    env: deps.env ?? process.env,
    stdout,
    stderr,
  };

  const first = argv[0];

  if (first === undefined || first === '--help' || first === '-h') {
    stdout(USAGE);
    return 0;
  }

  if (first === '--version' || first === '-v') {
    stdout('0.1.0\n');
    return 0;
  }

  if (!isCommand(first)) {
    stderr(`未知命令: ${first}\n\n${USAGE}`);
    return 2;
  }

  const flags = parseFlags(argv.slice(1));

  if (flags['help'] !== undefined) {
    stdout(USAGE);
    return 0;
  }

  try {
    if (first === 'review' || first === 'dry-run') {
      return await runReviewCommand(
        flags,
        resolved,
        first === 'dry-run' || flags['dry'] !== undefined,
      );
    }

    if (first === 'cost') {
      const loaded = await loadConfig(resolved.cwd);
      if (!loaded.ok) {
        for (const error of loaded.errors) stderr(`${error.path}：${error.message}\n`);
        return 1;
      }

      const files = Number(flags['files'] ?? '10');
      const lines = Number(flags['lines'] ?? '400');
      if (!Number.isFinite(files) || !Number.isFinite(lines)) {
        stderr('--files 与 --lines 必须是数字\n');
        return 2;
      }

      stdout(`${estimateCostText(loaded.config, files, lines)}\n`);
      return 0;
    }

    if (first === 'eval') {
      const beforePath = flags['baseline'];
      const afterPath = flags['current'];
      if (
        beforePath === undefined ||
        beforePath === '' ||
        afterPath === undefined ||
        afterPath === ''
      ) {
        stderr('需要两份快照：acr eval --baseline <基准.json> --current <本次.json>\n');
        return 2;
      }

      const load = async (path: string): Promise<unknown> =>
        JSON.parse(await readFile(path, 'utf8')) as unknown;
      const before = await load(beforePath);
      const after = await load(afterPath);

      if (!isBaselineSnapshot(before) || !isBaselineSnapshot(after)) {
        stderr('文件不是有效的基准快照（版本或字段不符）\n');
        return 1;
      }

      const comparison = compareBaselines(before, after);
      stdout(`${formatComparison(comparison)}\n`);

      // 不可比属于「结果无效」，用非零退出让 CI 注意到，而不是打印一段文字了事
      return comparison.comparable ? 0 : 1;
    }

    if (first === 'inspect') {
      const loaded = await loadConfig(resolved.cwd);
      if (!loaded.ok) {
        for (const error of loaded.errors) stderr(`${error.path}：${error.message}\n`);
        return 1;
      }

      const coverageText = flags['coverage'];
      const coverage =
        coverageText === undefined || coverageText === '' ? null : Number(coverageText);
      if (coverage !== null && !Number.isFinite(coverage)) {
        stderr('--coverage 必须是数字（百分比）\n');
        return 2;
      }

      // 写入所需的东西先备好：上一期要从平台读，它必须在跑巡检之前拿到
      const willWrite = flags['write'] !== undefined;
      let gateway: ReturnType<typeof createGitHubGateway> | null = null;
      let repo: { owner: string; repo: string } | null = null;

      if (willWrite) {
        const token = resolved.env[loaded.config.platform.tokenEnv] ?? resolved.env['GITHUB_TOKEN'];
        const repoText = loaded.config.platform.repository ?? resolved.env['GITHUB_REPOSITORY'];
        repo = repoText === undefined || repoText === null ? null : parseRepo(repoText);

        if (token === undefined || token === '' || repo === null) {
          stderr(
            '写入需要令牌与仓库：设置 GITHUB_TOKEN 与 GITHUB_REPOSITORY（或配置 platform.repository）\n',
          );
          return 3;
        }
        gateway = createGitHubGateway(token);
      }

      const historyFile = join(resolved.cwd, flags['history'] ?? '.acr/inspection-history.json');
      const history = await readHistory(historyFile);

      // 上期优先取平台上的报告：Action 每次都是干净容器，本地历史留不下来
      let previous: HistoryEntry | null = previousOf(history);
      if (gateway !== null && repo !== null) {
        const issues = await gateway.listIssuesByLabel(repo, INSPECTION_LABEL);
        const latest = [...issues].sort((a, b) => b.number - a.number)[0];
        const embedded = latest === undefined ? null : extractEmbeddedHistory(latest.body);
        if (embedded !== null) previous = embedded;
      }

      const files = await collectSourceFiles(resolved.cwd);
      // package.json 单独补进来：依赖维度要用，但它不是「源码文件」
      const manifest = await readOptional(resolved.cwd, 'package.json');
      const allFiles = manifest === null ? files : [...files, manifest];

      const inspection = runInspection({
        repository: resolved.env['GITHUB_REPOSITORY'] ?? 'local',
        commitSha: resolved.env['GITHUB_SHA'] ?? 'unknown',
        files: allFiles,
        config: loaded.config.inspection,
        coveragePercent: coverage,
        ...(previous === null ? {} : { previousFingerprints: previous.fingerprints }),
      });

      const entry: HistoryEntry = {
        inspectedAt: inspection.inspectedAt,
        totalScore: inspection.totalScore,
        scores: inspection.scores,
        fingerprints: inspection.findings.map((finding) => finding.fingerprint),
        reference: null,
      };

      const markdown = renderReport(inspection, {
        previous:
          previous === null
            ? null
            : {
                totalScore: previous.totalScore,
                scores: previous.scores,
                reference: previous.reference ?? '',
              },
        historyEntry: entry,
      });

      let reference: string | null = null;
      if (gateway !== null && repo !== null) {
        const info = await gateway.getRepoInfo(repo);
        const pageName = inspection.inspectedAt.slice(0, 10);
        const token =
          resolved.env[loaded.config.platform.tokenEnv] ?? resolved.env['GITHUB_TOKEN'] ?? '';

        const writeResult = await writeReport({
          config: loaded.config.inspection,
          hasWiki: info.hasWiki,
          pageName,
          markdown,
          writers: {
            issue: createGitHubIssueWriter(gateway, repo),
            ...(info.hasWiki
              ? {
                  wiki: createGitWikiWriter({
                    cloneUrl: `https://x-access-token:${token}@github.com/${repo.owner}/${repo.repo}.wiki.git`,
                    workDir: join(resolved.cwd, '.acr', 'wiki'),
                    run: runCommand,
                  }),
                }
              : {}),
          },
        });

        if (writeResult.warning !== null) stderr(`告警：${writeResult.warning}\n`);
        reference = writeResult.location?.reference ?? null;
      }

      const outPath = flags['out'];
      if (outPath !== undefined && outPath !== '') {
        await writeFile(outPath, markdown, 'utf8');
        stdout(`报告已写入 ${outPath}\n`);
      } else if (!willWrite) {
        stdout(markdown);
      }

      if (reference !== null) stdout(`报告已写入平台：${reference}\n`);

      // 本地历史仍然记一份：本地连续跑时不必依赖平台
      if (flags['no-history'] === undefined) {
        const updated = appendHistory(
          history,
          { ...entry, reference },
          loaded.config.inspection.historyDepth,
        );
        try {
          await mkdir(join(resolved.cwd, '.acr'), { recursive: true });
          await writeFile(historyFile, serializeHistory(updated), 'utf8');
        } catch (error) {
          stderr(
            `告警：历史未记录，下期无法对比（${error instanceof Error ? error.message : String(error)}）\n`,
          );
        }
      }

      return 0;
    }

    // 所有已登记的子命令都在上面处理完了；走到这里说明登记表与实现脱节    // 所有已登记的子命令都在上面处理完了；走到这里说明登记表与实现脱节
    stderr('该子命令尚未接入实现\n');
    return 3;
  } catch (error) {
    stderr(`运行失败：${error instanceof Error ? error.message : String(error)}\n`);
    return 4;
  }
}
