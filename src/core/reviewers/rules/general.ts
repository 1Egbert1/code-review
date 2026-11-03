/**
 * 通用规则：与语言无关的那几条。
 *
 * 这些不是从任何外部规范里搬的，而是这个工具自己在实践中反复见到的失效模式：
 * 异步没等待、异常被吞、深层嵌套、测试写成大杂烩。
 */

import type { RuleEntry } from './library.js';

const SOURCE = { name: '本项目', url: null, license: 'own' } as const;

export const GENERAL_RULES: readonly RuleEntry[] = [
  {
    id: 'general-await-async',
    level: 'mandatory',
    dimension: 'coding',
    title: '异步调用必须被等待或显式忽略',
    instruction:
      '调用返回 Promise 的函数时，要么 await / return，要么显式标注为何不等待；裸调用是缺陷。',
    // 限定到 JS 系：Java / Go 没有 Promise，注进去只会占名额
    languages: ['typescript', 'javascript'],
    source: SOURCE,
  },
  {
    id: 'general-no-empty-catch',
    level: 'mandatory',
    dimension: 'exception-log',
    title: '异常不得静默吞掉',
    instruction: 'catch 里至少要记录或上抛；只留一个空块会让线上问题失去唯一线索。',
    languages: ['*'],
    source: SOURCE,
  },
  {
    id: 'general-early-return',
    level: 'recommended',
    dimension: 'coding',
    title: '优先早返回，减少嵌套',
    instruction: '能用早返回消掉的嵌套就消掉；判断条件写在前面，主流程不要包在三层 if 里。',
    languages: ['*'],
    source: SOURCE,
  },
  {
    id: 'general-test-one-assertion',
    level: 'recommended',
    dimension: 'unit-test',
    title: '一个用例只验证一件事',
    instruction: '单个测试只断言一个行为；失败时要能从名字直接看出哪条行为坏了。',
    languages: ['*'],
    pathPatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
    source: SOURCE,
  },
  {
    id: 'general-api-boundary-validation',
    level: 'mandatory',
    dimension: 'security',
    title: '接口边界必须校验入参',
    instruction: '处理外部输入的入口要先校验结构再使用；内部调用可以信任，边界不行。',
    languages: ['*'],
    pathPatterns: ['**/api/**', '**/routes/**', '**/controllers/**', '**/handlers/**'],
    source: SOURCE,
  },
  {
    id: 'general-no-hardcoded-secret',
    level: 'mandatory',
    dimension: 'security',
    title: '不得在源码里写死凭证',
    instruction: '密钥、口令、令牌从环境变量或密钥服务读取，写字面量等于把它永久留在版本历史里。',
    languages: ['*'],
    source: SOURCE,
  },
];
