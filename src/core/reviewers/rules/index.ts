/**
 * 规则库总装与覆盖自检。
 *
 * 三份数据的来源与生命周期不同，所以分开放：
 * - general：本项目自撰，随时可调
 * - java / frontend：提炼自三方规范，改动要同步 basis 与 NOTICE
 *
 * `checkCoverage` 是本文件最重要的部分。它把「手册 215 条一条都没漏」从一句承诺
 * 变成一个可以跑出红绿的东西：任何一条既没写成规则、又没被明确排除，测试就会失败。
 */

import { MANUAL_CLAUSES, MANUAL_SECTION_COUNTS, MANUAL_TOTAL } from './clauses.js';
import { FRONTEND_RULES } from './frontend.js';
import { GENERAL_RULES } from './general.js';
import { JAVA_BUILD_RULES } from './java-build.js';
import { JAVA_CORE_RULES } from './java-core.js';
import { JAVA_DB_RULES } from './java-db.js';
import { JAVA_FORMAT_RULES } from './java-format.js';
import { JAVA_QUALITY_RULES } from './java-quality.js';
import { JAVA_RULES } from './java.js';
import type { RuleEntry, RuleLibrary } from './library.js';

/** Java 规则按主题分成多个文件，这里是它们的合集。 */
export const JAVA_ALL_RULES: RuleLibrary = {
  entries: [
    ...JAVA_RULES.entries,
    ...JAVA_CORE_RULES.entries,
    ...JAVA_QUALITY_RULES.entries,
    ...JAVA_DB_RULES.entries,
    ...JAVA_BUILD_RULES.entries,
    ...JAVA_FORMAT_RULES.entries,
  ],
};

export const BUILTIN_RULES: RuleLibrary = {
  entries: [...GENERAL_RULES, ...JAVA_ALL_RULES.entries, ...FRONTEND_RULES.entries],
};

export interface CoverageReport {
  readonly total: number;
  /** 写成规则的条款数 */
  readonly asRule: number;
  /** 明确排除的条款数 */
  readonly excluded: number;
  /** 既没写成规则、也没排除——这就是「漏了」 */
  readonly unclaimed: readonly string[];
  /** 规则引用了不存在的条款编号 */
  readonly dangling: readonly string[];
  /** 覆盖表说这条由某规则负责，但那条规则没声明它 */
  readonly unmapped: readonly string[];
}

/**
 * 检查覆盖完整性。
 *
 * 三种问题分别对应三类事故：
 * - `unclaimed`：加规则时漏了一条，最常见的疏漏
 * - `dangling`：条款编号写错（比如 `db-sql-12` 根本不存在），会让统计虚高
 * - `unmapped`：覆盖表和规则两边说法不一致，说明改动只改了一边
 */
export function checkCoverage(library: RuleLibrary = BUILTIN_RULES): CoverageReport {
  const known = new Map(MANUAL_CLAUSES.map((clause) => [clause.id, clause]));
  const claimed = new Set<string>();
  const dangling: string[] = [];

  for (const entry of library.entries) {
    for (const clauseId of entry.clauses ?? []) {
      if (!known.has(clauseId)) {
        dangling.push(`${entry.id} → ${clauseId}`);
        continue;
      }
      claimed.add(clauseId);
    }
  }

  const unclaimed: string[] = [];
  const unmapped: string[] = [];
  let asRule = 0;
  let excluded = 0;

  for (const clause of MANUAL_CLAUSES) {
    if (clause.verdict === 'rule') {
      asRule += 1;
      if (clause.ruleId === undefined) {
        unmapped.push(`${clause.id}：标为规则但没有 ruleId`);
        continue;
      }
      // 覆盖表说它由这条规则负责，反过来那条规则也必须认领它
      if (!claimed.has(clause.id)) unmapped.push(`${clause.id} → ${clause.ruleId} 未声明管辖`);
    } else {
      excluded += 1;
      if (clause.reason === undefined) unmapped.push(`${clause.id}：标为排除但没写原因`);
      if (claimed.has(clause.id)) unmapped.push(`${clause.id}：已排除却又有规则认领`);
    }
  }

  return {
    total: MANUAL_CLAUSES.length,
    asRule,
    excluded,
    unclaimed,
    dangling,
    unmapped,
  };
}

export { FRONTEND_RULES, GENERAL_RULES, JAVA_RULES, MANUAL_SECTION_COUNTS, MANUAL_TOTAL };
export type { RuleEntry };
