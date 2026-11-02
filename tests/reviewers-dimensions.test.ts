import { describe, expect, it } from 'vitest';

import {
  conventionReviewer,
  CONVENTION_CATEGORIES,
} from '../src/core/reviewers/dimensions/convention/index.js';
import {
  correctnessReviewer,
  CORRECTNESS_CATEGORIES,
} from '../src/core/reviewers/dimensions/correctness/index.js';
import {
  securityReviewer,
  SECURITY_CATEGORIES,
} from '../src/core/reviewers/dimensions/security/index.js';
import type { ReviewerSpec } from '../src/core/reviewers/schema.js';

interface SchemaShape {
  properties: { findings: { items: { properties: Record<string, { enum?: string[] }> } } };
}

function propsOf(spec: ReviewerSpec): Record<string, { enum?: string[] }> {
  const schema = spec.schema as unknown as SchemaShape;
  return schema.properties.findings.items.properties;
}

const ALL: ReviewerSpec[] = [correctnessReviewer, securityReviewer, conventionReviewer];

describe('三个维度的共同点', () => {
  it('都声明了提示词版本，且非空', () => {
    for (const spec of ALL) {
      expect(spec.promptVersion).toMatch(/^v\d+\.\d+$/);
    }
  });

  it('schema 的类别枚举与维度声明完全一致', () => {
    expect(propsOf(correctnessReviewer)['category']?.enum).toEqual([...CORRECTNESS_CATEGORIES]);
    expect(propsOf(securityReviewer)['category']?.enum).toEqual([...SECURITY_CATEGORIES]);
    expect(propsOf(conventionReviewer)['category']?.enum).toEqual([...CONVENTION_CATEGORIES]);
  });

  it('每个系统提示词都写了证据必须逐字复制', () => {
    for (const spec of ALL) {
      expect(spec.systemPrompt).toContain('一字不差');
    }
  });

  it('每个系统提示词都带输出格式说明', () => {
    for (const spec of ALL) {
      expect(spec.systemPrompt).toContain('{"findings":[');
    }
  });
});

describe('正确性维度', () => {
  it('严重度上限为 blocker：崩溃与数据不一致值得叫停', () => {
    expect(correctnessReviewer.maxSeverity).toBe('blocker');
    expect(propsOf(correctnessReviewer)['severity']?.enum).toEqual([
      'blocker',
      'major',
      'minor',
      'nit',
    ]);
  });

  it('明确排除风格类问题，避免与规范性维度重叠', () => {
    expect(correctnessReviewer.systemPrompt).toContain('命名');
    expect(correctnessReviewer.systemPrompt).toContain('不归你管');
  });

  it('要求先报改动行，再报函数内其他问题', () => {
    const prompt = correctnessReviewer.systemPrompt;
    expect(prompt.indexOf('先报改动行')).toBeLessThan(prompt.indexOf('函数内'));
  });
});

describe('安全性维度', () => {
  it('严重度上限为 blocker', () => {
    expect(securityReviewer.maxSeverity).toBe('blocker');
  });

  it('把越权列为首要项，并要求写出利用路径', () => {
    const prompt = securityReviewer.systemPrompt;
    expect(prompt).toContain('越权');
    expect(prompt).toContain('谁能利用');
    expect(prompt).toContain('怎么利用');
  });

  it('覆盖前端五组，而不是只写后端', () => {
    const prompt = securityReviewer.systemPrompt;
    for (const keyword of ['innerHTML', 'localStorage', '路由守卫', '原型污染', '完整性校验']) {
      expect(prompt).toContain(keyword);
    }
  });

  it('指出「只做前端隐藏」本质是后端缺陷', () => {
    expect(securityReviewer.systemPrompt).toContain('后端没校验');
  });
});

describe('规范性维度', () => {
  it('严重度上限锁在 minor，不允许放宽', () => {
    expect(conventionReviewer.maxSeverity).toBe('minor');
    // schema 里连 major / blocker 这个值都不存在，模型想报也报不出来
    expect(propsOf(conventionReviewer)['severity']?.enum).toEqual(['minor', 'nit']);
  });

  it('判断依据的优先级写死在提示词里：项目内约定高于业界规范', () => {
    const prompt = conventionReviewer.systemPrompt;
    expect(prompt.indexOf('项目内约定')).toBeLessThan(prompt.indexOf('业界规范'));
    expect(prompt).toContain('不是「哪种更好」，是「这里用的是哪种」');
  });

  it('明确不报格式化与静态检查能查的问题', () => {
    expect(conventionReviewer.systemPrompt).toContain('格式化与静态检查能查出来的');
  });
});
