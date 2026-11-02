/**
 * 审核员的共同契约与字段规范校验。
 *
 * **维度边界用字段规范锁死，不靠提示词说服。** 提示词里写「你只负责安全」，
 * 模型仍可能报一条命名问题；但 schema 里 `category` 的枚举只含 `security`，
 * 越界条目在结构化输出层就被拒掉，不进后续流程。这是类型约束，不是请求。
 */

import type { ContextSegment } from '../../contracts/context.js';
import type { RawFinding, ReviewerId, Severity } from '../../contracts/finding.js';

/** 严重度从重到轻，用于比较与上限截断。 */
export const SEVERITY_ORDER: readonly Severity[] = ['blocker', 'major', 'minor', 'nit'];

/** 严重度是否不超过上限。 */
export function severityWithin(severity: Severity, limit: Severity): boolean {
  return SEVERITY_ORDER.indexOf(severity) >= SEVERITY_ORDER.indexOf(limit);
}

/** 一个维度的定义。提示词、字段规范、上限都在这里，评审时一眼能看全。 */
export interface ReviewerSpec {
  readonly id: ReviewerId;
  /** 提示词版本，改一个字就要升号——它是归因结论差异的唯一依据 */
  readonly promptVersion: string;
  /** 本维度允许出现的问题类别，枚举外一律拒收 */
  readonly allowedCategories: readonly string[];
  /** 严重度上限，超出则截断到上限 */
  readonly maxSeverity: Severity;
  readonly systemPrompt: string;
  /** JSON Schema，同时用于约束模型与事后校验 */
  readonly schema: Readonly<Record<string, unknown>>;
  /** 拼 user 消息：只喂被选中的材料，不让它自己决定看什么 */
  readonly buildUserMessage: (input: ReviewerInput) => string;
}

/** 一次送审的材料。 */
export interface ReviewerInput {
  /** 本次审的文件路径；第二遍全局视角时可能为 null */
  readonly file: string | null;
  /** 已按预算裁好的上下文段 */
  readonly segments: readonly ContextSegment[];
  /** 该维度的额外指令（如安全维度的风险命中理由） */
  readonly note?: string;
}

/** 一条被拒的条目。带上 file/line 是为了让拒收记录能追溯到具体位置。 */
export interface RejectedItem {
  readonly title: string;
  readonly file: string | null;
  readonly line: number | null;
  readonly reason: 'schema-invalid';
  readonly detail: string;
}

/** 校验结果。拒收必须留原因，否则无法区分「模型乱报」与「规范写错」。 */
export interface ValidationOutcome {
  readonly accepted: readonly RawFinding[];
  readonly rejected: readonly RejectedItem[];
  /** 被截断到上限的条目数，进统计用 */
  readonly clamped: number;
}

const SIDES = new Set(['new', 'old']);
const SEVERITIES = new Set<string>(SEVERITY_ORDER);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * 校验模型输出，产出可信的原始问题项。
 *
 * 只做**结构与取值**校验，不判断内容对不对——「这条说得对吗」由后续的证据校验负责，
 * 那一步是确定性的，而这里只挡「格式不对」。
 */
