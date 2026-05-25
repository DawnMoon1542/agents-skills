---
name: git-smart-commit
description: 分析当前工作目录的 git 变更，自动生成结构化的 commit message，先 dry-run 展示后由用户确认再提交。触发于用户要求"提交代码"、"commit"、"生成 commit message"、"smart commit"等场景。
---

# Git Smart Commit — 智能提交

## 1. 核心流程

```
检查状态 → 分析变更 → 生成 commit message → dry-run 展示 → 用户确认 → 执行提交 → 询问推送
```

在用户确认之前，不执行任何写入操作。所有分析只读。

## 2. 确定变更范围

### 2.1 默认范围

- **当前有任务上下文**（agent 正在执行某个具体任务，如"修复登录超时 Bug"）→ 默认仅纳入与当前任务相关的文件变更，从 `git status --porcelain` 中筛选匹配上下文路径和主题的文件。
- **无任务上下文**（用户只说"提个 commit"，未附带任何工作说明）→ 默认纳入所有已暂存 + 未暂存的变更。

### 2.2 用户显式指定范围

用户可通过以下方式覆盖默认范围：

| 表述示例 | 含义 |
|---------|------|
| "只提交 src/auth 的变更" | 仅纳入匹配 `src/auth*` 路径的文件 |
| "排除测试文件" | 排除 `*.test.ts`、`*.spec.ts`、`tests/` 等文件 |
| "把 .ts 文件和配置文件分开提交" | 按文件类型拆分，分别生成 commit message |
| "把这两个文件一起提交" | 仅纳入用户指定的文件 |

以用户明确指定的范围为准，不额外揣测或扩缩范围。

### 2.3 前置条件

```bash
git status --porcelain
```

判断：

- 无任何变更 → 输出「工作区干净，无需提交」并结束。
- 仅有未跟踪文件 → 提示用户是否需要 `git add`，由用户决定。
- 存在已暂存 + 未暂存变更 → 若未指定范围，默认提交所有已暂存 + 未暂存。若已指定范围，仅提交范围内的文件。

### 2.4 分支与远端状态

```bash
git branch --show-current
git status -sb
```

在 dry-run 展示中附上当前分支名称。

## 3. 分析变更内容

### 3.1 变更概览

根据第 2 节确定的范围，对所纳入文件分情况获取 diff：

```bash
git diff --cached -- <范围文件>     # 范围内已暂存的变更
git diff -- <范围文件>              # 范围内未暂存的变更
git diff HEAD -- <范围文件>         # 新文件尚未暂存时，用 HEAD 比较
```

对于范围外的变更，仅展示文件清单（`git status` 筛选），不纳入分析。

### 3.2 变更归类

扫描 diff 内容，对每个文件的变更进行归类：

| 类别 | 判定依据 |
|------|---------|
| 新增文件 | 全新文件，非已有文件的重命名/移动 |
| 删除文件 | 删除已有文件 |
| 重命名 | 相似内容的新旧文件名 |
| 功能变更 | 新增函数/方法、新增逻辑、新增 API 端点 |
| 修复 | 条件修正、边界处理、异常捕获、逻辑错误修正 |
| 重构 | 变量重命名、提取函数、结构调整（行为不变） |
| 样式 | CSS/样式文件变更、UI 调整 |
| 配置 | package.json、tsconfig、.env、CI 配置等 |
| 依赖 | `pnpm add`/`uv add` 产生的锁文件和 package.json 变更 |
| 文档 | .md、注释大量变更、README 更新 |
| 测试 | test/ 或 spec/ 目录、pytest/vi test 相关文件 |
| 删除代码 | 仅删除不再需要的代码 |
| 批量 | 超过 10 个文件的同类型机械变更 |

### 3.3 关键变更识别

从 diff 中提取以下信息：

- 修改的文件列表及每个文件的核心变更目的
- 新增/删除的函数或方法名称
- 明显的 bug 修复（错误条件修正、异常处理添加）
- 新增的功能模块

## 4. 生成 Commit Message

### 4.1 格式

```
<英文类型>: <中文简述,50字以内>

<中文正文：描述本次变更的具体内容，按文件/模块逐条列出>
```

类型选择规则：

| 类型 | 使用场景 |
|------|---------|
| `feat` | 新增功能、模块、能力、页面 |
| `fix` | 修复 bug、错误行为 |
| `refactor` | 结构调整、代码整理（行为不变） |
| `test` | 新增或修改测试 |
| `chore` | 配置、依赖、构建、工具链变更 |
| `docs` | 文档变更 |
| `style` | 样式/ui变更 |

