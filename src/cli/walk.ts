/**
 * 目录遍历：为巡检收集源码文件。
 *
 * 只读文本类文件。二进制、产物、依赖目录必须跳过——它们既没有分析价值，还会把
 * 「行数」「重复率」这些指标算歪（一个压缩过的 bundle.js 能让重复率飙到 60%）。
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

/** 分析的文件类型。加新语言时只改这一处。 */
const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
  '.svelte',
  '.py',
  '.go',
  '.java',
  '.rs',
  '.rb',
  '.php',
  '.cs',
]);

/** 永远不分析的目录。理由同上：会把指标算歪。 */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.git',
  '.next',
  '.nuxt',
  '.workbuddy',
  'vendor',
  '__pycache__',
  '.venv',
]);

export interface SourceFileEntry {
  readonly path: string;
  readonly content: string;
}

/** 判断扩展名是否值得分析。 */
export function isSourceFile(path: string): boolean {
  const dot = path.lastIndexOf('.');
  if (dot < 0) return false;
  return SOURCE_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

/**
 * 递归收集源码文件。
 *
 * 路径统一用 `/` 分隔：指标与报告里到处是路径拼接，混用分隔符会在 Windows 上
 * 产生「同一个文件两个名字」这种极难发现的错。
 *
 * @param maxFiles 上限，防止在超大仓库上把内存打满
 */
export async function collectSourceFiles(
  root: string,
  maxFiles = 5000,
): Promise<SourceFileEntry[]> {
  const files: SourceFileEntry[] = [];

  const walk = async (dir: string): Promise<void> => {
    if (files.length >= maxFiles) return;

    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= maxFiles) return;

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(join(dir, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (!isSourceFile(entry.name)) continue;

      const absolute = join(dir, entry.name);
      const path = relative(root, absolute).split('\\').join('/');
      files.push({ path, content: await readFile(absolute, 'utf8') });
    }
  };

  await walk(root);
  // 排序保证同一份仓库每次跑出来的顺序一致，报告与指纹才可比
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/** 额外读一个文件（如 package.json 或覆盖率报告），不存在时返回 null。 */
export async function readOptional(root: string, name: string): Promise<SourceFileEntry | null> {
  try {
    const content = await readFile(join(root, name), 'utf8');
    return { path: name, content };
  } catch {
    return null;
  }
}
