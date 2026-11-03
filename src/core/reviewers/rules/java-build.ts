/**
 * 工程结构与依赖规约（对应手册第六部分 18 条，落成 13 条规则）。
 *
 * 载体判断：这些规则的判断对象大多是 `pom.xml`，少数作用于 Java 源码（分层依赖、DAO 异常包装）。
 * 所以语言限定分三类写，不用 `*`——`*` 会让它们出现在 .ts、.py 文件上，白占名额。
 *
 * 关于 JVM 参数两条（HeapDumpOnOutOfMemoryError、Xms=Xmx）：它们最常见的落地位置是
 * `pom.xml` 里打包插件的 `<jvmArguments>` 或 `<argLine>`，所以限定 `xml`。
 * 写成 .sh 启动脚本的情况本工具看不到——那属于部署产物，不是源码。
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
  languages: readonly string[],
  basis: string,
): RuleEntry {
  return {
    id,
    level,
    dimension,
    title: instruction.slice(0, 30),
    instruction,
    languages,
    clauses: clause,
    source: { ...SOURCE, basis: `${BASIS_PREFIX} ${basis}` },
  };
}

export const JAVA_BUILD_RULES: RuleLibrary = {
  entries: [
    // ── 应用分层 ──────────────────────────────────────────────────────────
    rule(
      'java-dao-exception-wrap',
      'reference',
      'architecture',
      'DAO 层把底层异常统一包装成自定义异常再上抛，且不在这里打日志——日志由更上层在拿到完整上下文后打一次。',
      ['eng-layer-2'],
      ['java'],
      '工程结构·应用分层',
    ),
    rule(
      'java-domain-model-naming',
      'reference',
      'architecture',
      '领域模型按职责分开：DO 对应表结构、DTO 用于跨层传输、VO 用于展示，不要把三者合成一个类。',
      ['eng-layer-3'],
      ['java'],
      '工程结构·应用分层',
    ),

    // ── 二方库依赖 ────────────────────────────────────────────────────────
    rule(
      'java-gav-format',
      'mandatory',
      'architecture',
      'GroupID 按 com.{公司}.{业务线}[.{子业务线}] 组织，最多四级；ArtifactID 用产品线名。',
      ['eng-lib-1'],
      ['xml'],
      '工程结构·二方库依赖',
    ),
    rule(
      'java-semver-format',
      'mandatory',
      'architecture',
      '二方库版本号用「主.次.修订」三段式：主版本对应不兼容改动，次版本对应兼容的新功能，修订对应兼容的问题修复。',
      ['eng-lib-2'],
      ['xml'],
      '工程结构·二方库依赖',
    ),
    rule(
      'java-api-no-enum-return',
      'mandatory',
      'architecture',
      '二方库对外接口的返回值不使用枚举类型（也不放在返回的 POJO 里）：调用方升级不同步时无法反序列化。',
      ['eng-lib-5'],
      ['java'],
      '工程结构·二方库依赖',
    ),
    rule(
      'java-duplicate-artifact-version',
      'mandatory',
      'architecture',
      '同一个 GroupId + ArtifactId 在同一份 pom 里不得声明两个不同版本，靠 dependencyManagement 统一。',
      ['eng-lib-7'],
      ['xml'],
      '工程结构·二方库依赖',
    ),
    rule(
      'java-pom-dependency-blocks',
      'recommended',
      'architecture',
      '依赖声明放 <dependencies>，版本统一放 <dependencyManagement>，两者不要混写。',
      ['eng-lib-8'],
      ['xml'],
      '工程结构·二方库依赖',
    ),

    // ── 服务器 ────────────────────────────────────────────────────────────
    rule(
      'java-jvm-heapdump',
      'recommended',
      'architecture',
      'JVM 启动参数加 -XX:+HeapDumpOnOutOfMemoryError 并指定 dump 路径，否则 OOM 现场直接丢失。',
      ['eng-server-3'],
      ['xml'],
      '工程结构·服务器',
    ),
    rule(
      'java-jvm-heap-fixed',
      'recommended',
      'architecture',
      '线上环境 -Xms 与 -Xmx 设成相同值，避免堆伸缩带来的额外 GC 压力。',
      ['eng-server-4'],
      ['xml'],
      '工程结构·服务器',
    ),
    rule(
      'java-redirect-internal',
      'reference',
      'architecture',
      '服务器内部跳转用 forward，外部地址用统一的 URL 拼装工具生成，不要手写字符串拼接。',
      ['eng-server-5'],
      ['java'],
      '工程结构·服务器',
    ),
  ],
};
