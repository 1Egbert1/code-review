import { describe, expect, it } from 'vitest';

import {
  ALLOWED_LICENSES,
  BUILTIN_RULES,
  collectNotices,
  languageOf,
  MAX_INJECTED_RULES,
  renderRuleBlock,
  selectRules,
  validateLibrary,
} from '../src/core/reviewers/rules/library.js';
import type { RuleEntry, RuleLibrary } from '../src/core/reviewers/rules/library.js';

function rule(overrides: Partial<RuleEntry> = {}): RuleEntry {
  return {
    id: 'r1',
    title: 't',
    instruction: 'i',
    languages: ['*'],
    source: { name: '本项目', url: null, license: 'own' },
    ...overrides,
  };
}

describe('语言推断', () => {
  it('按扩展名识别常见语言', () => {
    expect(languageOf('a.ts')).toBe('typescript');
    expect(languageOf('a.tsx')).toBe('typescript');
    expect(languageOf('a.py')).toBe('python');
    expect(languageOf('a.unknownext')).toBe('*');
  });
});

describe('按语言与路径挑规则', () => {
  const library: RuleLibrary = {
    entries: [
      rule({ id: 'universal' }),
      rule({ id: 'ts-only', languages: ['typescript'] }),
      rule({ id: 'py-only', languages: ['python'] }),
      rule({ id: 'test-only', pathPatterns: ['**/*.test.*'] }),
    ],
  };

  it('通用规则对所有语言生效', () => {
    expect(selectRules(library, { path: 'src/a.ts' }).map((entry) => entry.id)).toContain(
      'universal',
    );
  });

  it('语言专属规则只在对应语言生效', () => {
    const ts = selectRules(library, { path: 'src/a.ts' }).map((entry) => entry.id);
    const py = selectRules(library, { path: 'src/a.py' }).map((entry) => entry.id);

    expect(ts).toContain('ts-only');
    expect(ts).not.toContain('py-only');
    expect(py).toContain('py-only');
  });

  it('路径专属规则只在匹配路径生效', () => {
    expect(selectRules(library, { path: 'src/a.test.ts' }).map((entry) => entry.id)).toContain(
      'test-only',
    );
    expect(selectRules(library, { path: 'src/a.ts' }).map((entry) => entry.id)).not.toContain(
      'test-only',
    );
  });

  it('全局视角不注入路径专属规则——它可能只对部分文件成立', () => {
    expect(selectRules(library, { path: null }).map((entry) => entry.id)).not.toContain(
      'test-only',
    );
  });

  it('路径限定越具体的规则排越前', () => {
    const ids = selectRules(library, { path: 'src/a.test.ts' }).map((entry) => entry.id);
    expect(ids[0]).toBe('test-only');
  });

  it('注入条数有上限，避免稀释注意力', () => {
    const many: RuleLibrary = {
      entries: Array.from({ length: 30 }, (_unused, index) => rule({ id: `r${String(index)}` })),
    };
    expect(selectRules(many, { path: 'a.ts' })).toHaveLength(MAX_INJECTED_RULES);
  });

  it('可以显式指定更小的上限', () => {
    const many: RuleLibrary = {
      entries: Array.from({ length: 30 }, (_unused, index) => rule({ id: `r${String(index)}` })),
    };
    expect(selectRules(many, { path: 'a.ts', limit: 3 })).toHaveLength(3);
  });
});

describe('渲染', () => {
  it('写明冲突时以项目实际写法为准', () => {
    const block = renderRuleBlock([rule({ instruction: '用 camelCase' })]);
    // 没有这句，规则会压过项目自己的约定，制造噪音
    expect(block).toContain('以项目里的写法为准');
  });

  it('没有规则时返回空串，不输出空壳提示词', () => {
    expect(renderRuleBlock([])).toBe('');
  });
});

describe('授权合规', () => {
  it('内置规则全部合规', () => {
    expect(validateLibrary(BUILTIN_RULES)).toEqual([]);
  });

  it('许可证不在白名单时被拦下', () => {
    const problems = validateLibrary({
      entries: [rule({ source: { name: '某公司内部规范', url: null, license: 'proprietary' } })],
    });
    expect(problems[0]?.reason).toContain('proprietary');
  });

  it('缺来源声明时被拦下', () => {
    const problems = validateLibrary({
      entries: [rule({ source: { name: '  ', url: null, license: 'MIT' } })],
    });
    expect(problems[0]?.reason).toContain('来源');
  });

  it('白名单覆盖常见开源许可', () => {
    expect(ALLOWED_LICENSES).toContain('Apache-2.0');
    expect(ALLOWED_LICENSES).toContain('CC-BY-4.0');
  });
});

describe('来源声明', () => {
  it('按来源聚合，列出授权的规则', () => {
    const notices = collectNotices({ entries: [rule({ id: 'a' }), rule({ id: 'b' })] });
    expect(notices).toContain('本项目');
    expect(notices).toContain('a、b');
  });
});
