---
name: git-smart-squash
description: 将指定范围内的多个 commits 通过 rebase squash 合并为一个 commit 并重写 message。先 dry-run 展示后由用户确认再执行。触发于用户要求"squash commits"、"合并提交"、"压缩提交"、"smart squash"等场景。
---

# Git Smart Squash — 智能压缩提交

## 1. 核心流程

```
确定范围 → 列出 commits → 分析变更 → 生成新 commit message → dry-run 展示 → 用户确认 → 执行 squash → 展示结果
```

在用户确认之前，不执行任何写入操作。所有分析只读。

## 2. 确定 Commit 范围

### 2.1 用户指定两个 hash

用户提供 `<older_hash>` 和 `<newer_hash>`，将这两个 hash（含）之间的所有 commits 合并为一个。

验证步骤：

```bash
git log --oneline <older_hash>^..<newer_hash>
```

确认两个 hash 均存在于当前分支，且 older_hash 是 newer_hash 的祖先。

### 2.2 用户未指定 hash

从当前对话的上下文中提取本次会话所提交的所有 commit hash。

规则：

- 仅操作当前对话中由 agent 执行 `git commit` 产生的 commits。
- 不操作对话开始前已存在的 commits。
- 不操作非当前对话提交的 commits。
- 若当前对话仅产生 1 个或 0 个 commit，提示无需 squash 并结束。

从对话上下文中收集 commit hash 后，确定最老和最新的 hash，等价于用户指定了这两个 hash。

### 2.3 前置条件检查

```bash
git status --porcelain
```

- 工作区存在未提交变更 → 提示用户先处理（commit 或 stash），终止流程。
- 工作区干净 → 继续。

```bash
git branch --show-current
```

记录当前分支名称。

### 2.4 安全检查

```bash
git log --oneline <older_hash>^..HEAD
```

确认待 squash 的 commits 均位于分支顶端（即 newer_hash 到 HEAD 之间没有其他 commits，或 newer_hash 就是 HEAD）。若 newer_hash 不是 HEAD，提示用户确认是否继续（因为 squash 后 newer_hash 之后的 commits 也会被 rebase）。

## 3. 分析变更内容

### 3.1 列出待合并的 commits

```bash
git log --oneline --no-decorate <older_hash>^..<newer_hash>
```

### 3.2 聚合 diff

```bash
git diff <older_hash>^..<newer_hash> --stat
git diff <older_hash>^..<newer_hash>
```

扫描聚合 diff，按照与 git-smart-commit 相同的归类规则进行变更分类（功能变更、修复、重构、配置、测试等）。

### 3.3 关键变更识别

从聚合 diff 中提取：

- 修改的文件列表及每个文件的核心变更目的
- 新增/删除的函数或方法名称
- 整体变更的主要目的

## 4. 生成新 Commit Message

遵循与 git-smart-commit 相同的格式：

```text
英文类型: 中文简介，描述本次更改的结果是什么

中文正文：描述对什么文件进行了什么修改
```

类型选择规则与 git-smart-commit 一致：

| 类型 | 使用场景 |
|------|---------|
| `feat` | 新增功能、模块、能力、页面 |
| `fix` | 修复 bug、错误行为 |
| `refactor` | 结构调整、代码整理（行为不变） |
| `test` | 新增或修改测试 |
| `chore` | 配置、依赖、构建、工具链变更 |
| `docs` | 文档变更 |
| `style` | 样式/UI 变更 |

混合多种类型时，选择占比最大的；占比接近则优先 feat > fix > refactor > 其他。

## 5. Dry-Run 展示

向用户展示以下内容，不执行任何 git 操作：

```
=== Git Smart Squash - Dry Run ===

分支：<当前分支名>
待合并 commits（N 个）：
  <hash1> <message1>
  <hash2> <message2>
  ...
  <hashN> <messageN>

聚合变更概览：
  M  path/to/file1.ts    (+12, -3)
  A  path/to/file2.ts    (+45, -0)
  D  path/to/file3.ts    (+0, -20)
  ...

新 Commit Message：
---
<英文类型>: <中文简述>

<中文正文>
---

操作说明：
  将以上 N 个 commits 合并为 1 个 commit，使用上述 message。
  等价于 git rebase -i，将第一个之后的 commits 标记为 squash。
```

### 5.1 用户确认

使用 `AskUserQuestions` 询问用户下一步操作：

- `confirm` — 执行 squash
- `edit` — 用户修改 commit message 后再执行
- `cancel` — 取消操作

## 6. 执行 Squash

使用非交互式 rebase 完成 squash：

```bash
GIT_SEQUENCE_EDITOR="sed -i '' '2,\$s/^pick/squash/'" git rebase -i <older_hash>^
GIT_EDITOR="cat" git rebase --continue  # 不需要，上面会自动处理
```

