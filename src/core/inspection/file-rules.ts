/**
 * 文件级规则检查。
 *
 * 三个约束，缺一不可：
 *
 * 1. **纯函数，只依赖文件文本。** 不读改动、不读配置以外的状态、不调模型。
 *    巡检没有 diff，这些规则要能直接复用；将来做「改动审查的文件级提醒」也是同一份代码。
 * 2. **不重复模型的活。** 这里只放「规则算得比模型准」的东西：太长、太复杂、空 catch、
 *    写死的密钥。让模型去数行数只会数错。
 * 3. **每条都带行号或明确标注只有文件级。** 用户要能跳过去，而不是拿着「某处有问题」干瞪眼。
 */

import { listFunctions } from '../context/tiers.js';
import type { SourceFile } from './metrics.js';
import { DEFAULT_THRESHOLDS } from './score.js';
import type { Thresholds } from './score.js';

export type FileRuleId = 'file-too-long' | 'complex-function' | 'empty-catch' | 'hardcoded-secret';

export interface FileRuleIssue {
  readonly path: string;
  /** 能定位到行就给，纯文件级问题给 null */
  readonly line: number | null;
  readonly rule: FileRuleId;
  readonly severity: 'major' | 'minor' | 'nit';
  readonly title: string;
  readonly detail: string;
}

/** 空 catch：捕获后什么都没做，或者只留了个注释。这类问题运行时完全无声。 */
const EMPTY_CATCH = /catch\s*(\([^)]*\))?\s*\{\s*(\/\/[^\n]*|\/\*[\s\S]*?\*\/)?\s*\}/;

/** 写死的密钥。只匹配明显的字面量，避免把 `password: string` 这种类型声明也算进来。 */
const HARDCODED_SECRET =
  /\b(api[_-]?key|secret|password|passwd|token|access[_-]?key)\b\s*[:=]\s*['"`][^'"`]{8,}['"`]/i;

function cyclomaticOf(lines: readonly string[], startLine: number, endLine: number): number {
  const patterns = [
    /\bif\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /&&/g,
    /\|\|/g,
    /\?\?/g,
  ];
  let branches = 0;
  for (let index = startLine - 1; index < endLine && index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    for (const pattern of patterns) {
      const local = new RegExp(pattern.source, 'g');
      branches += Math.max(0, (line.match(local) ?? []).length);
    }
  }
  return branches + 1;
}

/** 检查全部文件。阈值可覆盖，默认与评分用同一套，避免「扣了分但说不出是哪条规则」的割裂。 */
export function checkFileRules(
  files: readonly SourceFile[],
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): FileRuleIssue[] {
  const issues: FileRuleIssue[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');

    if (lines.length > thresholds.maxFileLines) {
      issues.push({
        path: file.path,
        line: null,
        rule: 'file-too-long',
        severity: 'minor',
        title: `文件 ${String(lines.length)} 行，超过阈值 ${String(thresholds.maxFileLines)}`,
        detail: '文件过长会让定位与评审都变慢，建议按职责拆分。',
      });
    }

    for (const region of listFunctions(lines)) {
      const complexity = cyclomaticOf(lines, region.startLine, region.endLine);
      if (complexity <= thresholds.avgCyclomatic) continue;

      issues.push({
        path: file.path,
        line: region.startLine,
        rule: 'complex-function',
        severity: complexity > thresholds.avgCyclomatic * 2 ? 'major' : 'minor',
        title: `${region.name}() 圈复杂度 ${String(complexity)}`,
        detail: `阈值 ${String(thresholds.avgCyclomatic)}。分支越多，测试覆盖越难做全。`,
      });
    }

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? '';

      if (EMPTY_CATCH.test(line)) {
        issues.push({
          path: file.path,
          line: index + 1,
          rule: 'empty-catch',
          severity: 'major',
          title: '异常被静默吞掉',
          detail: '出错时不会有任何记录，排查线上问题时这条线索直接消失。',
        });
      }

      if (HARDCODED_SECRET.test(line)) {
        issues.push({
          path: file.path,
          line: index + 1,
          rule: 'hardcoded-secret',
          severity: 'major',
          title: '疑似写死的凭证',
          detail: '凭证进了代码就进了版本历史，轮换前一直有效。应改为从环境变量或密钥服务读取。',
        });
      }
    }
  }

  return issues;
}
