/**
 * 跨文件有界展开与「改了没改调用方」的规则检查。
 *
 * 两件事放在一起，因为它们共用同一份索引：
 * 1. **补充材料**（L2）：把改动文件所引用的符号签名拉进上下文，让审核员不必靠猜
 * 2. **免费规则**：导出符号的参数个数变化时，比对全仓调用点的实参个数
 *
 * 第 2 件的价值在于它**完全不需要模型**：参数个数是客观事实，比对了就有结论，
 * 零成本、百分百可复现。这类检查是「确定性层」最该做的事。
 *
 * 边界：只判断**个数**，不判断类型。个数不匹配在 JavaScript 里是真 bug，
 * 在 TypeScript 里通常编译就会报——但 CI 未必跑了编译，所以仍然值得报。
 */

import type { DiffLine, ParsedDiff } from '../../contracts/diff.js';
import type { ContextSegment } from '../../contracts/context.js';
import type { RawFinding } from '../../contracts/finding.js';
import { estimateTokens } from './tokens.js';
import type { SymbolIndex } from './symbols.js';

/** 一个导出符号的签名发生了变化。 */
export interface SignatureChange {
  readonly path: string;
  readonly name: string;
  /** 定位行号：新增的签名锚新侧，被删除的签名锚旧侧 */
  readonly line: number;
  readonly side: 'new' | 'old';
  /** 逐字引用改动中的那一行，作为证据 */
  readonly evidence: string;
  readonly kind: 'params-changed' | 'export-removed';
  /** 变化后的参数信息；export-removed 时为 0 */
  readonly paramCountAfter: number;
  readonly requiredAfter: number;
  readonly hasRestAfter: boolean;
}

/** 规则检查的产出。跳过的项要留痕，否则「为什么没报」无法解释。 */
export interface SignatureCheckOutcome {
  readonly findings: readonly RawFinding[];
  readonly skipped: readonly {
    readonly path: string;
    readonly name: string;
    readonly reason: string;
  }[];
}

const DECL_LINE = /^\s*export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/;
const DECL_ARROW = /^\s*export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/;

/** 从一行声明里取出符号名；不是导出声明则返回 null。 */
function declarationName(text: string): string | null {
  return DECL_LINE.exec(text)?.[1] ?? DECL_ARROW.exec(text)?.[1] ?? null;
}

/** 数一行声明里的形参与必填形参个数。 */
function paramsOf(text: string): { paramCount: number; required: number } {
  const open = text.indexOf('(');
  if (open < 0) return { paramCount: 0, required: 0 };

  let depth = 0;
  let inner = '';
  for (let index = open; index < text.length; index += 1) {
    const char = text[index] ?? '';
    if (char === '(') depth += 1;
    else if (char === ')') {
      depth -= 1;
      if (depth === 0) break;
    } else if (depth === 1) inner += char;
  }

  const parts = inner
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  const required = parts.filter(
    (part) => !part.startsWith('...') && !part.includes('=') && !/\?\s*:/.test(part),
  ).length;

  return { paramCount: parts.length, required };
}

/**
 * 从改动里找出签名变化。
 *
 * 不需要旧版本文件内容：签名变了，那两行必然出现在改动的删除行与新增行里。
 * 这比「再拉一次基线版本」省一次接口调用，也避免了基线漂移带来的错位。
 */
