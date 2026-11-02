/**
 * 执行发送动作。
 *
 * 这是整个项目里**唯一有外部副作用**的一层，因此四条纪律不可让步：
 *
 * 1. **串行 + 限速。** 平台对写接口有次级限流，并发发 15 条评论会直接被拒。
 * 2. **单批发不完就分批。** 一批超过 50 条会整批失败——不是部分成功，是整批。
 * 3. **发完必回读。** 接口返回成功不等于显示正确：位置参数错时平台照样 200，
 *    但评论会变成一段失效的引用。只信 200 的测试在这里全是假绿灯。
 * 4. **失败不中断整轮。** 一条发不出去，其余照发，并把失败原因记进结果。
 */

import type { PublishAction, ReviewWarning } from '../../contracts/result.js';
import type { CommentPort, WriteFailure, WriteResult } from '../../platforms/types.js';
import { SUMMARY_MARKER } from '../reconcile/markers.js';
import { resolvedNotice } from '../reconcile/plan.js';

export interface PublishOptions {
  readonly port: CommentPort;
  readonly actions: readonly PublishAction[];
  /** 渲染好的摘要；null 表示不发摘要 */
  readonly summaryBody: string | null;
  /** 已修复时的处理方式 */
  readonly resolveMode?: 'edit' | 'delete';
  /** 单批写操作上限，默认 50（实测 70 余条会整批失败） */
  readonly batchSize?: number;
  /** 两次写操作之间的间隔，默认 300ms */
  readonly intervalMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  /** 回读校验开关，默认开 */
  readonly verifyReadback?: boolean;
  /** 注入时间，便于测试固定输出 */
  readonly now?: () => string;
}

export interface PublishFailure {
  readonly action: string;
  readonly detail: string;
}

export interface PublishOutcome {
  readonly created: number;
  readonly replaced: number;
  readonly resolved: number;
  readonly failed: readonly PublishFailure[];
  readonly warnings: readonly ReviewWarning[];
  readonly readbackFailures: number;
  readonly summary: 'created' | 'updated' | 'failed' | 'skipped';
}

const DEFAULT_SLEEP = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function describe(failure: WriteFailure): string {
  return `${failure.kind}: ${failure.message}`;
}

/** 节流器：每次写之前等一会，每攒够一批额外多等一次。 */
function createThrottle(
  intervalMs: number,
  batchSize: number,
  sleep: (ms: number) => Promise<void>,
) {
  let sincePause = 0;
  let started = false;

  return async (): Promise<void> => {
    if (started && intervalMs > 0) await sleep(intervalMs);
    started = true;
    sincePause += 1;
    if (sincePause >= batchSize) {
      sincePause = 0;
      if (intervalMs > 0) await sleep(intervalMs);
    }
  };
}


/**
 * 限流重试。
 *
 * 只对 `rate-limit` 重试：其余失败重试也没用（权限、找不到），重试只会把一次明确的错误
 * 拖成三次等待。退避 500ms → 1s → 2s，最多三次，仍失败就记进结果，不中断整轮。
 */
async function withRetry(
  attempt: () => Promise<WriteResult>,
  sleep: (ms: number) => Promise<void>,
): Promise<WriteResult> {
  let last = await attempt();
  for (let round = 1; round <= 3 && !last.ok && last.failure.kind === 'rate-limit'; round += 1) {
    await sleep(Math.min(500 * 2 ** (round - 1), 4000));
    last = await attempt();
  }
  return last;
}

/** 回读校验：正文里必须还能找到这条评论的指纹标记。 */
async function verify(port: CommentPort, commentId: string, fingerprint: string): Promise<boolean> {
  const read = await port.read(commentId);
  return read !== null && read.body.includes(fingerprint);
}

