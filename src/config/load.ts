/**
 * 配置装载：默认值 → 仓库配置 → 本地覆盖 → 环境变量。
 *
 * 优先级写死在这里，不允许各模块各写一套：
 * **命令行参数 > 环境变量 > ai-review.local.yml > .ai-review.yml > 内置默认值**
 *
 * 两条边界：
 * - 文件不存在**不是错误**（大多数项目不会写配置），用默认值继续
 * - 文件存在但写错**是错误**，必须报错退出。悄悄用默认值会让用户以为配置生效了
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parse as parseYaml } from 'yaml';

import type { ResolvedConfig } from '../contracts/config.js';
import { resolveConfig } from './merge.js';
import type { ConfigError } from './validate.js';

export const CONFIG_FILE = '.ai-review.yml';
export const LOCAL_CONFIG_FILE = 'ai-review.local.yml';

export type LoadOutcome =
  | { readonly ok: true; readonly config: ResolvedConfig; readonly sources: readonly string[] }
  | { readonly ok: false; readonly errors: readonly ConfigError[] };

/** 读一个 YAML 文件；不存在返回 null。 */
async function readYamlIfExists(path: string): Promise<unknown> {
  try {
    const text = await readFile(path, 'utf8');
    return parseYaml(text) as unknown;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return null;
    throw error;
  }
}

/** 从环境变量取覆盖项。只认已经写进文档的几个，避免出现「隐式配置」。 */
function envOverrides(): Record<string, unknown> {
  const llm: Record<string, unknown> = {};
  if (process.env['ACR_MODEL'] !== undefined) llm['model'] = process.env['ACR_MODEL'];
  if (process.env['ACR_BASE_URL'] !== undefined) llm['baseUrl'] = process.env['ACR_BASE_URL'];

  const platform: Record<string, unknown> = {};
  if (process.env['ACR_REPOSITORY'] !== undefined)
    platform['repository'] = process.env['ACR_REPOSITORY'];

  const overrides: Record<string, unknown> = {};
  if (Object.keys(llm).length > 0) overrides['llm'] = llm;
  if (Object.keys(platform).length > 0) overrides['platform'] = platform;
  return overrides;
}

/**
 * 装载配置。
 *
 * @param cwd 仓库根目录
 */
export async function loadConfig(cwd: string): Promise<LoadOutcome> {
  const sources: string[] = [];
  const layers: unknown[] = [];

  const main = await readYamlIfExists(join(cwd, CONFIG_FILE));
  if (main !== null) {
    sources.push(CONFIG_FILE);
    layers.push(main);
  }

  const local = await readYamlIfExists(join(cwd, LOCAL_CONFIG_FILE));
  if (local !== null) {
    sources.push(LOCAL_CONFIG_FILE);
    layers.push(local);
  }

  const env = envOverrides();
  if (Object.keys(env).length > 0) {
    sources.push('环境变量');
    layers.push(env);
  }

  const resolved = resolveConfig(layers);
  return resolved.ok
    ? { ok: true, config: resolved.config, sources }
    : { ok: false, errors: resolved.errors };
}
