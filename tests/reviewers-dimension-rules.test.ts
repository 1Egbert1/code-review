import { describe, expect, it } from 'vitest';

import {
  shouldMuteConvention,
  detectLintConfig,
} from '../src/core/reviewers/dimensions/convention/lint-detect.js';
import {
  describeRoute,
  routeForSecurity,
} from '../src/core/reviewers/dimensions/security/route.js';

describe('安全风险路由', () => {
  it('鉴权相关路径送审', () => {
    const decision = routeForSecurity({ path: 'src/auth/login.ts', content: null });
    expect(decision.send).toBe(true);
    expect(decision.reasons.some((reason) => reason.includes('auth'))).toBe(true);
  });

  it('请求入口目录送审，即使路径没有关键词', () => {
    const decision = routeForSecurity({ path: 'src/api/list.ts', content: null });
    expect(decision.send).toBe(true);
    expect(decision.reasons.some((reason) => reason.includes('入口目录'))).toBe(true);
  });

  it('纯格式化工具函数不送审', () => {
    const decision = routeForSecurity({
      path: 'src/utils/format.ts',
      content: 'export function formatDate(d: Date) {\n  return d.toISOString();\n}',
    });
    expect(decision.send).toBe(false);
    expect(decision.reasons).toEqual([]);
  });

  it('内容里的危险动作也能触发，即使路径看着无害', () => {
    const decision = routeForSecurity({
      path: 'src/utils/helper.ts',
      content: 'const rows = db.exec("select * from users where id=" + id);',
    });
    expect(decision.send).toBe(true);
    expect(decision.reasons.some((reason) => reason.includes('数据库查询'))).toBe(true);
  });

  it('前端注入面也能触发', () => {
    const decision = routeForSecurity({
      path: 'src/components/message.tsx',
      content: 'return <div dangerouslySetInnerHTML={{ __html: content }} />;',
    });
    expect(decision.send).toBe(true);
    expect(decision.reasons.some((reason) => reason.includes('HTML'))).toBe(true);
  });

  it('取不到内容时仍能按路径判断', () => {
    expect(routeForSecurity({ path: 'src/payment/charge.ts', content: null }).send).toBe(true);
  });

  it('理由可读，能解释为什么送审', () => {
    const decision = routeForSecurity({ path: 'src/auth/session.ts', content: null });
    expect(describeRoute(decision)).toContain('命中');
  });

  it('不送审时也给出可读说明', () => {
    const decision = routeForSecurity({ path: 'src/utils/format.ts', content: 'const a = 1;' });
    expect(describeRoute(decision)).toContain('跳过');
  });
});

describe('静态检查配置检测', () => {
  it('检出 eslint 与 prettier 配置', () => {
    const found = detectLintConfig(['package.json', '.eslintrc.json', '.prettierrc']);
    expect(found).toEqual(expect.arrayContaining(['.eslintrc.json', '.prettierrc']));
  });

  it('检出扁平配置与 biome', () => {
    expect(detectLintConfig(['eslint.config.js'])).toEqual(['eslint.config.js']);
    expect(detectLintConfig(['biome.json'])).toEqual(['biome.json']);
  });

  it('没有配置时返回空', () => {
    expect(detectLintConfig(['src/a.ts', 'package.json'])).toEqual([]);
  });

  it('检出配置时规范性维度静音', () => {
    expect(shouldMuteConvention(['.eslintrc'], true)).toBe(true);
  });

  it('用户明确要求不要尊重配置时不静音', () => {
    // 有些项目装了配置但没接进 CI，那种情况下提示词补一遍仍有价值
    expect(shouldMuteConvention(['.eslintrc'], false)).toBe(false);
  });
});
