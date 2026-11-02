import { describe, expect, it } from 'vitest';

import type { DiffFile, DiffLine, ParsedDiff } from '../src/contracts/index.js';
import {
  buildImportSegments,
  checkSignatureChanges,
  collectRelatedFiles,
  findSignatureChanges,
} from '../src/core/context/crossfile.js';
import { buildSymbolIndex } from '../src/core/context/symbols.js';

function line(
  kind: DiffLine['anchor']['kind'],
  newLine: number | null,
  oldLine: number | null,
  text: string,
): DiffLine {
  return {
    anchor: { file: 'src/api.ts', oldPath: null, kind, newLine, oldLine },
    text,
    enclosingSymbol: null,
  };
}

function diffOf(lines: DiffLine[]): ParsedDiff {
  const file: DiffFile = {
    path: 'src/api.ts',
    oldPath: null,
    status: 'modified',
    lines,
    changedCount: lines.length,
    skippedReason: null,
  };
  return { files: [file], baseSha: 'base', headSha: 'head' };
}

describe('签名变化识别', () => {
  it('参数个数变化被识别，锚在新增的签名行', () => {
    const changes = findSignatureChanges(
      diffOf([
        line('removed', null, 10, 'export function fetchUser(id: string) {'),
        line('added', 10, null, 'export function fetchUser(id: string, token: string) {'),
      ]),
    );

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      name: 'fetchUser',
      line: 10,
      side: 'new',
      kind: 'params-changed',
      requiredAfter: 2,
      paramCountAfter: 2,
    });
  });

  it('只改函数体不算签名变化', () => {
    const changes = findSignatureChanges(diffOf([line('added', 11, null, '  return id.trim();')]));
    expect(changes).toHaveLength(0);
  });

  it('导出被整行删除时识别为移除，锚在旧侧', () => {
    const changes = findSignatureChanges(
      diffOf([line('removed', null, 10, 'export function fetchUser(id: string) {')]),
    );

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ kind: 'export-removed', side: 'old', line: 10 });
  });

  it('可选参数变必填也算变化', () => {
    const changes = findSignatureChanges(
      diffOf([
        line('removed', null, 3, 'export function run(task: string, retry?: number) {'),
        line('added', 3, null, 'export function run(task: string, retry: number) {'),
      ]),
    );

    expect(changes[0]).toMatchObject({ paramCountAfter: 2, requiredAfter: 2 });
  });
});

describe('调用方比对', () => {
  const index = buildSymbolIndex(
    new Map([
      ['src/api.ts', 'export function fetchUser(id: string, token: string) {\n  return id;\n}'],
      ['src/list.ts', 'const user = fetchUser(1);'],
      ['src/detail.ts', "const user = fetchUser(id, 'abc');"],
    ]),
  );

  it('实参不足的调用点被报出，实参正确的被放过', () => {
    const changes = findSignatureChanges(
      diffOf([
        line('removed', null, 10, 'export function fetchUser(id: string) {'),
        line('added', 10, null, 'export function fetchUser(id: string, token: string) {'),
      ]),
    );

    const outcome = checkSignatureChanges(changes, index);
    expect(outcome.findings).toHaveLength(1);

    const body = outcome.findings[0]?.body ?? '';
    expect(body).toContain('src/list.ts:1');
    expect(body).not.toContain('src/detail.ts');
  });

  it('定义文件自身不算调用方', () => {
    const recursive = buildSymbolIndex(
      new Map([['src/api.ts', 'export function loop(n: number) {}\nconst x = loop(1, 2);']]),
    );

    const changes = findSignatureChanges(
      diffOf([
        line('removed', null, 1, 'export function loop(n: number, m: number) {}'),
        line('added', 1, null, 'export function loop(n: number) {}'),
      ]),
    );

    const outcome = checkSignatureChanges(changes, recursive);
    expect(outcome.findings).toHaveLength(0);
  });

  it('调用点都对上时留痕说明为什么没报', () => {
    const clean = buildSymbolIndex(
      new Map([
        ['src/api.ts', 'export function ping(a: string) {}'],
        ['src/use.ts', "ping('x');"],
      ]),
    );

    const changes = findSignatureChanges(
      diffOf([
        line('removed', null, 1, 'export function ping() {}'),
        line('added', 1, null, 'export function ping(a: string) {}'),
      ]),
    );

    const outcome = checkSignatureChanges(changes, clean);
    expect(outcome.findings).toHaveLength(0);
    expect(outcome.skipped[0]?.reason).toContain('一致');
  });

  it('证据逐字取自改动行，便于后续证据校验', () => {
    const changes = findSignatureChanges(
      diffOf([
        line('removed', null, 10, 'export function fetchUser(id: string) {'),
        line('added', 10, null, 'export function fetchUser(id: string, token: string) {'),
      ]),
    );

    const outcome = checkSignatureChanges(changes, index);
    expect(outcome.findings[0]?.evidence).toBe(
      'export function fetchUser(id: string, token: string) {',
    );
  });
});

describe('跨文件展开', () => {
  const index = buildSymbolIndex(
    new Map([
      [
        'src/pages/list.ts',
        [
          "import { fetchUser } from '../api';",
          "import { helper } from './util';",
          'fetchUser(1);',
        ].join('\n'),
      ],
      ['src/api.ts', 'export function fetchUser(id: string, token: string) {}'],
      ['src/pages/util.ts', 'export function helper() {}'],
    ]),
  );

  it('解析相对路径到实际文件，含扩展名补全', () => {
    const related = collectRelatedFiles(index, ['src/pages/list.ts']);
    expect(related).toContain('src/api.ts');
    expect(related).toContain('src/pages/util.ts');
  });

  it('depth 为 0 时不展开', () => {
    expect(collectRelatedFiles(index, ['src/pages/list.ts'], { depth: 0 })).toEqual([]);
  });

  it('L2 段只给签名，不给函数体', () => {
    const segments = buildImportSegments(index, ['src/pages/list.ts']);
    const content = segments[0]?.content ?? '';

    expect(content).toContain('export function fetchUser');
    // 函数体不该出现，否则预算被无谓吃掉
    expect(content).not.toContain('return ');
  });
});
