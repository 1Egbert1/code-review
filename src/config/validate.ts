/**
 * 配置校验。
 *
 * 设计取向：**未知字段一律报错**。配置文件里写错一个字母（`maxInlineComment` 少个 s），
 * 静默忽略会让人以为生效了——这类问题排查起来极费时间，不如在启动时直接拦下。
 *
 * 纯函数，不读文件、不读环境变量，可直接单测。
 */

/** 校验错误。path 用点号表示层级，如 `review.maxInlineComments`。 */
export interface ConfigError {
  readonly path: string;
  readonly message: string;
}

type Obj = Record<string, unknown>;

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const TOP_KEYS = [
  'configVersion',
  'platform',
  'llm',
  'routing',
  'review',
  'gate',
  'inspection',
  'output',
] as const;

const PLATFORM_KEYS = ['kind', 'repository', 'tokenEnv'] as const;
const LLM_KEYS = [
  'preset',
  'baseUrl',
  'model',
  'apiKeyEnv',
  'temperature',
  'maxOutputTokens',
  'contextWindow',
  'pricing',
  'headers',
  'structuredOutput',
] as const;
const PRICING_KEYS = [
  'inputPerMTok',
  'outputPerMTok',
  'cacheWriteShortMultiplier',
  'cacheWriteLongMultiplier',
  'cacheReadMultiplier',
] as const;
const ROUTING_KEYS = [
  'enabled',
  'tiers',
  'byDimension',
  'fileRiskThreshold',
  'smallChangeLines',
  'defaultTier',
] as const;
const TIER_KEYS = ['model', 'maxOutputTokens', 'contextWindow', 'pricing'] as const;
const REVIEW_KEYS = [
  'dimensions',
  'maxInlineComments',
  'maxSummaryPreexisting',
  'maxSummaryFileLevel',
  'checkpoint',
  'skipPaths',
  'maxBudgetUsd',
  'crossFileDepth',
  'crossFileMaxFiles',
  'concurrency',
  'respectLintConfig',
] as const;
const DIMENSION_KEYS = ['enabled', 'severityFloor'] as const;
const GATE_KEYS = [
  'enabled',
  'blockingSeverity',
  'blockingCategories',
  'confidenceThreshold',
  'exemptionStore',
] as const;
const INSPECTION_KEYS = [
  'enabled',
  'weights',
  'maxScorePerDimension',
  'sampleSize',
  'carrier',
  'wikiPagePrefix',
  'historyDepth',
] as const;
const OUTPUT_KEYS = ['inline', 'summary', 'language', 'resolveMode'] as const;

const REVIEWER_IDS = ['correctness', 'security', 'convention'] as const;
const SEVERITIES = ['blocker', 'major', 'minor', 'nit'] as const;
const SCORE_DIMENSIONS = [
  'complexity',
  'duplication',
  'dependency',
  'type-safety',
  'test',
] as const;

/** 校验入口。返回空数组表示通过。 */
export function validateConfig(value: unknown): readonly ConfigError[] {
  const errors: ConfigError[] = [];

  if (!isObject(value)) {
    return [{ path: '', message: '配置必须是一个对象' }];
  }

  expectKeys(errors, '', value, TOP_KEYS);

  const version: unknown = value['configVersion'];
  if (version !== undefined && version !== 1) {
    // 只展示标量；对象/数组只报类型名，避免出现 "[object Object]" 这种无用信息
    const shown =
      typeof version === 'number' || typeof version === 'string' ? String(version) : typeof version;
    errors.push({ path: 'configVersion', message: `只支持版本 1，收到 ${shown}` });
  }

  checkPlatform(errors, value['platform']);
  checkLlm(errors, value['llm']);
  checkRouting(errors, value['routing']);
  checkReview(errors, value['review']);
  checkGate(errors, value['gate']);
  checkInspection(errors, value['inspection']);
  checkOutput(errors, value['output']);

  return errors;
}

// ---------------------------------------------------------------- 通用断言

function expectKeys(
  errors: ConfigError[],
  path: string,
  obj: Obj,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      errors.push({
        path: path === '' ? key : `${path}.${key}`,
        message: '未知字段，请检查拼写',
      });
    }
  }
}

function expectObject(errors: ConfigError[], path: string, value: unknown): Obj | null {
  if (value === undefined) return null;
  if (!isObject(value)) {
    errors.push({ path, message: '应为对象' });
    return null;
  }
  return value;
}

