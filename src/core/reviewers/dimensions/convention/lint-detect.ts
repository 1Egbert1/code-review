/**
 * 检测仓库里是否已有格式化 / 静态检查配置。
 *
 * 为什么要它：CI 已经报过的问题，AI 再说一遍是纯负收益——作者会把整个工具当成噪音源。
 * 检出配置就把规范性维度**整体静音**，宁可少报，不要重复报。
 *
 * 判定只看文件名，不看内容：内容解析要引入各家的配置格式，收益极低。
 */

/** 常见配置文件。命中任意一个就认为这类问题已有人在管。 */
const LINT_CONFIGS: readonly string[] = [
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.js',
  'prettier.config.js',
  '.stylelintrc',
  '.stylelintrc.json',
  '.editorconfig',
  'biome.json',
  'ruff.toml',
  '.golangci.yml',
];

const CONFIG_SET = new Set(LINT_CONFIGS.map((name) => name.toLowerCase()));

/** 返回命中的配置文件名；空数组表示没检出。 */
export function detectLintConfig(paths: readonly string[]): string[] {
  const found = new Set<string>();

  for (const path of paths) {
    const name = path.split('/').pop()?.toLowerCase() ?? '';
    if (CONFIG_SET.has(name)) found.add(name);
  }

  return [...found];
}

/**
 * 规范性维度是否应该静音。
 *
 * `respectLintConfig` 为假时永不静音——有些项目虽然装了配置但没接进 CI，
 * 那种情况下 AI 补一遍是有价值的。这个开关交给用户判断。
 */
export function shouldMuteConvention(
  paths: readonly string[],
  respectLintConfig: boolean,
): boolean {
  if (!respectLintConfig) return false;
  return detectLintConfig(paths).length > 0;
}