export function findSignatureChanges(diff: ParsedDiff): SignatureChange[] {
  const changes: SignatureChange[] = [];

  for (const file of diff.files) {
    if (file.skippedReason !== null) continue;

    const removed = new Map<string, DiffLine>();
    const added = new Map<string, DiffLine>();

    for (const line of file.lines) {
      const name = declarationName(line.text);
      if (name === null) continue;
      if (line.anchor.kind === 'removed') removed.set(name, line);
      else if (line.anchor.kind === 'added') added.set(name, line);
    }

    for (const [name, addedLine] of added) {
      const before = removed.get(name);
      if (before === undefined) continue;

      const after = paramsOf(addedLine.text);
      const previous = paramsOf(before.text);
      if (after.paramCount === previous.paramCount && after.required === previous.required)
        continue;

      const line = addedLine.anchor.newLine;
      if (line === null) continue;

      changes.push({
        path: file.path,
        name,
        line,
        side: 'new',
        evidence: addedLine.text,
        kind: 'params-changed',
        paramCountAfter: after.paramCount,
        requiredAfter: after.required,
        hasRestAfter: /\.\.\./.test(addedLine.text),
      });
    }

    for (const [name, removedLine] of removed) {
      if (added.has(name)) continue;
      const line = removedLine.anchor.oldLine;
      if (line === null) continue;

      changes.push({
        path: file.path,
        name,
        line,
        side: 'old',
        evidence: removedLine.text,
        kind: 'export-removed',
        paramCountAfter: 0,
        requiredAfter: 0,
        hasRestAfter: false,
      });
    }
  }

  return changes;
}

/** 单条问题里最多列多少个调用点；其余只报个数。 */
const MAX_CITED_SITES = 10;

/**
 * 比对调用点，产出问题项。
 *
 * **一条变化只产出一个问题项**，正文里列出调用点。理由：若每个调用点各发一条，
 * 一次改签名就能刷出二十条评论，用户会直接关掉这个功能。
 */
export function checkSignatureChanges(
  changes: readonly SignatureChange[],
  index: SymbolIndex,
): SignatureCheckOutcome {
  const findings: RawFinding[] = [];
  const skipped: { path: string; name: string; reason: string }[] = [];

  for (const change of changes) {
    const sites = (index.calls.get(change.name) ?? []).filter((site) => site.path !== change.path);

    if (change.kind === 'export-removed') {
      if (sites.length === 0) {
        skipped.push({
          path: change.path,
          name: change.name,
          reason: '没有找到调用点，可能未被使用或为动态引用',
        });
        continue;
      }
      findings.push(
        makeFinding(
          change,
          sites.map((site) => `${site.path}:${site.line}`),
          '该导出符号已被删除，但仍有调用点',
        ),
      );
      continue;
    }

    const offending = sites.filter((site) => {
      if (site.argCount < change.requiredAfter) return true;
      if (!change.hasRestAfter && site.argCount > change.paramCountAfter) return true;
      return false;
    });

    if (offending.length === 0) {
      skipped.push({ path: change.path, name: change.name, reason: '调用点实参个数与新签名一致' });
      continue;
    }

    findings.push(
      makeFinding(
        change,
        offending.map(
          (site) =>
            `${site.path}:${site.line}（传入 ${site.argCount} 个，需要 ${change.requiredAfter} 个）`,
        ),
        '函数签名的参数个数已变化，但这些调用点没有同步修改',
      ),
    );
  }

  return { findings, skipped };
}

function makeFinding(
  change: SignatureChange,
  sites: readonly string[],
  problem: string,
): RawFinding {
  const cited = sites.slice(0, MAX_CITED_SITES);
  const rest = sites.length - cited.length;

  return {
    file: change.path,
    line: change.line,
    side: change.side,
    severity: 'major',
    category: 'logic',
    title: `${change.name}() 的调用方未同步修改`,
    body: [
      `${problem}。`,
      '',
      '调用点：',
      ...cited.map((site) => `- ${site}`),
      ...(rest > 0 ? [`- 另有 ${rest} 处`] : []),
      '',
      change.kind === 'export-removed'
        ? '后果：调用方会得到 undefined 或抛出 TypeError。'
        : '后果：少传的参数在运行时是 undefined，可能在下游某处才炸；多传的参数被静默忽略，说明调用方还停留在旧契约上。',
    ].join('\n'),
    evidence: change.evidence,
    suggestion: null,
    // 规则结论，但依赖语法级解析：动态引用看不见，个数统计对多行调用可能有偏差
    confidence: 0.85,
  };
}

