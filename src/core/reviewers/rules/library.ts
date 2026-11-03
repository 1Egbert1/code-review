/**
 * 规则库：把「项目该遵守的写法」按语言与路径挑出来，注入提示词。
 *
 * 三个必须想清楚的点：
 *
 * 1. **不能整段抄别人的规范。** 大厂公开文档的授权各不相同，抄进来是法律风险。
 *    正确做法是「提取规则是什么，自己重写成一句可执行的指令」，并在来源里标清楚。
 * 2. **不能全量注入。** 一门语言的规范动辄几百条，全塞进去只会稀释注意力，
 *    让模型顾不上看代码。必须按语言筛、按路径筛，并设条数上限。
 * 3. **规则低于项目实际写法。** 仓库里全是 snake_case 时，注入「用 camelCase」的规则
 *    只会制造噪音。所以渲染出来的规则块必须写明「与项目实际写法冲突时，以项目为准」。
 */

/** 允许引用的授权。没有明确开放授权的内部规范不在其列。 */
export const ALLOWED_LICENSES = ['own', 'MIT', 'Apache-2.0', 'BSD-3-Clause', 'CC-BY-4.0'] as const;

export type License = (typeof ALLOWED_LICENSES)[number];

export interface RuleSource {
  readonly name: string;
  readonly url: string | null;
  /** 允许清单之外的取值会被 validateLibrary 拦下，因此这里放宽为字符串 */
  readonly license: string;
  /** 若原文本被改动过，写明改了什么。署名要求通常包含这一条。 */
  readonly modified?: string;
}

export interface RuleEntry {
  readonly id: string;
  /** 一句话说明这条规则管什么 */
  readonly title: string;
  /** 注入提示词的具体指令，必须可执行，不写「保持代码整洁」这种废话 */
  readonly instruction: string;
  /** 适用语言；`['*']` 表示不限 */
  readonly languages: readonly string[];
  /** 仅在这些路径下注入；空数组表示不限 */
  readonly pathPatterns?: readonly string[];
  readonly source: RuleSource;
}

export interface RuleLibrary {
  readonly entries: readonly RuleEntry[];
}

/** 内置规则。**全部自己撰写**，不复制任何厂商文档原文。 */
export const BUILTIN_RULES: RuleLibrary = {
  entries: [
    {
      id: 'await-async-calls',
      title: '异步调用必须被等待或显式忽略',
      instruction:
        '调用返回 Promise 的函数时，要么 await / return，要么显式标注为何不等待；裸调用是缺陷。',
      languages: ['*'],
      source: { name: '本项目', url: null, license: 'own' },
    },
    {
      id: 'early-return',
      title: '优先早返回，减少嵌套',
      instruction: '能用早返回消掉的嵌套就消掉；判断条件写在前面，主流程不要包在三层 if 里。',
      languages: ['*'],
      source: { name: '本项目', url: null, license: 'own' },
    },
    {
      id: 'no-empty-catch',
      title: '异常不得静默吞掉',
      instruction: 'catch 里至少要记录或上抛；只留一个空块会让线上问题失去唯一线索。',
      languages: ['*'],
      source: { name: '本项目', url: null, license: 'own' },
    },
    {
      id: 'explicit-any',
      title: '禁止用 any 逃避类型',
      instruction: '不要用 any 或 @ts-ignore 绕过类型检查；确实无法表达时用 unknown 并收窄。',
      languages: ['typescript'],
      source: { name: '本项目', url: null, license: 'own' },
    },
    {
      id: 'test-case-focus',
      title: '一个用例只验证一件事',
      instruction: '单个测试只断言一个行为；失败时要能从名字直接看出哪条行为坏了。',
      languages: ['*'],
      pathPatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
      source: { name: '本项目', url: null, license: 'own' },
    },
    {
      id: 'api-boundary-validation',
      title: '接口边界必须校验入参',
      instruction: '处理外部输入的入口要先校验结构再使用；内部调用可以信任，边界不行。',
      languages: ['*'],
      pathPatterns: ['**/api/**', '**/routes/**', '**/controllers/**', '**/handlers/**'],
      source: { name: '本项目', url: null, license: 'own' },
    },
  ],
};

/** 注入条数上限。经验值：再多模型就开始忽略后面的。 */
export const MAX_INJECTED_RULES = 8;

