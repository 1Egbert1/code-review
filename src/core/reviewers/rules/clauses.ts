/**
 * 条款覆盖表。
 *
 * 为什么要有这张表：《阿里巴巴Java开发手册》v1.3.0（2017 年 PDF）正文共 **215 条**，
 * 分成六大维度、二十个小节。规则库要能证明「一条都没漏」——不能靠人拍胸脯，
 * 得靠一条可执行的断言。
 *
 * 每条条款只有两种归宿，没有第三种：
 *
 * | 归宿 | 含义 | 必填 |
 * | --- | --- | --- |
 * | `rule` | 写成了可判定的规则指令 | `ruleId` |
 * | `excluded` | 明确不做，并说明为什么 | `reason` |
 *
 * **「没时间做」不是理由。** 排除必须落进下面某个具体原因，这是为了让排除也是个决定，
 * 而不是遗忘。测试会断言：215 条全部被认领、没有重复、`rule` 类指向的规则必须真实存在。
 *
 * 编号按「小节 + 出现顺序」编，不用 PDF 里的原编号——原编号在分页处会被切断，
 * 拿它当主键会出现两页各有一个「第 3 条」。
 */

import type { RuleLevel } from './library.js';

/**
 * 不写成规则的原因。
 *
 * 每种都要能回答「那这条靠什么保证」，否则就是偷懒的借口。
 */
export type ExclusionReason =
  /** 需要人对业务语境作判断，没有客观判据；写成规则只会产出误报 */
  | 'subjective'
  /** 需要仓库结构、模块关系、运行环境等单文件之外的信息 */
  | 'needs-context'
  /** 属于部署与运维配置，源码里看不见 */
  | 'ops-config'
  /** 需要静态分析、依赖树、覆盖率报告等专用工具 */
  | 'needs-tool'
  /** 需要执行计划 / 运行时数据才能判断 */
  | 'needs-plan'
  /** 需要与历史版本对比，单次快照判不了 */
  | 'needs-baseline'
  /** 团队流程约定，不是代码问题 */
  | 'process'
  /** 观点或教育性说明，没有「违规」这种状态 */
  | 'opinion'
  /** 总纲，已拆解到更具体的条款 */
  | 'umbrella'
  /** 特定技术栈（velocity / iBATIS），本工具不覆盖 */
  | 'stack-specific'
  /** 巡检的五维指标已经在算，不必再写成提示词规则 */
  | 'covered-by-metrics'
  /** 语义说明，本身不构成可判定条件 */
  | 'educational';

export const REASON_LABEL: Readonly<Record<ExclusionReason, string>> = {
  subjective: '需人工判断',
  'needs-context': '需仓库上下文',
  'ops-config': '属运维配置',
  'needs-tool': '需专用工具',
  'needs-plan': '需执行计划',
  'needs-baseline': '需历史对比',
  process: '属团队流程',
  opinion: '属观点说明',
  umbrella: '总纲已拆解',
  'stack-specific': '特定技术栈',
  'covered-by-metrics': '巡检已覆盖',
  educational: '语义说明',
};

export interface Clause {
  /** `{小节}-{序号}` */
  readonly id: string;
  readonly level: RuleLevel;
  /** 一句话概括该条要求什么 */
  readonly summary: string;
  readonly verdict: 'rule' | 'excluded';
  readonly ruleId?: string;
  readonly reason?: ExclusionReason;
}