/** 把 `./foo` 这类相对路径解析成索引里的真实路径。 */
function resolveSource(
  fromPath: string,
  source: string,
  known: ReadonlySet<string>,
): string | null {
  if (!source.startsWith('.')) return null;

  const base = fromPath.split('/').slice(0, -1);
  const segments = [...base];
  for (const part of source.split('/')) {
    if (part === '.' || part === '') continue;
    if (part === '..') segments.pop();
    else segments.push(part);
  }
  const joined = segments.join('/');

  const candidates = [
    joined,
    `${joined}.ts`,
    `${joined}.tsx`,
    `${joined}.js`,
    `${joined}.jsx`,
    `${joined}.mjs`,
    `${joined}/index.ts`,
    `${joined}/index.tsx`,
  ];
  return candidates.find((candidate) => known.has(candidate)) ?? null;
}

export interface ExpandOptions {
  /** 展开层数，0 表示不展开；默认 1 */
  readonly depth?: number;
  /** 最多引入多少个文件，默认 30 */
  readonly maxFiles?: number;
}

/**
 * 列出需要额外读取的文件路径。
 *
 * 只算路径、不取内容——取数属于平台层，这里保持纯函数，便于单测。
 * 引擎拿到路径后去平台读，再把内容并入索引重建一次。
 */
export function collectRelatedFiles(
  index: SymbolIndex,
  changedPaths: readonly string[],
  options: ExpandOptions = {},
): string[] {
  const depth = options.depth ?? 1;
  const maxFiles = options.maxFiles ?? 30;
  if (depth <= 0) return [];

  const known = new Set(index.files.keys());
  const seen = new Set(changedPaths);
  const result: string[] = [];
  let frontier = [...changedPaths];

  for (let level = 0; level < depth; level += 1) {
    const next: string[] = [];
    for (const path of frontier) {
      const symbols = index.files.get(path);
      if (symbols === undefined) continue;
      for (const ref of symbols.imports) {
        const resolved = resolveSource(path, ref.source, known);
        if (resolved === null || seen.has(resolved)) continue;
        seen.add(resolved);
        result.push(resolved);
        next.push(resolved);
        if (result.length >= maxFiles) return result;
      }
    }
    frontier = next;
  }

  return result;
}

/**
 * 生成 L2 段：改动文件所引用的符号签名。
 *
 * 只给签名不给函数体：函数体动辄几十行，而这里要解决的是「这个函数长什么样」，
 * 签名加类型就够。给多了会把预算吃光，还稀释注意力。
 */
export function buildImportSegments(
  index: SymbolIndex,
  changedPaths: readonly string[],
  options: ExpandOptions = {},
): ContextSegment[] {
  if ((options.depth ?? 1) <= 0) return [];

  // 直接引用就是第一层，不需要再过滤——collectRelatedFiles 管的是「要不要继续往外看一层」
  const known = new Set(index.files.keys());
  const maxFiles = options.maxFiles ?? 30;
  const segments: ContextSegment[] = [];
  let usedFiles = 0;

  for (const path of changedPaths) {
    const file = index.files.get(path);
    if (file === undefined) continue;

    const lines: string[] = [];
    for (const ref of file.imports) {
      const resolved = resolveSource(path, ref.source, known);
      if (resolved === null) continue;
      if (usedFiles >= maxFiles) break;
      usedFiles += 1;

      const target = index.files.get(resolved);
      if (target === undefined) continue;

      const wanted = target.exports.filter(
        (symbol) => ref.names.includes('default') || ref.names.includes(symbol.name),
      );
      for (const symbol of wanted) {
        lines.push(`${resolved}:${symbol.line}  ${symbol.signatureText.split('\n')[0] ?? ''}`);
      }
    }

    if (lines.length === 0) continue;

    const content = lines.join('\n');
    segments.push({
      tier: 'L2',
      path,
      title: `${path} 引用的符号签名（${lines.length} 个）`,
      content,
      estimatedTokens: estimateTokens(content),
    });
  }

  return segments;
}
