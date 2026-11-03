/**
 * 规则库总装。
 *
 * 三份数据分开放，理由是它们的来源与生命周期不同：
 * - general：本项目自撰，随时可调
 * - java / frontend：提炼自三方规范，改动要同步 basis 与 NOTICE
 *
 * 合在一起后按「约束力 → 语言 → 路径」筛，注入条数有上限。
 */

import { FRONTEND_RULES } from './frontend.js';
import { GENERAL_RULES } from './general.js';
import { JAVA_RULES } from './java.js';
import type { RuleLibrary } from './library.js';

export const BUILTIN_RULES: RuleLibrary = {
  entries: [...GENERAL_RULES, ...JAVA_RULES.entries, ...FRONTEND_RULES.entries],
};

export { FRONTEND_RULES, GENERAL_RULES, JAVA_RULES };
