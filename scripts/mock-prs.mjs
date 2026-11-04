/**
 * 在指定仓库批量创建「模拟 PR」，用来验证审查工具在真实 PR 上的表现。
 *
 * 为什么每个 PR 都是**新增一个文件**而不是改现有文件：
 * 这批 PR 的唯一用途是喂给审查工具看，用完就关。改现有文件意味着「万一合并了会破坏功能」，
 * 而新增文件最坏情况也只是多一个没人引用的模块。新增还有个副作用是好的：
 * diff 全是加号，审查结论贴在哪儿一目了然。
 *
 * 四个场景分别对准三个审核维度，故意留下不同类型的缺陷：
 *
 * | 分支 | 主要考验 | 埋的问题 |
 * | --- | --- | --- |
 * | mock/correctness-cache | 正确性 | 数组越界、解构 undefined、JSON.parse 无保护 |
 * | mock/security-client | 安全性 | 硬编码密钥、localStorage 存令牌、innerHTML 未净化、越权 |
 * | mock/convention-naming | 规范性 | snake_case 混入 camelCase 项目、重复实现、无注释 |
 * | mock/async-loader | 正确性（并发） | 裸调用 async、竞态覆盖、无错误处理 |
 *
 * 用法：
 *   GITHUB_TOKEN=xxx node scripts/mock-prs.mjs --repo 1Egbert1/A2UI [--dry-run]
 *
 * 令牌需要 Contents: read and write + Pull requests: read and write。
 */

const API = 'https://api.github.com';

