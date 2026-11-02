import { describe, expect, it } from 'vitest';

import { parseMarker, renderMarker, stripMarker } from '../src/core/reconcile/markers.js';
import type { CommentMarker } from '../src/contracts/result.js';

const MARKER: CommentMarker = {
  version: 'v1',
  fingerprint: 'ab12cd34ef56ab78',
  reviewer: 'security',
  scope: 'changed',
  promptVersion: 'v1.0',
  model: 'deepseek-chat',
};

describe('隐藏标记', () => {
  it('渲染后能被原样解析回来', () => {
    const text = renderMarker(MARKER);
    expect(parseMarker(text)).toEqual(MARKER);
  });

  it('埋在正文里也能找到', () => {
    const body = `**越权**\n\n这里没校验归属。\n\n${renderMarker(MARKER)}`;
    expect(parseMarker(body)).toEqual(MARKER);
  });

  it('不是本工具的评论返回 null', () => {
    expect(parseMarker('看起来像代码审查意见，但没有标记')).toBeNull();
  });

  it('剥掉标记后只剩用户可见内容', () => {
    const body = `正文内容\n\n${renderMarker(MARKER)}`;
    expect(stripMarker(body).trim()).toBe('正文内容');
  });

  it('标记为空时不误匹配', () => {
    expect(parseMarker('<!-- acr:v1|kind=summary -->')).toBeNull();
  });
});
