# 接入指南

两条路径，用途不同：

| 路径                    | 用在哪                       | 谁来配                                    |
| ----------------------- | ---------------------------- | ----------------------------------------- |
| **A. 接进仓库**（推荐） | 真实项目，PR 一推就自动审    | 仓库管理员配一次 Secret，之后所有人不用管 |
| **B. 本地跑一次**       | 调提示词、复现问题、验证改动 | 只有调试的人在自己机器上配                |

真实项目一律走 A。让每个开发者在自己电脑上配 key 不现实，也没法保证一致。

---

# 路径 A：接进仓库

全程只做一次。密钥存在仓库的 Secrets 里，不进代码、不进日志。

## A1. 建 Secret

进入**要接入的那个仓库**，依次点：

**Settings** → 左侧 **Secrets and variables** → **Actions** → **New repository secret**

| 字段   | 填什么                               |
| ------ | ------------------------------------ |
| Name   | `AI_REVIEW_API_KEY`                  |
| Secret | 模型服务的 key，见文末「模型与密钥」 |

名字必须与 `.ai-review.yml` 里的 `llm.apiKeyEnv` 一致，默认就是 `AI_REVIEW_API_KEY`。

**你不需要另外建 GitHub 令牌。** Action 自动使用仓库内置的 `GITHUB_TOKEN`，权限由 workflow 里的 `permissions:` 决定。

### 多仓库共用同一个 key

**组织 Settings** → Secrets and variables → Actions → New organization secret，建好后在 _Repository access_ 里选允许使用的仓库。

仓库级与组织级同名时，仓库级优先，可以用这个机制单独覆盖某个仓库的 key。

## A2. 放入 workflow 文件

把本仓库的 `.github/workflows/review.yml` 复制到**目标仓库**的同一路径。

唯一需要改的是引用地址：把 `uses: 1Egbert1/code-review@main` 换成你自己的部署位置。

> 生产环境建议 pin 到 commit SHA（`@a1b2c3d`）而不是 `@main`。指向分支意味着上游一改，
> 你的仓库下次 PR 就执行新代码——对一个有写权限的 Action 来说，这等于把仓库交出去。

可选：在目标仓库根目录放一份 `.ai-review.yml` 覆盖默认配置。不放也能跑。

## A3. 先手动跑一次 dry-run

workflow 里已经写好：手动触发默认走 `dry-run`，只打印不写。

1. 进入仓库的 **Actions** 页
2. 左侧选 **AI 代码审查**
3. 右上 **Run workflow** → 填一个**已存在**的 PR 编号 → mode 保持 `dry-run` → 运行
4. 跑完点进这次运行看日志

日志里重点看四行（见文末「跑完看什么」）。确认结论合理、没有大量误报，再往下走。

## A4. 切到自动审查

`pull_request_target` 已经覆盖了 PR 打开、更新、草稿转正式三种时机。之后不用再手动触发。

---

## 三个必须知道的坑

### 坑一：`pull_request_target` 到底要不要用

| 事件                  | fork 的 PR 能用 Secret 吗                   | 适用                       |
| --------------------- | ------------------------------------------- | -------------------------- |
| `pull_request`        | **不能**（GitHub 不给 fork 的代码提供密钥） | 只有本仓库分支提 PR 时可用 |
| `pull_request_target` | 能                                          | 需要审外部贡献者时用这个   |

开源项目、或仓库有外部协作者提 PR，**必须**用 `pull_request_target`，否则审查会因缺 key 失败。

**它安全的前提只有一条：绝不检出 PR 的代码。** 本 Action 只通过接口读改动文本，从不执行 PR 里的任何东西。一旦有人在 job 里加了指向 PR head 的 `actions/checkout`，就会变成远程代码执行漏洞——那时 `GITHUB_TOKEN` 有写权限、Secret 也在环境里。

### 坑二：workflow 改动要先合并才生效

`pull_request_target` 运行的是**默认分支上的 workflow 文件**，不是 PR 里的那份。

所以新加的 workflow 必须先进 `main`，下一次 PR 才会触发。想在 PR 里改 workflow 顺便测试是行不通的，会看起来像「加了但没跑」。

### 坑三：不声明 permissions 会 403

新仓库的 `GITHUB_TOKEN` 默认只读。发评论时才会暴露成 403，日志看起来像权限问题而不是配置问题。

```yaml
permissions:
  contents: read # 读文件内容
  pull-requests: write # 发与改行内评论
  issues: write # 摘要评论（issue comment）
  checks: write # 门禁写检查运行；不开门禁时用不到
```

只跑 dry-run 的话全部给 `read` 也行——它不写任何东西。

### 另外：连续推送给同一个 PR 会触发多次

`review.yml` 里加了 `concurrency` + `cancel-in-progress`。不加的话两次审查会同时操作同一批评论，出现「删了又建」「同一问题贴两遍」，看起来像程序错乱。

---

# 路径 B：本地跑一次

只在调试时用。密钥走环境变量，**不要写进 `.ai-review.yml`**——那个文件要进版本库。

## B1. 拿 GitHub 只读令牌

访问 <https://github.com/settings/tokens>，选 **Fine-grained tokens** → Generate new token。

| 字段              | 填                                        |
| ----------------- | ----------------------------------------- |
| Token name        | `ai-review-dryrun`                        |
| Expiration        | 7 days                                    |
| Repository access | **Only select repositories** → 选目标仓库 |