function expectBoolean(errors: ConfigError[], path: string, value: unknown): void {
  if (value !== undefined && typeof value !== 'boolean') {
    errors.push({ path, message: '应为布尔值' });
  }
}

function expectString(errors: ConfigError[], path: string, value: unknown): void {
  if (value !== undefined && typeof value !== 'string') {
    errors.push({ path, message: '应为字符串' });
  }
}

function expectNullableString(errors: ConfigError[], path: string, value: unknown): void {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    errors.push({ path, message: '应为字符串或 null' });
  }
}

function expectInteger(
  errors: ConfigError[],
  path: string,
  value: unknown,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): void {
  if (value === undefined) return;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    errors.push({ path, message: '应为整数' });
    return;
  }
  if (value < min || value > max) {
    errors.push({
      path,
      message: `应在 ${String(min)}~${String(max)} 之间，收到 ${String(value)}`,
    });
  }
}

function expectNumberInRange(
  errors: ConfigError[],
  path: string,
  value: unknown,
  min: number,
  max: number,
): void {
  if (value === undefined) return;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    errors.push({ path, message: '应为数字' });
    return;
  }
  if (value < min || value > max) {
    errors.push({
      path,
      message: `应在 ${String(min)}~${String(max)} 之间，收到 ${String(value)}`,
    });
  }
}

function expectEnum(
  errors: ConfigError[],
  path: string,
  value: unknown,
  allowed: readonly string[],
): void {
  if (value === undefined) return;
  if (typeof value !== 'string' || !allowed.includes(value)) {
    errors.push({ path, message: `应为 ${allowed.join(' / ')} 之一` });
  }
}

function expectStringArray(errors: ConfigError[], path: string, value: unknown): void {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    errors.push({ path, message: '应为字符串数组' });
  }
}

// ---------------------------------------------------------------- 分节校验

function checkPlatform(errors: ConfigError[], raw: unknown): void {
  const obj = expectObject(errors, 'platform', raw);
  if (obj === null) return;

  expectKeys(errors, 'platform', obj, PLATFORM_KEYS);
  if (obj['kind'] !== undefined && obj['kind'] !== 'github') {
    errors.push({ path: 'platform.kind', message: '当前只支持 github' });
  }
  expectNullableString(errors, 'platform.repository', obj['repository']);
  expectString(errors, 'platform.tokenEnv', obj['tokenEnv']);
}

function checkPricing(errors: ConfigError[], path: string, raw: unknown): void {
  if (raw === null) return;
  const obj = expectObject(errors, path, raw);
  if (obj === null) return;

  expectKeys(errors, path, obj, PRICING_KEYS);
  expectNumberInRange(errors, `${path}.inputPerMTok`, obj['inputPerMTok'], 0, 10000);
  expectNumberInRange(errors, `${path}.outputPerMTok`, obj['outputPerMTok'], 0, 100000);
  expectNumberInRange(
    errors,
    `${path}.cacheWriteShortMultiplier`,
    obj['cacheWriteShortMultiplier'],
    0,
    10,
  );
  expectNumberInRange(
    errors,
    `${path}.cacheWriteLongMultiplier`,
    obj['cacheWriteLongMultiplier'],
    0,
    10,
  );
  expectNumberInRange(errors, `${path}.cacheReadMultiplier`, obj['cacheReadMultiplier'], 0, 10);
}

function checkLlm(errors: ConfigError[], raw: unknown): void {
  const obj = expectObject(errors, 'llm', raw);
  if (obj === null) return;

  expectKeys(errors, 'llm', obj, LLM_KEYS);
  expectString(errors, 'llm.preset', obj['preset']);
  expectString(errors, 'llm.baseUrl', obj['baseUrl']);
  expectString(errors, 'llm.model', obj['model']);
  expectString(errors, 'llm.apiKeyEnv', obj['apiKeyEnv']);
  expectNumberInRange(errors, 'llm.temperature', obj['temperature'], 0, 2);
  expectInteger(errors, 'llm.maxOutputTokens', obj['maxOutputTokens'], 1);
  expectInteger(errors, 'llm.contextWindow', obj['contextWindow'], 1);

  const pricing = obj['pricing'];
  if (pricing === undefined || pricing === null) {
    // null 是合法值：表示未配置单价，费用显示「无法折算」
  } else {
    checkPricing(errors, 'llm.pricing', pricing);
  }

  const headers = obj['headers'];
  if (headers !== undefined) {
    if (!isObject(headers)) {
      errors.push({ path: 'llm.headers', message: '应为对象' });
    } else {
      for (const [key, val] of Object.entries(headers)) {
        if (typeof val !== 'string') {
          errors.push({ path: `llm.headers.${key}`, message: '请求头值应为字符串' });
        }
      }
    }
  }

  expectEnum(errors, 'llm.structuredOutput', obj['structuredOutput'], [
    'auto',
    'json-schema',
    'json-object',
    'none',
  ]);
}

