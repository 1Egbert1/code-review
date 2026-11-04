# 接入指南

两条路径，用途不同：

| 路径                    | 用在哪                       | 谁来配                                    |
| ----------------------- | ---------------------------- | ----------------------------------------- |
| **A. 接进仓库**（推荐） | 真实项目，PR 一推就自动审    | 仓库管理员配一次 Secret，之后所有人不用管 |
| **B. 本地跑一次**       | 调提示词、复现问题、验证改动 | 只有调试的人在自己机器上配                |

真实项目一律走 A。让每个开发者在自己电脑上配 key 不现实，也没法保证一致。

---

# 路径 A：接进仓库

全程在 GitHub 网页上点，不需要命令行。只做一次。

## 先分清两个概念

GitHub 提供两种「环境变量」，用途不同，**放错了就等于把密钥明文公开**：

|                    | **Secrets**            | **Variables**    |
| ------------------ | ---------------------- | ---------------- |
| 存储方式           | 加密                   | 明文             |
| 日志里能否看到     | 看不到，自动显示 `***` | 能看到           |
| 建完之后能否再查看 | 不能，只能覆盖         | 能               |
| 适合放什么         | 令牌、API key          | 开关、模式、阈值 |

**API key 必须放 Secrets。** 放进 Variables 等于把密钥明文写在仓库设置里，任何能看仓库设置的人都读得到。

下文的操作都在这里：仓库页 → **Settings** → 左侧 **Secrets and variables** → **Actions**。

---

## 第 1 步：建 Secret（放模型 key）

**Settings** → **Secrets and variables** → **Actions** → 右侧 **Secrets** 标签 → **New repository secret**

| 字段   | 填什么                                           |
| ------ | ------------------------------------------------ |
| Name   | `AI_REVIEW_API_KEY`                              |
| Secret | 模型服务的 key（`sk-...`），见文末「模型与密钥」 |

点 **Add secret**。

名字必须与 `.ai-review.yml` 里的 `llm.apiKeyEnv` 一致，默认就是 `AI_REVIEW_API_KEY`。改过配置就按配置里的名字建。

> 建完之后页面上不会再显示这个值，只能覆盖。这是正常的——Secret 就是设计成不可回读的。

**不需要另建 GitHub 令牌。** Action 自动使用仓库内置的 `GITHUB_TOKEN`，权限由 workflow 里的 `permissions:` 控制。

### 多仓库共用

**组织 Settings** → Secrets and variables → Actions → New organization secret，然后在 _Repository access_ 里勾选允许使用的仓库。

仓库级与组织级同名时仓库级优先，可以用它单独覆盖某个仓库的 key。

---

## 第 2 步：确认 workflow 已就位

打开 <https://github.com/1Egbert1/code-review/blob/main/.github/workflows/review.yml>，能看到内容就说明它在默认分支上。

这一步不能跳。`pull_request_target` **只运行默认分支上的 workflow 文件**，PR 里带的那份不会生效——所以文件必须先合并进 `main`。

要接入的是别的仓库：把这个文件复制过去，把 `uses: 1Egbert1/code-review@main` 换成你的部署位置。生产环境建议 pin 到 commit SHA 而不是 `@main`。

---

## 第 3 步：建一个测试 PR

仓库现在没有任何 PR，得先有一个才能验证。

1. 打开仓库首页，随便点进一个文件（比如 `README.md`）
2. 右上角**铅笔图标**（Edit this file）
3. 在末尾加一行字，什么都行
4. 下方选 **Create a new branch for this commit and start a pull request**，分支名填 `test/first-review`
5. 点 **Propose changes** → 再点 **Create pull request**

PR 一创建，**审查就会自动开始**。

**这时跑的仍然是 dry-run**（默认模式），只打印不写，PR 上不会出现任何评论。这是有意的：让「产生副作用」成为一个需要显式开启的动作。

---

## 第 4 步：看这次运行的结果

1. 进仓库的 **Actions** 页
2. 左侧选 **AI 代码审查**，最上面那条就是刚才触发的
3. 点进去，展开 `Run 1Egbert1/code-review@main` 这一步，看日志

正常的话，日志里会打印审查过程与统计。重点看四行（见文末「跑完看什么」）。

如果只看到一句红色报错，对照文末「常见错误」——最可能是 Secret 名字不对，或者没建。

---

## 第 5 步：满意后再开启真发评论

确认 dry-run 的结论可以接受，才让它往 PR 上写东西。

**Settings** → **Secrets and variables** → **Actions** → **Variables** 标签 → **New repository variable**

| 字段  | 填什么     |
| ----- | ---------- |
| Name  | `ACR_MODE` |
| Value | `review`   |

建完之后，新的 PR 就会真发评论了。已经跑过的那条不会自动重跑，可以去 Actions 页点 **Re-run all jobs**。

想退回只打印：把 `ACR_MODE` 改成 `dry-run`，或者直接删掉这个变量（删掉就是默认的 dry-run）。

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

`pull_request_target` 运行的是**默认分支上的 workflow 文件**。新加的 workflow 必须先进 `main`，下一次 PR 才会触发。在 PR 里改 workflow 顺便测试行不通，会看起来像「加了但没跑」。

### 坑三：不声明 permissions 会 403

新仓库的 `GITHUB_TOKEN` 默认只读。发评论时才会暴露成 403，日志看起来像权限问题而不是配置问题。

```yaml
permissions:
  contents: read # 读文件内容
  pull-requests: write # 发与改行内评论
  issues: write # 摘要评论（issue comment）
  checks: write # 门禁写检查运行；不开门禁时用不到
```

### 另外：连续推送会触发多次

`review.yml` 里加了 `concurrency` + `cancel-in-progress`。不加的话两次审查会同时操作同一批评论，出现「删了又建」「同一问题贴两遍」，看起来像程序错乱。

---

# 本地跑评测（改提示词前后对比）

评测是唯一能回答「这次改动是变好还是变差」的东西。不需要 PR、不需要平台令牌，只要模型 key。

```bash
# 1. 跑一次，存成基准
AI_REVIEW_API_KEY='sk-...' node dist/cli.js eval --dataset evals/dataset.json --out evals/base.json --label before

# 2. 改提示词 / 改规则

# 3. 再跑一次
AI_REVIEW_API_KEY='sk-...' node dist/cli.js eval --dataset evals/dataset.json --out evals/after.json --label after

# 4. 对比
node dist/cli.js eval --baseline evals/base.json --current evals/after.json
```

成本参考：4 个样本 × 2 轮 × 2 个维度 ≈ $0.006 一轮。

**看结果时的三条**：

| 现象                   | 说明                                                 |
| ---------------------- | ---------------------------------------------------- |
| 召回涨、标注命中率跌   | 开始报更多问题，新增的可能是真的（未标注），要看明细 |
| 复现率低于 80%         | 模型输出不稳，单次分数不可信，别据此下结论           |
| 「多余」里有同位置重复 | 同一处被两个维度各说一遍，是冗余不是错误             |

详细口径见规格书 21.7。

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
