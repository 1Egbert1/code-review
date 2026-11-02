/**
 * 发送后的回读校验。
 *
 * 为什么必须有：接口返回成功**不等于**评论显示正确。位置参数给错时，
 * 平台可能照样返回 200，只是把内容显示成一段坏掉的引用。
 * 只看状态码的校验在这里完全无效——所以发完必须读回来逐项比对。
 *
 * 校验四项（规格书 6.5），任一项不过就记为异常：
 * 1. 评论能被取回
 * 2. 标记可解析且指纹一致
 * 3. 平台返回的行号与侧与预期一致
 * 4. 正文未被平台改写
 */

import { parseMarker } from '../../core/reconcile/markers.js';

/** 发送时我们就知道、发完后要逐项核对的信息。 */
export interface ReadbackExpectation {
  readonly fingerprint: string;
  readonly line: number;
  readonly side: 'LEFT' | 'RIGHT';
  /** 发送时的完整正文，含隐藏标记 */
  readonly body: string;
}

/** 平台回读到的实际值。取不到时相应字段为 null。 */
export interface ReadbackActual {
  readonly found: boolean;
  readonly body: string | null;
  readonly line: number | null;
  readonly side: 'LEFT' | 'RIGHT' | null;
}

/** 回读失败原因。 */
export type ReadbackFailure =
  /** 评论根本没被取回 */
  | 'not-found'
  /** 正文里没有可解析的标记——内容被截断或转义 */
  | 'marker-missing'
  /** 标记存在但指纹对不上——发出去的不是这一条 */
  | 'marker-mismatch'
  /** 行号或侧与预期不一致——位置参数被平台静默修正 */
  | 'line-mismatch'
  /** 正文与发送内容不一致——平台改写了内容 */
  | 'body-mismatch';

/** 统一换行与首尾空白，避免把平台的格式清理误判成内容篡改。 */
function normalizeBody(body: string): string {
  return body.replace(/\r\n/g, '\n').trim();
}

/**
 * 执行四项校验。
 *
 * @returns 失败项列表；空数组表示全部通过
 */
export function verifyReadback(
  expected: ReadbackExpectation,
  actual: ReadbackActual,
): readonly ReadbackFailure[] {
  // 拿不到内容时后续检查都没有意义，直接返回，避免报出一堆衍生错误
  if (!actual.found || actual.body === null) {
    return ['not-found'];
  }

  const failures: ReadbackFailure[] = [];

  const marker = parseMarker(actual.body);
  if (marker === null) {
    failures.push('marker-missing');
  } else if (marker.fingerprint !== expected.fingerprint) {
    failures.push('marker-mismatch');
  }

  if (actual.line !== expected.line || actual.side !== expected.side) {
    failures.push('line-mismatch');
  }

  if (normalizeBody(actual.body) !== normalizeBody(expected.body)) {
    failures.push('body-mismatch');
  }

  return failures;
}

/** 把失败原因转成一句可直接进告警的话。 */
export function describeFailure(failure: ReadbackFailure): string {
  switch (failure) {
    case 'not-found':
      return '评论未被取回，发送可能未生效';
    case 'marker-missing':
      return '正文中找不到标记，内容可能被截断或转义';
    case 'marker-mismatch':
      return '标记指纹与发送时不一致，发出去的可能不是这一条';
    case 'line-mismatch':
      return '平台返回的行号或侧与预期不符，位置参数可能被静默修正';
    case 'body-mismatch':
      return '正文与发送内容不一致，平台可能改写了内容';
  }
}
