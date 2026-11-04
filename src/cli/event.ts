/**
 * 从 GitHub 的事件载荷里补充上下文。
 *
 * 为什么需要这一层：Action 文档里承诺「零配置」——仓库与 PR 编号都从事件上下文取。
 * 这条承诺被打破过一次，方式很隐蔽：
 *
 *   调用方写 `with: pull-request: ${{ inputs.pr }}`，想表达「PR 事件时留空，由事件上下文提供」。
 *   但**在 PR 事件里这个表达式解析成空串，而显式传空串会覆盖 action 的默认值**
 *   （默认值本身就写着 `github.event.pull_request.number`）。于是默认值根本没被用上，
 *   下游拿到一个空字符串，报「缺少审查对象」。
 *
 * 教训不是「记得别传空串」，而是：**不能把「没传」和「传了个空」当成一回事**。
 * 事件文件 `GITHUB_EVENT_PATH` 是平台自己写盘的，不经过调用方的表达式，
 * 所以它是最稳的一层兜底，放在最后。
 */

/** 事件文件里可能出现 PR 编号的位置。值不一定是数字，所以逐个校验。 */
const NUMBER_PATHS: readonly (readonly string[])[] = [
  ['pull_request', 'number'],
  ['issue', 'number'],
  ['inputs', 'pr'],
];

/** 从解析后的事件载荷里取编号；取不到返回 null。 */
export function numberFromEventPayload(payload: unknown): number | null {
  for (const path of NUMBER_PATHS) {
    let node: unknown = payload;
    for (const key of path) {
      if (typeof node !== 'object' || node === null) {
        node = undefined;
        break;
      }
      node = (node as Record<string, unknown>)[key];
    }
    const value = typeof node === 'string' ? Number(node) : node;
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  }
  return null;
}

export interface ResolvePullRequestInput {
  /** 命令行的 `--pr`。优先级最高：人显式打的字，不该被环境覆盖 */
  readonly flag: string | undefined;
  readonly env: NodeJS.ProcessEnv;
  /** 读事件文件。测试注入用；默认走真实文件系统 */
  readonly readEventFile?: (path: string) => Promise<string>;
}

/**
 * 解析 PR 编号。三个来源依次尝试，全都拿不到时返回 `NaN`。
 *
 * 空串与空白串都按「没有」处理：环境变量的常见坑就是把「未设置」写成 `''`，
 * 而 `??` 只挡 `undefined`/`null`，挡不住空串。
 */
export async function resolvePullRequestNumber(input: ResolvePullRequestInput): Promise<number> {
  const fromFlag = toNumber(input.flag);
  if (fromFlag !== null) return fromFlag;

  const fromEnv = toNumber(input.env['ACR_PULL_REQUEST']);
  if (fromEnv !== null) return fromEnv;

  const eventPath = input.env['GITHUB_EVENT_PATH'];
  if (eventPath === undefined || eventPath.trim() === '') return Number.NaN;

  try {
    const read = input.readEventFile ?? defaultReadEventFile;
    const parsed: unknown = JSON.parse(await read(eventPath));
    const fromEvent = numberFromEventPayload(parsed);
    return fromEvent ?? Number.NaN;
  } catch {
    // 读不到事件文件不算错误：本地跑的时候本来就没有它，交给上层报「缺少审查对象」
    return Number.NaN;
  }
}

function toNumber(text: string | undefined): number | null {
  if (text === undefined) return null;
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isInteger(value) && value > 0 ? value : null;
}

async function defaultReadEventFile(path: string): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  return readFile(path, 'utf8');
}