export const MANUAL_CLAUSES: readonly Clause[] = [
  // ── (一) 命名风格 14 条 ────────────────────────────────────────────────
  {
    id: 'naming-1',
    level: 'mandatory',
    summary: '禁止拼音与英文混写，禁止中文命名',
    verdict: 'rule',
    ruleId: 'java-naming-no-pinyin',
  },
  {
    id: 'naming-2',
    level: 'mandatory',
    summary: '类名用 UpperCamelCase（DO/BO/DTO/VO/AO 例外）',
    verdict: 'rule',
    ruleId: 'java-naming-case',
  },
  {
    id: 'naming-3',
    level: 'mandatory',
    summary: '方法名、参数、成员变量、局部变量用 lowerCamelCase',
    verdict: 'rule',
    ruleId: 'java-naming-case',
  },
  {
    id: 'naming-4',
    level: 'mandatory',
    summary: '常量全大写、下划线分隔',
    verdict: 'rule',
    ruleId: 'java-naming-case',
  },
  {
    id: 'naming-5',
    level: 'mandatory',
    summary: '抽象类 Abstract/Base 开头，异常类 Exception 结尾，测试类以被测类名开头加 Test',
    verdict: 'rule',
    ruleId: 'java-abstract-prefix',
  },
  {
    id: 'naming-6',
    level: 'mandatory',
    summary: '数组类型中括号跟随类型（String[] args）',
    verdict: 'rule',
    ruleId: 'java-array-bracket',
  },
  {
    id: 'naming-7',
    level: 'mandatory',
    summary: 'POJO 布尔属性不加 is 前缀',
    verdict: 'rule',
    ruleId: 'java-boolean-no-is',
  },
  {
    id: 'naming-8',
    level: 'mandatory',
    summary: '包名全小写、单数、每段一个词',
    verdict: 'rule',
    ruleId: 'java-package-naming',
  },
  {
    id: 'naming-9',
    level: 'mandatory',
    summary: '杜绝不规范缩写',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'naming-10',
    level: 'recommended',
    summary: '命名用尽量完整的单词组合',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'naming-11',
    level: 'recommended',
    summary: '用到设计模式时命名体现模式',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'naming-12',
    level: 'recommended',
    summary: '接口方法与属性不加修饰符，并写 Javadoc',
    verdict: 'rule',
    ruleId: 'java-interface-no-modifier',
  },
  {
    id: 'naming-13',
    level: 'reference',
    summary: '枚举类带 Enum 后缀，成员全大写下划线分隔',
    verdict: 'rule',
    ruleId: 'java-enum-naming',
  },
  {
    id: 'naming-14',
    level: 'reference',
    summary: 'Service/DAO 方法按 get/list/count/save/insert/remove/update 前缀',
    verdict: 'rule',
    ruleId: 'java-service-dao-naming',
  },

  // ── (二) 常量定义 5 条 ────────────────────────────────────────────────
  {
    id: 'const-1',
    level: 'mandatory',
    summary: '禁止魔法值直接出现在代码里',
    verdict: 'rule',
    ruleId: 'java-no-magic-value',
  },
  {
    id: 'const-2',
    level: 'mandatory',
    summary: 'long 赋值用大写 L',
    verdict: 'rule',
    ruleId: 'java-long-uppercase-l',
  },
  {
    id: 'const-3',
    level: 'recommended',
    summary: '不要用一个常量类装下所有常量',
    verdict: 'excluded',
    reason: 'needs-context',
  },
  {
    id: 'const-4',
    level: 'recommended',
    summary: '常量按五层复用范围分别放置',
    verdict: 'excluded',
    reason: 'needs-context',
  },
  {
    id: 'const-5',
    level: 'recommended',
    summary: '取值范围有限且带延伸属性时用枚举',
    verdict: 'excluded',
    reason: 'subjective',
  },

  // ── (三) 代码格式 11 条 ───────────────────────────────────────────────
  {
    id: 'format-1',
    level: 'mandatory',
    summary: '大括号换行约定',
    verdict: 'rule',
    ruleId: 'java-format-brace',
  },
  {
    id: 'format-2',
    level: 'mandatory',
    summary: '括号内侧不留空格',
    verdict: 'rule',
    ruleId: 'java-format-paren-space',
  },
  {
    id: 'format-3',
    level: 'mandatory',
    summary: 'if/for/while/switch/do 与括号之间加空格',
    verdict: 'rule',
    ruleId: 'java-format-keyword-space',
  },
  {
    id: 'format-4',
    level: 'mandatory',
    summary: '二目、三目运算符两侧加空格',
    verdict: 'rule',
    ruleId: 'java-format-operator-space',
  },
  {
    id: 'format-5',
    level: 'mandatory',
    summary: '4 空格缩进，禁用 tab',
    verdict: 'rule',
    ruleId: 'java-format-indent',
  },
  {
    id: 'format-6',
    level: 'mandatory',
    summary: '双斜线与注释内容之间一个空格',
    verdict: 'rule',
    ruleId: 'java-format-comment-space',
  },
  {
    id: 'format-7',
    level: 'mandatory',
    summary: '单行不超过 120 字符',
    verdict: 'rule',
    ruleId: 'java-format-line-length',
  },
  {
    id: 'format-8',
    level: 'mandatory',
    summary: '参数逗号后加空格',
    verdict: 'rule',
    ruleId: 'java-format-comma-space',
  },
  {
    id: 'format-9',
    level: 'mandatory',
    summary: '文件 UTF-8 编码、Unix 换行符',
    verdict: 'rule',
    ruleId: 'java-format-encoding',
  },
  {
    id: 'format-10',
    level: 'recommended',
    summary: '不要用空格做纵向对齐',
    verdict: 'rule',
    ruleId: 'java-format-no-align',
  },
  {
    id: 'format-11',
    level: 'recommended',
    summary: '不同语义之间插入空行',
    verdict: 'rule',
    ruleId: 'java-format-blank-line',
  },

  // ── (四) OOP 规约 20 条 ───────────────────────────────────────────────
  {
    id: 'oop-1',
    level: 'mandatory',
    summary: '静态成员用类名访问，不经对象引用',
    verdict: 'rule',
    ruleId: 'java-static-access',
  },
  {
    id: 'oop-2',
    level: 'mandatory',
    summary: '覆写方法必须加 @Override',
    verdict: 'rule',
    ruleId: 'java-override-annotation',
  },
  {
    id: 'oop-3',
    level: 'mandatory',
    summary: '可变参数同类型同语义，避免 Object...',
    verdict: 'rule',
    ruleId: 'java-varargs-type',
  },
  {
    id: 'oop-4',
    level: 'mandatory',
    summary: '对外接口不改签名；过时必须标 @Deprecated 并说明替代',
    verdict: 'rule',
    ruleId: 'java-signature-stability',
  },
  {
    id: 'oop-5',
    level: 'mandatory',
    summary: '不得使用已过时的类或方法',
    verdict: 'rule',
    ruleId: 'java-no-deprecated-usage',
  },
  {
    id: 'oop-6',
    level: 'mandatory',
    summary: 'equals 由常量或确定有值的对象调用',
    verdict: 'rule',
    ruleId: 'java-equals-null-safe',
  },
  {
    id: 'oop-7',
    level: 'mandatory',
    summary: '同类型包装类比较必须用 equals',
    verdict: 'rule',
    ruleId: 'java-wrapper-equals',
  },
  {
    id: 'oop-8',
    level: 'mandatory',
    summary: 'POJO 属性与 RPC 出入参用包装类型，局部变量用基本类型',
    verdict: 'rule',
    ruleId: 'java-pojo-wrapper-type',
  },
  {
    id: 'oop-9',
    level: 'mandatory',
    summary: 'DO/DTO/VO 不设属性默认值',
    verdict: 'rule',
    ruleId: 'java-pojo-no-default-value',
  },
  {
    id: 'oop-10',
    level: 'mandatory',
    summary: 'serialVersionUID 只在完全不兼容升级时修改',
    verdict: 'rule',
    ruleId: 'java-serial-version-uid',
  },
  {
    id: 'oop-11',
    level: 'mandatory',
    summary: '构造方法里不写业务逻辑',
    verdict: 'rule',
    ruleId: 'java-constructor-no-logic',
  },
  {
    id: 'oop-12',
    level: 'mandatory',
    summary: 'POJO 必须写 toString，继承时串 super.toString',
    verdict: 'rule',
    ruleId: 'java-pojo-tostring',
  },
  {
    id: 'oop-13',
    level: 'recommended',
    summary: 'split 结果按索引取值前检查末段是否为空',
    verdict: 'rule',
    ruleId: 'java-split-tail-check',
  },
  {
    id: 'oop-14',
    level: 'recommended',
    summary: '重载方法放在一起',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'oop-15',
    level: 'recommended',
    summary: '类内方法按 公有/保护 > 私有 > getter setter 排列',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'oop-16',
    level: 'recommended',
    summary: 'getter/setter 不写业务逻辑，setter 用 this 赋值',
    verdict: 'rule',
    ruleId: 'java-accessor-no-logic',
  },
  {
    id: 'oop-17',
    level: 'recommended',
    summary: '循环体内字符串拼接用 StringBuilder',
    verdict: 'rule',
    ruleId: 'java-string-builder-in-loop',
  },
  {
    id: 'oop-18',
    level: 'recommended',
    summary: '按场景使用 final 限制继承与重写',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'oop-19',
    level: 'recommended',
    summary: '慎用 Object.clone 拷贝对象',
    verdict: 'rule',
    ruleId: 'java-clone-caution',
  },
  {
    id: 'oop-20',
    level: 'recommended',
    summary: '访问控制从严，工具类构造方法私有',
    verdict: 'rule',
    ruleId: 'java-access-modifier-strict',
  },

  // ── (五) 集合处理 13 条 ───────────────────────────────────────────────
  {
    id: 'coll-1',
    level: 'mandatory',
    summary: '重写 equals 必须重写 hashCode',
    verdict: 'rule',
    ruleId: 'java-equals-hashcode-pair',
  },
  {
    id: 'coll-2',
    level: 'mandatory',
    summary: 'subList 结果不得强转为 ArrayList',
    verdict: 'rule',
    ruleId: 'java-sublist-caution',
  },
  {
    id: 'coll-3',
    level: 'mandatory',
    summary: 'subList 期间修改原集合会抛并发修改异常',
    verdict: 'rule',
    ruleId: 'java-sublist-caution',
  },
  {
    id: 'coll-4',
    level: 'mandatory',
    summary: '集合转数组用 toArray(T[]) 且长度匹配',
    verdict: 'rule',
    ruleId: 'java-toarray-typed',
  },
  {
    id: 'coll-5',
    level: 'mandatory',
    summary: 'Arrays.asList 返回的集合不可增删',
    verdict: 'rule',
    ruleId: 'java-arrays-aslist-immutable',
  },
  {
    id: 'coll-6',
    level: 'mandatory',
    summary: '泛型通配符 extends 不能写、super 不能读',
    verdict: 'rule',
    ruleId: 'java-generic-wildcard',
  },
  {
    id: 'coll-7',
    level: 'mandatory',
    summary: 'foreach 里不增删元素，改用 Iterator',
    verdict: 'rule',
    ruleId: 'java-no-remove-in-foreach',
  },
  {
    id: 'coll-8',
    level: 'mandatory',
    summary: 'Comparator 须满足自反、传递、一致三条约定',
    verdict: 'rule',
    ruleId: 'java-comparator-contract',
  },
  {
    id: 'coll-9',
    level: 'recommended',
    summary: '集合初始化时给定容量',
    verdict: 'rule',
    ruleId: 'java-collection-capacity',
  },
  {
    id: 'coll-10',
    level: 'recommended',
    summary: '遍历 Map 用 entrySet 而非 keySet',
    verdict: 'rule',
    ruleId: 'java-entryset-iteration',
  },
  {
    id: 'coll-11',
    level: 'recommended',
    summary: '注意各 Map 实现能否存 null 键值',
    verdict: 'rule',
    ruleId: 'java-map-null-key',
  },
  {
    id: 'coll-12',
    level: 'reference',
    summary: '利用集合的有序性与稳定性',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'coll-13',
    level: 'reference',
    summary: '用 Set 去重，避免 List.contains 逐个比对',
    verdict: 'rule',
    ruleId: 'java-set-for-dedup',
  },

  // ── (六) 并发处理 15 条 ───────────────────────────────────────────────
  {
    id: 'concur-1',
    level: 'mandatory',
    summary: '单例的获取与方法都要线程安全',
    verdict: 'rule',
    ruleId: 'java-singleton-thread-safe',
  },
  {
    id: 'concur-2',
    level: 'mandatory',
    summary: '线程与线程池要指定有意义的名称',
    verdict: 'rule',
    ruleId: 'java-thread-naming',
  },
  {
    id: 'concur-3',
    level: 'mandatory',
    summary: '线程必须由线程池提供，禁止显式 new Thread',
    verdict: 'rule',
    ruleId: 'java-no-raw-thread',
  },
  {
    id: 'concur-4',
    level: 'mandatory',
    summary: '线程池用 ThreadPoolExecutor 构造，不用 Executors 工厂',
    verdict: 'rule',
    ruleId: 'java-no-executors',
  },
  {
    id: 'concur-5',
    level: 'mandatory',
    summary: 'SimpleDateFormat 不做 static 共享，或必须加锁',
    verdict: 'rule',
    ruleId: 'java-simpledateformat-thread',
  },
  {
    id: 'concur-6',
    level: 'mandatory',
    summary: '锁的粒度尽量小，能无锁就不用锁',
    verdict: 'excluded',
    reason: 'needs-context',
  },
  {
    id: 'concur-7',
    level: 'mandatory',
    summary: '多资源加锁保持全局一致的顺序',
    verdict: 'excluded',
    reason: 'needs-context',
  },
  {
    id: 'concur-8',
    level: 'mandatory',
    summary: '并发更新同一记录须加锁或用 version 乐观锁',
    verdict: 'rule',
    ruleId: 'java-lost-update',
  },
  {
    id: 'concur-9',
    level: 'mandatory',
    summary: '多任务定时用 ScheduledExecutorService，不用 Timer',
    verdict: 'rule',
    ruleId: 'java-no-timer',
  },
  {
    id: 'concur-10',
    level: 'recommended',
    summary: 'CountDownLatch 的 countDown 放进 finally',
    verdict: 'rule',
    ruleId: 'java-countdown-latch-finally',
  },
  {
    id: 'concur-11',
    level: 'recommended',
    summary: 'Random 不要跨线程共享',
    verdict: 'rule',
    ruleId: 'java-random-shared',
  },
  {
    id: 'concur-12',
    level: 'recommended',
    summary: '双重检查锁必须给实例字段加 volatile',
    verdict: 'rule',
    ruleId: 'java-dcl-volatile',
  },
  {
    id: 'concur-13',
    level: 'reference',
    summary: 'volatile 只解决可见性，不解决多写安全',
    verdict: 'excluded',
    reason: 'educational',
  },
  {
    id: 'concur-14',
    level: 'reference',
    summary: 'HashMap 并发扩容可能形成死链',
    verdict: 'rule',
    ruleId: 'java-hashmap-shared-mutation',
  },
  {
    id: 'concur-15',
    level: 'reference',
    summary: 'ThreadLocal 用 static 修饰',
    verdict: 'rule',
    ruleId: 'java-threadlocal-static',
  },

  // ── (七) 控制语句 8 条 ────────────────────────────────────────────────
  {
    id: 'ctrl-1',
    level: 'mandatory',
    summary: 'switch 每个 case 必须终止或注释说明贯穿，且必须有 default',
    verdict: 'rule',
    ruleId: 'java-switch-default',
  },
  {
    id: 'ctrl-2',
    level: 'mandatory',
    summary: 'if/else/for/while/do 一律带大括号',
    verdict: 'rule',
    ruleId: 'java-mandatory-braces',
  },
  {
    id: 'ctrl-3',
    level: 'recommended',
    summary: '异常分支用早返回替代 if-else 嵌套',
    verdict: 'rule',
    ruleId: 'java-early-return',
  },
  {
    id: 'ctrl-4',
    level: 'recommended',
    summary: '复杂条件先赋给有意义的布尔变量',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'ctrl-5',
    level: 'recommended',
    summary: '循环体内的对象创建、连接获取尽量外提',
    verdict: 'rule',
    ruleId: 'java-loop-hoist',
  },
  {
    id: 'ctrl-6',
    level: 'recommended',
    summary: '批量接口要做入参保护',
    verdict: 'rule',
    ruleId: 'java-input-validation',
  },
  {
    id: 'ctrl-7',
    level: 'reference',
    summary: '列举了需要参数校验的场景',
    verdict: 'excluded',
    reason: 'needs-context',
  },
  {
    id: 'ctrl-8',
    level: 'reference',
    summary: '列举了不需要参数校验的场景',
    verdict: 'excluded',
    reason: 'needs-context',
  },

  // ── (八) 注释规约 11 条 ───────────────────────────────────────────────
  {
    id: 'comment-1',
    level: 'mandatory',
    summary: '类、属性、方法注释用 Javadoc 格式',
    verdict: 'rule',
    ruleId: 'java-javadoc-required',
  },
  {
    id: 'comment-2',
    level: 'mandatory',
    summary: '抽象方法与接口方法必须写 Javadoc 说明做什么',
    verdict: 'rule',
    ruleId: 'java-javadoc-required',
  },
  {
    id: 'comment-3',
    level: 'mandatory',
    summary: '类注释必须含创建者与创建日期',
    verdict: 'rule',
    ruleId: 'java-class-author-date',
  },
  {
    id: 'comment-4',
    level: 'mandatory',
    summary: '方法内注释另起一行，多行注释与代码对齐',
    verdict: 'rule',
    ruleId: 'java-format-comment-space',
  },
  {
    id: 'comment-5',
    level: 'mandatory',
    summary: '枚举每个数据项都要有注释',
    verdict: 'rule',
    ruleId: 'java-enum-field-comment',
  },
  {
    id: 'comment-6',
    level: 'recommended',
    summary: '半吊子英文不如用中文写清楚',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'comment-7',
    level: 'recommended',
    summary: '改代码同时改注释',
    verdict: 'excluded',
    reason: 'needs-baseline',
  },
  {
    id: 'comment-8',
    level: 'reference',
    summary: '谨慎注释掉代码，无用就删除',
    verdict: 'rule',
    ruleId: 'java-no-commented-code',
  },
  {
    id: 'comment-9',
    level: 'reference',
    summary: '注释要反映设计思想与业务含义',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'comment-10',
    level: 'reference',
    summary: '注释力求精简，避免过滥',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'comment-11',
    level: 'reference',
    summary: 'TODO 等特殊标记须注明标记人与时间',
    verdict: 'rule',
    ruleId: 'java-todo-format',
  },

  // ── (九) 其它 8 条 ────────────────────────────────────────────────────
  {
    id: 'misc-1',
    level: 'mandatory',
    summary: '正则表达式预编译后复用',
    verdict: 'rule',
    ruleId: 'java-regex-precompile',
  },
  {
    id: 'misc-2',
    level: 'mandatory',
    summary: 'velocity 模板直接取属性名，不写 getXxx',
    verdict: 'excluded',
    reason: 'stack-specific',
  },
  {
    id: 'misc-3',
    level: 'mandatory',
    summary: '模板输出变量用 $!{var} 带感叹号',
    verdict: 'rule',
    ruleId: 'java-velocity-escape',
  },
  {
    id: 'misc-4',
    level: 'mandatory',
    summary: '取整数随机数用 nextInt，不要放大后取整',
    verdict: 'rule',
    ruleId: 'java-random-int',
  },
  {
    id: 'misc-5',
    level: 'mandatory',
    summary: '取当前毫秒用 System.currentTimeMillis',
    verdict: 'rule',
    ruleId: 'java-current-time-millis',
  },
  {
    id: 'misc-6',
    level: 'recommended',
    summary: '视图模板里不放复杂逻辑',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'misc-7',
    level: 'recommended',
    summary: '数据结构构造时指定初始大小',
    verdict: 'rule',
    ruleId: 'java-collection-capacity',
  },
  {
    id: 'misc-8',
    level: 'recommended',
    summary: '及时清理不再使用的代码与配置',
    verdict: 'excluded',
    reason: 'needs-tool',
  },

  // ── 二、异常日志 21 条 ────────────────────────────────────────────────
  {
    id: 'exc-1',
    level: 'mandatory',
    summary: '可用预检查规避的运行时异常不要靠 catch 兜',
    verdict: 'rule',
    ruleId: 'java-precheck-not-catch',
  },
  {
    id: 'exc-2',
    level: 'mandatory',
    summary: '异常不做流程控制',
    verdict: 'rule',
    ruleId: 'java-no-exception-for-flow',
  },
  {
    id: 'exc-3',
    level: 'mandatory',
    summary: '不 try 大段代码，按异常类型分别捕获',
    verdict: 'rule',
    ruleId: 'java-narrow-try-scope',
  },
  {
    id: 'exc-4',
    level: 'mandatory',
    summary: '捕获必须处理或上抛，不得吞掉',
    verdict: 'rule',
    ruleId: 'java-catch-must-handle',
  },
  {
    id: 'exc-5',
    level: 'mandatory',
    summary: '事务里 catch 后需回滚的要手动回滚',
    verdict: 'rule',
    ruleId: 'java-transaction-rollback',
  },
  {
    id: 'exc-6',
    level: 'mandatory',
    summary: 'finally 里关闭资源，关闭本身也要防异常',
    verdict: 'rule',
    ruleId: 'java-finally-close-resource',
  },
  {
    id: 'exc-7',
    level: 'mandatory',
    summary: 'finally 里不得 return',
    verdict: 'rule',
    ruleId: 'java-finally-no-return',
  },
  {
    id: 'exc-8',
    level: 'mandatory',
    summary: '捕获类型与抛出类型必须匹配或为其父类',
    verdict: 'rule',
    ruleId: 'java-catch-type-match',
  },
  {
    id: 'exc-9',
    level: 'recommended',
    summary: '可能返回 null 时须注释说明',
    verdict: 'rule',
    ruleId: 'java-null-return-doc',
  },
  {
    id: 'exc-10',
    level: 'recommended',
    summary: '注意自动拆箱导致的空指针',
    verdict: 'rule',
    ruleId: 'java-unboxing-npe',
  },
  {
    id: 'exc-11',
    level: 'recommended',
    summary: '用有业务含义的自定义异常，不抛 RuntimeException/Exception/Throwable',
    verdict: 'rule',
    ruleId: 'java-specific-exception',
  },
  {
    id: 'exc-12',
    level: 'reference',
    summary: '对外接口返回错误码，内部抛异常',
    verdict: 'excluded',
    reason: 'needs-context',
  },
  {
    id: 'exc-13',
    level: 'reference',
    summary: '避免重复代码（DRY）',
    verdict: 'excluded',
    reason: 'covered-by-metrics',
  },
  {
    id: 'log-1',
    level: 'mandatory',
    summary: '用 SLF4J 门面，不用 Log4j/Logback 的 API',
    verdict: 'rule',
    ruleId: 'java-log-slf4j-facade',
  },
  {
    id: 'log-2',
    level: 'mandatory',
    summary: '日志文件至少保留 15 天',
    verdict: 'excluded',
    reason: 'ops-config',
  },
  {
    id: 'log-3',
    level: 'mandatory',
    summary: '扩展日志按 appName_logType_logName 命名',
    verdict: 'excluded',
    reason: 'ops-config',
  },
  {
    id: 'log-4',
    level: 'mandatory',
    summary: 'trace/debug/info 用占位符或条件输出',
    verdict: 'rule',
    ruleId: 'java-log-slf4j-placeholder',
  },
  {
    id: 'log-5',
    level: 'mandatory',
    summary: '配置 additivity=false 避免重复打印',
    verdict: 'excluded',
    reason: 'ops-config',
  },
  {
    id: 'log-6',
    level: 'mandatory',
    summary: '异常日志要含案发现场与堆栈',
    verdict: 'rule',
    ruleId: 'java-log-with-context',
  },
  {
    id: 'log-7',
    level: 'recommended',
    summary: '生产环境禁止 debug 输出',
    verdict: 'excluded',
    reason: 'ops-config',
  },
  {
    id: 'log-8',
    level: 'reference',
    summary: '用户入参错误用 warn 级别记录',
    verdict: 'excluded',
    reason: 'opinion',
  },

  // ── 三、单元测试 16 条 ────────────────────────────────────────────────
  {
    id: 'test-1',
    level: 'mandatory',
    summary: '单测遵守 AIR 原则（自动、独立、可重复）',
    verdict: 'rule',
    ruleId: 'java-test-air',
  },
  {
    id: 'test-2',
    level: 'mandatory',
    summary: '全自动执行、非交互式，用断言而非打印验证',
    verdict: 'rule',
    ruleId: 'java-test-no-print',
  },
  {
    id: 'test-3',
    level: 'mandatory',
    summary: '用例之间不互相调用，不依赖执行顺序',
    verdict: 'rule',
    ruleId: 'java-test-independent',
  },
  {
    id: 'test-4',
    level: 'mandatory',
    summary: '用例可重复执行，不受外界环境影响',
    verdict: 'rule',
    ruleId: 'java-test-no-external',
  },
  {
    id: 'test-5',
    level: 'mandatory',
    summary: '单测粒度到方法级',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'test-6',
    level: 'mandatory',
    summary: '核心模块的增量代码单测必须通过',
    verdict: 'excluded',
    reason: 'process',
  },
  {
    id: 'test-7',
    level: 'mandatory',
    summary: '单测写在 src/test/java',
    verdict: 'rule',
    ruleId: 'java-test-location',
  },
  {
    id: 'test-8',
    level: 'recommended',
    summary: '语句覆盖率 70%，核心模块分支覆盖 100%',
    verdict: 'rule',
    ruleId: 'java-test-coverage',
  },
  {
    id: 'test-9',
    level: 'recommended',
    summary: '单测遵守 BCDE 原则',
    verdict: 'excluded',
    reason: 'umbrella',
  },
  {
    id: 'test-10',
    level: 'recommended',
    summary: '数据库相关测试不假设数据已存在',
    verdict: 'rule',
    ruleId: 'java-test-db-independent',
  },
  {
    id: 'test-11',
    level: 'recommended',
    summary: '数据库测试设自动回滚或数据加前后缀标识',
    verdict: 'rule',
    ruleId: 'java-test-tx-rollback',
  },
  {
    id: 'test-12',
    level: 'recommended',
    summary: '不可测代码应重构，不要为凑覆盖率写歪测试',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'test-13',
    level: 'recommended',
    summary: '设计评审阶段确定单测范围',
    verdict: 'excluded',
    reason: 'process',
  },
  {
    id: 'test-14',
    level: 'recommended',
    summary: '提测前完成单测，不事后补',
    verdict: 'excluded',
    reason: 'process',
  },
  {
    id: 'test-15',
    level: 'reference',
    summary: '业务代码避免构造过重、全局状态过多等难测结构',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'test-16',
    level: 'reference',
    summary: '澄清对单测的常见误解',
    verdict: 'excluded',
    reason: 'opinion',
  },

  // ── 四、安全规约 8 条 ─────────────────────────────────────────────────
  {
    id: 'sec-1',
    level: 'mandatory',
    summary: '涉及用户个人数据的功能必须做权限校验',
    verdict: 'rule',
    ruleId: 'java-authz-check',
  },
  {
    id: 'sec-2',
    level: 'mandatory',
    summary: '敏感数据展示必须脱敏',
    verdict: 'rule',
    ruleId: 'java-sensitive-mask',
  },
  {
    id: 'sec-3',
    level: 'mandatory',
    summary: 'SQL 参数必须绑定，禁止字符串拼接',
    verdict: 'rule',
    ruleId: 'java-sql-param-binding',
  },
  {
    id: 'sec-4',
    level: 'mandatory',
    summary: '所有外部入参必须做有效性校验',
    verdict: 'rule',
    ruleId: 'java-input-validation',
  },
  {
    id: 'sec-5',
    level: 'mandatory',
    summary: '输出到页面的用户数据必须转义',
    verdict: 'rule',
    ruleId: 'java-xss-escape',
  },
  {
    id: 'sec-6',
    level: 'mandatory',
    summary: '表单与 AJAX 提交须做 CSRF 防护',
    verdict: 'rule',
    ruleId: 'java-csrf-protection',
  },
  {
    id: 'sec-7',
    level: 'mandatory',
    summary: '短信、支付等平台资源必须防重放',
    verdict: 'rule',
    ruleId: 'java-replay-protection',
  },
  {
    id: 'sec-8',
    level: 'recommended',
    summary: 'UGC 场景须防刷与违禁词过滤',
    verdict: 'rule',
    ruleId: 'java-ugc-risk-control',
  },

  // ── 五、MySQL 47 条 ───────────────────────────────────────────────────
  {
    id: 'db-table-1',
    level: 'mandatory',
    summary: '是与否字段用 is_xxx 命名，unsigned tinyint 存储',
    verdict: 'rule',
    ruleId: 'java-is-xxx-tinyint',
  },
  {
    id: 'db-table-2',
    level: 'mandatory',
    summary: '表名字段名小写、不以数字开头',
    verdict: 'rule',
    ruleId: 'java-db-name-lowercase',
  },
  {
    id: 'db-table-3',
    level: 'mandatory',
    summary: '表名不用复数',
    verdict: 'rule',
    ruleId: 'java-db-name-lowercase',
  },
  {
    id: 'db-table-4',
    level: 'mandatory',
    summary: '不得使用 SQL 保留字做标识符',
    verdict: 'rule',
    ruleId: 'java-db-no-reserved-word',
  },
  {
    id: 'db-table-5',
    level: 'mandatory',
    summary: '索引按 pk_/uk_/idx_ 前缀命名',
    verdict: 'rule',
    ruleId: 'java-index-naming',
  },
  {
    id: 'db-table-6',
    level: 'mandatory',
    summary: '小数用 decimal，禁用 float/double',
    verdict: 'rule',
    ruleId: 'java-decimal-not-float',
  },
  {
    id: 'db-table-7',
    level: 'mandatory',
    summary: '长度几乎相等的字符串用 char',
    verdict: 'rule',
    ruleId: 'java-db-char-for-fixed',
  },
  {
    id: 'db-table-8',
    level: 'mandatory',
    summary: 'varchar 不超过 5000，超出用 text 独立成表',
    verdict: 'rule',
    ruleId: 'java-varchar-length',
  },
  {
    id: 'db-table-9',
    level: 'mandatory',
    summary: '表必备 id、gmt_create、gmt_modified 三字段',
    verdict: 'rule',
    ruleId: 'java-table-three-fields',
  },
  {
    id: 'db-table-10',
    level: 'recommended',
    summary: '表名带业务名称前缀',
    verdict: 'excluded',
    reason: 'needs-context',
  },
  {
    id: 'db-table-11',
    level: 'recommended',
    summary: '库名与应用名称一致',
    verdict: 'excluded',
    reason: 'needs-context',
  },
  {
    id: 'db-table-12',
    level: 'recommended',
    summary: '字段含义变化时同步更新字段注释',
    verdict: 'rule',
    ruleId: 'java-db-column-comment',
  },
  {
    id: 'db-table-13',
    level: 'recommended',
    summary: '冗余字段须权衡一致性',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'db-table-14',
    level: 'recommended',
    summary: '500 万行或 2GB 以上才考虑分库分表',
    verdict: 'excluded',
    reason: 'needs-context',
  },
  {
    id: 'db-table-15',
    level: 'reference',
    summary: '字段长度按实际需要选，避免过大',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'db-index-1',
    level: 'mandatory',
    summary: '业务唯一字段必须建唯一索引',
    verdict: 'rule',
    ruleId: 'java-db-unique-index',
  },
  {
    id: 'db-index-2',
    level: 'mandatory',
    summary: '禁止超过三表 join；join 字段类型一致且有索引',
    verdict: 'rule',
    ruleId: 'java-db-join-limit',
  },
  {
    id: 'db-index-3',
    level: 'mandatory',
    summary: 'varchar 建索引要指定长度',
    verdict: 'rule',
    ruleId: 'java-db-index-length',
  },
  {
    id: 'db-index-4',
    level: 'mandatory',
    summary: '页面搜索禁止左模糊与全模糊',
    verdict: 'rule',
    ruleId: 'java-db-no-leading-wildcard',
  },
  {
    id: 'db-index-5',
    level: 'recommended',
    summary: 'order by 利用索引有序性，避免 file_sort',
    verdict: 'rule',
    ruleId: 'java-db-orderby-index',
  },
  {
    id: 'db-index-6',
    level: 'recommended',
    summary: '用覆盖索引避免回表',
    verdict: 'excluded',
    reason: 'needs-plan',
  },
  {
    id: 'db-index-7',
    level: 'recommended',
    summary: '超多分页用延迟关联或子查询优化',
    verdict: 'excluded',
    reason: 'needs-plan',
  },
  {
    id: 'db-index-8',
    level: 'recommended',
    summary: 'SQL 性能目标达到 range，力争 ref/const',
    verdict: 'excluded',
    reason: 'needs-plan',
  },
  {
    id: 'db-index-9',
    level: 'recommended',
    summary: '组合索引把区分度高的列放最左',
    verdict: 'excluded',
    reason: 'needs-plan',
  },
  {
    id: 'db-index-10',
    level: 'recommended',
    summary: '防止字段类型不同导致隐式转换、索引失效',
    verdict: 'rule',
    ruleId: 'java-db-implicit-cast',
  },
  {
    id: 'db-index-11',
    level: 'reference',
    summary: '纠正建索引的三种极端认知',
    verdict: 'excluded',
    reason: 'opinion',
  },
  {
    id: 'db-sql-1',
    level: 'mandatory',
    summary: '统计行数用 count(*)，不用 count(列名) 或 count(常量)',
    verdict: 'rule',
    ruleId: 'java-sql-count-star',
  },
  {
    id: 'db-sql-2',
    level: 'mandatory',
    summary: 'count(distinct) 会忽略 NULL 行',
    verdict: 'excluded',
    reason: 'educational',
  },
  {
    id: 'db-sql-3',
    level: 'mandatory',
    summary: 'sum() 在全 NULL 时返回 NULL，注意空指针',
    verdict: 'rule',
    ruleId: 'java-sql-sum-null',
  },
  {
    id: 'db-sql-4',
    level: 'mandatory',
    summary: '判空用 ISNULL()',
    verdict: 'rule',
    ruleId: 'java-sql-null-check',
  },
  {
    id: 'db-sql-5',
    level: 'mandatory',
    summary: '分页查询在 count 为 0 时直接返回',
    verdict: 'rule',
    ruleId: 'java-sql-pagination-early-return',
  },
  {
    id: 'db-sql-6',
    level: 'mandatory',
    summary: '不得使用外键与级联，改在应用层处理',
    verdict: 'rule',
    ruleId: 'java-db-no-foreign-key',
  },
  {
    id: 'db-sql-7',
    level: 'mandatory',
    summary: '禁止使用存储过程',
    verdict: 'rule',
    ruleId: 'java-db-no-procedure',
  },
  {
    id: 'db-sql-8',
    level: 'mandatory',
    summary: '数据订正先 select 确认再改',
    verdict: 'rule',
    ruleId: 'java-db-select-before-write',
  },
  {
    id: 'db-sql-9',
    level: 'recommended',
    summary: 'in 集合元素控制在 1000 以内',
    verdict: 'rule',
    ruleId: 'java-sql-in-limit',
  },
  {
    id: 'db-sql-10',
    level: 'reference',
    summary: '有全球化需求时统一用 utf-8',
    verdict: 'excluded',
    reason: 'ops-config',
  },
  {
    id: 'db-sql-11',
    level: 'reference',
    summary: '避免在开发代码中使用 TRUNCATE TABLE',
    verdict: 'rule',
    ruleId: 'java-db-no-truncate',
  },
  {
    id: 'db-orm-1',
    level: 'mandatory',
    summary: '查询不得用 * 作字段列表',
    verdict: 'rule',
    ruleId: 'java-sql-no-select-star',
  },
  {
    id: 'db-orm-2',
    level: 'mandatory',
    summary: 'POJO 布尔属性不带 is，数据库字段带 is_，在映射中转换',
    verdict: 'rule',
    ruleId: 'java-orm-boolean-mapping',
  },
  {
    id: 'db-orm-3',
    level: 'mandatory',
    summary: '不用 resultClass 做返回参数，须显式定义映射',
    verdict: 'rule',
    ruleId: 'java-orm-resultmap',
  },
  {
    id: 'db-orm-4',
    level: 'mandatory',
    summary: 'MyBatis 参数用 #{} 不用 ${}',
    verdict: 'rule',
    ruleId: 'java-mybatis-no-dollar',
  },
  {
    id: 'db-orm-5',
    level: 'mandatory',
    summary: '不使用 iBATIS 的 queryForList 分页重载',
    verdict: 'excluded',
    reason: 'stack-specific',
  },
  {
    id: 'db-orm-6',
    level: 'mandatory',
    summary: '不允许用 HashMap/Hashtable 接收查询结果',
    verdict: 'rule',
    ruleId: 'java-orm-no-map-result',
  },
  {
    id: 'db-orm-7',
    level: 'mandatory',
    summary: '更新记录须同步写 gmt_modified',
    verdict: 'rule',
    ruleId: 'java-db-gmt-modified',
  },
  {
    id: 'db-orm-8',
    level: 'recommended',
    summary: '不做大而全的更新接口，只更新目标字段',
    verdict: 'rule',
    ruleId: 'java-db-narrow-update',
  },
  {
    id: 'db-orm-9',
    level: 'reference',
    summary: '@Transactional 不要滥用，须考虑多方回滚',
    verdict: 'rule',
    ruleId: 'java-transaction-scope',
  },
  {
    id: 'db-orm-10',
    level: 'reference',
    summary: '动态 SQL 各标签的语义说明',
    verdict: 'excluded',
    reason: 'educational',
  },

  // ── 六、工程结构 18 条 ────────────────────────────────────────────────
  {
    id: 'eng-layer-1',
    level: 'recommended',
    summary: '分层依赖只能由上层指向下层',
    verdict: 'rule',
    ruleId: 'java-layer-dependency',
  },
  {
    id: 'eng-layer-2',
    level: 'reference',
    summary: 'DAO 层统一包装为自定义异常，不在此打印日志',
    verdict: 'rule',
    ruleId: 'java-dao-exception-wrap',
  },
  {
    id: 'eng-layer-3',
    level: 'reference',
    summary: '领域模型按 DO/DTO/VO 分工，不混用',
    verdict: 'rule',
    ruleId: 'java-domain-model-naming',
  },
  {
    id: 'eng-lib-1',
    level: 'mandatory',
    summary: '二方库 GroupID 按 com.公司.业务线 格式，最多四级',
    verdict: 'rule',
    ruleId: 'java-gav-format',
  },
  {
    id: 'eng-lib-2',
    level: 'mandatory',
    summary: '二方库版本号用 主.次.修订 三段式',
    verdict: 'rule',
    ruleId: 'java-semver-format',
  },
  {
    id: 'eng-lib-3',
    level: 'mandatory',
    summary: '线上应用不依赖 SNAPSHOT 版本',
    verdict: 'rule',
    ruleId: 'java-no-snapshot-dependency',
  },
  {
    id: 'eng-lib-4',
    level: 'mandatory',
    summary: '二方库升降级不得改变其余依赖的仲裁结果',
    verdict: 'excluded',
    reason: 'needs-tool',
  },
  {
    id: 'eng-lib-5',
    level: 'mandatory',
    summary: '二方库接口返回值不使用枚举类型',
    verdict: 'rule',
    ruleId: 'java-api-no-enum-return',
  },
  {
    id: 'eng-lib-6',
    level: 'mandatory',
    summary: '同组二方库用统一版本变量',
    verdict: 'rule',
    ruleId: 'java-unified-version-variable',
  },
  {
    id: 'eng-lib-7',
    level: 'mandatory',
    summary: '禁止同一 GA 出现多个版本',
    verdict: 'rule',
    ruleId: 'java-duplicate-artifact-version',
  },
  {
    id: 'eng-lib-8',
    level: 'recommended',
    summary: '依赖声明与版本仲裁分块放置',
    verdict: 'rule',
    ruleId: 'java-pom-dependency-blocks',
  },
  {
    id: 'eng-lib-9',
    level: 'recommended',
    summary: '二方库尽量不暴露配置项',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'eng-lib-10',
    level: 'reference',
    summary: '二方库发布遵循精简可控原则',
    verdict: 'excluded',
    reason: 'subjective',
  },
  {
    id: 'eng-server-1',
    level: 'recommended',
    summary: '高并发场景调小 TCP time_wait 超时',
    verdict: 'excluded',
    reason: 'ops-config',
  },
  {
    id: 'eng-server-2',
    level: 'recommended',
    summary: '调大服务器最大文件句柄数',
    verdict: 'excluded',
    reason: 'ops-config',
  },
  {
    id: 'eng-server-3',
    level: 'recommended',
    summary: 'JVM 开启 HeapDumpOnOutOfMemoryError',
    verdict: 'rule',
    ruleId: 'java-jvm-heapdump',
  },
  {
    id: 'eng-server-4',
    level: 'recommended',
    summary: '生产环境 Xms 与 Xmx 设为相同值',
    verdict: 'rule',
    ruleId: 'java-jvm-heap-fixed',
  },
  {
    id: 'eng-server-5',
    level: 'reference',
    summary: '内部跳转用 forward，外部地址统一由工具类生成',
    verdict: 'rule',
    ruleId: 'java-redirect-internal',
  },
];

/** 按小节统计。测试用它核对每节条数与手册一致。 */
export function clauseGroups(): Map<string, Clause[]> {
  const groups = new Map<string, Clause[]>();
  for (const clause of MANUAL_CLAUSES) {
    const key = clause.id.replace(/-\d+$/, '');
    const list = groups.get(key) ?? [];
    list.push(clause);
    groups.set(key, list);
  }
  return groups;
}

/** 手册声称的条数与各小节分布，用于交叉核对，不可随手改。 */
export const MANUAL_TOTAL = 215;

export const MANUAL_SECTION_COUNTS: Readonly<Record<string, number>> = {
  naming: 14,
  const: 5,
  format: 11,
  oop: 20,
  coll: 13,
  concur: 15,
  ctrl: 8,
  comment: 11,
  misc: 8,
  exc: 13,
  log: 8,
  test: 16,
  sec: 8,
  'db-table': 15,
  'db-index': 11,
  'db-sql': 11,
  'db-orm': 10,
  'eng-layer': 3,
  'eng-lib': 10,
  'eng-server': 5,
};
