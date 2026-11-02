/**
 * 极简 glob 匹配。
 *
 * 为什么自己写：规格书 2.1 限定运行时依赖只能有 octokit 与 yaml，
 * 而跳过清单只需要 `**`、`*`、`?` 三种通配，自己实现比引依赖划算。
 *
 * 支持的语法：
 * - `*`   匹配单层内的任意字符（不跨斜杠）
 * - `**`  匹配跨层任意字符
 * - `**\/` 匹配「零个或多个目录层级」，因此 `**\/*.lock` 能同时命中 `a.lock` 与 `dir/a.lock`
 * - `?`   匹配单个非斜杠字符
 *
 * 路径一律使用正斜杠，调用方负责先把反斜杠换成斜杠。
 */

const REGEX_SPECIAL = /[.+^${}()|[\]\\]/g;

function escapeRegex(char: string): string {
  return char.replace(REGEX_SPECIAL, '\\$&');
}

/**
 * 把 glob 编译成锚定的正则。
 *
 * @param pattern glob 模式，如 `**\/*.lock`
 */
export function compileGlob(pattern: string): RegExp {
  let source = '^';
  let i = 0;

  while (i < pattern.length) {
    const char = pattern.charAt(i);

    if (char === '*') {
      const isDoubleStar = pattern.charAt(i + 1) === '*';
      if (isDoubleStar) {
        // `**/` 表示「零个或多个目录」，这样才能同时命中根目录下的同名文件
        if (pattern.charAt(i + 2) === '/') {
          source += '(?:.*/)?';
          i += 3;
          continue;
        }
        source += '.*';
        i += 2;
        continue;
      }
      source += '[^/]*';
      i += 1;
      continue;
    }

    if (char === '?') {
      source += '[^/]';
      i += 1;
      continue;
    }

    source += escapeRegex(char);
    i += 1;
  }

  return new RegExp(`${source}$`);
}

/** 单条 glob 是否命中。 */
export function matchesGlob(path: string, pattern: string): boolean {
  return compileGlob(pattern).test(path.replace(/\\/g, '/'));
}

/**
 * 判断路径是否命中任意一条模式。
 *
 * @param patterns 空数组表示不跳过任何文件
 */
export function matchesAny(path: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => matchesGlob(path, pattern));
}