export function validateRawFindings(payload: unknown, spec: ReviewerSpec): ValidationOutcome {
  const container = isRecord(payload) ? payload['findings'] : null;
  if (!Array.isArray(container)) {
    return {
      accepted: [],
      rejected: [
        {
          title: '(整批)',
          file: null,
          line: null,
          reason: 'schema-invalid',
          detail: '输出缺少 findings 数组',
        },
      ],
      clamped: 0,
    };
  }

  const accepted: RawFinding[] = [];
  const rejects: RejectedItem[] = [];
  let clamped = 0;

  for (const item of container) {
    if (!isRecord(item)) {
      rejects.push({
        title: '(非对象)',
        file: null,
        line: null,
        reason: 'schema-invalid',
        detail: '条目不是对象',
      });
      continue;
    }

    const title = str(item['title']) ?? '(无标题)';
    const file = str(item['file']);
    const side = str(item['side']);
    const line = item['line'];
    const severity = str(item['severity']);
    const category = str(item['category']);
    const body = str(item['body']);
    const evidence = str(item['evidence']);
    const confidence = item['confidence'];
    const suggestionRaw = item['suggestion'];

    const problem = firstProblem({
      file,
      side,
      line,
      severity,
      category,
      body,
      evidence,
      confidence,
    });
    if (problem !== null) {
      rejects.push({
        title,
        file,
        line: typeof line === 'number' ? line : null,
        reason: 'schema-invalid',
        detail: problem,
      });
      continue;
    }

    // 类别越界是维度的核心防线：直接拒，不做「猜测它想报哪类」的补救
    if (!spec.allowedCategories.includes(category as string)) {
      rejects.push({
        title,
        file,
        line: typeof line === 'number' ? line : null,
        reason: 'schema-invalid',
        detail: `类别 ${String(category)} 不属于维度 ${spec.id}`,
      });
      continue;
    }

    let finalSeverity = severity as Severity;
    if (!severityWithin(finalSeverity, spec.maxSeverity)) {
      finalSeverity = spec.maxSeverity;
      clamped += 1;
    }

    accepted.push({
      file: file as string,
      line: line as number,
      side: side as 'new' | 'old',
      severity: finalSeverity,
      title: title.slice(0, 60),
      body: body as string,
      evidence: evidence as string,
      suggestion: typeof suggestionRaw === 'string' && suggestionRaw !== '' ? suggestionRaw : null,
      confidence: confidence as number,
    });
  }

  return { accepted, rejected: rejects, clamped };
}

/** 逐字段检查，返回第一条不合格的原因；全部合格返回 null。 */
function firstProblem(fields: {
  file: string | null;
  side: string | null;
  line: unknown;
  severity: string | null;
  category: string | null;
  body: string | null;
  evidence: string | null;
  confidence: unknown;
}): string | null {
  if (fields.file === null || fields.file === '') return '缺少 file';
  if (fields.side === null || !SIDES.has(fields.side))
    return `side 必须是 new 或 old，收到 ${String(fields.side)}`;
  if (typeof fields.line !== 'number' || !Number.isInteger(fields.line) || fields.line < 1) {
    return `line 必须是正整数，收到 ${String(fields.line)}`;
  }
  if (fields.severity === null || !SEVERITIES.has(fields.severity)) {
    return `severity 取值非法：${String(fields.severity)}`;
  }
  if (fields.category === null || fields.category === '') return '缺少 category';
  if (fields.body === null || fields.body.trim() === '') return 'body 不能为空';
  if (fields.evidence === null || fields.evidence.trim() === '') return 'evidence 不能为空';
  if (typeof fields.confidence !== 'number' || fields.confidence < 0 || fields.confidence > 1) {
    return `confidence 必须落在 0~1，收到 ${String(fields.confidence)}`;
  }
  return null;
}

/** 拼字段规范：所有维度共用骨架，只有类别枚举与严重度上限不同。 */
export function buildSchema(
  categories: readonly string[],
  maxSeverity: Severity,
): Record<string, unknown> {
  // 取「不超过上限」的那几档：上限是 minor 就只允许 minor 与 nit
  const severities = SEVERITY_ORDER.slice(SEVERITY_ORDER.indexOf(maxSeverity));
  return {
    type: 'object',
    required: ['findings'],
    properties: {
      findings: {
        type: 'array',
        items: {
          type: 'object',
          required: [
            'file',
            'line',
            'side',
            'severity',
            'category',
            'title',
            'body',
            'evidence',
            'confidence',
          ],
          properties: {
            file: { type: 'string' },
            line: { type: 'integer', minimum: 1 },
            side: { enum: ['new', 'old'] },
            severity: { enum: severities },
            category: { enum: [...categories] },
            title: { type: 'string', maxLength: 60 },
            body: { type: 'string' },
            evidence: { type: 'string' },
            suggestion: { type: ['string', 'null'] },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
    },
  };
}
