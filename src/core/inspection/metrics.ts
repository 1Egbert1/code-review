/**
 * 巡检的指标计算。
 *
 * 全部是纯函数，输入只有「文件路径 + 内容」，不依赖改动、不调模型。
 * 这条边界很重要：指标要能单独跑、单独测、单独解释，否则「这个月为什么掉了 4 分」
 * 永远只能靠猜。
 *
 * **能力边界必须诚实**：依赖是否过期、有没有已知漏洞，需要查外部数据库（需要网络）。
 * 这里能算的只有「循环依赖」和「版本范围是否过于宽松」，剩下两项标注为未检测，
 * 不参与打分——**宁可少算，也不要编一个看起来合理的数字**。
 */

import { listFunctions } from '../context/tiers.js';

export interface SourceFile {
  readonly path: string;
  readonly content: string;
}

export interface ComplexityStats {
  readonly files: number;
  readonly totalLines: number;
  readonly functions: number;
  readonly avgFunctionLines: number;
  readonly maxFunctionLines: number;
  readonly avgCyclomatic: number;
  readonly maxCyclomatic: number;
  /** 圈复杂度超过阈值的函数数 */
  readonly complexFunctions: number;
  readonly maxFileLines: number;
}

/** 计为「一次分支」的语法。取多了会把普通语句也算进来，取少了会低估。 */
const DECISION_PATTERNS: readonly RegExp[] = [
  /\bif\s*\(/g,
  /\bfor\s*\(/g,
  /\bwhile\s*\(/g,
  /\bcase\s+/g,
  /\bcatch\s*\(/g,
  /&&/g,
  /\|\|/g,
  /\?\?/g,
  /\?\s*[^:]+:/g,
];

/** 单行里的分支点数。 */
function decisionPoints(line: string): number {
  let count = 0;
  for (const pattern of DECISION_PATTERNS) {
    // 每次用新正则，避免 lastIndex 在多次调用间残留
    const local = new RegExp(pattern.source, 'g');
    count += Math.max(0, (line.match(local) ?? []).length);
  }
  return count;
}

/** 圈复杂度 = 分支点 + 1。 */
function cyclomaticOf(lines: readonly string[], startLine: number, endLine: number): number {
  let branches = 0;
  for (let index = startLine - 1; index < endLine && index < lines.length; index += 1) {
    branches += decisionPoints(lines[index] ?? '');
  }
  return branches + 1;
}

export function computeComplexity(
  files: readonly SourceFile[],
  complexityThreshold: number,
): ComplexityStats {
  let totalLines = 0;
  let functionCount = 0;
  let functionLines = 0;
  let maxFunctionLines = 0;
  let maxFileLines = 0;
  let complexFunctions = 0;
  let cyclomaticSum = 0;
  let maxCyclomatic = 0;

  for (const file of files) {
    const lines = file.content.split('\n');
    totalLines += lines.length;
    maxFileLines = Math.max(maxFileLines, lines.length);

    for (const region of listFunctions(lines)) {
      const length = region.endLine - region.startLine + 1;
      const cyclomatic = cyclomaticOf(lines, region.startLine, region.endLine);

      functionCount += 1;
      functionLines += length;
      maxFunctionLines = Math.max(maxFunctionLines, length);
      cyclomaticSum += cyclomatic;
      maxCyclomatic = Math.max(maxCyclomatic, cyclomatic);
      if (cyclomatic > complexityThreshold) complexFunctions += 1;
    }
  }

  return {
    files: files.length,
    totalLines,
    functions: functionCount,
    avgFunctionLines: functionCount === 0 ? 0 : Math.round(functionLines / functionCount),
    maxFunctionLines,
    avgCyclomatic: functionCount === 0 ? 0 : Number((cyclomaticSum / functionCount).toFixed(1)),
    maxCyclomatic,
    complexFunctions,
    maxFileLines,
  };
}

export interface DuplicationStats {
  /** 重复代码行占总有效行的比例 0~1 */
  readonly ratio: number;
  readonly duplicatedLines: number;
  readonly totalLines: number;
  readonly blocks: number;
}

/** 窗口大小：太小会把常见语句对（`}` + 空行）当重复，太大则漏掉小段复制。 */
const DUPLICATION_WINDOW = 6;

function normalizeForHash(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

/**
 * 重复代码检测：连续 6 行归一化后完全相同的窗口，视为重复。
 *
 * 这是**行级近似**，不是语义克隆检测：改了变量名的复制粘贴会被它漏掉。
 * 取舍理由：语义检测要 AST 甚至要模型，而巡检的价值在于趋势——只要口径稳定，
 * 相对变化就能说明问题，绝对值不必精确。
 */
export function computeDuplication(files: readonly SourceFile[]): DuplicationStats {
  const windows = new Map<string, number>();
  const marked = new Set<string>();
  let totalLines = 0;

  for (const file of files) {
    const lines = file.content.split('\n').map(normalizeForHash);
    const significant = lines.filter((line) => line !== '');
    totalLines += significant.length;

    for (let start = 0; start + DUPLICATION_WINDOW <= significant.length; start += 1) {
      // 键里不带路径：跨文件复制粘贴才是最典型的重复，带上路径就永远匹配不上
      const key = significant.slice(start, start + DUPLICATION_WINDOW).join('\n');
      const seen = windows.get(key);
      if (seen === undefined) {
        windows.set(key, 1);
        continue;
      }

      windows.set(key, seen + 1);
      // 重复出现：把这段窗口的每一行都标记为重复
      for (let offset = 0; offset < DUPLICATION_WINDOW; offset += 1) {
        marked.add(`${file.path}\u0000${String(start + offset)}`);
      }
    }
  }

  return {
    ratio: totalLines === 0 ? 0 : Number((marked.size / totalLines).toFixed(4)),
    duplicatedLines: marked.size,
    totalLines,
    blocks: [...windows.values()].filter((count) => count > 1).length,
  };
}

export interface DependencyStats {
  readonly total: number;
  /** 版本范围以 ^ ~ * 开头的依赖数 */
  readonly loose: number;
  /** 相对参与计算的依赖总数 */
  readonly looseRatio: number;
  readonly circular: number;
  /** 是否检测了过期与漏洞；无外部数据时为 false */
  readonly checkedOutdated: boolean;
}

/** 判断两个路径之间是否存在循环引用。只看相对引用，与跨文件展开同一口径。 */
function resolveRelative(fromPath: string, source: string): string | null {
  if (!source.startsWith('.')) return null;
  const segments = fromPath.split('/').slice(0, -1);
  for (const part of source.split('/')) {
    if (part === '.' || part === '') continue;
    if (part === '..') segments.pop();
    else segments.push(part);
  }
  return segments.join('/');
}

/** 统计循环依赖：对每个文件做一次深度优先，遇到回边就记一次。 */
export function countCircularDependencies(files: readonly SourceFile[]): number {
  const known = new Set(files.map((file) => file.path));
  const edges = new Map<string, string[]>();

  for (const file of files) {
    const targets: string[] = [];
    const pattern = /from\s+['"](\.[^'"]+)['"]/g;
    for (const match of file.content.matchAll(pattern)) {
      const base = resolveRelative(file.path, match[1] ?? '');
      if (base === null) continue;
      // 补全扩展名：索引里存的是带扩展名的真实路径
      const candidate = [`${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}/index.ts`, base].find(
        (path) => known.has(path),
      );
      if (candidate !== undefined) targets.push(candidate);
    }
    edges.set(file.path, targets);
  }

  let circular = 0;
  const state = new Map<string, 'visiting' | 'done'>();

  const visit = (path: string): void => {
    const current = state.get(path);
    if (current === 'done') return;
    if (current === 'visiting') {
      circular += 1;
      return;
    }

    state.set(path, 'visiting');
    for (const next of edges.get(path) ?? []) visit(next);
    state.set(path, 'done');
  };

  for (const file of files) visit(file.path);
  return circular;
}

/** 从 package.json 里读依赖规模与版本范围松紧。 */
export function computeDependencies(files: readonly SourceFile[]): DependencyStats {
  const manifest = files.find(
    (file) => file.path === 'package.json' || file.path.endsWith('/package.json'),
  );
  let total = 0;
  let loose = 0;

  if (manifest !== undefined) {
    try {
      const parsed = JSON.parse(manifest.content) as Record<string, unknown>;
      const sections = ['dependencies', 'devDependencies'] as const;
      for (const section of sections) {
        const block = parsed[section];
        if (typeof block !== 'object' || block === null) continue;
        for (const range of Object.values(block as Record<string, unknown>)) {
          if (typeof range !== 'string') continue;
          total += 1;
          if (/^[\^~*]|^>=|^latest$/.test(range)) loose += 1;
        }
      }
    } catch {
      // 清单坏了不是致命问题：这一维按「无法统计」处理
    }
  }

  return {
    total,
    loose,
    looseRatio: total === 0 ? 0 : Number((loose / total).toFixed(2)),
    circular: countCircularDependencies(files),
    // 过期与漏洞需要查外部数据库，没有数据就不假装有
    checkedOutdated: false,
  };
}

export interface TypeSafetyStats {
  readonly anyCount: number;
  readonly ignoredChecks: number;
  /** 每千行的 any 数量 */
  readonly anyDensity: number;
  readonly totalLines: number;
}

export function computeTypeSafety(files: readonly SourceFile[]): TypeSafetyStats {
  let anyCount = 0;
  let ignoredChecks = 0;
  let totalLines = 0;

  for (const file of files) {
    const lines = file.content.split('\n');
    totalLines += lines.length;

    for (const line of lines) {
      // 这一项本来就是注释，必须在「跳过注释」之前统计
      if (/@ts-ignore|@ts-expect-error|eslint-disable.*no-explicit-any/.test(line))
        ignoredChecks += 1;

      // 排除注释行：`// 这里不要用 any` 不算逃逸
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

      if (/:\s*any\b|<any>|as\s+any\b/.test(line)) anyCount += 1;
    }
  }

  return {
    anyCount,
    ignoredChecks,
    anyDensity: totalLines === 0 ? 0 : Number(((anyCount / totalLines) * 1000).toFixed(1)),
    totalLines,
  };
}

export interface TestStats {
  readonly sourceFiles: number;
  readonly testFiles: number;
  /** 测试文件数与源码文件数之比 */
  readonly ratio: number;
  /** 覆盖率百分比；没有报告时为 null */
  readonly coveragePercent: number | null;
}

const TEST_PATTERN = /(\.|-)(test|spec)\.[a-z]+$|(^|\/)__tests__\//i;

export function computeTests(
  files: readonly SourceFile[],
  coveragePercent: number | null = null,
): TestStats {
  const testFiles = files.filter((file) => TEST_PATTERN.test(file.path)).length;
  const sourceFiles = files.length - testFiles;

  return {
    sourceFiles,
    testFiles,
    ratio: sourceFiles === 0 ? 0 : Number((testFiles / sourceFiles).toFixed(2)),
    coveragePercent,
  };
}