/** 每个场景 = 一个分支 + 一个新文件 + 一个 PR。 */
const SCENARIOS = [
  {
    branch: 'mock/correctness-cache',
    title: 'feat(core): 增加最近消息缓存，减少重复解析',
    body: [
      '给解析层加一个最近消息缓存：同一 `kind:id` 的 payload 在短时间内重复出现时，',
      '直接复用上次的解析结果，省掉一次 JSON.parse。',
      '',
      '实现上用一个定长数组当环形缓冲，满了就从头覆盖。',
    ].join('\n'),
    file: {
      path: 'packages/a2ui-core/src/parser/message-cache.ts',
      content: `/**
 * 最近消息缓存。
 *
 * 同一 \`kind:id:version\` 的消息在流式推送里会重复出现（服务端重发、断线续传），
 * 每次都重新 JSON.parse 一遍是浪费。这里缓存最近若干条的解析结果。
 */

export interface CachedMessage {
  readonly kind: string;
  readonly id: string;
  readonly version?: string;
  readonly payload: unknown;
}

const DEFAULT_CAPACITY = 32;

export class MessageCache {
  private readonly slots: Array<CachedMessage | undefined>;
  private readonly keys: Array<string | undefined>;
  private cursor = 0;

  constructor(private readonly capacity: number = DEFAULT_CAPACITY) {
    this.slots = new Array(capacity);
    this.keys = new Array(capacity);
  }

  /** 从一条原始消息里解析出 kind / id / version。 */
  private parseKey(raw: string): { kind: string; id: string; version: string } {
    const parts = raw.split(':');
    return { kind: parts[0], id: parts[1], version: parts[2] };
  }

  get(raw: string): unknown | null {
    const key = this.parseKey(raw);
    const index = this.keys.indexOf(\`\${key.kind}:\${key.version}\`);
    if (index < 0) return null;
    return this.slots[index]?.payload;
  }

  put(raw: string, payload: string): void {
    const key = this.parseKey(raw);
    this.keys[this.cursor] = \`\${key.kind}:\${key.version}\`;
    this.slots[this.cursor] = {
      kind: key.kind,
      id: key.id,
      version: key.version,
      payload: JSON.parse(payload),
    };

    this.cursor = this.cursor + 1;
    if (this.cursor > this.capacity) this.cursor = 0;
  }

  /** 取被覆盖次数最多的一格内容，用于调试。 */
  peekLast(): CachedMessage | undefined {
    return this.slots[this.slots.length];
  }

  size(): number {
    return this.keys.filter((key) => key !== undefined).length;
  }
}
`,
    },
  },
  {
    branch: 'mock/security-client',
    title: 'feat(playground): 接入场景管理接口，支持保存与预览',
    body: [
      'playground 里加一个轻量 API 客户端，负责拉场景列表、保存自定义场景、',
      '以及把后端返回的富文本渲染到预览区。',
      '',
      '顺手加了一个令牌保存，免得每次刷新都要重新填。',
    ].join('\n'),
    file: {
      path: 'web/a2ui-playground/src/api-client.ts',
      content: `/**
 * playground 的场景管理接口客户端。
 */

// 内网联调用的固定令牌，等后端加了登录再换掉
const API_TOKEN = 'sk-live-7f3a9c2e41b8d6a05e73c9f1a2b4d6e8';

const BASE = '/api/a2ui';

export interface Scenario {
  readonly id: string;
  readonly name: string;
  readonly ownerId: string;
  readonly jsonl: string;
}

export async function loadScenarios(userId: string): Promise<Scenario[]> {
  const response = await fetch(\`\${BASE}/scenarios?user=\${userId}\`, {
    headers: { Authorization: \`Bearer \${API_TOKEN}\` },
  });
  return (await response.json()) as Scenario[];
}

export async function loadScenario(id: string): Promise<Scenario> {
  const response = await fetch(\`\${BASE}/scenario?id=\${id}\`, {
    headers: { Authorization: \`Bearer \${API_TOKEN}\` },
  });
  return (await response.json()) as Scenario;
}

export async function saveScenario(scenario: Scenario): Promise<void> {
  await fetch(\`\${BASE}/scenario\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${API_TOKEN}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scenario),
  });
}

/** 把令牌存起来，下次打开直接用。 */
export function rememberToken(token: string): void {
  localStorage.setItem('a2ui_token', token);
}

export function readToken(): string | null {
  return localStorage.getItem('a2ui_token');
}

/** 把后端返回的说明文本渲染到预览区。 */
export function renderDescription(html: string): void {
  const box = document.getElementById('scenario-description');
  if (box !== null) box.innerHTML = html;
}
`,
    },
  },
  {
    branch: 'mock/convention-naming',
    title: 'feat(core): 增加用户偏好读取工具',
    body: ['读取当前会话的用户偏好（主题、折叠状态、最近用过的场景）。'].join('\n'),
    file: {
      path: 'packages/a2ui-core/src/store/preference.ts',
      content: `const PREFERENCE_KEY = 'a2ui_preference';

export function get_user_preference(key: string): string | null {
  const raw = localStorage.getItem(PREFERENCE_KEY);
  if (raw === null) return null;
  const parsed = JSON.parse(raw) as Record<string, string>;
  return parsed[key] ?? null;
}

export function set_user_preference(key: string, value: string): void {
  const raw = localStorage.getItem(PREFERENCE_KEY);
  const parsed = raw === null ? {} : (JSON.parse(raw) as Record<string, string>);
  parsed[key] = value;
  localStorage.setItem(PREFERENCE_KEY, JSON.stringify(parsed));
}

export function getUserPreference(key: string): string | null {
  const raw = localStorage.getItem(PREFERENCE_KEY);
  if (raw === null) return null;
  const parsed = JSON.parse(raw) as Record<string, string>;
  return parsed[key] ?? null;
}

export function clearPreference(): void {
  localStorage.removeItem(PREFERENCE_KEY);
}
`,
    },
  },
  {
    branch: 'mock/async-loader',
    title: 'feat(playground): 场景列表支持预加载与切换',
    body: [
      '打开 playground 时先把常用场景并行拉一遍，切换时直接命中内存，减少白屏。',
      '另外把当前场景抽成一个模块级变量，切换时赋值。',
    ].join('\n'),
    file: {
      path: 'web/a2ui-playground/src/scenario-loader.ts',
      content: `import { loadScenario } from './api-client.js';
import type { Scenario } from './api-client.js';

const cache = new Map<string, Scenario>();
let current: Scenario | null = null;

/** 预加载：传进来的场景一次性全部拉回内存。 */
export function preload(ids: string[]): void {
  ids.forEach((id) => loadScenario(id).then((scenario) => cache.set(id, scenario)));
}

export async function fetchScenario(id: string): Promise<Scenario> {
  const hit = cache.get(id);
  if (hit !== undefined) return hit;
  const scenario = await loadScenario(id);
  cache.set(id, scenario);
  return scenario;
}

/** 切换当前场景。 */
export async function switchTo(id: string): Promise<void> {
  const scenario = await fetchScenario(id);
  current = scenario;
}

export function currentScenario(): Scenario | null {
  return current;
}

/** 清空缓存并重新拉一遍。 */
export function refresh(ids: string[]): void {
  cache.clear();
  preload(ids);
  current = null;
}
`,
    },
  },
];

