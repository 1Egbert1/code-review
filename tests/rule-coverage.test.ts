/**
 * 规则库覆盖与注入行为的测试。
 *
 * 这个文件是「手册 215 条一条都没漏」这个承诺的兑现方式：它不检查我有没有写文档，
 * 只检查数据是否自洽。任何一条既没写成规则、又没被明确排除，`unclaimed` 就会非空。
 */

import { describe, expect, it } from 'vitest';

import {
  MANUAL_CLAUSES,
  MANUAL_SECTION_COUNTS,
  MANUAL_TOTAL,
  REASON_LABEL,
} from '../src/core/reviewers/rules/clauses.js';
import {
  BUILTIN_RULES,
  checkCoverage,
  FRONTEND_RULES,
  GENERAL_RULES,
  JAVA_ALL_RULES,
} from '../src/core/reviewers/rules/index.js';
import {
  interleaveByDimension,
  languageOf,
  MAX_INJECTED_RULES,
  selectRules,
} from '../src/core/reviewers/rules/library.js';

describe('手册条款覆盖', () => {
  it('条款总数与手册一致', () => {
    expect(MANUAL_CLAUSES.length).toBe(MANUAL_TOTAL);
    expect(MANUAL_TOTAL).toBe(215);
  });

  it('每个小节的条数与手册一致', () => {
    const actual = new Map<string, number>();
    for (const clause of MANUAL_CLAUSES) {
      const key = clause.id.replace(/-\d+$/, '');
      actual.set(key, (actual.get(key) ?? 0) + 1);
    }

    expect(Object.fromEntries(actual)).toEqual(MANUAL_SECTION_COUNTS);
  });

  it('条款编号唯一', () => {
    const ids = MANUAL_CLAUSES.map((clause) => clause.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('没有任何一条既没写成规则、也没被排除', () => {
    const report = checkCoverage();
    expect(report.unclaimed).toEqual([]);
  });

  it('没有规则引用不存在的条款编号', () => {
    expect(checkCoverage().dangling).toEqual([]);
  });

  it('覆盖表与规则两边说法一致', () => {
    expect(checkCoverage().unmapped).toEqual([]);
  });

  it('每条排除都写明了具体原因，且原因在枚举内', () => {
    const excluded = MANUAL_CLAUSES.filter((clause) => clause.verdict === 'excluded');
    expect(excluded.length).toBeGreaterThan(0);

    for (const clause of excluded) {
      expect(clause.reason, clause.id).toBeDefined();
      expect(Object.keys(REASON_LABEL), clause.id).toContain(clause.reason);
    }
  });

  it('排除理由分布在多种原因上，不是一句「做不了」打天下', () => {
    const reasons = new Set(
      MANUAL_CLAUSES.filter((clause) => clause.verdict === 'excluded').map(
        (clause) => clause.reason,
      ),
    );
    expect(reasons.size).toBeGreaterThanOrEqual(5);
  });

  it('从手册提炼的规则都认领了条款', () => {
    // 通用规则是自撰的，前端规则对应 f2e-spec，两者都不在这张表里；
    // 这里只约束从手册来的规则，它们必须能指回具体条款
    const orphans = JAVA_ALL_RULES.entries.filter((entry) => (entry.clauses ?? []).length === 0);
    expect(orphans.map((entry) => entry.id)).toEqual([]);
  });
});

describe('规则库自洽', () => {
  it('规则 id 唯一', () => {
    const ids = BUILTIN_RULES.entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每条规则都有可执行指令、来源与适用语言', () => {
    for (const entry of BUILTIN_RULES.entries) {
      expect(entry.instruction.length, entry.id).toBeGreaterThan(8);
      expect(entry.source.name, entry.id).toBeTruthy();
      expect(entry.languages.length, entry.id).toBeGreaterThan(0);
    }
  });

  it('来自三方规范的规则必须写明依据，自撰规则不强制', () => {
    for (const entry of [...JAVA_ALL_RULES.entries, ...FRONTEND_RULES.entries]) {
      expect(entry.source.basis, entry.id).toBeTruthy();
    }
    // 自撰规则也允许写 basis，但至少要有来源名
    for (const entry of GENERAL_RULES) {
      expect(entry.source.name, entry.id).toBeTruthy();
    }
  });

  it('手册提炼出的规则都标了来源，不是无主条文', () => {
    for (const entry of JAVA_ALL_RULES.entries) {
      expect(entry.source.basis, entry.id).toContain('阿里巴巴Java开发手册');
    }
  });
});

describe('规则选取', () => {
  it('format 规则默认不注入：格式该由工具管', () => {
    const without = selectRules(BUILTIN_RULES, { path: 'src/A.java' });
    expect(without.some((entry) => entry.dimension === 'format')).toBe(false);

    const withFormat = selectRules(BUILTIN_RULES, { path: 'src/A.java', includeFormat: true });
    expect(withFormat.some((entry) => entry.dimension === 'format')).toBe(true);
  });

  it('单测规则只在测试文件里注入', () => {
    const business = selectRules(BUILTIN_RULES, {
      path: 'src/service/UserService.java',
      dimensions: ['unit-test'],
    });
    expect(business).toEqual([]);

    const test = selectRules(BUILTIN_RULES, {
      path: 'src/test/java/UserServiceTest.java',
      dimensions: ['unit-test'],
    });
    expect(test.length).toBeGreaterThan(0);
  });

  it('建表规约只对 SQL 生效，不污染 Java 文件', () => {
    const java = selectRules(BUILTIN_RULES, {
      path: 'src/service/UserService.java',
      dimensions: ['database'],
    });
    const sql = selectRules(BUILTIN_RULES, {
      path: 'db/schema/user.sql',
      dimensions: ['database'],
    });

    expect(java.some((entry) => entry.id === 'java-table-three-fields')).toBe(false);
    expect(sql.some((entry) => entry.id === 'java-table-three-fields')).toBe(true);
  });

  it('按维度取时不会混入其他维度的规则', () => {
    const security = selectRules(BUILTIN_RULES, { path: 'src/A.java', dimensions: ['security'] });
    expect(security.every((entry) => entry.dimension === 'security')).toBe(true);
  });

  it('多个维度轮流取，不会让某一维度吃满名额', () => {
    const picked = selectRules(BUILTIN_RULES, {
      path: 'src/service/UserService.java',
      dimensions: ['coding', 'exception-log', 'database'],
    });

    const counts = new Map<string, number>();
    for (const entry of picked) counts.set(entry.dimension, (counts.get(entry.dimension) ?? 0) + 1);

    expect(picked.length).toBe(MAX_INJECTED_RULES);
    // 三个维度都应该拿到份额
    expect(counts.size).toBe(3);
    for (const count of counts.values()) expect(count).toBeGreaterThanOrEqual(3);
  });

  it('轮转截断：每个维度都保留，且总量不超上限', () => {
    const rules = [
      ...Array.from({ length: 10 }, (_, i) => makeEntry(`a-${i}`, 'security')),
      ...Array.from({ length: 2 }, (_, i) => makeEntry(`b-${i}`, 'naming')),
    ];

    const picked = interleaveByDimension(rules, 4);
    expect(picked.length).toBe(4);
    // 安全有 10 条也不能独占，命名必须有份额
    expect(picked.filter((entry) => entry.dimension === 'naming').length).toBe(2);
  });

  it('全局视角按语言取：不筛语言时一条都取不到', () => {
    // path 为 null 且不指定 language 时，language 变量为 '*'，语言特定规则都不含它
    const untyped = selectRules(BUILTIN_RULES, { path: null, dimensions: ['naming'] });
    expect(untyped).toEqual([]);

    const typed = selectRules(BUILTIN_RULES, {
      path: null,
      language: 'java',
      dimensions: ['naming'],
    });
    expect(typed.length).toBeGreaterThan(0);
  });

  it('.xml 能被识别成单独语言，否则 mapper 里的 SQL 规则永远匹配不上', () => {
    expect(languageOf('src/mapper/UserMapper.xml')).toBe('xml');
  });
});

function makeEntry(id: string, dimension: 'security' | 'naming') {
  return {
    id,
    level: 'mandatory' as const,
    dimension,
    title: id,
    instruction: `规则 ${id}`,
    languages: ['*'],
    clauses: ['sec-1'],
    source: { name: 'test', url: null, license: 'own' },
  };
}
