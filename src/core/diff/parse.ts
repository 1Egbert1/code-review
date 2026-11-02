/**
 * 改动文本解析：把 unified diff 变成结构化的 {@link ParsedDiff}。
 *
 * 纯函数，不读文件、不碰网络，因此可以对着 fixture 精确断言。
 *
 * 两件事必须做对，否则后面全错：
 * 1. **上下文行的新旧行号各自独立递增**。文件前面有增删时两者会错开，
 *    用同一个变量算行号是最常见的实现错误。
 * 2. **换行符差异不能产生虚假改动**。CRLF 与 LF 的差别不该被当成增删行。
 */

import type { DiffFile, DiffLine, LineAnchor, ParsedDiff } from '../../contracts/index.js';

/** 文件级元信息，来自平台接口；单文件补丁文本本身不含这些信息。 */
export interface FileMeta {
  readonly path: string;
  readonly oldPath: string | null;
  readonly status: DiffFile['status'];
}

/** 解析后的一行，尚未分配行号。 */
type HunkLine =
  | { readonly kind: 'context'; readonly text: string }
  | { readonly kind: 'added'; readonly text: string }
  | { readonly kind: 'removed'; readonly text: string };

/** 一个改动块。 */
interface Hunk {
  readonly oldStart: number;
  readonly newStart: number;
  readonly lines: readonly HunkLine[];
}

/** 块头：`@@ -1,5 +1,7 @@`，计数省略时默认为 1。 */
const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/** 把 CRLF / CR 统一成 LF。只在解析入口做一次，后续都按 LF 处理。 */
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * 判断文本是否为二进制改动的描述。
 *
 * Git 对二进制文件不输出逐行补丁，而是给一句 `Binary files ... differ`。
 */
function looksBinary(patch: string): boolean {
  return /^Binary files .* differ$/m.test(patch) || patch.includes('GIT binary patch');
}

/**
 * 把补丁文本切成行数组。
 *
 * 末尾的空行来自文本结尾的换行符，不是内容，必须去掉——否则会多出一行虚假的上下文。
 */