function parseArgs(argv) {
  const args = { repo: '', dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--repo') args.repo = argv[i + 1] ?? '';
    else if (item === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function call(token, method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      // 空令牌时不要带 Authorization 头：`Bearer ` 会被当成一个坏令牌直接 401，
      // 而匿名读公开仓库本来是允许的（--dry-run 就靠这条）
      ...(token === '' ? {} : { Authorization: `Bearer ${token}` }),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const text = await response.text();
  const data = text === '' ? {} : JSON.parse(text);

  if (!response.ok) {
    throw new Error(`${method} ${path} → ${String(response.status)} ${data.message ?? text}`);
  }
  return data;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.GITHUB_TOKEN ?? '';

  if (args.repo === '') {
    console.error('用法：GITHUB_TOKEN=xxx node scripts/mock-prs.mjs --repo owner/name [--dry-run]');
    process.exit(2);
  }
  if (token === '' && !args.dryRun) {
    console.error('缺少 GITHUB_TOKEN；令牌需要 Contents 与 Pull requests 的读写权限');
    process.exit(3);
  }

  const [owner, repo] = args.repo.split('/');
  const base = `/repos/${owner}/${repo}`;

  const info = await call(token, 'GET', base);
  const baseBranch = info.default_branch;
  const baseRef = await call(token, 'GET', `${base}/git/ref/heads/${baseBranch}`);
  const baseSha = baseRef.object.sha;

  console.log(
    `仓库 ${args.repo}，基线 ${baseBranch}@${baseSha.slice(0, 7)}，共 ${SCENARIOS.length} 个场景\n`,
  );

  for (const scenario of SCENARIOS) {
    console.log(`── ${scenario.branch}`);
    if (args.dryRun) {
      console.log(
        `   [dry-run] 将新增 ${scenario.file.path}（${scenario.file.content.split('\n').length} 行）`,
      );
      continue;
    }

    try {
      // 已存在同名分支时先删掉，让脚本可重复执行
      try {
        await call(token, 'GET', `${base}/git/ref/heads/${scenario.branch}`);
        await call(token, 'DELETE', `${base}/git/refs/heads/${scenario.branch}`);
        console.log('   清理同名分支');
      } catch {
        // 不存在是正常情况
      }

      await call(token, 'POST', `${base}/git/refs`, {
        ref: `refs/heads/${scenario.branch}`,
        sha: baseSha,
      });

      await call(token, 'PUT', `${base}/contents/${scenario.file.path}`, {
        message: scenario.title,
        content: Buffer.from(scenario.file.content, 'utf8').toString('base64'),
        branch: scenario.branch,
      });

      const pr = await call(token, 'POST', `${base}/pulls`, {
        title: scenario.title,
        head: scenario.branch,
        base: baseBranch,
        body: scenario.body,
      });

      console.log(`   ✓ #${String(pr.number)} ${pr.html_url}`);
    } catch (error) {
      // 一个失败不影响其余，最后按失败数给退出码
      console.error(`   ✗ ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