Permissions 只开三项，其余保持 No access：

| 权限              | 设为      | 用途                  |
| ----------------- | --------- | --------------------- |
| **Contents**      | Read-only | 读文件内容            |
| **Pull requests** | Read-only | 读 PR、改动、行内评论 |
| **Issues**        | Read-only | 读摘要评论            |

不要选 Classic：`repo` 是整个私有仓库的读写全权，对只读场景过重。

验证（Git Bash）：

```bash
curl -s -H "Authorization: Bearer github_pat_xxx" https://api.github.com/user | head -3
```

看到 `"login": "你的用户名"` 即成功。

## B2. 设环境变量

Git Bash，只在当前窗口有效：

```bash
export GITHUB_TOKEN='github_pat_xxx'
export AI_REVIEW_API_KEY='sk-xxx'
```

要长期有效：`Win+R` → `sysdm.cpl` → 高级 → 环境变量 → 用户变量，新建这两个。**建完必须重开终端**。

## B3. 跑

```bash
cd F:/个人项目/ai-review
node dist/cli.js cost --files 10 --lines 400      # 先确认配置能读
node dist/cli.js dry-run --repo owner/repo --pr 123
```

dry-run 只打印，不创建评论、不改状态，仓库那边看不到任何变化。

---

# 模型与密钥

## 当前核实过的参数

**模型名和价格都会变。** 2026-11 核实的情况：

| 项             | 值                              |
| -------------- | ------------------------------- |
| Base URL       | `https://api.deepseek.com`      |
| 模型名         | `deepseek-flash`                |
| 上下文         | 标称 1M（配置里按 128K 算预算） |
| 缓存命中输入   | $0.006 / 100 万 token           |
| 缓存未命中输入 | $0.3 / 100 万 token             |
| 输出           | $1.2 / 100 万 token             |

> 已经**不是** `deepseek-chat`。接入前对照 <https://api-docs.deepseek.com/quick_start/pricing> 再确认一遍。
> 价格分峰谷：高峰（UTC 01-04、06-10 的工作日）是低峰的两倍，上表取高峰价，属保守估计。

## 缓存：最值得盯的一项

缓存命中与未命中的输入价差 **50 倍**（0.006 vs 0.3）。

本工具默认把不变的内容（系统提示词、规则块、仓库约定）放在提示词最前面，就是为了吃这个折扣。跑完看统计里的「缓存读」：

- 有值 → 前缀稳定，折扣拿到了
- **一直是 0 → 前缀不稳定，每轮都在重建，钱白花**，这是 bug

## 换模型

改 `.ai-review.yml` 的 `llm` 段，任何 OpenAI 兼容服务都行：

```yaml
llm:
  baseUrl: https://api.openai.com/v1
  model: gpt-4o-mini
  apiKeyEnv: OPENAI_API_KEY
  contextWindow: 128000
  pricing:
    inputPerMTok: 0.15
    outputPerMTok: 0.6
    cacheWriteShortMultiplier: 0
    cacheWriteLongMultiplier: 0
    cacheReadMultiplier: 0.5
```

改了 `apiKeyEnv` 就要在仓库里建**同名**的 Secret。

内置预设见 `src/providers/presets.ts`：`deepseek`、`openai`、`compatible`（任意兼容网关）、`ollama`（本地）。

**单价必须自己填。** 不填时费用显示为「无法折算」（`null`），不会显示成 0——「不知道」和「免费」是两件事。

---

# 跑完看什么

| 看什么       | 健康的样子               | 不正常说明什么                            |
| ------------ | ------------------------ | ----------------------------------------- |
| 缓存读       | 大于 0                   | 一直是 0 = 每轮重建缓存，输入成本差 50 倍 |
| 定位来源分布 | 大部分是「行号」         | 大量落「证据反查」= 模型写的行号不可靠    |
| 丢弃原因     | 少量 `evidence-mismatch` | 大量丢弃 = 模型在编造代码，提示词要改     |
| 费用         | 单 PR 约 $0.01~0.03      | 明显更高 = 上下文塞多了，或缓存没命中     |

---

# 常见错误对照

| 现象                           | 原因                                                   | 处理                                     |
| ------------------------------ | ------------------------------------------------------ | ---------------------------------------- |
| workflow 加了但没跑            | `pull_request_target` 只认默认分支上的 workflow 文件   | 先把 workflow 合并进 `main`              |
| `缺少 AI_REVIEW_API_KEY`       | Secret 没建，或名字与 `llm.apiKeyEnv` 不一致           | 按配置里的名字建                         |
| 发评论 403                     | `permissions` 没声明                                   | 加 `pull-requests: write`                |
| 取数 404                       | `GITHUB_TOKEN` 权限不足（fork PR 用了 `pull_request`） | 改用 `pull_request_target`               |
| 模型 401                       | key 错或没余额                                         | 去控制台看余额                           |
| 模型 404                       | base URL 或模型名不对                                  | 对照官方文档，模型名改得很快             |
| `缺少仓库`                     | 没传 `--repo`（本地跑）                                | 加上 `--repo owner/repo`                 |
| `配置错误` + 字段路径          | `.ai-review.yml` 有未知键或类型不对                    | 按提示改，不确定就删掉那几行用默认值     |
| 提示「不支持 response_format」 | 模型不支持结构化输出                                   | 会自动降级，属正常，日志里能看到降级过程 |