如果一次提交混合了多种类型，选择占比最大的；如果两种类型占比接近，优先 feat > fix > refactor > 其他。

### 4.2 正文规范

- 正文每行一个独立变更点，便于回顾。
- 以「文件路径名：具体变更描述」格式逐条列出。
- 删除代码的文件标注为「移除」。
- 描述变更的结果而非过程。

正文范例：

```
- src/protocol/message.ts：新增 MessageTurn 接口和 mergeTurnSteps 工具函数
- src/renderer/index.ts：deriveRenderableContent 增加 ID 去重逻辑
- tests/protocol/message.test.ts：补充 mergeTurnSteps 边界用例
```

### 4.3 基本原则

- 简述写变更的结果，不写变更的过程。
- 正文列文件级变更，不逐行复述 diff。
- 一条 commit 覆盖一组逻辑相关的变更；若变更之间无关联，提示用户分开提交。

## 5. Dry-Run 展示

向用户展示以下内容，不执行任何 git 操作：

```
=== Git Smart Commit - Dry Run ===

分支：<当前分支名>
范围：<范围说明，如"当前任务相关文件 3 个"或"所有变更 12 个文件"或"排除测试文件后 5 个文件">
待提交文件数：N

范围外未纳入文件（如有）：
  ?? path/to/outside.ts

Commit Message：
---
<英文类型>: <中文简述>

<中文正文>
---

[按 Y 确认提交 / 按 N 取消 / 按 E 修改 commit message]
```

### 5.1 用户确认

使用 `AskUserQuestions` 工具询问用户，提供三个选项：

- `confirm` — 确认提交，执行 git commit
- `cancel` — 取消，不做任何操作
- `edit` — 用户提供修改后的 commit message，用用户提供的版本提交

### 5.2 修改响应

若用户选择 edit，记录用户提供的文本，后续步骤使用用户版本提交。

## 6. 执行提交

用户确认后，先将范围内的文件加入暂存区，再提交：

```bash
git add <范围文件列表>
git commit -m "<类型>: <简述>" -m "<正文>"
```

提交完成后展示结果：

```
已提交至分支 <branch>：<commit hash 前7位>
```

### 6.1 询问是否推送

提交成功后，使用 `AskUserQuestions` 询问用户是否推送到远端：

- `push` — 执行 `git push`
- `skip` — 不推送，结束流程

### 6.2 提交失败处理

| 错误 | 处置 |
|------|------|
| 空 commit | 提示工作区无实际变更，不提交 |
| pre-commit hook 失败 | 展示 hook 输出，等待用户处理 |
| 签名/鉴权失败 | 提示用户配置 git user/credential |

## 7. 完整示例

### 示例 1：混合变更

用户执行 `git smart-commit` 后的 dry-run：

```
=== Git Smart Commit - Dry Run ===

分支：main
范围：当前任务相关文件 4 个
待提交文件数：4

范围外未纳入文件：
  ?? temp/debug.log

变更概览：
  M  src/renderer/index.ts        (+12, -3)  — 去重逻辑
  M  src/protocol/message.ts      (+45, -0)  — 新增接口与工具函数
  M  tests/protocol/message.test.ts (+30, -0)  — 测试用例
  M  tsconfig.json                (+1, -1)   — 路径别名调整

Commit Message：
---
feat: 消息合并去重，新增 MessageTurn 接口与 mergeTurnSteps

- src/protocol/message.ts：新增 MessageTurn 接口和 mergeTurnSteps 工具函数
- src/renderer/index.ts：deriveRenderableContent 增加按 ID 去重逻辑
- tests/protocol/message.test.ts：补充 mergeTurnSteps 正常与边界测试用例
- tsconfig.json：新增 @protocol 路径别名
---
```

### 示例 2：仅修复

```
=== Git Smart Commit - Dry Run ===

分支：fix/login-timeout
范围：当前任务相关文件 1 个
待提交文件数：1

Commit Message：
---
fix: 修复登录超时不显示错误提示

- src/services/auth.ts：catch 块中增加错误信息返回逻辑
---
```

## 8. 与其他技能的协作

- 与 `continuously-work` 配合：持续执行期间频繁自动提交，任务完成后使用本技能做最终审查提交。
- 与 `code-review` 配合：code-review 完成后，使用本技能将审查修正作为一个整体提交。
- 与 `subagent-driven-development` 配合：子代理返回变更后，使用本技能统一提交。

## 9. 禁止模式

- 在执行 dry-run 之前直接执行 commit。
- 跳过 `git diff` 分析，仅凭文件名生成 commit message。
- 在一个 commit 中混合多个无关的变更主题。
- 提交空的 commit message。
- 在用户确认前执行任何写操作。
