/**
 * Java 规约条目。
 *
 * **来源与合规说明（重要）**：
 * 《阿里巴巴Java开发手册》PDF 页脚写明「禁止用于商业用途，违者必究」，其条文属于受版权保护的
 * 表达，因此这里**不复制任何原文**。做法是：从公开手册中提炼「这条规则要求什么」（规则属于思想，
 * 不受版权保护），再用自己的话写成一句可执行指令。每条都标注 `basis` 说明出处章节。
 *
 * 官方开源的 PMD 实现见 alibaba/p3c（Apache-2.0），可作为规则可执行性的交叉参考。
 *
 * 约束力沿用手册的强制 / 推荐 / 参考三级：强制映射为 major（可被门禁挡住），
 * 推荐映射为 minor，参考映射为 nit。
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
  dimension: RuleEntry['dimension'],
  instruction: string,
  basis: string,
): RuleEntry {
  return {
    id,
    level,
    dimension,
    title: instruction.slice(0, 30),
    instruction,
    languages: ['java'],
    source: { ...SOURCE, basis: `${BASIS_PREFIX} ${basis}` },
  };
}

export const JAVA_RULES: RuleLibrary = {
  entries: [
    // ── 命名 ──────────────────────────────────────────────────────────────
    rule(
      'java-naming-case',
      'mandatory',
      'naming',
      '类名用大驼峰，方法名、参数名、成员变量、局部变量用小驼峰，常量全大写下划线分隔，包名全小写。',
      '编程规约·命名风格',
    ),
    rule(
      'java-naming-no-pinyin',
      'mandatory',
      'naming',
      '命名不得用拼音、中英混写或纯中文，也不要用望文不知义的缩写。',
      '编程规约·命名风格',
    ),
    rule(
      'java-boolean-no-is',
      'mandatory',
      'naming',
      'POJO 的布尔属性不要加 is 前缀，部分序列化框架会把它当成 getter 从而解析错字段。',
      '编程规约·命名风格',
    ),
    rule(
      'java-abstract-prefix',
      'recommended',
      'naming',
      '抽象类名以 Abstract 或 Base 开头，异常类以 Exception 结尾，测试类以被测类名开头加 Test。',
      '编程规约·命名风格',
    ),
    rule(
      'java-service-dao-naming',
      'reference',
      'naming',
      'Service/DAO 层方法按动词前缀命名：取单个用 get、取多个用 list、计数用 count、插入用 insert/save、更新用 update、删除用 remove/delete。',
      '编程规约·命名风格',
    ),

    // ── 编程 ──────────────────────────────────────────────────────────────
    rule(
      'java-no-magic-value',
      'mandatory',
      'coding',
      '不允许未定义的常量值（魔法值）直接出现在代码里，抽成有名字的常量或枚举。',
      '编程规约·常量定义',
    ),
    rule(
      'java-long-uppercase-l',
      'mandatory',
      'coding',
      'long 字面量用大写 L，小写 l 容易与数字 1 混淆。',
      '编程规约·常量定义',
    ),
    rule(
      'java-override-annotation',
      'mandatory',
      'coding',
      '所有覆写方法必须加 @Override，让编译期就能发现签名写错。',
      '编程规约·OOP 规约',
    ),
    rule(
      'java-equals-null-safe',
      'mandatory',
      'coding',
      '调用 equals 时把常量或确定非空的对象放在前面，避免空指针。',
      '编程规约·OOP 规约',
    ),
    rule(
      'java-wrapper-equals',
      'mandatory',
      'coding',
      '包装类型之间比较值一律用 equals，不要用 ==（Integer 缓存范围外会得到反直觉结果）。',
      '编程规约·OOP 规约',
    ),
    rule(
      'java-no-remove-in-foreach',
      'mandatory',
      'coding',
      '不要在 foreach 循环里对集合做 remove/add，用迭代器或 removeIf 替代。',
      '编程规约·集合处理',
    ),
    rule(
      'java-arrays-aslist-immutable',
      'mandatory',
      'coding',
      'Arrays.asList 返回的是固定长度视图，对它 add/remove 会抛异常；需要可变集合要再包一层。',
      '编程规约·集合处理',
    ),
    rule(
      'java-sublist-caution',
      'mandatory',
      'coding',
      'subList 的结果不能强转成 ArrayList，且原集合元素数量变动会让子列表失效。',
      '编程规约·集合处理',
    ),
    rule(
      'java-string-builder-in-loop',
      'recommended',
      'coding',
      '循环体内拼接字符串用 StringBuilder，不要用 + 反复产生临时对象。',
      '编程规约·OOP 规约',
    ),
    rule(
      'java-collection-capacity',
      'recommended',
      'coding',
      '集合初始化时按预估规模指定初始容量，避免反复扩容。',
      '编程规约·集合处理',
    ),
    rule(
      'java-entryset-iteration',
      'recommended',
      'coding',
      '遍历 Map 的键值对用 entrySet，不要先取 keySet 再逐个 get。',
      '编程规约·集合处理',
    ),
    rule(
      'java-interface-no-modifier',
      'reference',
      'coding',
      '接口里的方法与属性不需要写 public 等修饰符，保持简洁并写清语义。',
      '编程规约·命名风格',
    ),

    // ── 异常与日志 ────────────────────────────────────────────────────────
    rule(
      'java-catch-must-handle',
      'mandatory',
      'exception-log',
      'catch 住就必须处理或向上抛出，不允许捕获后什么都不做。',
      '异常日志·异常处理',
    ),
    rule(
      'java-no-exception-for-flow',
      'mandatory',
      'exception-log',
      '异常不要用来做流程控制或条件控制，它的开销远高于条件分支。',
      '异常日志·异常处理',
    ),
    rule(
      'java-narrow-try-scope',
      'mandatory',
      'exception-log',
      'try 块只包可能抛异常的最小范围，不要整段方法体一起 try。',
      '异常日志·异常处理',
    ),
    rule(
      'java-finally-no-return',
      'mandatory',
      'exception-log',
      'finally 块里不要 return，它会覆盖 try 中的返回值并吞掉异常。',
      '异常日志·异常处理',
    ),
    rule(
      'java-log-slf4j-placeholder',
      'mandatory',
      'exception-log',
      '日志依赖 SLF4J 门面并用占位符传参，不要直接调具体日志实现，也不要用字符串拼接。',
      '异常日志·日志规约',
    ),
    rule(
      'java-log-with-context',
      'mandatory',
      'exception-log',
      '异常日志要同时包含现场信息（参数、关键标识）与异常堆栈，只打一句「失败」等于没打。',
      '异常日志·日志规约',
    ),

    // ── 单元测试 ──────────────────────────────────────────────────────────
    rule(
      'java-test-air',
      'mandatory',
      'unit-test',
      '单元测试要满足 AIR：自动执行、相互独立、可重复运行，不受外界环境与执行顺序影响。',
      '单元测试·AIR 原则',
    ),
    rule(
      'java-test-location',
      'mandatory',
      'unit-test',
      '测试代码放在 src/test/java 下，不要混进业务代码目录。',
      '单元测试',
    ),
    rule(
      'java-test-coverage',
      'recommended',
      'unit-test',
      '核心模块的语句覆盖率目标 70% 以上；为凑覆盖率写不规范测试不如不写。',
      '单元测试',
    ),
    rule(
      'java-test-db-independent',
      'recommended',
      'unit-test',
      '涉及数据库的测试不要假设库里已有数据，必要时用自动回滚避免留下脏数据。',
      '单元测试',
    ),

    // ── 安全 ──────────────────────────────────────────────────────────────
    rule(
      'java-authz-check',
      'mandatory',
      'security',
      '涉及用户个人资源的功能必须做权限与归属校验，不能只看是否登录。',
      '安全规约',
    ),
    rule(
      'java-sql-param-binding',
      'mandatory',
      'security',
      'SQL 参数一律用参数绑定或字段值限定，禁止把用户输入拼进语句。',
      '安全规约',
    ),
    rule(
      'java-input-validation',
      'mandatory',
      'security',
      '外部请求的任何参数都必须做有效性校验后再使用。',
      '安全规约',
    ),
    rule(
      'java-sensitive-mask',
      'mandatory',
      'security',
      '用户敏感数据（手机号、证件号、银行卡等）展示前必须脱敏。',
      '安全规约',
    ),
    rule(
      'java-csrf-protection',
      'mandatory',
      'security',
      '表单与 AJAX 提交必须做 CSRF 防护；写操作要校验来源与防伪令牌。',
      '安全规约',
    ),

    // ── 数据库 ────────────────────────────────────────────────────────────
    rule(
      'java-table-three-fields',
      'mandatory',
      'database',
      '表必备三字段：主键 id、创建时间 gmt_create、更新时间 gmt_modified。',
      'MySQL 数据库·建表规约',
    ),
    rule(
      'java-decimal-not-float',
      'mandatory',
      'database',
      '金额等精确小数用 decimal，禁止用 float/double。',
      'MySQL 数据库·建表规约',
    ),
    rule(
      'java-is-xxx-tinyint',
      'mandatory',
      'database',
      '表达「是/否」的字段用 is_xxx 命名，类型为 unsigned tinyint。',
      'MySQL 数据库·建表规约',
    ),
    rule(
      'java-index-naming',
      'recommended',
      'database',
      '索引按用途命名：主键 pk_、唯一索引 uk_、普通索引 idx_ 加字段名。',
      'MySQL 数据库·索引规约',
    ),
    rule(
      'java-varchar-length',
      'recommended',
      'database',
      'varchar 长度不要超过 5000，更长的内容单独建表或改用文本类型。',
      'MySQL 数据库·建表规约',
    ),

    // ── 工程结构 ──────────────────────────────────────────────────────────
    rule(
      'java-no-snapshot-dependency',
      'mandatory',
      'architecture',
      '线上应用不要依赖 SNAPSHOT 版本，否则发布不可重复。',
      '工程结构·二方库依赖',
    ),
    rule(
      'java-unified-version-variable',
      'recommended',
      'architecture',
      '一组二方库依赖用统一的版本变量管理，避免版本号散落各处造成不一致。',
      '工程结构·二方库依赖',
    ),
    rule(
      'java-layer-dependency',
      'recommended',
      'architecture',
      '依赖方向保持单向（上层依赖下层），不要出现下层反向回调上层的跨层依赖。',
      '工程结构·应用分层',
    ),
  ],
};
