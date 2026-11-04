/**
 * 评测样本集：格式、校验、加载。
 *
 * 一个样本 = 一次改动 + 这份改动里**人工核实过**的期望结论。
 *
 * 为什么样本自带补丁与文件内容，而不是「存一个 PR 号，跑的时候去平台取」：
 * 1. **可复现**：平台上的 PR 会被后续提交改动，样本必须冻结；否则同一份数据集今天 0.7 明天 0.5。
 * 2. **不依赖网络**：评测要能在 CI 里跑，不能因为一次接口抖动就变成「今天没测」。
 * 3. **只测该测的**：取数层已经有集成测试，评测要测的是「审 → 定位 → 校验」这一段。
 *
 * 代价是样本集文件会比较大（每个样本内嵌一份完整文件内容）。四个样本约 30KB，可以接受；
 * 样本数上百时要改成「目录 + 按需读取」，那时再拆。
 */

import type { DiffFile } from '../../contracts/diff.js';
import type { ExpectedFinding } from './match.js';
import { computeDatasetHash } from './baseline.js';

export interface EvalSample {
  /** 样本标识，进样本集指纹。改名等于换题，必须重跑基准 */
  readonly id: string;
  /** 改动文件路径（新版本一侧） */
  readonly path: string;
  readonly status: DiffFile['status'];
  /** 只含该文件 hunk 的 unified diff，不含 `diff --git` 头 */
  readonly patch: string;
  /** 改动后的完整文件内容。定位与上下文都要它；删除文件的样本传空串 */
  readonly content: string;
  /** 人工核实过的期望结论 */
  readonly expected: readonly ExpectedFinding[];
}

export interface EvalDataset {
  readonly version: 1;
  readonly name: string;
  /** 数据集说明：样本从哪来、标注是谁核的。缺失不算错，但会少一条排查线索 */
  readonly note?: string;
  readonly samples: readonly EvalSample[];
}

/** 只认契约里定义的四种状态。多一个少一个都会让样本集读出来的结构对不上 diff。 */
const STATUSES: ReadonlySet<string> = new Set(['added', 'modified', 'deleted', 'renamed']);

/**
 * 解析并校验样本集。
 *
 * 校验从严：坏样本集必须立刻报错。
 * 因为「样本集里有 3 条读不出来」如果被静默跳过，跑的是一份更小的题，
 * 分数会**变好看**——这是最不该发生的方向。
 */
export function parseDataset(text: string): EvalDataset {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`样本集不是合法 JSON：${asMessage(error)}`, { cause: error });
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('样本集顶层必须是对象');
  }

  const root = parsed as Record<string, unknown>;
  if (root['version'] !== 1) throw new Error(`样本集版本不支持：${String(root['version'])}`);
  if (typeof root['name'] !== 'string' || root['name'] === '') throw new Error('样本集缺少 name');

  const rawSamples = root['samples'];
  if (!Array.isArray(rawSamples) || rawSamples.length === 0) {
    throw new Error('样本集里没有任何样本');
  }

  const samples = rawSamples.map((item, index) => parseSample(item, index));
  const seen = new Set<string>();
  for (const sample of samples) {
    if (seen.has(sample.id)) throw new Error(`样本 id 重复：${sample.id}`);
    seen.add(sample.id);
  }

  return {
    version: 1,
    name: root['name'],
    ...(typeof root['note'] === 'string' ? { note: root['note'] } : {}),
    samples,
  };
}

function parseSample(value: unknown, index: number): EvalSample {
  const at = `第 ${String(index + 1)} 个样本`;
  if (typeof value !== 'object' || value === null) throw new Error(`${at} 不是对象`);

  const record = value as Record<string, unknown>;
  const id = record['id'];
  const path = record['path'];
  const status = record['status'];
  const patch = record['patch'];
  const content = record['content'];

  if (typeof id !== 'string' || id === '') throw new Error(`${at} 缺少 id`);
  if (typeof path !== 'string' || path === '') throw new Error(`样本 ${id} 缺少 path`);
  if (typeof status !== 'string' || !STATUSES.has(status)) {
    throw new Error(`样本 ${id} 的 status 非法：${String(status)}`);
  }
  if (typeof patch !== 'string') throw new Error(`样本 ${id} 缺少 patch`);
  if (typeof content !== 'string') throw new Error(`样本 ${id} 缺少 content`);

  const rawExpected = record['expected'];
  if (!Array.isArray(rawExpected)) throw new Error(`样本 ${id} 缺少 expected 数组`);

  const expected = rawExpected.map((item, order) =>
    parseExpected(item, `${id} 的第 ${String(order + 1)} 条期望`),
  );

  return {
    id,
    path,
    status: status as DiffFile['status'],
    patch,
    content,
    expected,
  };
}

function parseExpected(value: unknown, at: string): ExpectedFinding {
  if (typeof value !== 'object' || value === null) throw new Error(`${at} 不是对象`);

  const record = value as Record<string, unknown>;
  const line = record['line'];
  const category = record['category'];
  const reviewer = record['reviewer'];

  if (typeof line !== 'number' || !Number.isInteger(line) || line <= 0) {
    throw new Error(`${at} 的 line 必须是正整数`);
  }
  if (typeof category !== 'string' || category === '') throw new Error(`${at} 缺少 category`);
  if (reviewer !== 'correctness' && reviewer !== 'security' && reviewer !== 'convention') {
    throw new Error(`${at} 的 reviewer 非法：${String(reviewer)}`);
  }

  return {
    line,
    category,
    reviewer,
    ...(typeof record['severity'] === 'string' ? { severity: record['severity'] } : {}),
    ...(typeof record['note'] === 'string' ? { note: record['note'] } : {}),
  };
}

/**
 * 样本集指纹。
 *
 * 只由「样本 id + 期望条数」决定，不包含补丁内容。
 * 理由：改标注数量会让指纹变（分数不可比是对的），但**改文件内容不改题**——
 * 修正一处笔误不该让历史基准全部作废。真正会让分数不可比的是「题变了」，不是「字变了」。
 */
export function datasetHashOf(dataset: EvalDataset): string {
  return computeDatasetHash(
    dataset.samples.map((sample) => ({ id: sample.id, expected: sample.expected.length })),
  );
}

/** 统计样本集的规模，用于命令行展示。 */
export function describeDataset(dataset: EvalDataset): string {
  const expected = dataset.samples.reduce((sum, sample) => sum + sample.expected.length, 0);
  return `${dataset.name}：${String(dataset.samples.length)} 个样本 / ${String(expected)} 条期望结论`;
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
