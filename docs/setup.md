# 接入与首次运行

本文只做一件事：让你在一个真实 PR 上把审查链路跑通一次。全程只读，**不会在仓库里留下任何痕迹**。

需要两样东西：一个 GitHub 只读令牌、一个模型 API key。都设成环境变量，不写进配置文件。

---

## 第 1 步：获取 GitHub Token

### 打开创建页面

浏览器访问 <https://github.com/settings/tokens>

如果地址失效，按路径找：右上角头像 → **Settings** → 左侧最下 **Developer settings** → **Personal access tokens**。

### 选择令牌类型

页面上有两种，选 **Fine-grained tokens**（细粒度），点 **Generate new token**。

> 为什么不选 Classic：Classic 的 `repo` 权限是**整个私有仓库的读写全权**，对只读场景过重。Fine-grained 可以精确到「某个仓库的某两类数据只读」。

### 填写表单

| 字段              | 填什么                                              |
| ----------------- | --------------------------------------------------- |
| Token name        | `ai-review-dryrun`（随意，能认出用途即可）          |
| Expiration        | 7 days（跑通就删，别设永久）                        |
| Repository access | **Only select repositories** → 选中你要试的那个仓库 |

在 **Permissions** → **Repository permissions** 里，只开这三项：

| 权限              | 设为      | 用途                                    |
| ----------------- | --------- | --------------------------------------- |
| **Contents**      | Read-only | 读文件内容（构建上下文要用）            |
| **Pull requests** | Read-only | 读 PR 信息、改动文本、已有行内评论      |
| **Issues**        | Read-only | 读汇总评论（摘要存在 issue comment 里） |
| Metadata          | Read-only | 自动带上，不可取消                      |

其余全部保持 **No access**。点 **Generate token**。

### 保存

页面会显示 `github_pat_xxxxxxxx`。**只显示这一次**，关掉就再也看不到，只能重新生成。

### 验证拿到了

在 Git Bash 里执行（把 `github_pat_xxx` 换成你的）：

```bash
curl -s -H "Authorization: Bearer github_pat_xxx" https://api.github.com/user | head -3
```

返回里能看到 `"login": "你的用户名"` 就对了。返回 `Bad credentials` 说明复制时带了空格或漏了字符。

---

## 第 2 步：获取模型 API Key

### 注册与创建

访问 <https://platform.deepseek.com/api_keys>，登录后在 **API keys** 页点创建，复制 `sk-xxxxxxxx`。

### 充值

DeepSeek 不是免费额度制，账户要有余额才能调用。**充 10 元足够跑几百次**——一次 PR 审查大约 $0.02（约 0.15 元）。

### 核对模型名（重要）

**模型名会变。** 2026-11 核实的情况：

| 项               | 当前值                     |
| ---------------- | -------------------------- |
| Base URL         | `https://api.deepseek.com` |
| 模型名           | `deepseek-flash`           |
| 上下文           | 标称 1M                    |
| 缓存命中输入价   | $0.006 / 100 万 token      |
| 缓存未命中输入价 | $0.3 / 100 万 token        |
| 输出价           | $1.2 / 100 万 token        |

> 已经**不是** `deepseek-chat` 了。接入前请对照 <https://api-docs.deepseek.com/quick_start/pricing> 再确认一遍，价格与模型名都可能调整。

用别的厂商也行，只要是 OpenAI 兼容协议。见文末「换模型」。

---

## 第 3 步：设置环境变量

两个变量：

| 变量名              | 值                         | 说明                            |
| ------------------- | -------------------------- | ------------------------------- |
| `GITHUB_TOKEN`      | 第 1 步的 `github_pat_...` | 配置里 `platform.tokenEnv` 指定 |
| `AI_REVIEW_API_KEY` | 第 2 步的 `sk-...`         | 配置里 `llm.apiKeyEnv` 指定     |

### 方式 A：只在当前 Git Bash 窗口有效（最简单，推荐先用这个）

```bash
export GITHUB_TOKEN='github_pat_xxx'
export AI_REVIEW_API_KEY='sk-xxx'
```

关掉窗口就失效。适合先跑一次试试。

### 方式 B：Windows 用户环境变量（长期有效）

