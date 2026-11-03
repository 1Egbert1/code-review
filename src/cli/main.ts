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
import { readFile } from 'node:fs/promises';

import { loadConfig } from '../config/load.js';
import { describeActions, runReview } from '../core/engine.js';
import { createGitHubCommentPort } from '../platforms/github/comments.js';
import { createGitHubGateway } from '../platforms/github/client.js';
import { fetchSnapshot } from '../platforms/github/fetch.js';
import { createOpenAiCompatClient } from '../providers/openai-compat.js';
import { compareBaselines, isBaselineSnapshot } from '../core/eval/baseline.js';
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

  const prText = flags['pr'] ?? deps.env['ACR_PULL_REQUEST'];
  const prNumber = prText === undefined || prText === '' ? Number.NaN : Number(prText);
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    deps.stderr('缺少合并请求编号：请用 --pr <编号> 指定\n');
    return 3;
  }

  const token = deps.env[config.platform.tokenEnv] ?? deps.env['GITHUB_TOKEN'];
  if (token === undefined || token === '') {
    deps.stderr(`缺少平台令牌：请设置环境变量 ${config.platform.tokenEnv}\n`);
    return 3;
  }

  const apiKey = deps.env[config.llm.apiKeyEnv];
  if (apiKey === undefined || apiKey === '') {
    deps.stderr(`缺少模型密钥：请设置环境变量 ${config.llm.apiKeyEnv}\n`);
    return 3;
  }

  const ref = { ...repo, number: prNumber };
  const gateway = createGitHubGateway(token);

  const request: ReviewRequest = {
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

  let headSha = '';

  const result: ReviewResult = await runReview(request, {
    config,
    client,
    fetchSnapshot: async () => {
      headSha = await gateway.getPullRequestHeadSha(ref);
      const fetched = await fetchSnapshot(gateway, ref, headSha, config.review.skipPaths);
      for (const warning of fetched.warnings) deps.stderr(`告警：${warning.message}\n`);
      return fetched.snapshot;
    },
    // 只打印模式不创建写入端口：没有端口就不可能发出写请求
    port: dryRun ? null : createGitHubCommentPort(gateway, ref, headSha),
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

    // inspect 在后续任务包实现。现在明确告知，而不是静默成功。
    stderr(`子命令 ${first} 尚未实现\n`);
    return 3;
  } catch (error) {
    stderr(`运行失败：${error instanceof Error ? error.message : String(error)}\n`);
    return 4;
  }
}
