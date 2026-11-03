import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { main } from '../src/cli/main.js';
import {
  appendHistory,
  EMPTY_HISTORY,
  extractEmbeddedHistory,
  parseHistory,
  previousOf,
  serializeHistory,
} from '../src/core/inspection/history.js';
import { renderReport } from '../src/core/inspection/report.js';
import type { HistoryEntry } from '../src/core/inspection/history.js';

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    inspectedAt: '2026-11-03T00:00:00Z',
    totalScore: 71,
    scores: { complexity: 11, duplication: 20, dependency: 17, 'type-safety': 20, test: 20 },
    fingerprints: ['fp1'],
    reference: null,
    ...overrides,
  };
}

describe('历史累积', () => {
  it('按顺序追加', () => {
    const first = appendHistory(EMPTY_HISTORY, entry({ totalScore: 60 }), 12);
    const second = appendHistory(first, entry({ totalScore: 65 }), 12);

    expect(second.entries.map((item) => item.totalScore)).toEqual([60, 65]);
  });

  it('只保留最近若干期，避免文件无限变大', () => {
    let history = EMPTY_HISTORY;
    for (let index = 0; index < 5; index += 1) {
      history = appendHistory(history, entry({ totalScore: index }), 3);
    }

    expect(history.entries.map((item) => item.totalScore)).toEqual([2, 3, 4]);
  });

  it('上一期取最后一条，首期为 null', () => {
    expect(previousOf(EMPTY_HISTORY)).toBeNull();
    expect(
      previousOf(appendHistory(EMPTY_HISTORY, entry({ totalScore: 88 }), 12))?.totalScore,
    ).toBe(88);
  });
});

describe('历史文件的读取', () => {
  it('序列化后能原样读回', () => {
    const history = appendHistory(EMPTY_HISTORY, entry(), 12);
    expect(parseHistory(serializeHistory(history))).toEqual(history);
  });

  it('版本不符时抛错，不静默当空历史', () => {
    // 当空历史会让报告把「全部问题」写成「新增」，那是错误结论
    expect(() => parseHistory('{"version":2,"entries":[]}')).toThrow(/版本/);
  });

  it('结构损坏时抛错', () => {
    expect(() => parseHistory('{"version":1}')).toThrow(/entries/);
    expect(() => parseHistory('[]')).toThrow(/对象/);
  });
});

describe('两次巡检能连起来', () => {
  it('第二期生成对比段，并把本期写入历史文件', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acr-history-'));
    await writeFile(join(root, 'a.ts'), 'export function f() {\n  return 1;\n}', 'utf8');

    const run = async (): Promise<string> => {
      let output = '';
      const box = {
        cwd: root,
        env: {} as NodeJS.ProcessEnv,
        stdout: (text: string) => {
          output += text;
        },
        stderr: () => {},
      };
      expect(await main(['inspect'], box)).toBe(0);
      return output;
    };

    const firstOutput = await run();
    expect(firstOutput).not.toContain('与上次对比');

    const secondOutput = await run();
    expect(secondOutput).toContain('与上次对比');

    const history = parseHistory(
      await readFile(join(root, '.acr', 'inspection-history.json'), 'utf8'),
    );
    expect(history.entries).toHaveLength(2);
  });

  it('历史文件损坏时明确失败，而不是按首期继续', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acr-history-bad-'));
    await mkdir(join(root, '.acr'), { recursive: true });
    await writeFile(join(root, '.acr', 'inspection-history.json'), '{"version":9}', 'utf8');

    const box = {
      cwd: root,
      env: {} as NodeJS.ProcessEnv,
      stdout: () => {},
      stderr: () => {},
    };

    expect(await main(['inspect'], box)).toBe(4);
  });

  it('--no-history 时不写历史文件', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acr-history-skip-'));
    const box = {
      cwd: root,
      env: {} as NodeJS.ProcessEnv,
      stdout: () => {},
      stderr: () => {},
    };

    expect(await main(['inspect', '--no-history'], box)).toBe(0);
    await expect(readFile(join(root, '.acr', 'inspection-history.json'), 'utf8')).rejects.toThrow();
  });
});

describe('无状态环境下的趋势（内嵌片段）', () => {
  it('本期摘要能嵌进正文再原样读回', () => {
    const markdown = renderReport(
      {
        repository: 'a/b',
        commitSha: 'c',
        inspectedAt: '2026-11-03T00:00:00Z',
        metrics: [],
        breakdown: [],
        totalScore: 72,
        scores: { complexity: 12, duplication: 20, dependency: 20, 'type-safety': 20, test: 20 },
        counts: { blocker: 0, major: 0, minor: 0, nit: 0 },
        findings: [],
        regressions: [],
        resolved: [],
        previousRef: null,
        location: null,
      },
      { historyEntry: entry({ totalScore: 72 }) },
    );

    const decoded = extractEmbeddedHistory(markdown);
    expect(decoded?.totalScore).toBe(72);
    expect(decoded?.fingerprints).toEqual(['fp1']);
  });

  it('没有内嵌片段时返回 null，由调用方退回本地历史', () => {
    expect(extractEmbeddedHistory('# 普通报告')).toBeNull();
  });

  it('片段被截断或不是 base64 时返回 null，不抛异常', () => {
    expect(extractEmbeddedHistory('<!-- acr:history !!!not-base64!!! -->')).toBeNull();
  });
});
