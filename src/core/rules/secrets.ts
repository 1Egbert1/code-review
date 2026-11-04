/**
 * 凭证硬编码检测。
 *
 * **为什么不交给模型判断**：真实 PR 上试过，一行 `const API_TOKEN = 'sk-live-7f3a...'`
 * 摆在文件第 6 行，三个维度跑下来一条都没提——模型把注意力放在调用链和错误处理上了。
 * 而这个问题一旦漏掉，后果是密钥随仓库一起泄露（fork、CI 日志、历史提交都算）。
 *
 * 所以做成确定性规则：正则命中即产出，零模型成本、100% 可复现。
 * 与「签名变化检查」同一类：能用代码判定的，就不要问模型。
 *
 * **只扫新增行。** 删除一行含密钥的代码不该报——那是修好了，不是引入问题。
 * （真要做历史扫描是另一件事，那需要遍历提交历史，不在单次审查范围内。）
 */

import type { ParsedDiff, RawFinding } from '../../contracts/index.js';

/** 一条命中。 */
export interface SecretHit {
  readonly file: string;
  readonly line: number;
  readonly kind: string;
  readonly label: string;
  /** 命中的那一行原文（去掉首尾空白），作为证据 */
  readonly evidence: string;
}

interface SecretPattern {
  readonly kind: string;
  readonly label: string;
  readonly pattern: RegExp;
}

/**
 * 常见凭证格式。
 *
 * 只收「有固定前缀 + 足够长度」的：这类格式误报率低，且覆盖了绝大多数真实事故。
 * 不试图匹配「任意看起来随机的字符串」——那会把哈希值、base64 图片全报出来。
 */
const PATTERNS: readonly SecretPattern[] = [
  {
    kind: 'openai-style',
    label: 'OpenAI / DeepSeek 风格 API key',
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    kind: 'github-fine-grained',
    label: 'GitHub 细粒度令牌',
    pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  },
  {
    kind: 'github-token',
    label: 'GitHub 令牌',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  },
  {
    kind: 'aws-access-key',
    label: 'AWS 访问密钥 ID',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  },
  {
    kind: 'google-api-key',
    label: 'Google API key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/,
  },
  {
    kind: 'slack-token',
    label: 'Slack 令牌',
    pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/,
  },
  {
    kind: 'private-key',
    label: '私钥内容',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/,
  },
  {
    kind: 'jwt',
    label: 'JWT 令牌',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
];

/**
 * 判断命中的是不是占位符。
 *
 * 真实项目里 `sk-your-key-here`、`sk-xxxxxxxxxxxxxxxx` 这类示例很常见，
 * 全报出来会让人立刻关掉这条规则。判据用「不同字符占比」：
 * 真正的密钥是高熵的，占位符往往反复用同一个字符。
 */
function looksLikePlaceholder(raw: string): boolean {
  // 去掉已知前缀，只看随机部分
  const body = raw.replace(/^(sk|gh[pousr]|github_pat|AKIA|ASIA|AIza|xox[baprs]|eyJ)[-_]?/i, '');
  const compact = body.replace(/[-_]/g, '');
  if (compact.length === 0) return true;

  const distinct = new Set(compact).size;
  // 少于 30% 的不同字符，基本可以断定是凑长度的占位
  if (distinct < compact.length * 0.3) return true;

  // 明确写着「填你的密钥」的字样也算占位。
  // 不过滤 example：AWS 官方文档里的 AKIAIOSFODNN7EXAMPLE 被大量项目原样复制，
  // 报出来正好提醒「这是示例值，你得换掉」。
  return /(?:your|placeholder|changeme|dummy|sample|replace[-_]?me)/i.test(compact);
}

/** 扫一遍改动里的新增行。 */
export function scanSecrets(diff: ParsedDiff): SecretHit[] {
  const hits: SecretHit[] = [];

  for (const file of diff.files) {
    if (file.skippedReason !== null) continue;

    for (const line of file.lines) {
      if (line.anchor.kind !== 'added' || line.anchor.newLine === null) continue;

      for (const { kind, label, pattern } of PATTERNS) {
        const match = pattern.exec(line.text);
        if (match === null) continue;
        if (looksLikePlaceholder(match[0])) continue;

        hits.push({
          file: file.path,
          line: line.anchor.newLine,
          kind,
          label,
          evidence: line.text.trim(),
        });
        // 一行只报一次：同一行同时像两种凭证时，报一条足够，不必刷两遍
        break;
      }
    }
  }

  return hits;
}

/**
 * 转成待校验的结论。
 *
 * `confidence = 1`：这是正则匹配，不是判断。置信度在这里没有意义，
 * 但字段要求它，填 1 而不是 1.0 这种写法是为了让下游「规则产出不看置信度」的
 * 逻辑有明确依据可循（见 gate 模块）。
 */
export function secretsToFindings(hits: readonly SecretHit[]): RawFinding[] {
  return hits.map((hit) => ({
    file: hit.file,
    line: hit.line,
    side: 'new',
    severity: 'blocker',
    category: 'secret-exposure',
    title: `源码里硬编码了 ${hit.label}`,
    body: [
      `这一行把凭证直接写进了代码，格式匹配 ${hit.label}。`,
      '',
      '后果：能读到这个仓库的人都能拿到它——包括 fork、CI 日志、以及历史提交。',
      '删掉这一行并不能让它失效，凭证已经在历史里了。',
      '',
      '**处理**：立即到签发方作废并重新生成；新值放环境变量或密钥管理服务，',
      '再把这行改成从环境读取。',
    ].join('\n'),
    evidence: hit.evidence,
    suggestion: '改为从环境变量或密钥管理服务读取，并轮换已经泄露的凭证。',
    confidence: 1,
  }));
}
