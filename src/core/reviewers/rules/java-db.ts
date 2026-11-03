/**
 * MySQL 与 ORM 规约（对应手册第五部分 47 条，落成 32 条规则）。
 *
 * 三条落地上的判断：
 *
 * 1. **建表与索引规则只对 SQL 生效。** 它们判断的是 DDL 文本（字段类型、索引命名），
 *    注入到普通 Java 文件里没有对应物，只会占名额。
 * 2. **ORM 规则对 SQL / XML / Java 都生效。** MyBatis 的 SQL 可能写在 mapper.xml，
 *    也可能写成注解挂在接口方法上，载体不固定。
 * 3. **有些条目看着像规则，其实是解释**（比如 count(distinct) 忽略 NULL、动态 SQL 标签语义）。
 *    那些归到「语义说明」不写成规则——模型不需要被提醒一个事实，它需要一条能判定的条件。
 */

import type { RuleEntry, RuleLibrary } from './library.js';

const BASIS_PREFIX = '《阿里巴巴Java开发手册》v1.3.0';
const SOURCE = {
  name: '《阿里巴巴Java开发手册》要点提炼（表述自撰）',
  url: 'https://github.com/alibaba/p3c',
  license: 'own',
  modified: '仅提炼规则要求，用本项目自己的话重写，未复制条文原文',
} as const;

/** DDL 与查询语句的载体。 */
const SQL_ONLY = ['sql'];
/** SQL 可能出现在三种文件里。 */
const SQL_ANYWHERE = ['sql', 'xml', 'java'];

function rule(
  id: string,
  level: RuleEntry['level'],
  instruction: string,
  clause: readonly string[],
  languages: readonly string[],
  basis: string,
): RuleEntry {
  return {
    id,
    level,
    dimension: 'database',
    title: instruction.slice(0, 30),
    instruction,
    languages,
    clauses: clause,
    source: { ...SOURCE, basis: `${BASIS_PREFIX} ${basis}` },
  };
}

