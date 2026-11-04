import { describe, expect, it } from 'vitest';

import { numberFromEventPayload, resolvePullRequestNumber } from '../src/cli/event.js';

/** 事件文件读取的替身：只认一个路径，其余按「文件不存在」处理。 */
function readerFor(payload: unknown, path = '/tmp/event.json') {
  return async (requested: string): Promise<string> => {
    if (requested !== path) throw new Error('ENOENT');
    return JSON.stringify(payload);
  };
}

describe('从事件载荷取 PR 编号', () => {
  it('取 pull_request.number', () => {
    expect(numberFromEventPayload({ pull_request: { number: 42 } })).toBe(42);
  });

  it('workflow_dispatch 的手填输入也能认', () => {
    expect(numberFromEventPayload({ inputs: { pr: '7' } })).toBe(7);
  });

  it('字符串、零、负数、缺字段一律不接受', () => {
    expect(numberFromEventPayload({ pull_request: { number: '0' } })).toBeNull();
    expect(numberFromEventPayload({ pull_request: { number: -3 } })).toBeNull();
    expect(numberFromEventPayload({ pull_request: {} })).toBeNull();
    expect(numberFromEventPayload(null)).toBeNull();
  });
});

describe('解析 PR 编号的三层顺序', () => {
  it('命令行优先于环境与事件', async () => {
    const value = await resolvePullRequestNumber({
      flag: '9',
      env: { ACR_PULL_REQUEST: '8', GITHUB_EVENT_PATH: '/tmp/event.json' },
      readEventFile: readerFor({ pull_request: { number: 7 } }),
    });
    expect(value).toBe(9);
  });

  it('环境变量是空串时不能当成「有值」，要继续往下找', async () => {
    // 这条是真实故障的回归：workflow 里 `pull-request: ${{ inputs.pr }}` 在 PR 事件下
    // 会传进来一个空串，而 `??` 只挡 null/undefined，挡不住空串
    const value = await resolvePullRequestNumber({
      flag: undefined,
      env: { ACR_PULL_REQUEST: '', GITHUB_EVENT_PATH: '/tmp/event.json' },
      readEventFile: readerFor({ pull_request: { number: 7 } }),
    });
    expect(value).toBe(7);
  });

  it('环境变量是纯空白时同样忽略', async () => {
    const value = await resolvePullRequestNumber({
      flag: '  ',
      env: { ACR_PULL_REQUEST: '   ', GITHUB_EVENT_PATH: '/tmp/event.json' },
      readEventFile: readerFor({ pull_request: { number: 5 } }),
    });
    expect(value).toBe(5);
  });

  it('没有事件文件时返回 NaN，由上层报「缺少审查对象」', async () => {
    const value = await resolvePullRequestNumber({
      flag: undefined,
      env: {},
      readEventFile: readerFor({}),
    });
    expect(Number.isNaN(value)).toBe(true);
  });

  it('事件文件坏了不抛异常，同样返回 NaN', async () => {
    const value = await resolvePullRequestNumber({
      flag: undefined,
      env: { GITHUB_EVENT_PATH: '/tmp/event.json' },
      readEventFile: async () => '{ 这不是 json',
    });
    expect(Number.isNaN(value)).toBe(true);
  });
});
