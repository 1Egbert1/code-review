/**
 * 前端规约条目。
 *
 * **来源与合规说明**：依据 alibaba/f2e-spec（MPL-2.0，docs/coding 与 docs/engineering 两大部分）。
 * MPL-2.0 是文件级 copyleft：复制其文件内容需按 MPL 再授权。因此这里**不复制原文**，
 * 只提炼「这条规则要求什么」并用本项目自己的话写成指令；每条标注 basis 便于追溯。
 *
 * 语言以 typescript / javascript 为准。Vue 单文件按 javascript 处理（见 languageOf）。
 */

import type { RuleEntry, RuleLibrary } from './library.js';

const SOURCE = {
  name: 'alibaba/f2e-spec 要点提炼（表述自撰）',
  url: 'https://github.com/alibaba/f2e-spec',
  license: 'own',
  modified: '仅提炼规则要求，用本项目自己的话重写，未复制规约原文',
} as const;

const WEB_LANGS = ['typescript', 'javascript'] as const;

function rule(
  id: string,
  level: RuleEntry['level'],
  dimension: RuleEntry['dimension'],
  instruction: string,
  basis: string,
  options: {
    readonly languages?: readonly string[];
    readonly pathPatterns?: readonly string[];
  } = {},
): RuleEntry {
  return {
    id,
    level,
    dimension,
    title: instruction.slice(0, 30),
    instruction,
    languages: options.languages ?? [...WEB_LANGS],
    ...(options.pathPatterns === undefined ? {} : { pathPatterns: options.pathPatterns }),
    source: { ...SOURCE, basis: `f2e-spec ${basis}` },
  };
}

export const FRONTEND_RULES: RuleLibrary = {
  entries: [
    // ── 编码规约 ──────────────────────────────────────────────────────────
    rule(
      'fe-naming',
      'mandatory',
      'naming',
      '组件用大驼峰，变量与函数用小驼峰，常量全大写下划线分隔，文件名在团队内保持一种风格并前后一致。',
      'docs/coding 命名',
    ),
    rule(
      'fe-explicit-any',
      'mandatory',
      'coding',
      '不要用 any 或 @ts-ignore 绕开类型检查；确实无法表达时用 unknown 并显式收窄。',
      'docs/coding TypeScript',
    ),
    rule(
      'fe-cleanup-side-effects',
      'mandatory',
      'coding',
      '注册的定时器、事件监听、订阅必须在卸载或依赖变化时清理，否则会重复叠加。',
      'docs/coding 副作用',
    ),
    rule(
      'fe-no-param-mutation',
      'recommended',
      'coding',
      '不要直接修改入参与 props，需要变更时创建新对象，避免调用方数据被悄悄改掉。',
      'docs/coding 数据流',
    ),
    rule(
      'fe-key-stable',
      'recommended',
      'coding',
      '列表渲染的 key 用稳定唯一标识，不要用数组下标——增删排序时会导致状态错位。',
      'docs/coding 列表渲染',
    ),
    rule(
      'fe-state-minimal',
      'recommended',
      'coding',
      '能从既有状态推导出来的值不要另存一份，重复状态迟早会不同步。',
      'docs/coding 状态管理',
    ),
    rule(
      'fe-no-magic-value',
      'recommended',
      'coding',
      '重复出现或含义不明的字面量要抽成具名常量，避免散落各处难以统一修改。',
      'docs/coding 常量',
    ),

    // ── 工程规约 ──────────────────────────────────────────────────────────
    rule(
      'fe-dir-by-feature',
      'recommended',
      'frontend',
      '目录按功能或业务域组织，不要按文件类型把 components/hooks/utils 摊平成大仓库。',
      'docs/engineering 目录结构',
    ),
    rule(
      'fe-import-alias',
      'recommended',
      'frontend',
      '跨模块引用使用路径别名，避免 ../../../ 这种一移动就全断的相对路径。',
      'docs/engineering 模块引用',
    ),
    rule(
      'fe-file-single-purpose',
      'reference',
      'frontend',
      '一个文件只承担一件事；超过数百行或同时处理多种职责时考虑拆分。',
      'docs/engineering 文件组织',
    ),

    // ── 安全规约 ──────────────────────────────────────────────────────────
    rule(
      'fe-no-untrusted-html',
      'mandatory',
      'security',
      '外部数据不得直接写入 innerHTML / dangerouslySetInnerHTML / v-html；必须先净化或改用文本绑定。',
      'docs/coding 安全渲染',
    ),
    rule(
      'fe-no-secret-in-bundle',
      'mandatory',
      'security',
      '密钥、令牌、内部地址不得出现在前端源码或用公开前缀注入的环境变量里，它们都会被打进产物。',
      'docs/engineering 环境变量',
    ),
    rule(
      'fe-token-storage',
      'mandatory',
      'security',
      '长期有效的令牌不要放 localStorage；优先用 httpOnly Cookie，会话态令牌放内存。',
      'docs/coding 存储',
    ),
    rule(
      'fe-state-change-guard',
      'mandatory',
      'security',
      '写操作请求要带防伪令牌或同源校验；仅靠前端隐藏按钮不构成权限控制。',
      'docs/coding 请求',
    ),
  ],
};
