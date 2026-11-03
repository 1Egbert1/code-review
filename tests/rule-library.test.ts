import { describe, expect, it } from 'vitest';

import { BUILTIN_RULES, FRONTEND_RULES, JAVA_RULES } from '../src/core/reviewers/rules/index.js';
import {
  ALLOWED_LICENSES,
  collectNotices,
  languageOf,
  MAX_INJECTED_RULES,
  renderRuleBlock,
  selectRules,
  severityOf,
  validateLibrary,
} from '../src/core/reviewers/rules/library.js';
import type { RuleEntry, RuleLibrary } from '../src/core/reviewers/rules/library.js';

function rule(overrides: Partial<RuleEntry> = {}): RuleEntry {
  return {
    id: 'r1',
    level: 'mandatory',
    dimension: 'coding',
    title: 't',
    instruction: 'i',
    languages: ['*'],
    source: { name: '本项目', url: null, license: 'own' },
    ...overrides,
  };
}

describe('语言推断', () => {
  it('按扩展名识别', () => {
    expect(languageOf('a.ts')).toBe('typescript');
    expect(languageOf('a.java')).toBe('java');
    expect(languageOf('a.vue')).toBe('javascript');
    expect(languageOf('a.sql')).toBe('sql');
    expect(languageOf('a.unknownext')).toBe('*');
  });
});

describe('筛选与排序', () => {
  const library: RuleLibrary = {
    entries: [
      rule({ id: 'universal' }),
      rule({ id: 'java-only', languages: ['java'] }),
      rule({ id: 'ts-only', languages: ['typescript'] }),
      rule({ id: 'reference-rule', level: 'reference' }),
      rule({ id: 'test-only', dimension: 'unit-test', pathPatterns: ['**/*.test.*'] }),
      rule({ id: 'db-rule', dimension: 'database' }),
    ],
  };

  it('语言不符的规则不注入', () => {
    const java = selectRules(library, { path: 'A.java' }).map((entry) => entry.id);
    const ts = selectRules(library, { path: 'a.ts' }).map((entry) => entry.id);

    expect(java).toContain('java-only');
    expect(java).not.toContain('ts-only');
    expect(ts).toContain('ts-only');
  });

  it('强制排在推荐与参考之前——注入有上限，被截掉的必须是参考', () => {
    const ids = selectRules(library, { path: 'a.ts' }).map((entry) => entry.id);
    expect(ids[ids.length - 1]).toBe('reference-rule');
  });

  it('按维度筛选', () => {
    const onlyDb = selectRules(library, { path: 'a.ts', dimensions: ['database'] });
    expect(onlyDb.map((entry) => entry.id)).toEqual(['db-rule']);
  });

  it('按约束力筛选', () => {
    const mandatory = selectRules(library, { path: 'a.ts', levels: ['mandatory'] });
    expect(mandatory.every((entry) => entry.level === 'mandatory')).toBe(true);
  });

  it('路径专属规则只在匹配路径生效', () => {
    expect(selectRules(library, { path: 'a.test.ts' }).map((entry) => entry.id)).toContain(
      'test-only',
    );
    expect(selectRules(library, { path: 'a.ts' }).map((entry) => entry.id)).not.toContain(
      'test-only',
    );
  });

  it('全局视角不注入路径专属规则', () => {
    expect(selectRules(library, { path: null }).map((entry) => entry.id)).not.toContain(
      'test-only',
    );
  });

  it('注入条数有上限', () => {
    const many: RuleLibrary = {
      entries: Array.from({ length: 40 }, (_unused, index) => rule({ id: `r${String(index)}` })),
    };
    expect(selectRules(many, { path: 'a.ts' })).toHaveLength(MAX_INJECTED_RULES);
  });

  it('超限时先丢参考级', () => {
    const entries = [
      ...Array.from({ length: 20 }, (_unused, index) => rule({ id: `m${String(index)}` })),
      rule({ id: 'ref-1', level: 'reference' }),
    ];
    const picked = selectRules({ entries }, { path: 'a.ts', limit: 5 });
    expect(picked.some((entry) => entry.level === 'reference')).toBe(false);
  });
});

