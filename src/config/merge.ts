/**
 * 配置分层合并。
 *
 * 合并规则（规格书 10.2）：
 * - 对象**逐字段深合并**；
 * - **数组整体替换，不拼接**。拼接会让用户无法清空默认的跳过清单——那是反直觉的。
 *
 * 本模块只做纯计算，不读文件、不读环境变量，因此可以直接单测。
 */

import type { ResolvedConfig } from '../contracts/config.js';

import { DEFAULT_CONFIG } from './defaults.js';
import { type ConfigError, validateConfig } from './validate.js';

/** 合并与校验的结果。失败时返回全部错误，而不是只报第一个——一次改完比试错五轮快。 */
export type ResolveOutcome =
  | { readonly ok: true; readonly config: ResolvedConfig }
  | { readonly ok: false; readonly errors: readonly ConfigError[] };

/** 判断是否为普通对象（数组与 null 都不算）。 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 深合并两个值。
 *
 * 数组整体替换，对象递归合并，其余情况后者覆盖前者。
 */
export function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined) return base;

  // 数组整体替换：不拼接，否则用户无法清空默认清单
  // 显式断言为 unknown[]：Array.isArray 的类型守卫会把元素放宽成 any，那会破坏严格性
  if (Array.isArray(override)) return [...(override as readonly unknown[])];

  if (isPlainObject(base) && isPlainObject(override)) {
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      merged[key] = deepMerge(base[key], value);
    }
    return merged;
  }

  return override;
}

/**
 * 按优先级从低到高合并多层配置并校验。
 *
 * @param layers 由低到高的配置层，例如 `[文件配置, 本地覆盖, 环境变量结果, 命令行结果]`
 * @returns 合并成功返回完整配置，否则返回全部错误
 */
export function resolveConfig(layers: readonly unknown[]): ResolveOutcome {
  let merged: unknown = DEFAULT_CONFIG;

  for (const layer of layers) {
    if (layer === undefined || layer === null) continue;
    merged = deepMerge(merged, layer);
  }

  const errors = validateConfig(merged);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, config: merged as ResolvedConfig };
}
