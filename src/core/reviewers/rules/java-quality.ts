/**
 * 异常、日志、单元测试与安全的补充规则。
 *
 * 这四类原先各有几条基础规则写着，这里补的是手册里那些**能落成判定条件**的条目。
 * 判断标准同前：写成规则就要能被一条代码事实证伪，否则归入「需人工判断」。
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
  clause: readonly string[],
  basis: string,
): RuleEntry {
  return {
    id,
    level,
    dimension,
    title: instruction.slice(0, 30),
    instruction,
    languages: ['java'],
    clauses: clause,
    source: { ...SOURCE, basis: `${BASIS_PREFIX} ${basis}` },
  };
}

export const JAVA_QUALITY_RULES: RuleLibrary = {
  entries: [
    // ── 异常补充 ──────────────────────────────────────────────────────────
    rule(
      'java-precheck-not-catch',
      'mandatory',
      'exception-log',
      '能用前置检查规避的运行时异常（空指针、数组越界、类型转换）就用检查规避，不要靠 catch 兜住。',
      ['exc-1'],
      '异常日志·异常处理',
    ),
    rule(
      'java-transaction-rollback',
      'mandatory',
      'exception-log',
      '事务方法里 catch 住异常后如果仍需回滚，必须显式标记回滚（rollbackFor 或手动回滚），否则事务会照常提交。',
      ['exc-5'],
      '异常日志·异常处理',
    ),
    rule(
      'java-finally-close-resource',
      'mandatory',
      'exception-log',
      '资源必须在 finally 中关闭（或用 try-with-resources），且关闭动作本身也要防异常。',
      ['exc-6'],
      '异常日志·异常处理',
    ),
    rule(
      'java-catch-type-match',
      'mandatory',
      'exception-log',
      '捕获的异常类型必须与可能抛出的类型匹配，或者是它的父类；捕一个从不抛出的类型说明判断错了。',
      ['exc-8'],
      '异常日志·异常处理',
    ),
    rule(
      'java-null-return-doc',
      'recommended',
      'exception-log',
      '方法可能返回 null 时必须在 Javadoc 里写明，让调用方知道要做非空判断。',
      ['exc-9'],
      '异常日志·异常处理',
    ),
    rule(
      'java-unboxing-npe',
      'recommended',
      'exception-log',
      '基本类型接收包装类型的返回值时会自动拆箱，值为 null 就抛空指针；接口返回值、数据库查询结果尤其要注意。',
      ['exc-10'],
      '异常日志·异常处理',
    ),
    rule(
      'java-specific-exception',
      'recommended',
      'exception-log',
      '抛异常要用有业务含义的自定义异常；不要直接 new RuntimeException()，更不要抛 Exception 或 Throwable。',
      ['exc-11'],
      '异常日志·异常处理',
    ),

    // ── 日志补充 ──────────────────────────────────────────────────────────
    rule(
      'java-log-slf4j-facade',
      'mandatory',
      'exception-log',
      '只用 SLF4J 的 API（LoggerFactory.getLogger），不直接依赖 Log4j/Logback 的实现类——换实现时才不用改代码。',
      ['log-1'],
      '异常日志·日志规约',
    ),

    // ── 单元测试补充 ──────────────────────────────────────────────────────
    rule(
      'java-test-no-print',
      'mandatory',
      'unit-test',
      '测试结果必须靠断言表达，不允许用 System.out 打印后人工比对——那样的测试无法自动化执行。',
      ['test-2'],
      '单元测试·AIR 原则',
    ),
    rule(
      'java-test-independent',
      'mandatory',
      'unit-test',
      '用例之间不得相互调用，也不得依赖执行顺序；每个用例自己准备数据、自己收尾。',
      ['test-3'],
      '单元测试·AIR 原则',
    ),
    rule(
      'java-test-no-external',
      'mandatory',
      'unit-test',
      '用例要能重复执行：不依赖固定时钟、不依赖外部服务可用、不依赖上一次运行留下的数据。',
      ['test-4'],
      '单元测试·AIR 原则',
    ),
    rule(
      'java-test-tx-rollback',
      'recommended',
      'unit-test',
      '涉及数据库的用例加事务回滚（@Transactional + @Rollback），或给测试数据加统一前后缀，避免脏数据。',
      ['test-11'],
      '单元测试·数据库相关',
    ),

    // ── 安全补充 ──────────────────────────────────────────────────────────
    rule(
      'java-xss-escape',
      'mandatory',
      'security',
      '输出到页面的用户数据必须转义；模板引擎的默认转义不要关，富文本场景用白名单过滤而不是整体放行。',
      ['sec-5'],
      '安全规约',
    ),
    rule(
      'java-replay-protection',
      'mandatory',
      'security',
      '涉及短信、邮件、支付、下单等平台资源的写操作，必须做防重放：幂等键、频次限制或验证码，缺一不可。',
      ['sec-7'],
      '安全规约',
    ),
    rule(
      'java-ugc-risk-control',
      'recommended',
      'security',
      '用户生成内容（发帖、评论、私信）要走防刷与内容风控（频次限制、违禁词过滤、人工审核兜底）。',
      ['sec-8'],
      '安全规约',
    ),
  ],
};
