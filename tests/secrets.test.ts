/**
 * 凭证检测的用例。
 *
 * 这条规则的价值全在「不漏」：它存在的理由就是模型漏了一次。
 * 所以用例的重点不是「能不能报」，而是「该报的都报了、不该报的没报」。
 */

import { describe, expect, it } from 'vitest';

import { parseUnifiedDiff } from '../src/core/diff/parse.js';
import { scanSecrets, secretsToFindings } from '../src/core/rules/secrets.js';

/** 把一个新增行包成完整的 unified diff。 */
function diffOf(addedLines: readonly string[], path = 'src/config.ts') {
  const body = addedLines.map((line) => `+${line}`).join('\n');
  return parseUnifiedDiff(
    [
      `diff --git a/${path} b/${path}`,
      `--- a/${path}`,
      `+++ b/${path}`,
      `@@ -1,1 +1,${String(addedLines.length)} @@`,
      ' const existing = 1;',
      body,
      '',
    ].join('\n'),
  );
}

describe('凭证检测', () => {
  it('OpenAI 风格密钥被报出来（真实事故里最常见的一种）', () => {
    const hits = scanSecrets(
      diffOf(["const API_TOKEN = 'sk-live-7f3a9c2e41b8d6a05e73c9f1a2b4d6e8';"]),
    );

    expect(hits).toHaveLength(1);
    expect(hits[0]?.kind).toBe('openai-style');
    expect(hits[0]?.line).toBe(2);
  });

  it('GitHub 令牌与私钥头也能认出来', () => {
    expect(
      scanSecrets(diffOf(['const t = "github_pat_11ABCDEFG0123456789_abcdefghijklmnop";'])),
    ).toHaveLength(1);
    expect(scanSecrets(diffOf(['-----BEGIN RSA PRIVATE KEY-----']))).toHaveLength(1);
    expect(scanSecrets(diffOf(['const k = "AKIAIOSFODNN7EXAMPLE";']))).toHaveLength(1);
  });

  it('占位符不报：满屏 sk-xxxxx 会把这条规则变成噪音', () => {
    const hits = scanSecrets(
      diffOf([
        "const key = 'sk-xxxxxxxxxxxxxxxxxxxxxxxx';",
        "const key2 = 'sk-your-key-here-please-replace';",
        "const key3 = 'sk-00000000000000000000000000';",
      ]),
    );

    expect(hits).toEqual([]);
  });

  it('只扫新增行：删掉密钥是在修问题，不该报', () => {
    const diff = parseUnifiedDiff(
      [
        'diff --git a/src/config.ts b/src/config.ts',
        '--- a/src/config.ts',
        '+++ b/src/config.ts',
        '@@ -1,2 +1,1 @@',
        "-const API_TOKEN = 'sk-live-7f3a9c2e41b8d6a05e73c9f1a2b4d6e8';",
        ' const other = 1;',
        '',
      ].join('\n'),
    );

    expect(scanSecrets(diff)).toEqual([]);
  });

  it('同一行命中多种格式只报一条', () => {
    const hits = scanSecrets(diffOf(['const both = "sk-live-7f3a9c2e41b8d6a05e73c9f1a2b4d6e8";']));
    expect(hits).toHaveLength(1);
  });

  it('命中后转成 blocker 级、可被门禁拦下的结论', () => {
    const [finding] = secretsToFindings(
      scanSecrets(diffOf(["const API_TOKEN = 'sk-live-7f3a9c2e41b8d6a05e73c9f1a2b4d6e8';"])),
    );

    expect(finding?.severity).toBe('blocker');
    expect(finding?.category).toBe('secret-exposure');
    expect(finding?.confidence).toBe(1);
    // 证据必须是原文，校验链要用它反查位置
    expect(finding?.evidence).toContain('API_TOKEN');
    // 正文要说清「删除不等于失效」，否则作者可能只删掉那一行就以为完事
    expect(finding?.body).toMatch(/作废|轮换/);
  });

  it('跳过的文件不扫：二进制或命中跳过清单的文件没有可读文本', () => {
    const diff = diffOf(["const t = 'sk-live-7f3a9c2e41b8d6a05e73c9f1a2b4d6e8';"]);
    const skipped = {
      ...diff,
      files: diff.files.map((file) => ({ ...file, skippedReason: '二进制' })),
    };

    expect(scanSecrets(skipped)).toEqual([]);
  });
});

describe('假凭证的两条豁免路径', () => {
  it('整串字典序的示例按占位符处理（本项目的脱敏测试夹具就是这种）', () => {
    expect(scanSecrets(diffOf(['const t = "ghp_abcdefghijklmnopqrstuvwxyz0123";']))).toEqual([]);
  });

  it('只是「里面含一段连排」的真令牌照报，不能顺手放过', () => {
    expect(
      scanSecrets(diffOf(['const t = "github_pat_11ABCDEFG0123456789_abcdefghijklmnop";'])),
    ).toHaveLength(1);
  });

  it('作者显式标注 acr-allow-secret 的行不报', () => {
    const hits = scanSecrets(
      diffOf([
        "const k = 'sk-live-7f3a9c2e41b8d6a05e73c9f1a2b4d6e8'; // acr-allow-secret 测试夹具",
      ]),
    );
    expect(hits).toEqual([]);
  });
});
