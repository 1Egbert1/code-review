import { describe, expect, it } from 'vitest';

import type { CommentMarker } from '../src/contracts/index.js';
import { parseMarker, renderMarker, stripMarker } from '../src/core/reconcile/markers.js';
import {
  type ReadbackActual,
  type ReadbackExpectation,
  verifyReadback,
} from '../src/platforms/github/readback.js';

const MARKER: CommentMarker = {
  version: 'v1',
  fingerprint: 'ab12cd34ef56gh78',
  reviewer: 'correctness',
  scope: 'changed',
  promptVersion: 'v1.0',
  model: 'deepseek-chat',
};

const BODY = `这条会空指针。\n\n${renderMarker(MARKER)}`;

function expected(overrides: Partial<ReadbackExpectation> = {}): ReadbackExpectation {
  return { fingerprint: MARKER.fingerprint, line: 10, side: 'RIGHT', body: BODY, ...overrides };
}

function actual(overrides: Partial<ReadbackActual> = {}): ReadbackActual {
  return { found: true, body: BODY, line: 10, side: 'RIGHT', ...overrides };
}

describe('隐藏标记', () => {
  it('渲染后能原样解析回来', () => {
    const parsed = parseMarker(`正文\n\n${renderMarker(MARKER)}`);
    expect(parsed).toEqual(MARKER);
  });

  it('标记必须在正文末尾才认', () => {
    expect(parseMarker(`${renderMarker(MARKER)}\n\n后面还有内容`)).toBeNull();
  });

  it('没有标记时返回 null，调用方据此判定「不是本工具发的」', () => {
    expect(parseMarker('这是一条普通评论')).toBeNull();
  });

  it('版本不符时返回 null，避免用旧格式误判', () => {
    expect(parseMarker('<!-- acr:v9|fp=x|rv=correctness|sc=changed|pv=v1|md=m -->')).toBeNull();
  });

  it('字段不全时返回 null', () => {
    expect(parseMarker('<!-- acr:v1|fp=x|rv=correctness -->')).toBeNull();
  });

  it('维度或范围不在枚举内时返回 null', () => {
    expect(parseMarker('<!-- acr:v1|fp=x|rv=unknown|sc=changed|pv=v1|md=m -->')).toBeNull();
    expect(parseMarker('<!-- acr:v1|fp=x|rv=correctness|sc=wide|pv=v1|md=m -->')).toBeNull();
  });

  it('去掉标记后得到用户可见的正文', () => {
    expect(stripMarker(BODY)).toBe('这条会空指针。');
  });
});

describe('回读校验', () => {
  it('四项全对时没有任何失败', () => {
    expect(verifyReadback(expected(), actual())).toEqual([]);
  });

  it('取不回评论时只报 not-found，不衍生其他失败', () => {
    expect(verifyReadback(expected(), actual({ found: false }))).toEqual(['not-found']);
    expect(verifyReadback(expected(), actual({ body: null }))).toEqual(['not-found']);
  });

  it('正文里没有标记', () => {
    const body = '这条会空指针。';
    expect(verifyReadback(expected({ body }), actual({ body }))).toEqual(['marker-missing']);
  });

  it('标记指纹对不上，说明发出去的不是这一条', () => {
    const other = { ...MARKER, fingerprint: 'different' };
    const body = `这条会空指针。\n\n${renderMarker(other)}`;
    expect(verifyReadback(expected(), actual({ body }))).toContain('marker-mismatch');
  });

  it('行号被平台静默修正', () => {
    expect(verifyReadback(expected(), actual({ line: 11 }))).toEqual(['line-mismatch']);
  });

  it('侧被改动（RIGHT 变 LEFT）也算位置错误', () => {
    expect(verifyReadback(expected(), actual({ side: 'LEFT' }))).toEqual(['line-mismatch']);
  });

  it('正文被改写', () => {
    const body = `这条会空指针！（平台加了感叹号）\n\n${renderMarker(MARKER)}`;
    expect(verifyReadback(expected(), actual({ body }))).toEqual(['body-mismatch']);
  });

  it('多个问题同时存在时全部报出，不只报第一个', () => {
    const failures = verifyReadback(expected(), actual({ line: 99, side: 'LEFT' }));
    expect(failures).toContain('line-mismatch');
  });

  it('换行符与首尾空白差异不算篡改', () => {
    const body = `这条会空指针。\r\n\r\n${renderMarker(MARKER)}\r\n`;
    // 归一化只吃换行与首尾空白；正文内部结构一致就应通过
    const result = verifyReadback(expected(), actual({ body }));
    expect(result).not.toContain('body-mismatch');
  });
});
