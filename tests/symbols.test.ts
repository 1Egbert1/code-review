import { describe, expect, it } from 'vitest';

import { buildSymbolIndex } from '../src/core/context/symbols.js';

describe('符号索引', () => {
  it('认出函数导出的参数个数与必填个数', () => {
    const index = buildSymbolIndex(
      new Map([
        [
          'src/api.ts',
          [
            'export function fetchUser(id: string, options?: object) {',
            '  return id;',
            '}',
            'export function ping(a: number, b = 1, ...rest: string[]) {}',
          ].join('\n'),
        ],
      ]),
    );

    const [fetchUser, ping] = index.files.get('src/api.ts')?.exports ?? [];
    expect(fetchUser?.paramCount).toBe(2);
    // options 带 ?，不算必填
    expect(fetchUser?.requiredParams).toBe(1);
    expect(ping?.paramCount).toBe(3);
    expect(ping?.requiredParams).toBe(1);
    expect(ping?.hasRest).toBe(true);
  });

  it('认出默认导入与具名导入', () => {
    const index = buildSymbolIndex(
      new Map([
        [
          'src/a.ts',
          [
            "import React from 'react';",
            "import { foo, bar as baz } from './b';",
            "import type { T } from './c';",
          ].join('\n'),
        ],
      ]),
    );

    const imports = index.files.get('src/a.ts')?.imports ?? [];
    expect(imports.map((item) => item.source)).toEqual(['react', './b', './c']);
    expect(imports[1]?.names).toEqual(['foo', 'bar']);
  });

  it('统计调用点的实参个数，字符串里的逗号不算分隔', () => {
    const index = buildSymbolIndex(
      new Map([
        ['src/a.ts', ['const a = f(1, 2);', 'const b = f("x,y");', 'const c = f();'].join('\n')],
      ]),
    );

    const calls = index.calls.get('f') ?? [];
    expect(calls.map((site) => site.argCount)).toEqual([2, 1, 0]);
  });

  it('控制关键字不算调用', () => {
    const index = buildSymbolIndex(
      new Map([['src/a.ts', ['if (x) {', '  return (1);', '}', 'while (y) {}'].join('\n')]]),
    );

    expect(index.calls.get('if')).toBeUndefined();
    expect(index.calls.get('while')).toBeUndefined();
  });

  it('同一行的多个调用都能被索引', () => {
    const index = buildSymbolIndex(new Map([['src/a.ts', 'const v = g(f(1), 2);']]));

    expect(index.calls.get('f')?.[0]?.argCount).toBe(1);
    expect(index.calls.get('g')?.[0]?.argCount).toBe(2);
  });
});
