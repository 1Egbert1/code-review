import { describe, expect, it } from 'vitest';

import { redactCredentials } from '../src/platforms/github/reports.js';

describe('错误信息脱敏', () => {
  it('抹掉 clone URL 里的令牌段', () => {
    const raw =
      "fatal: unable to access 'https://x-access-token:github_pat_ABC123def456@github.com/o/r.wiki.git/'";
    const safe = redactCredentials(raw);

    expect(safe).not.toContain('ABC123def456');
    expect(safe).toContain('x-access-token:***@github.com');
  });

  it('抹掉裸的令牌串（错误信息有时只回显令牌本身）', () => {
    const safe = redactCredentials('remote: Invalid token ghp_abcdefghijklmnopqrstuvwxyz0123');

    expect(safe).not.toContain('ghp_abcdefghijklmnop');
    expect(safe).toContain('***');
  });

  it('抹掉 OpenAI 风格的 key', () => {
    const safe = redactCredentials(
      'Authorization: Bearer sk-live-7f3a9c2e41b8d6a05e73c9f', // acr-allow-secret 测试夹具
    );

    expect(safe).not.toContain('7f3a9c2e41b8d6a05e73c9f');
  });

  it('不含凭证的文本原样返回，不做无谓改动', () => {
    const raw = 'fatal: repository not found';
    expect(redactCredentials(raw)).toBe(raw);
  });
});