/** 由扩展名推断语言。推断不出时返回 '*'。 */
export function languageOf(path: string): string {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'rs':
      return 'rust';
    default:
      return '*';
  }
}

/** 把 `**` 语义的简单通配转成正则。只支持 `**` 与 `*`，够用且不会写出意外的回溯。 */
function globToRegExp(pattern: string): RegExp {
  // 先把 ** 换成占位片段再替换单个 *，避免 ** 被拆成两个 [^/]*
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0001')
    .split('\u0001')
    .map((part) => part.replace(/\*/g, '[^/]*'))
    .join('.*');
  return new RegExp(`^${escaped}$`);
}

function matchesAny(path: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => globToRegExp(pattern).test(path));
}

export interface SelectOptions {
  readonly path: string | null;
  readonly limit?: number;
}

/**
 * 挑出适用于该文件的规则。
 *
 * 排序：路径限定得越具体越靠前——「测试文件里一个用例只验证一件事」比通用规则更值得占位。
 */
export function selectRules(library: RuleLibrary, options: SelectOptions): RuleEntry[] {
  const limit = options.limit ?? MAX_INJECTED_RULES;
  const path = options.path;
  const language = path === null ? '*' : languageOf(path);

  const applicable = library.entries.filter((entry) => {
    const languageOk = entry.languages.includes('*') || entry.languages.includes(language);
    if (!languageOk) return false;

    const patterns = entry.pathPatterns ?? [];
    if (patterns.length === 0) return true;
    // 全局视角（path 为 null）时，路径专属规则不注入——它可能只对部分文件成立
    if (path === null) return false;
    return matchesAny(path, patterns);
  });

  const specificity = (entry: RuleEntry): number => ((entry.pathPatterns ?? []).length > 0 ? 1 : 0);
  return [...applicable].sort((a, b) => specificity(b) - specificity(a)).slice(0, limit);
}

/** 渲染成提示词片段。冲突时的优先级必须写进去，否则规则会压过项目实际写法。 */
export function renderRuleBlock(rules: readonly RuleEntry[]): string {
  if (rules.length === 0) return '';

  return [
    '以下规则是仓库的既有约定，作为审查依据：',
    ...rules.map((rule) => `- ${rule.instruction}`),
    '',
    '若这些规则与项目里实际的写法冲突，以项目里的写法为准——不要用通用规范去否定本项目的习惯。',
  ].join('\n');
}

/** 生成来源声明，供 README / NOTICE 使用。署名是许可证要求的一部分，不能省。 */
export function collectNotices(library: RuleLibrary): string {
  const bySource = new Map<string, RuleEntry[]>();
  for (const entry of library.entries) {
    const key = `${entry.source.name}\u0000${entry.source.license}\u0000${entry.source.url ?? ''}\u0000${entry.source.modified ?? ''}`;
    const list = bySource.get(key) ?? [];
    list.push(entry);
    bySource.set(key, list);
  }

  const lines: string[] = ['# 规则来源与授权', ''];
  for (const [key, entries] of bySource) {
    const [name, license, url, modified] = key.split('\u0000');
    lines.push(`- ${name ?? ''}（${license ?? ''}）${url === '' ? '' : ` ${url ?? ''}`}`);
    if (modified !== '') lines.push(`  - 改动：${modified ?? ''}`);
    lines.push(`  - 使用：${entries.map((entry) => entry.id).join('、')}`);
  }
  return lines.join('\n');
}

export interface LicenseProblem {
  readonly ruleId: string;
  readonly reason: string;
}

/**
 * 校验规则库的授权合规性。
 *
 * 没有明确开放授权的规范**不能**用——README 里写一句「来源：某公司规范」并不构成授权。
 * 这条检查放在这里，是为了让「顺手抄一段」在 CI 就被拦下。
 */
export function validateLibrary(library: RuleLibrary): LicenseProblem[] {
  const problems: LicenseProblem[] = [];

  for (const entry of library.entries) {
    const license = entry.source.license;
    if (!(ALLOWED_LICENSES as readonly string[]).includes(license)) {
      problems.push({ ruleId: entry.id, reason: `许可证「${license}」不在允许清单内` });
    }
    if (entry.source.name.trim() === '') {
      problems.push({ ruleId: entry.id, reason: '缺少来源声明' });
    }
    if (entry.instruction.trim() === '') {
      problems.push({ ruleId: entry.id, reason: '规则正文为空' });
    }
  }

  return problems;
}