export async function publish(options: PublishOptions): Promise<PublishOutcome> {
  const port = options.port;
  const sleep = options.sleep ?? DEFAULT_SLEEP;
  const batchSize = options.batchSize ?? 50;
  const intervalMs = options.intervalMs ?? 300;
  const throttle = createThrottle(intervalMs, batchSize, sleep);
  const checkReadback = options.verifyReadback ?? true;
  const now = options.now ?? ((): string => new Date().toISOString());

  const failed: PublishFailure[] = [];
  const warnings: ReviewWarning[] = [];
  let created = 0;
  let replaced = 0;
  let resolved = 0;
  let readbackFailures = 0;

  const record = (action: string, result: WriteResult): boolean => {
    if (result.ok) return true;
    failed.push({ action, detail: describe(result.failure) });
    return false;
  };

  for (const action of options.actions) {
    if (action.kind === 'keep') continue;

    if (action.kind === 'create') {
      // 摘要类条目由摘要统一承载，不单独发
      if (action.target !== 'inline') continue;

      await throttle();
      const result = await withRetry(() => port.createInline(
        {
          path: action.finding.anchor.file,
          line: action.finding.anchor.newLine ?? action.finding.anchor.oldLine ?? 0,
          side: action.finding.anchor.kind === 'removed' ? 'old' : 'new',
        },
        action.body,
      ), sleep);

      if (!record('create', result)) continue;
      created += 1;

      if (checkReadback && result.ok) {
        const ok = await verify(port, result.commentId, action.finding.fingerprint);
        if (!ok) {
          readbackFailures += 1;
          warnings.push({
            kind: 'readback',
            message: '评论已创建，但回读校验未通过（内容可能被平台改写）',
            target: `${action.finding.anchor.file}:${String(action.finding.anchor.newLine ?? 0)}`,
          });
        }
      }
      continue;
    }

    if (action.kind === 'replace') {
      // 先发新的再处理旧的：顺序反了的话，新评论发失败就彻底丢了这条意见
      await throttle();
      const createdResult = await withRetry(() => port.createInline(
        {
          path: action.finding.anchor.file,
          line: action.finding.anchor.newLine ?? action.finding.anchor.oldLine ?? 0,
          side: action.finding.anchor.kind === 'removed' ? 'old' : 'new',
        },
        action.body,
      ), sleep);

      if (!record('replace', createdResult)) continue;
      replaced += 1;

      await throttle();
      const removed = await withRetry(() => port.remove(action.commentId), sleep);
      if (!removed.ok) {
        // 删不掉就退一步标记为已解决，至少不会让旧结论看起来仍然成立
        const fallback = await withRetry(() => port.resolve(action.commentId), sleep);
        if (!fallback.ok) {
          warnings.push({
            kind: 'permission',
            message: '旧评论既无法删除也无法标记为已解决（权限不足），可能与新评论同时存在',
            target: action.commentId,
          });
        }
      }
      continue;
    }

    // resolve
    await throttle();
    const primary =
      options.resolveMode === 'delete'
        ? await port.remove(action.commentId)
        : await port.resolve(action.commentId);

    if (primary.ok) {
      resolved += 1;
      continue;
    }

    if (primary.failure.kind !== 'permission') {
      failed.push({ action: 'resolve', detail: describe(primary.failure) });
      continue;
    }

    // 权限不足：降级为「编辑原评论并加一行说明」，保证用户知道这条已经修复
    const current = await port.read(action.commentId);
    if (current === null) {
      failed.push({ action: 'resolve', detail: '权限不足且读不到原评论，无法降级' });
      continue;
    }

    await throttle();
    const edited = await port.update(
      action.commentId,
      `${resolvedNotice(now())}\n\n${current.body}`,
    );
    if (!record('resolve-fallback', edited)) continue;

    resolved += 1;
    warnings.push({
      kind: 'permission',
      message: '没有「标记已解决」的权限，已降级为在评论正文加一行说明',
      target: action.commentId,
    });
  }

  let summary: PublishOutcome['summary'] = 'skipped';
  if (options.summaryBody !== null) {
    const existing = await port.findThread(SUMMARY_MARKER);
    await throttle();

    if (existing === null) {
      const result = await withRetry(() => port.createThread(options.summaryBody ?? ''), sleep);
      summary = record('summary-create', result) ? 'created' : 'failed';
    } else {
      const result = await withRetry(() => port.update(existing.commentId, options.summaryBody ?? ''), sleep);
      summary = record('summary-update', result) ? 'updated' : 'failed';
    }
  }

  return { created, replaced, resolved, failed, warnings, readbackFailures, summary };
}
