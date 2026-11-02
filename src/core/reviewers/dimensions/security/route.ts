/**
 * 安全维度的风险路由。
 *
 * 目的不是「审得更全」，而是**把不该送审的文件挡在外面**。把一个纯格式化函数送去做安全审查，
 * 除了花钱，还会逼着模型报点什么——于是 `formatDate` 里也会冒出「未校验输入」。
 *
 * 纯函数、零网络、可单测。每条命中都带理由，报告里要能解释「这个文件为什么被安全审」。
 */

/** 路径里出现这些词，说明文件大概率在处理信任边界。 */
const PATH_KEYWORDS: readonly string[] = [
  'auth',
  'login',
  'logout',
  'session',
  'token',
  'crypto',
  'password',
  'secret',
  'upload',
  'download',
  'sql',
  'query',
  'exec',
  'shell',
  'admin',
  'payment',
  'order',
  'user',
  'permission',
  'role',
];

/** 请求入口目录：这里的东西天然接触外部输入。 */
const ENTRY_DIRS: readonly string[] = [
  'api/',
  'routes/',
  'controllers/',
  'handlers/',
  'middleware/',
  'pages/api/',
];

/** 内容里出现这些，说明代码在做危险动作。 */
const CONTENT_PATTERNS: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: '数据库查询拼接', pattern: /\b(select|insert|update|delete)\b[\s\S]{0,80}(\+|\$\{)/i },
  { label: '命令执行', pattern: /\b(exec|execSync|spawn|spawnSync|system)\s*\(/ },
  { label: '模板渲染', pattern: /\b(renderTemplate|compile|eval|new\s+Function)\s*\(/ },
  { label: '反序列化', pattern: /\b(deserialize|unserialize|yaml\.load|pickle\.loads)\s*\(/ },
  {
    label: '路径拼接',
    pattern: /\b(path\.join|path\.resolve|readFile|writeFile|createReadStream)\s*\(/,
  },
  { label: '加解密', pattern: /\b(createCipheriv|createDecipheriv|createHash|sign|verify)\s*\(/ },
  { label: '外部请求', pattern: /\b(fetch|axios|request|http\.get|https\.get)\s*\(/ },
  { label: '直接插入 HTML', pattern: /(innerHTML|dangerouslySetInnerHTML|v-html|document\.write)/ },
  { label: '浏览器存储', pattern: /(localStorage|sessionStorage|document\.cookie)/ },
  { label: '权限判断', pattern: /\b(isAdmin|hasRole|checkPermission|authorize|canAccess)\b/i },
];

export interface RouteInput {
  readonly path: string;
  /** 文件改动后的完整内容；取不到时为 null（只能按路径判断） */
  readonly content: string | null;
}

export interface RouteDecision {
  readonly send: boolean;
  /** 命中的理由，按可读顺序排列；为空表示未命中任何风险面 */
  readonly reasons: readonly string[];
}

/** 判断一个文件是否需要送安全审查。 */
export function routeForSecurity(input: RouteInput): RouteDecision {
  const reasons: string[] = [];
  const lowerPath = input.path.toLowerCase();

  for (const keyword of PATH_KEYWORDS) {
    if (lowerPath.includes(keyword)) reasons.push(`路径含「${keyword}」`);
  }

  for (const dir of ENTRY_DIRS) {
    if (lowerPath.includes(dir)) reasons.push(`位于请求入口目录 ${dir}`);
  }

  if (input.content !== null) {
    for (const { label, pattern } of CONTENT_PATTERNS) {
      if (pattern.test(input.content)) reasons.push(`内容涉及${label}`);
    }
  }

  return { send: reasons.length > 0, reasons };
}

/** 把路由结果拼成一句可读说明，进报告与日志。 */
export function describeRoute(decision: RouteDecision): string {
  return decision.send ? `命中：${decision.reasons.join('、')}` : '未命中任何风险面，跳过安全审查';
}