describe('约束力映射严重度', () => {
  it('强制→major，推荐→minor，参考→nit', () => {
    expect(severityOf('mandatory')).toBe('major');
    expect(severityOf('recommended')).toBe('minor');
    expect(severityOf('reference')).toBe('nit');
  });
});

describe('渲染', () => {
  it('按维度分组并标注约束力', () => {
    const block = renderRuleBlock([
      rule({ dimension: 'naming', level: 'mandatory', instruction: '类名大驼峰' }),
      rule({ dimension: 'security', level: 'recommended', instruction: '入参校验' }),
    ]);

    expect(block).toContain('【命名】');
    expect(block).toContain('（强制）类名大驼峰');
    expect(block).toContain('（推荐）入参校验');
  });

  it('写明冲突时以项目实际写法为准', () => {
    expect(renderRuleBlock([rule()])).toContain('以项目里的写法为准');
  });

  it('没有规则时返回空串', () => {
    expect(renderRuleBlock([])).toBe('');
  });
});

describe('内置规则库', () => {
  it('整体合规：无禁用许可证、无缺失依据', () => {
    expect(validateLibrary(BUILTIN_RULES)).toEqual([]);
  });

  it('覆盖后端各维度与前端工程', () => {
    const dimensions = new Set(BUILTIN_RULES.entries.map((entry) => entry.dimension));
    const expected = [
      'naming',
      'coding',
      'exception-log',
      'unit-test',
      'security',
      'database',
      'architecture',
      'frontend',
    ] as const;

    for (const dimension of expected) {
      expect(dimensions.has(dimension)).toBe(true);
    }
  });

  it('三方规则都写了依据，能追溯回原规范', () => {
    const imported = [...JAVA_RULES.entries, ...FRONTEND_RULES.entries];
    for (const entry of imported) {
      expect((entry.source.basis ?? '').length).toBeGreaterThan(6);
    }
  });

  it('三级约束力都有条目，不是平铺的愿望清单', () => {
    const levels = new Set(BUILTIN_RULES.entries.map((entry) => entry.level));
    expect(levels.has('mandatory')).toBe(true);
    expect(levels.has('recommended')).toBe(true);
    expect(levels.has('reference')).toBe(true);
  });

  it('规约数量达到可用规模（不少于 50 条）', () => {
    expect(BUILTIN_RULES.entries.length).toBeGreaterThanOrEqual(50);
  });

  it('id 唯一', () => {
    const ids = BUILTIN_RULES.entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Java 与前端条目按语言隔离，不会互相注入', () => {
    const javaRules = selectRules(BUILTIN_RULES, { path: 'src/Foo.java' });
    const tsRules = selectRules(BUILTIN_RULES, { path: 'src/foo.ts' });

    expect(javaRules.some((entry) => entry.id.startsWith('java-'))).toBe(true);
    expect(javaRules.some((entry) => entry.id.startsWith('fe-'))).toBe(false);
    expect(tsRules.some((entry) => entry.id.startsWith('fe-'))).toBe(true);
    expect(tsRules.some((entry) => entry.id.startsWith('java-'))).toBe(false);
  });
});

describe('授权校验', () => {
  it('白名单外的许可证被拦下', () => {
    const problems = validateLibrary({
      entries: [rule({ source: { name: '某公司规范', url: null, license: 'proprietary' } })],
    });
    expect(problems[0]?.reason).toContain('proprietary');
  });

  it('引用三方规范却没写依据时被拦下', () => {
    const problems = validateLibrary({
      entries: [rule({ source: { name: '某规范', url: null, license: 'Apache-2.0' } })],
    });
    expect(problems[0]?.reason).toContain('依据');
  });

  it('白名单覆盖常见开源许可', () => {
    expect(ALLOWED_LICENSES).toContain('Apache-2.0');
    expect(ALLOWED_LICENSES).toContain('MPL-2.0');
  });
});

describe('来源声明', () => {
  it('按来源聚合，并列出依据', () => {
    const notices = collectNotices({ entries: JAVA_RULES.entries.slice(0, 2) });
    expect(notices).toContain('阿里巴巴Java开发手册');
    expect(notices).toContain('依据');
  });
});