实际执行策略（跨平台兼容）：

```bash
# 方案：使用 git reset --soft + commit
git reset --soft <older_hash>^
git commit -m "<类型>: <简述>" -m "<正文>"
```

选择 `git reset --soft` 方案，因为：
- 不依赖交互式编辑器
- 跨平台兼容
- 结果等价于 squash rebase
- 前提：待 squash 的 commits 必须位于分支顶端（newer_hash == HEAD）

若 newer_hash 不是 HEAD，则必须使用 rebase 方案：

```bash
# 生成 rebase todo 脚本
git log --oneline --reverse <older_hash>^..<newer_hash> | \
  awk 'NR==1{print "pick "$0} NR>1{print "squash "$0}' > /tmp/git-squash-todo

GIT_SEQUENCE_EDITOR="cp /tmp/git-squash-todo" git rebase -i <older_hash>^
```

rebase 过程中若出现冲突，终止 rebase 并通知用户手动处理。

### 6.1 执行完成

```bash
git log --oneline -1
```

展示结果：

```
已完成 squash，分支 <branch>：<new_commit_hash 前7位> <commit message 首行>
（原 N 个 commits 已合并为 1 个）
```

### 6.2 询问是否推送

使用 `AskUserQuestions` 询问用户是否推送到远端：

- `force_push` — 执行 `git push --force-with-lease`（因为 rebase 改写了历史）
- `skip` — 不推送，结束流程

注意：squash 后推送必须使用 `--force-with-lease`，因为历史已被改写。在展示选项时明确告知用户这是 force push。

### 6.3 失败处理

| 错误 | 处置 |
|------|------|
| 工作区不干净 | 提示用户先 commit 或 stash |
| hash 不存在 | 提示用户检查 hash 是否正确 |
| hash 不在当前分支 | 提示用户切换到正确分支 |
| newer_hash 不是 HEAD 且 rebase 冲突 | 执行 `git rebase --abort`，通知用户 |
| reset --soft 后 commit 失败 | 执行 `git reflog` 找回原 HEAD，通知用户 |

## 7. 完整示例

### 示例 1：用户指定两个 hash

```
=== Git Smart Squash - Dry Run ===

分支：feat/lyrics-player
待合并 commits（4 个）：
  a1b2c3d feat: 新增歌词滚动组件
  e4f5g6h fix: 修复歌词时间戳解析
  i7j8k9l refactor: 提取歌词解析工具函数
  m0n1o2p test: 补充歌词解析单元测试

聚合变更概览：
  A  src/components/LyricsScroll.tsx    (+120, -0)
  A  src/utils/lyricsParser.ts          (+85, -0)
  M  src/types/lyrics.ts               (+15, -0)
  A  tests/utils/lyricsParser.test.ts   (+60, -0)

新 Commit Message：
---
feat: 新增歌词滚动播放组件与解析工具

新增 LyricsScroll 组件实现歌词滚动展示，新增 lyricsParser 工具函数处理时间戳解析，
补充 lyrics 类型定义，添加解析逻辑单元测试
---

操作说明：
  将以上 4 个 commits 合并为 1 个 commit，使用上述 message。
```

### 示例 2：当前对话提交的 commits

```
=== Git Smart Squash - Dry Run ===

分支：main
待合并 commits（3 个，均为本次对话提交）：
  d4e5f6a chore: 添加 eslint 配置
  b7c8d9e chore: 修复 lint 报错
  f0a1b2c chore: 调整 tsconfig strict 选项

聚合变更概览：
  A  eslint.config.mjs    (+35, -0)
  M  tsconfig.json        (+3, -1)
  M  src/index.ts         (+2, -2)

新 Commit Message：
---
chore: 配置 eslint 并启用 tsconfig strict 模式

新增 eslint.config.mjs 配置文件，修正 lint 报错，tsconfig 启用 strict 相关选项
---

操作说明：
  将以上 3 个 commits 合并为 1 个 commit，使用上述 message。
```

## 8. 与其他技能的协作

- 与 `git-smart-commit` 配合：多次 smart-commit 后使用本技能合并为一个整洁的 commit。
- 与 `subagent-driven-development` 配合：多个子代理各自提交后，使用本技能统一压缩。

## 9. 禁止模式

- 在 dry-run 之前直接执行 squash。
- 操作不属于用户指定范围的 commits。
- 未指定 hash 时操作非当前对话产生的 commits。
- 工作区不干净时强行执行 reset 或 rebase。
- 在用户确认前执行任何写操作。
- 使用 `git push --force` 而非 `--force-with-lease`。
- squash 后丢失代码变更。