function checkRouting(errors: ConfigError[], raw: unknown): void {
  const obj = expectObject(errors, 'routing', raw);
  if (obj === null) return;

  expectKeys(errors, 'routing', obj, ROUTING_KEYS);
  expectBoolean(errors, 'routing.enabled', obj['enabled']);
  expectNumberInRange(errors, 'routing.fileRiskThreshold', obj['fileRiskThreshold'], 0, 100);
  expectInteger(errors, 'routing.smallChangeLines', obj['smallChangeLines'], 0);
  expectString(errors, 'routing.defaultTier', obj['defaultTier']);

  const tiers = obj['tiers'];
  if (tiers !== undefined) {
    if (!isObject(tiers)) {
      errors.push({ path: 'routing.tiers', message: '应为对象' });
    } else {
      for (const [name, tier] of Object.entries(tiers)) {
        const tierPath = `routing.tiers.${name}`;
        const tierObj = expectObject(errors, tierPath, tier);
        if (tierObj === null) continue;
        expectKeys(errors, tierPath, tierObj, TIER_KEYS);
        expectString(errors, `${tierPath}.model`, tierObj['model']);
        expectInteger(errors, `${tierPath}.maxOutputTokens`, tierObj['maxOutputTokens'], 1);
        expectInteger(errors, `${tierPath}.contextWindow`, tierObj['contextWindow'], 1);
        if (tierObj['pricing'] !== undefined && tierObj['pricing'] !== null) {
          checkPricing(errors, `${tierPath}.pricing`, tierObj['pricing']);
        }
      }
    }
  }

  const byDimension = obj['byDimension'];
  if (byDimension !== undefined) {
    if (!isObject(byDimension)) {
      errors.push({ path: 'routing.byDimension', message: '应为对象' });
    } else {
      expectKeys(errors, 'routing.byDimension', byDimension, REVIEWER_IDS);
      for (const [key, val] of Object.entries(byDimension)) {
        if (typeof val !== 'string') {
          errors.push({ path: `routing.byDimension.${key}`, message: '应为档位名字符串' });
        }
      }
    }
  }

  // 引用了不存在的档位是常见错误：配置能通过校验但运行时无从选择
  if (isObject(tiers)) {
    const known = new Set(Object.keys(tiers));
    const declared = obj['defaultTier'];
    if (typeof declared === 'string' && known.size > 0 && !known.has(declared)) {
      errors.push({
        path: 'routing.defaultTier',
        message: `档位 ${declared} 未在 routing.tiers 中定义`,
      });
    }
    if (isObject(byDimension)) {
      for (const [key, val] of Object.entries(byDimension)) {
        if (typeof val === 'string' && known.size > 0 && !known.has(val)) {
          errors.push({
            path: `routing.byDimension.${key}`,
            message: `档位 ${val} 未在 routing.tiers 中定义`,
          });
        }
      }
    }
  }
}