1. `Win + R`，输入 `sysdm.cpl` 回车
2. **高级** 标签 → **环境变量**
3. 上半部分「用户变量」→ **新建**
4. 变量名填 `GITHUB_TOKEN`，变量值粘贴令牌，确定
5. 重复一次，建 `AI_REVIEW_API_KEY`

**建完必须重开终端**，已有的窗口读不到新变量。

### 方式 C：PowerShell 当前会话

```powershell
$env:GITHUB_TOKEN = "github_pat_xxx"
$env:AI_REVIEW_API_KEY = "sk-xxx"
```

### 不要做的事

**不要把令牌写进 `.ai-review.yml`。** 那个文件要进版本库，令牌一进去就得作废。

---

## 第 4 步：跑 dry-run

### 先确认配置能读

```bash
cd F:/个人项目/ai-review
node dist/cli.js cost --files 10 --lines 400
```

正常会打印预估调用次数与费用。如果这里就报错，先别急着跑，看文末「常见错误」。

### 执行

```bash
node dist/cli.js dry-run --repo owner/repo --pr 123
```

- `owner/repo`：仓库全名，从浏览器地址栏复制，如 `1Egbert1/code-review`
- `123`：PR 编号，在 PR 页面标题后面（`#123` 里的数字）

**dry-run 只打印，不创建评论、不改状态、不发检查运行。** 仓库那边看不到任何变化。

### 换一个更保险的试法

如果想先用公开仓库试，找你关注的任一开源项目的某个 PR，只读公开仓库的令牌风险更低。

---

## 第 5 步：跑完看四个数字

命令结束时会打印统计。重点看这四组：

| 看什么           | 健康的样子               | 不正常说明什么                                |
| ---------------- | ------------------------ | --------------------------------------------- |
| **缓存读**       | 大于 0                   | 一直是 0 = 每轮都在重建缓存，输入成本差 50 倍 |
| **定位来源分布** | 大部分是「行号」         | 大量落到「证据反查」= 模型写的行号不可靠      |
| **丢弃原因**     | 少量 `evidence-mismatch` | 大量丢弃 = 模型在编造代码，提示词要改         |
| **费用**         | 单 PR 约 $0.01~0.03      | 明显更高 = 上下文塞多了，或缓存没命中         |

---

## 常见错误对照

| 报错                          | 原因                                      | 处理                                               |
| ----------------------------- | ----------------------------------------- | -------------------------------------------------- |
| `缺少仓库`                    | 没传 `--repo`                             | 加上 `--repo owner/repo`                           |
| `配置错误` + 字段路径         | `.ai-review.yml` 里有不认识的键或类型不对 | 按提示的路径改；不确定就删掉那几行用默认值         |
| `Bad credentials` / 401       | GitHub 令牌错、过期，或没勾对应仓库权限   | 重新生成，确认 Contents 与 Pull requests 都是 Read |
| `404` 且令牌没问题            | 令牌的 repository access 没选中这个仓库   | 回到令牌设置补选仓库                               |
| 模型返回 401                  | key 错或没余额                            | 去控制台看余额                                     |
| 模型返回 404                  | base URL 或模型名不对                     | 对照官方文档确认，模型名改得很快                   |
| `不支持 response_format` 相关 | 模型不支持结构化输出                      | 会自动降级，属正常；日志里能看到降级过程           |

---

## 换模型

改 `.ai-review.yml` 的 `llm` 段。任何 OpenAI 兼容服务都行：

```yaml
llm:
  baseUrl: https://api.openai.com/v1
  model: gpt-4o-mini
  apiKeyEnv: OPENAI_API_KEY
  contextWindow: 128000
```

内置预设见 `src/providers/presets.ts`：`deepseek`、`openai`、`compatible`（任意兼容网关）、`ollama`（本地）。

### 关于缓存

带提示词缓存的厂商（DeepSeek 自动缓存、Anthropic 显式标记、OpenAI 自动缓存）能把重复的输入前缀费用降到几十分之一。

**这个工具默认把不变的部分放在提示词前面**，所以缓存命中率应该很高。如果统计里「缓存读」长期是 0，说明前缀不稳定——通常是注入了时间戳或随机顺序的内容，属于 bug。

单价必须自己填 `llm.pricing`。不填的时候费用显示为无法折算（`null`），**不会显示成 0**——「不知道」和「免费」是两件事。
