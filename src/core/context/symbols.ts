/**
 * 语法级符号索引。
 *
 * **这是文本分析，不是类型检查。** 能力边界必须说清：
 * - 认得：`export function` / `export const` / `export class` / `export interface` 等显式导出，
 *   以及 `import x from` / `import { a, b } from` 两种导入形态
 * - 认不得：动态导入、re-export 链、路径别名（`@/foo`）、同名符号的重载、装饰器生成的成员
 *
 * 因此它**只用来挑材料并把明显的问题挑出来**，绝不判断「这个调用是否类型正确」。
 * 漏报是预期的（动态引用看不见），误报靠「实参个数少于必填参数」这条硬规则压住——
 * 只有个数确定不匹配时才断言，参数类型不做任何推断。
 */

/** 文件里一个导出符号。 */
export interface ExportedSymbol {
  readonly name: string;
  readonly kind: 'function' | 'const' | 'class' | 'interface' | 'type' | 'enum';
  /** 声明所在行，1 起 */
  readonly line: number;
  /** 声明原文（可能是拼接后的多行），用于作为证据 */
  readonly signatureText: string;
  /** 形参总数；非函数为 0 */
  readonly paramCount: number;
  /** 必填形参个数：排除带 `?`、带默认值、以及 `...rest` */
  readonly requiredParams: number;
  /** 是否存在剩余参数 */
  readonly hasRest: boolean;
}

/** 一条导入语句引用的符号。 */
export interface ImportRef {
  readonly line: number;
  /** 原样保存的来源字符串，可能是相对路径或包名 */
  readonly source: string;
  /** 具名导入的符号；默认导入记为 `default` */
  readonly names: readonly string[];
}

/** 一处调用点。 */
export interface CallSite {
  /** 被调用的符号名 */
  readonly name: string;
  readonly path: string;
  readonly line: number;
  readonly text: string;
  readonly argCount: number;
}

/** 一个文件的解析结果。 */
export interface FileSymbols {
  readonly exports: readonly ExportedSymbol[];
  readonly imports: readonly ImportRef[];
}

/** 全仓索引。只在内存里存在，运行结束即丢。 */
export interface SymbolIndex {
  readonly files: ReadonlyMap<string, FileSymbols>;
  /** 符号名 → 调用点。同名符号会被合并，这是已知的误报来源，故规则判定时要求唯一来源 */
  readonly calls: ReadonlyMap<string, readonly CallSite[]>;
}

const DECL =
  /^\s*export\s+(?:default\s+)?(?:declare\s+)?(?:async\s+)?(function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;
const IMPORT_NAMED = /^\s*import\s+(?:type\s+)?{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/;
const IMPORT_DEFAULT =
  /^\s*import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s*(?:,\s*{[^}]*})?\s*from\s*['"]([^'"]+)['"]/;

/** 跳过字符串字面量内部，避免把 `f("a,b")` 的一个参数数成两个。 */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let quote: string | null = null;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? '';

    if (quote !== null) {
      current += char;
      if (char === '\\') {
        current += text[index + 1] ?? '';
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      current += char;
      continue;
    }
    if (char === '(' || char === '[' || char === '{' || char === '<') depth += 1;
    if (char === ')' || char === ']' || char === '}' || char === '>') depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  parts.push(current);
  return parts;
}

/** 从 `(` 开始取出配平的参数列表内容；取不到返回 null。 */
function takeParens(text: string, openIndex: number): { inner: string; end: number } | null {
  let depth = 0;
  let quote: string | null = null;

  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index] ?? '';
    if (quote !== null) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') depth += 1;
    else if (char === ')') {
      depth -= 1;
      if (depth === 0) return { inner: text.slice(openIndex + 1, index), end: index };
    }
  }
  return null;
}

interface ParamInfo {
  readonly paramCount: number;
  readonly requiredParams: number;
  readonly hasRest: boolean;
}

function analyseParams(inner: string): ParamInfo {
  const raw = splitTopLevel(inner, ',')
    .map((part) => part.trim())
    .filter((part) => part !== '');

  let required = 0;
  let hasRest = false;
  for (const param of raw) {
    if (param.startsWith('...')) {
      hasRest = true;
      continue;
    }
    // 解构参数里可能含 `=`，只看第一层的赋值
    const hasDefault = splitTopLevel(param, '=').length > 1;
    const optional = /\?\s*:/.test(param) || /^\s*[A-Za-z_$][\w$]*\?\s*$/.test(param);
    if (!hasDefault && !optional) required += 1;
  }

  return { paramCount: raw.length, requiredParams: required, hasRest };
}

