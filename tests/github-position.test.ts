import { describe, expect, it } from 'vitest';

import type { LineAnchor } from '../src/contracts/index.js';
import { githubPositionPort, toCommentPosition } from '../src/platforms/github/position.js';

function anchor(overrides: Partial<LineAnchor> = {}): LineAnchor {
  return {
    file: 'src/a.ts',
    oldPath: null,
    kind: 'added',
    newLine: 10,
    oldLine: null,
    ...overrides,
  };
}

describe('GitHub 位置映射', () => {
  it('新增行：用改动后行号，锚在 RIGHT', () => {
    expect(toCommentPosition(anchor({ kind: 'added', newLine: 7, oldLine: null }))).toEqual({
      path: 'src/a.ts',
      line: 7,
      side: 'RIGHT',
    });
  });

  it('删除行：用改动前行号，锚在 LEFT', () => {
    expect(toCommentPosition(anchor({ kind: 'removed', newLine: null, oldLine: 12 }))).toEqual({
      path: 'src/a.ts',
      line: 12,
      side: 'LEFT',
    });
  });

  it('上下文行：用改动后行号，锚在 RIGHT，而不是旧版本', () => {
    // 用户看的是改动后的文件，锚在 LEFT 会指向看不见的旧版本
    expect(toCommentPosition(anchor({ kind: 'context', newLine: 20, oldLine: 18 }))).toEqual({
      path: 'src/a.ts',
      line: 20,
      side: 'RIGHT',
    });
  });

  it('重命名后使用新路径', () => {
    const position = toCommentPosition(
      anchor({
        file: 'src/new.ts',
        oldPath: 'src/old.ts',
        kind: 'context',
        newLine: 3,
        oldLine: 3,
      }),
    );
    expect(position?.path).toBe('src/new.ts');
  });

  it('缺少该侧行号时返回 null，而不是编造一个行号', () => {
    expect(toCommentPosition(anchor({ kind: 'added', newLine: null }))).toBeNull();
    expect(toCommentPosition(anchor({ kind: 'removed', oldLine: null, newLine: null }))).toBeNull();
    expect(toCommentPosition(anchor({ kind: 'context', newLine: null, oldLine: 5 }))).toBeNull();
  });

  it('端口对象暴露平台标识与同一套映射', () => {
    expect(githubPositionPort.kind).toBe('github');
    expect(githubPositionPort.toCommentPosition(anchor({ newLine: 1 }))?.side).toBe('RIGHT');
  });
});
