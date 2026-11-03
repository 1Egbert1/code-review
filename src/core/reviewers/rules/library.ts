/**
 * 规则库：把「项目该遵守的写法」按语言、路径、维度挑出来，注入提示词。
 *
 * 四条必须想清楚的点：
 *
 * 1. **不复制别人的条文原文。** 三方规范的授权各不相同，而《阿里巴巴Java开发手册》的 PDF
 *    页脚写明「禁止用于商业用途」。表达受版权保护，但**规则本身是思想，不受版权保护**——
 *    所以做法是：只提炼「这条规则要求什么」，用自己的话写成一句可执行指令，并在来源里
 *    标清依据（basis）。这样既合规，也让规则能适配本工具的字段而不是硬搬别人的排版。
 * 2. **约束力要带进来。** 强制 / 推荐 / 参考三级的处理完全不同：强制要能被门禁挡住，
 *    参考只该提示。丢了这一层，规则库就退化成一张平铺的愿望清单。
 * 3. **不能全量注入。** 一门语言几百条，全塞进去只会稀释注意力。必须按语言筛、按路径筛、
 *    按约束力排序，并设条数上限。
 * 4. **规则低于项目实际写法。** 仓库里全是 snake_case 时，注入「用 camelCase」只会制造噪音。
 *    渲染出的规则块必须写明冲突时以项目为准。
 */

/** 允许引用的授权。没有明确开放授权的规范不在其列。 */
export const ALLOWED_LICENSES = [
  'own',
  'MIT',
  'Apache-2.0',
  'BSD-3-Clause',
  'CC-BY-4.0',
  'MPL-2.0',
] as const;

export type License = (typeof ALLOWED_LICENSES)[number];

/** 约束力三级，对应「强制 / 推荐 / 参考」。 */
export type RuleLevel = 'mandatory' | 'recommended' | 'reference';

/** 规则所属维度。前七项对齐后端手册的划分，末项是前端工程规约。 */
export type RuleDimension =
  | 'naming'
  | 'coding'
  | 'exception-log'
  | 'unit-test'
  | 'security'
  | 'database'
  | 'architecture'
  | 'frontend';

export const DIMENSION_LABEL: Readonly<Record<RuleDimension, string>> = {
  naming: '命名',
  coding: '编程',
  'exception-log': '异常与日志',
  'unit-test': '单元测试',
  security: '安全',
  database: '数据库',
  architecture: '工程结构',
  frontend: '前端工程',
};

/** 约束力对应的严重度。强制能被门禁挡住，参考只提示。 */
export function severityOf(level: RuleLevel): 'major' | 'minor' | 'nit' {
  if (level === 'mandatory') return 'major';
  if (level === 'recommended') return 'minor';
  return 'nit';
}

export interface RuleSource {
  readonly name: string;
  readonly url: string | null;
  /** 允许清单之外的取值会被 validateLibrary 拦下，因此这里放宽为字符串 */
  readonly license: string;
  /**
   * 依据：这条规则从哪来、第几版、哪一节。
   * 只写「依据」不写「原文」，是规避版权风险的方式，也是可追溯的唯一途径。
   */
  readonly basis?: string;
  /** 若原文本被改动过，写明改了什么。署名要求通常包含这一条。 */
  readonly modified?: string;
}

export interface RuleEntry {
  readonly id: string;
  /** 约束力等级 */
  readonly level: RuleLevel;
  readonly dimension: RuleDimension;
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

/**
 * 注入条数上限。
 *
 * 14 条时实测：安全与异常两类（强制项最多）就把名额吃满，编程类（equals、@Override、
 * 集合遍历）全被挤出——那些恰恰是最容易在现实代码里出错的地方。18 条能覆盖到它们，
 * 又没长到让模型开始忽略后面的条目。
 */
export const MAX_INJECTED_RULES = 18;

/** 由扩展名推断语言。推断不出时返回 '*'。 */
export function languageOf(path: string): string {
  const dot = path.lastIndexOf('.');
  const ext = dot < 0 ? '' : path.slice(dot + 1).toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
    case 'vue':
      return 'javascript';
    case 'java':
      return 'java';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'sql':
      return 'sql';
    default:
      return '*';
  }
}

/** 把 `**` 语义的简单通配转成正则。只支持 `**` 与 `*`，够用且不会写出意外的回溯。 */
function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  let out = '';
  let index = 0;

  while (index < escaped.length) {
    // `**/` 表示「任意层目录，且可以一层都没有」——否则 `**/*.test.*` 匹配不到根目录下的文件
    if (escaped.startsWith('**/', index)) {
      out += '(?:.*/)?';
      index += 3;
      continue;
    }
    if (escaped.startsWith('**', index)) {
      out += '.*';
      index += 2;
      continue;
    }
    if (escaped[index] === '*') {
      out += '[^/]*';
      index += 1;
      continue;
    }
    out += escaped[index];
    index += 1;
  }

  return new RegExp(`^${out}$`);
}

function matchesAny(path: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => globToRegExp(pattern).test(path));
}