function splitPatchLines(patch: string): readonly string[] {
  const lines = normalizeNewlines(patch).split('\n');
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

/** 解析出全部改动块。 */
function parseHunks(lines: readonly string[]): readonly Hunk[] {
  const hunks: Hunk[] = [];
  let current: { oldStart: number; newStart: number; lines: HunkLine[] } | null = null;

  for (const line of lines) {
    const header = HUNK_HEADER.exec(line);
    if (header !== null) {
      if (current !== null) hunks.push(current);
      current = {
        oldStart: Number(header[1]),
        newStart: Number(header[3]),
        lines: [],
      };
      continue;
    }

    // 块外内容（文件头、索引行等）在这里被忽略：行号只由块头决定
    if (current === null) continue;

    // `\ No newline at end of file` 只是标记，不占行、不影响行号
    if (line.startsWith('\\')) continue;

    const marker = line.charAt(0);
    const text = line.slice(1);

    if (marker === '+') {
      current.lines.push({ kind: 'added', text });
    } else if (marker === '-') {
      current.lines.push({ kind: 'removed', text });
    } else {
      // 上下文行以空格开头；少数工具会把行尾空格裁掉，于是变成空字符串。
      // 两种都按上下文处理，内容取去掉标记后的部分。
      current.lines.push({ kind: 'context', text: marker === ' ' ? text : line });
    }
  }

  if (current !== null) hunks.push(current);
  return hunks;
}

/**
 * 把改动块展开成带行号的行列表。
 *
 * 关键：oldLine 与 newLine 分开递增。上下文行两者都走一步，
 * 但它们的起点不同（分别来自块头的两个数），所以同一行在新旧文件中的行号可能不相等。
 */
function expandHunks(hunks: readonly Hunk[], file: string, oldPath: string | null): DiffLine[] {
  const result: DiffLine[] = [];

  for (const hunk of hunks) {
    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;

    for (const line of hunk.lines) {
      let anchor: LineAnchor;

      if (line.kind === 'context') {
        anchor = { file, oldPath, kind: 'context', oldLine, newLine };
        oldLine += 1;
        newLine += 1;
      } else if (line.kind === 'added') {
        anchor = { file, oldPath, kind: 'added', oldLine: null, newLine };
        newLine += 1;
      } else {
        anchor = { file, oldPath, kind: 'removed', oldLine, newLine: null };
        oldLine += 1;
      }

      result.push({ anchor, text: line.text, enclosingSymbol: null });
    }
  }

  return result;
}

/**
 * 解析单个文件的补丁文本。
 *
 * @param patch 该文件的 unified diff 片段。
 *   **null 表示平台未提供补丁内容**（大文件常见）；
 *   **空字符串表示确实没有内容改动**（例如纯重命名，只有元信息没有 hunk）。
 *   两者必须区分：前者是信息缺失，后者是正常情况。
 * @param meta 文件级元信息，必须由调用方提供（补丁片段里没有路径）
 */
export function parsePatch(patch: string | null, meta: FileMeta): DiffFile {
  const empty = (skippedReason: string | null): DiffFile => ({
    path: meta.path,
    oldPath: meta.oldPath,
    status: meta.status,
    lines: [],
    changedCount: 0,
    skippedReason,
  });

  if (patch === null) {
    // 平台对超大文件不给补丁内容。这不是错误，是信息缺失，必须显式标注。
    return empty('平台未提供补丁内容');
  }

  if (patch.trim() === '') {
    // 纯重命名、纯权限变更等没有内容改动，属于正常情况，不算跳过
    return empty(null);
  }

  if (looksBinary(patch)) {
    return empty('二进制文件');
  }

  const lines = splitPatchLines(patch);
  const hunks = parseHunks(lines);
  const diffLines = expandHunks(hunks, meta.path, meta.oldPath);
  const changedCount = diffLines.filter((line) => line.anchor.kind !== 'context').length;

  return {
    path: meta.path,
    oldPath: meta.oldPath,
    status: meta.status,
    lines: diffLines,
    changedCount,
    skippedReason: null,
  };
}

/** 从 `--- a/x` / `+++ b/y` 这类文件头里取出路径，去掉 a/ 与 b/ 前缀。 */
function stripPathPrefix(raw: string): string | null {
  const trimmed = raw.trim().split('\t')[0] ?? '';
  if (trimmed === '' || trimmed === '/dev/null') return null;

  const withoutPrefix = trimmed.replace(/^[ab]\//, '');
  return withoutPrefix === '' ? null : withoutPrefix;
}

/**
 * 解析完整的 unified diff（多个文件）。
 *
 * SPEC-GAP：这里按 `diff --git` 切分，只认路径与状态，不解析权限位、相似度等细节——
 * 那些对审查没有影响。GitHub 接口按文件返回补丁片段，通常走 {@link parsePatch}；
 * 本函数主要服务本地模式（直接吃 git diff 的输出）。
 */
export function parseUnifiedDiff(text: string): ParsedDiff {
  const normalized = normalizeNewlines(text);
  const blocks = normalized.split(/^diff --git /m).slice(1);

  const files: DiffFile[] = blocks.map((block) => {
    const body = `diff --git ${block}`;
    const headerPath = /^diff --git a\/(.+) b\/(.+)$/m.exec(body);

    let oldPath: string | null = null;
    let newPath: string | null = null;

    const minus = /^--- (.+)$/m.exec(body);
    const plus = /^\+\+\+ (.+)$/m.exec(body);
    if (minus !== null) oldPath = stripPathPrefix(minus[1] ?? '');
    if (plus !== null) newPath = stripPathPrefix(plus[1] ?? '');

    // 没有 ---/+++ 时退回 diff --git 行里的两个路径
    if (headerPath !== null) {
      oldPath ??= headerPath[1] ?? null;
      newPath ??= headerPath[2] ?? null;
    }

    const isNew = /^new file mode /m.test(body) || oldPath === null;
    const isDeleted = /^deleted file mode /m.test(body) || newPath === null;
    const isRenamed = /^rename from /m.test(body) || /^similarity index /m.test(body);

    const status: DiffFile['status'] = isNew
      ? 'added'
      : isDeleted
        ? 'deleted'
        : isRenamed && oldPath !== newPath
          ? 'renamed'
          : 'modified';

    const path = newPath ?? oldPath ?? '';
    const patchStart = body.search(/^@@ /m);
    const patch = patchStart >= 0 ? body.slice(patchStart) : '';

    return parsePatch(patch, {
      path,
      oldPath: status === 'renamed' || status === 'modified' ? oldPath : null,
      status,
    });
  });

  return { files, baseSha: '', headSha: '' };
}