/** 把从某行开始、可能跨行的声明拼成一个字符串，最多看 8 行。 */
function joinDeclaration(lines: readonly string[], startLine: number): string {
  const collected: string[] = [];
  let depth = 0;

  for (let offset = 0; offset < 8; offset += 1) {
    const text = lines[startLine - 1 + offset];
    if (text === undefined) break;
    collected.push(text);
    for (const char of text) {
      if (char === '(' || char === '{' || char === '[') depth += 1;
      if (char === ')' || char === '}' || char === ']') depth -= 1;
    }
    // 括号配平且已经看到过括号，就认为声明结束
    if (depth <= 0 && /[()]/.test(collected.join('\n'))) break;
  }

  return collected.join('\n');
}

function parseExports(lines: readonly string[]): ExportedSymbol[] {
  const symbols: ExportedSymbol[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const match = DECL.exec(line);
    if (match === null) continue;

    const raw = match[1] ?? '';
    // let / var 与 const 在签名层面等价，统一按 const 处理，避免下游漏判
    const kind: ExportedSymbol['kind'] =
      raw === 'let' || raw === 'var' ? 'const' : (raw as ExportedSymbol['kind']);
    const name = match[2] ?? '';
    const signatureText = joinDeclaration(lines, index + 1);

    let params: ParamInfo = { paramCount: 0, requiredParams: 0, hasRest: false };
    if (kind === 'function') {
      const open = signatureText.indexOf('(', signatureText.indexOf(name));
      if (open >= 0) {
        const parens = takeParens(signatureText, open);
        if (parens !== null) params = analyseParams(parens.inner);
      }
    } else if (kind === 'const') {
      // 只处理箭头函数：`const f = (a) => ...`
      const arrow = signatureText.indexOf('=>');
      const open = signatureText.indexOf('(');
      if (arrow >= 0 && open >= 0 && open < arrow) {
        const parens = takeParens(signatureText, open);
        if (parens !== null) params = analyseParams(parens.inner);
        else if (/^\s*[A-Za-z_$][\w$]*\s*=>/.test(signatureText)) {
          params = { paramCount: 1, requiredParams: 1, hasRest: false };
        }
      }
    }

    symbols.push({
      name,
      kind,
      line: index + 1,
      signatureText,
      paramCount: params.paramCount,
      requiredParams: params.requiredParams,
      hasRest: params.hasRest,
    });
  }

  return symbols;
}

function parseImports(lines: readonly string[]): ImportRef[] {
  const imports: ImportRef[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';

    const named = IMPORT_NAMED.exec(line);
    if (named !== null) {
      const names = (named[1] ?? '')
        .split(',')
        .map((part) => part.trim().replace(/^type\s+/, ''))
        .map((part) => part.split(/\s+as\s+/)[0] ?? part)
        .filter((part) => part !== '');
      imports.push({ line: index + 1, source: named[2] ?? '', names });
      continue;
    }

    const single = IMPORT_DEFAULT.exec(line);
    if (single !== null) {
      imports.push({ line: index + 1, source: single[2] ?? '', names: ['default'] });
    }
  }

  return imports;
}

/** 这些不是函数调用，只是语法关键字后面跟了括号。 */
const NOT_A_CALL = new Set([
  'if',
  'for',
  'while',
  'switch',
  'catch',
  'return',
  'typeof',
  'await',
  'function',
  'super',
  'import',
  'constructor',
  'do',
  'else',
]);

/** 找出一行里所有 `name(` 形态的调用，并数出实参个数。 */
function findCallsInLine(path: string, lineNumber: number, text: string): CallSite[] {
  const sites: CallSite[] = [];
  // 用后行断言而不是消费前一个字符：`g(f(1))` 里 f 紧跟在 ( 之后，
  // 消费式的 `(^|[^\w$.])` 会把那个 ( 吃掉，导致内层调用被整条漏掉
  const pattern = /(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g;

  for (const match of text.matchAll(pattern)) {
    const name = match[1];
    if (name === undefined || NOT_A_CALL.has(name)) continue;
    const open = (match.index ?? 0) + match[0].length - 1;
    const parens = takeParens(text, open);
    if (parens === null) continue;
    const args = splitTopLevel(parens.inner, ',')
      .map((part) => part.trim())
      .filter((part) => part !== '');
    sites.push({ name, path, line: lineNumber, text: text.trim(), argCount: args.length });
  }

  return sites;
}

/** 建立全仓索引。入参是「路径 → 文件内容」，未提供的文件不参与索引。 */
export function buildSymbolIndex(files: ReadonlyMap<string, string>): SymbolIndex {
  const parsed = new Map<string, FileSymbols>();
  const calls = new Map<string, CallSite[]>();

  for (const [path, content] of files) {
    if (content === '') continue;
    const lines = content.split('\n');
    parsed.set(path, { exports: parseExports(lines), imports: parseImports(lines) });

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? '';
      // 导入行与声明行不产生调用
      if (IMPORT_NAMED.test(line) || IMPORT_DEFAULT.test(line) || DECL.test(line)) continue;
      for (const site of findCallsInLine(path, index + 1, line)) {
        const existing = calls.get(site.name);
        if (existing === undefined) calls.set(site.name, [site]);
        else existing.push(site);
      }
    }
  }

  return { files: parsed, calls };
}
