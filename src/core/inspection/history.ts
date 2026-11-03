/**
 * 巡检历史落盘。
 *
 * 趋势对比必须有一个「上一期」的来源。三种做法各有代价：
 *
 * | 做法 | 代价 |
 * | --- | --- |
 * | 每次去平台读上一期报告正文解析 | 依赖正文格式，改一次渲染就断 |
 * | 全放平台，不落本地 | 换仓库/换载体就丢历史 |
 * | **本地 JSON 累积**（本实现） | 需要把文件存起来，Agent 场景下要进仓库或缓存 |
 *
 * 选了本地 JSON，因为它与渲染格式解耦：报告的排版怎么改都不影响趋势。
 * 文件损坏时**直接报错**而不是当空历史——当空历史会把「本期全是新增」写进报告，
 * 那是一次静默的错误结论。
 */

import type { ScoreDimension } from '../../contracts/inspection.js';

export interface HistoryEntry {
  readonly inspectedAt: string;
  readonly totalScore: number;
  readonly scores: Readonly<Record<ScoreDimension, number>>;
  /** 本期的问题指纹，用于下期算新增与已修复 */
  readonly fingerprints: readonly string[];
  /** 报告写到哪里（Issue 编号或 Wiki 页面名）；未写入为 null */
  readonly reference: string | null;
}

export interface InspectionHistory {
  readonly version: 1;
  readonly entries: readonly HistoryEntry[];
}

export const EMPTY_HISTORY: InspectionHistory = { version: 1, entries: [] };

/**
 * 追加一期并裁剪。
 *
 * 只保留最近 `depth` 期：历史文件进了仓库就会一直变大，无限追加早晚变成负担。
 */
export function appendHistory(
  history: InspectionHistory,
  entry: HistoryEntry,
  depth: number,
): InspectionHistory {
  const entries = [...history.entries, entry];
  const kept = depth > 0 ? entries.slice(Math.max(0, entries.length - depth)) : entries;
  return { version: 1, entries: kept };
}

/** 上一期。首期返回 null——调用方据此不生成对比段。 */
export function previousOf(history: InspectionHistory): HistoryEntry | null {
  return history.entries.length === 0
    ? null
    : (history.entries[history.entries.length - 1] ?? null);
}

/** 解析历史文件。格式不对就抛，不静默降级成空历史。 */
export function parseHistory(text: string): InspectionHistory {
  const parsed = JSON.parse(text) as unknown;

  // 数组也是 object，必须单独排除，否则会顺着 version 检查报出一个误导性的错
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('历史文件不是一个对象');
  }
  const record = parsed as Record<string, unknown>;
  if (record['version'] !== 1) throw new Error(`不支持的历史版本：${String(record['version'])}`);
  if (!Array.isArray(record['entries'])) throw new Error('历史文件缺少 entries 数组');

  return { version: 1, entries: record['entries'] as HistoryEntry[] };
}

/** 序列化。缩进两格，让这个文件在 PR 里可读——它不是二进制缓存。 */
export function serializeHistory(history: InspectionHistory): string {
  return `${JSON.stringify(history, null, 2)}\n`;
}

/**
 * 报告正文里内嵌的历史片段标记。
 *
 * 为什么需要它：Action 每次运行都是一个干净容器，本地历史文件留不下来。
 * 把本期摘要嵌进报告正文，下一期从上一期的 Issue / Wiki 页面里读回来，
 * 趋势在无状态环境里也能连上——这比要求用户持久化一个文件现实得多。
 */
export const HISTORY_EMBED_PATTERN = /<!--\s*acr:history\s+([A-Za-z0-9+/=]+)\s*-->/;

/** 指纹最多存这么多条。再多正文会变长，而趋势只需要「大概有哪些问题」。 */
const MAX_EMBEDDED_FINGERPRINTS = 200;

/** 生成本期内嵌片段（base64，避免 JSON 里的换行破坏注释）。 */
export function embedHistory(entry: HistoryEntry): string {
  const trimmed: HistoryEntry = {
    ...entry,
    fingerprints: entry.fingerprints.slice(0, MAX_EMBEDDED_FINGERPRINTS),
  };
  return `<!-- acr:history ${Buffer.from(JSON.stringify(trimmed), 'utf8').toString('base64')} -->`;
}

/** 从报告正文里读回上一期。读不出或格式不符时返回 null，由调用方退回本地历史。 */
export function extractEmbeddedHistory(markdown: string): HistoryEntry | null {
  const match = HISTORY_EMBED_PATTERN.exec(markdown);
  if (match === null) return null;

  try {
    const decoded = Buffer.from(match[1] ?? '', 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;

    const record = parsed as Record<string, unknown>;
    if (typeof record['totalScore'] !== 'number' || typeof record['inspectedAt'] !== 'string')
      return null;
    if (typeof record['scores'] !== 'object' || record['scores'] === null) return null;

    return {
      inspectedAt: record['inspectedAt'],
      totalScore: record['totalScore'],
      scores: record['scores'] as HistoryEntry['scores'],
      fingerprints: Array.isArray(record['fingerprints'])
        ? (record['fingerprints'] as string[])
        : [],
      reference: typeof record['reference'] === 'string' ? record['reference'] : null,
    };
  } catch {
    return null;
  }
}