export interface SelectOptions {
  readonly path: string | null;
  readonly limit?: number;
  /** 只看某些维度 */
  readonly dimensions?: readonly RuleDimension[];
  /** 只看某些约束力等级 */
  readonly levels?: readonly RuleLevel[];
}

const LEVEL_RANK: Readonly<Record<RuleLevel, number>> = {
  mandatory: 0,
  recommended: 1,
  reference: 2,
};

/**
 * 维度优先级：注入名额有限时必须先保高风险的。
 *
 * 只按约束力排序会出现一个坏结果：命名和格式类规则数量最多，全是「强制」，
 * 于是把安全、异常、数据库的条目全挤出 14 条的名额——审查变成了挑格式。
 */
const DIMENSION_RANK: Readonly<Record<RuleDimension, number>> = {
  security: 0,
  'exception-log': 1,
  database: 2,
  coding: 3,
  'unit-test': 4,
  architecture: 5,
  naming: 6,
  frontend: 7,
};

/**
 * 挑出适用于该文件的规则。
 *
 * 排序：约束力（强制最前）→ 路径限定更具体的靠前 → 原始顺序。
 * 强制排在前面不只是美观：注入有上限，被截掉的必须是「参考」而不是「强制」。
 */
export function selectRules(library: RuleLibrary, options: SelectOptions): RuleEntry[] {
  const limit = options.limit ?? MAX_INJECTED_RULES;
  const path = options.path;
  const language = path === null ? '*' : languageOf(path);

  const applicable = library.entries.filter((entry) => {
    if (options.levels !== undefined && !options.levels.includes(entry.level)) return false;
    if (options.dimensions !== undefined && !options.dimensions.includes(entry.dimension))
      return false;

    const languageOk = entry.languages.includes('*') || entry.languages.includes(language);
    if (!languageOk) return false;

    const patterns = entry.pathPatterns ?? [];
    if (patterns.length === 0) return true;
    // 全局视角（path 为 null）时，路径专属规则不注入——它可能只对部分文件成立
    if (path === null) return false;
    return matchesAny(path, patterns);
  });

  const specificity = (entry: RuleEntry): number => ((entry.pathPatterns ?? []).length > 0 ? 1 : 0);

  return [...applicable]
    .sort((a, b) => {
      const byLevel = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
      if (byLevel !== 0) return byLevel;

      const byDimension = DIMENSION_RANK[a.dimension] - DIMENSION_RANK[b.dimension];
      if (byDimension !== 0) return byDimension;

      return specificity(b) - specificity(a);
    })
    .slice(0, limit);
}

const LEVEL_LABEL: Readonly<Record<RuleLevel, string>> = {
  mandatory: '强制',
  recommended: '推荐',
  reference: '参考',
};

/**
 * 渲染成提示词片段。按维度分组，每条标注约束力。
 *
 * 冲突时的优先级必须写进去，否则规则会压过项目实际写法——那是这个功能最容易产生的噪音源。
 */
export function renderRuleBlock(rules: readonly RuleEntry[]): string {
  if (rules.length === 0) return '';

  const groups = new Map<RuleDimension, RuleEntry[]>();
  for (const rule of rules) {
    const list = groups.get(rule.dimension) ?? [];
    list.push(rule);
    groups.set(rule.dimension, list);
  }

  const sections: string[] = ['以下是仓库的既有约定，作为审查依据：'];
  for (const [dimension, entries] of groups) {
    sections.push(`【${DIMENSION_LABEL[dimension]}】`);
    for (const entry of entries) {
      sections.push(`- （${LEVEL_LABEL[entry.level]}）${entry.instruction}`);
    }
  }

  sections.push(
    '若这些规则与项目里实际的写法冲突，以项目里的写法为准——不要用通用规范去否定本项目的习惯。',
  );
  return sections.join('\n');
}

/** 生成来源声明，供 NOTICE.md 使用。署名与依据是许可证要求的一部分，不能省。 */
export function collectNotices(library: RuleLibrary): string {
  const bySource = new Map<string, RuleEntry[]>();
  for (const entry of library.entries) {
    const key = [
      entry.source.name,
      entry.source.license,
      entry.source.url ?? '',
      entry.source.basis ?? '',
      entry.source.modified ?? '',
    ].join('\u0000');
    const list = bySource.get(key) ?? [];
    list.push(entry);
    bySource.set(key, list);
  }

  const lines: string[] = ['# 规则来源与授权', ''];
  for (const [key, entries] of bySource) {
    const [name, license, url, basis, modified] = key.split('\u0000');
    lines.push(`- **${name ?? ''}**（${license ?? ''}）${url === '' ? '' : ` ${url ?? ''}`}`);
    if (basis !== '') lines.push(`  - 依据：${basis ?? ''}`);
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
 * 没有明确开放授权的规范**不能**复制其原文——README 里写一句「来源：某公司规范」并不构成授权。
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
    // 依据三方规范时必须有 basis，否则日后无法追溯「这条从哪来」
    if (entry.source.license !== 'own' && (entry.source.basis ?? '').trim() === '') {
      problems.push({ ruleId: entry.id, reason: '引用三方规范但未写明依据' });
    }
  }

  return problems;
}