export const JAVA_DB_RULES: RuleLibrary = {
  entries: [
    // ── 建表 ──────────────────────────────────────────────────────────────
    rule(
      'java-db-name-lowercase',
      'mandatory',
      '表名与字段名只用小写字母、数字和下划线：不以数字开头，不出现连续两个下划线，不用复数表名。',
      ['db-table-2', 'db-table-3'],
      SQL_ONLY,
      'MySQL 数据库·建表规约',
    ),
    rule(
      'java-db-no-reserved-word',
      'mandatory',
      '不得用 SQL 保留字做表名或字段名（desc、order、range、match、group、key 等）。',
      ['db-table-4'],
      SQL_ONLY,
      'MySQL 数据库·建表规约',
    ),
    rule(
      'java-db-char-for-fixed',
      'mandatory',
      '存储长度几乎固定的字符串用 char 而不是 varchar。',
      ['db-table-7'],
      SQL_ONLY,
      'MySQL 数据库·建表规约',
    ),
    rule(
      'java-db-column-comment',
      'recommended',
      '每个字段都要有 COMMENT，说明它存什么、取值范围；字段含义变化时同步改注释。',
      ['db-table-12'],
      SQL_ONLY,
      'MySQL 数据库·建表规约',
    ),

    // ── 索引 ──────────────────────────────────────────────────────────────
    rule(
      'java-db-unique-index',
      'mandatory',
      '业务上具有唯一性的字段（含组合）必须建唯一索引，不要只靠应用层先查后插。',
      ['db-index-1'],
      SQL_ONLY,
      'MySQL 数据库·索引规约',
    ),
    rule(
      'java-db-join-limit',
      'mandatory',
      '一条查询最多关联三张表；join 的字段类型必须完全一致，且被关联字段要有索引。',
      ['db-index-2'],
      SQL_ANYWHERE,
      'MySQL 数据库·索引规约',
    ),
    rule(
      'java-db-index-length',
      'mandatory',
      '给 varchar 字段建索引必须指定前缀长度，不要对全字段建。',
      ['db-index-3'],
      SQL_ONLY,
      'MySQL 数据库·索引规约',
    ),
    rule(
      'java-db-no-leading-wildcard',
      'mandatory',
      '禁止 LIKE 以 % 开头（左模糊或全模糊），索引会失效；这类检索应交给搜索引擎。',
      ['db-index-4'],
      SQL_ANYWHERE,
      'MySQL 数据库·索引规约',
    ),
    rule(
      'java-db-orderby-index',
      'recommended',
      'order by 的字段顺序要与组合索引一致，否则会走 file_sort。',
      ['db-index-5'],
      SQL_ANYWHERE,
      'MySQL 数据库·索引规约',
    ),
    rule(
      'java-db-implicit-cast',
      'recommended',
      '查询条件里的字面量类型要与字段类型一致，避免隐式转换导致索引失效（如字符串字段传数字）。',
      ['db-index-10'],
      SQL_ANYWHERE,
      'MySQL 数据库·索引规约',
    ),

    // ── SQL 语句 ──────────────────────────────────────────────────────────
    rule(
      'java-sql-count-star',
      'mandatory',
      '统计行数用 count(*)，不要用 count(列名) 或 count(常量)。',
      ['db-sql-1'],
      SQL_ANYWHERE,
      'MySQL 数据库·SQL 语句',
    ),
    rule(
      'java-sql-sum-null',
      'mandatory',
      'sum() 在全列为 NULL 时返回 NULL，接收返回值时要防自动拆箱的空指针。',
      ['db-sql-3'],
      SQL_ANYWHERE,
      'MySQL 数据库·SQL 语句',
    ),
    rule(
      'java-sql-null-check',
      'mandatory',
      '判断字段是否为 NULL 用 ISNULL() 或 IS NULL，不要用 = NULL。',
      ['db-sql-4'],
      SQL_ANYWHERE,
      'MySQL 数据库·SQL 语句',
    ),
    rule(
      'java-sql-pagination-early-return',
      'mandatory',
      '分页查询先 count，为 0 时直接返回空结果，不要再执行后续的列表查询。',
      ['db-sql-5'],
      SQL_ANYWHERE,
      'MySQL 数据库·SQL 语句',
    ),
    rule(
      'java-db-no-foreign-key',
      'mandatory',
      '不使用外键与级联更新/删除，关联关系在应用层维护。',
      ['db-sql-6'],
      SQL_ONLY,
      'MySQL 数据库·SQL 语句',
    ),
    rule(
      'java-db-no-procedure',
      'mandatory',
      '不使用存储过程与触发器，逻辑写在应用层。',
      ['db-sql-7'],
      SQL_ONLY,
      'MySQL 数据库·SQL 语句',
    ),
    rule(
      'java-db-select-before-write',
      'mandatory',
      '数据订正：先 select 确认影响范围，再执行 update/delete；批量删除必须有明确的 where 条件。',
      ['db-sql-8'],
      SQL_ANYWHERE,
      'MySQL 数据库·SQL 语句',
    ),
    rule(
      'java-sql-in-limit',
      'recommended',
      'in 后面的集合元素控制在 1000 个以内；更多时改造为 join 或分批。',
      ['db-sql-9'],
      SQL_ANYWHERE,
      'MySQL 数据库·SQL 语句',
    ),
    rule(
      'java-db-no-truncate',
      'reference',
      '业务代码里不使用 TRUNCATE TABLE：它不进事务、不触发触发器，误用无法回滚。',
      ['db-sql-11'],
      SQL_ANYWHERE,
      'MySQL 数据库·SQL 语句',
    ),

    // ── ORM ───────────────────────────────────────────────────────────────
    rule(
      'java-sql-no-select-star',
      'mandatory',
      '查询必须写明字段列表，不得使用 select *。',
      ['db-orm-1'],
      SQL_ANYWHERE,
      'MySQL 数据库·ORM 映射',
    ),
    rule(
      'java-orm-boolean-mapping',
      'mandatory',
      '数据库是是与否语义的字段用 is_xxx，POJO 里对应属性去掉 is 前缀，在 resultMap 中显式映射。',
      ['db-orm-2'],
      SQL_ANYWHERE,
      'MySQL 数据库·ORM 映射',
    ),
    rule(
      'java-orm-resultmap',
      'mandatory',
      '不要用 resultClass/resultType 让它自动猜字段映射，显式写 resultMap；每张表对应一个明确的映射。',
      ['db-orm-3'],
      SQL_ANYWHERE,
      'MySQL 数据库·ORM 映射',
    ),
    rule(
      'java-mybatis-no-dollar',
      'mandatory',
      'MyBatis 参数一律用 #{}，禁止 ${}——后者是字符串拼接，直接构成 SQL 注入。',
      ['db-orm-4'],
      ['xml', 'java'],
      'MySQL 数据库·ORM 映射',
    ),
    rule(
      'java-orm-no-map-result',
      'mandatory',
      '查询结果必须映射到明确的领域对象，不允许用 HashMap/Hashtable 接收。',
      ['db-orm-6'],
      ['xml', 'java'],
      'MySQL 数据库·ORM 映射',
    ),
    rule(
      'java-db-gmt-modified',
      'mandatory',
      'update 语句必须同时更新 gmt_modified 为当前时间。',
      ['db-orm-7'],
      SQL_ANYWHERE,
      'MySQL 数据库·ORM 映射',
    ),
    rule(
      'java-db-narrow-update',
      'recommended',
      '不要写「传入整个 POJO 就全字段更新」的接口，只更新调用方明确要改的字段。',
      ['db-orm-8'],
      SQL_ANYWHERE,
      'MySQL 数据库·ORM 映射',
    ),
    rule(
      'java-transaction-scope',
      'reference',
      '@Transactional 只加在真正需要原子性的边界上；它会影响并发能力，且加了事务就要想清缓存、消息、检索的回滚。',
      ['db-orm-9'],
      ['java'],
      'MySQL 数据库·ORM 映射',
    ),
  ],
};