function checkReview(errors: ConfigError[], raw: unknown): void {
  const obj = expectObject(errors, 'review', raw);
  if (obj === null) return;

  expectKeys(errors, 'review', obj, REVIEW_KEYS);
  expectInteger(errors, 'review.maxInlineComments', obj['maxInlineComments'], 0);
  expectInteger(errors, 'review.maxSummaryPreexisting', obj['maxSummaryPreexisting'], 0);
  expectInteger(errors, 'review.maxSummaryFileLevel', obj['maxSummaryFileLevel'], 0);
  expectBoolean(errors, 'review.checkpoint', obj['checkpoint']);
  expectStringArray(errors, 'review.skipPaths', obj['skipPaths']);
  expectNumberInRange(errors, 'review.maxBudgetUsd', obj['maxBudgetUsd'], 0, 10000);
  expectInteger(errors, 'review.crossFileDepth', obj['crossFileDepth'], 0, 2);
  expectInteger(errors, 'review.crossFileMaxFiles', obj['crossFileMaxFiles'], 0);
  expectInteger(errors, 'review.concurrency', obj['concurrency'], 1, 64);
  expectBoolean(errors, 'review.respectLintConfig', obj['respectLintConfig']);

  const dimensions = obj['dimensions'];
  if (dimensions !== undefined) {
    if (!isObject(dimensions)) {
      errors.push({ path: 'review.dimensions', message: '应为对象' });
    } else {
      expectKeys(errors, 'review.dimensions', dimensions, REVIEWER_IDS);
      for (const id of REVIEWER_IDS) {
        const dim = dimensions[id];
        if (dim === undefined) continue;
        const dimPath = `review.dimensions.${id}`;
        const dimObj = expectObject(errors, dimPath, dim);
        if (dimObj === null) continue;
        expectKeys(errors, dimPath, dimObj, DIMENSION_KEYS);
        expectBoolean(errors, `${dimPath}.enabled`, dimObj['enabled']);
        expectEnum(errors, `${dimPath}.severityFloor`, dimObj['severityFloor'], SEVERITIES);
      }
    }
  }
}

function checkGate(errors: ConfigError[], raw: unknown): void {
  const obj = expectObject(errors, 'gate', raw);
  if (obj === null) return;

  expectKeys(errors, 'gate', obj, GATE_KEYS);
  expectBoolean(errors, 'gate.enabled', obj['enabled']);

  if (obj['blockingSeverity'] !== undefined && obj['blockingSeverity'] !== 'blocker') {
    errors.push({
      path: 'gate.blockingSeverity',
      message: '当前只允许 blocker——非致命问题不得阻塞合并',
    });
  }

  expectStringArray(errors, 'gate.blockingCategories', obj['blockingCategories']);
  expectNumberInRange(errors, 'gate.confidenceThreshold', obj['confidenceThreshold'], 0, 1);

  const store = obj['exemptionStore'];
  if (store !== undefined && store !== null && store !== 'issue-comment') {
    errors.push({ path: 'gate.exemptionStore', message: '当前只支持 issue-comment 或 null' });
  }
}

function checkInspection(errors: ConfigError[], raw: unknown): void {
  const obj = expectObject(errors, 'inspection', raw);
  if (obj === null) return;

  expectKeys(errors, 'inspection', obj, INSPECTION_KEYS);
  expectBoolean(errors, 'inspection.enabled', obj['enabled']);
  expectInteger(errors, 'inspection.maxScorePerDimension', obj['maxScorePerDimension'], 1);
  expectInteger(errors, 'inspection.sampleSize', obj['sampleSize'], 0);
  expectEnum(errors, 'inspection.carrier', obj['carrier'], ['auto', 'wiki', 'issue']);
  expectString(errors, 'inspection.wikiPagePrefix', obj['wikiPagePrefix']);
  expectInteger(errors, 'inspection.historyDepth', obj['historyDepth'], 1, 120);

  const weights = obj['weights'];
  if (weights !== undefined) {
    if (!isObject(weights)) {
      errors.push({ path: 'inspection.weights', message: '应为对象' });
    } else {
      expectKeys(errors, 'inspection.weights', weights, SCORE_DIMENSIONS);
      let sum = 0;
      let complete = true;
      for (const dim of SCORE_DIMENSIONS) {
        const val = weights[dim];
        if (val === undefined) {
          complete = false;
          continue;
        }
        if (typeof val !== 'number' || Number.isNaN(val) || val < 0) {
          errors.push({ path: `inspection.weights.${dim}`, message: '应为非负数字' });
          complete = false;
          continue;
        }
        sum += val;
      }
      if (complete && Math.abs(sum - 100) > 0.01) {
        errors.push({
          path: 'inspection.weights',
          message: `五个维度权重合计应为 100，当前 ${String(sum)}`,
        });
      }
    }
  }
}

function checkOutput(errors: ConfigError[], raw: unknown): void {
  const obj = expectObject(errors, 'output', raw);
  if (obj === null) return;

  expectKeys(errors, 'output', obj, OUTPUT_KEYS);
  expectBoolean(errors, 'output.inline', obj['inline']);
  expectBoolean(errors, 'output.summary', obj['summary']);
  expectEnum(errors, 'output.language', obj['language'], ['zh-CN', 'en']);
  expectEnum(errors, 'output.resolveMode', obj['resolveMode'], ['edit', 'delete']);
}
