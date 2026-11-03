/**
 * Java 代码格式规约（11 条）。
 *
 * **这些规则默认不注入提示词。** 理由很直接：缩进、空格、换行、行宽都是格式化工具
 * 能百分之百稳定解决的，让模型去挑这些是拿最贵的手段做最便宜的事，而且必然带误报。
 *
 * 只有一种情况值得注入：仓库里**没有任何**格式化或静态检查配置（.editorconfig、
 * checkstyle、spotless 都没有）。那时确实没人管这些，说一句比不说强。
 *
 * 保留成规则而不是直接删掉，是因为它们构成了「手册 215 条无遗漏」的一部分：
 * 每条都有归宿，归宿可以是不注入，但不能是「忘了」。
 */

import type { RuleEntry, RuleLibrary } from './library.js';

const BASIS_PREFIX = '《阿里巴巴Java开发手册》v1.3.0';
const SOURCE = {
  name: '《阿里巴巴Java开发手册》要点提炼（表述自撰）',
  url: 'https://github.com/alibaba/p3c',
  license: 'own',
  modified: '仅提炼规则要求，用本项目自己的话重写，未复制条文原文',
} as const;

function rule(
  id: string,
  level: RuleEntry['level'],
  instruction: string,
  clause: readonly string[],
): RuleEntry {
  return {
    id,
    level,
    dimension: 'format',
    title: instruction.slice(0, 30),
    instruction,
    languages: ['java'],
    clauses: clause,
    source: { ...SOURCE, basis: `${BASIS_PREFIX} 编程规约·代码格式` },
  };
}

export const JAVA_FORMAT_RULES: RuleLibrary = {
  entries: [
    rule(
      'java-format-brace',
      'mandatory',
      '空代码块写成 {}；非空时左大括号不换行、大括号后换行、右大括号前换行；catch/finally/else 前不换行。',
      ['format-1'],
    ),
    rule(
      'java-format-paren-space',
      'mandatory',
      '小括号内侧不留空格：写 foo(a, b)，不写 foo( a, b )。',
      ['format-2'],
    ),
    rule(
      'java-format-keyword-space',
      'mandatory',
      'if/for/while/switch/do 等关键字与左括号之间必须有一个空格。',
      ['format-3'],
    ),
    rule('java-format-operator-space', 'mandatory', '二目与三目运算符两侧各留一个空格。', [
      'format-4',
    ]),
    rule('java-format-indent', 'mandatory', '用 4 个空格缩进，不用 tab。', ['format-5']),
    rule(
      'java-format-comment-space',
      'mandatory',
      '双斜线与注释正文之间留且只留一个空格；方法内多行注释与代码左对齐。',
      ['format-6', 'comment-4'],
    ),
    rule(
      'java-format-line-length',
      'mandatory',
      '单行不超过 120 字符；换行时第二行起缩进 4 个空格，运算符与下一行同行首。',
      ['format-7'],
    ),
    rule('java-format-comma-space', 'mandatory', '方法参数在定义与调用时，逗号后加一个空格。', [
      'format-8',
    ]),
    rule('java-format-encoding', 'mandatory', '源文件用 UTF-8 编码、LF 换行符，不要混入 CRLF。', [
      'format-9',
    ]),
    rule(
      'java-format-no-align',
      'recommended',
      '不要用多余空格把某一行与上一行对齐，那会让后续改动产生无意义的 diff。',
      ['format-10'],
    ),
    rule(
      'java-format-blank-line',
      'recommended',
      '不同语义的语句组之间插入一个空行；同一逻辑内不留空行。',
      ['format-11'],
    ),
  ],
};
