---
name: pi-session-summarizer
description: 提取指定时间范围内所有 pi agent session 记录，按项目分类整理为结构化 markdown 文档，保存到当前工作目录。用于定期回顾、进度汇总、工作记录归档。
---

# PI Agent Session 汇总器

## 概述

从 `~/.pi/agent/sessions` 目录读取指定时间范围内的所有 JSONL session 文件，提取每个 session 的第一条用户消息（即任务描述），按项目/目录分组整理，输出为带分类目录的 Markdown 文档。

## 输入参数

用户需要提供时间范围：

- **开始日期**：格式 `YYYY-MM-DD`，必填
- **结束日期**：格式 `YYYY-MM-DD`，必填

## 输出

在当前工作目录生成 `pi-sessions-summary-<开始日期>-<结束日期>.md`，包含：

1. 统计摘要（总 session 数、涉及项目数、时间跨度、最活跃项目）
2. 按项目分组的任务列表，每个任务标注时间和简述
3. 关键主题的归纳总结

## 执行流程

### 步骤 1：运行提取脚本

使用 skill 目录下提供的 `extract-sessions.py` 脚本：

```bash
uv run <skill-dir>/extract-sessions.py --from <开始日期> --to <结束日期>
```

脚本默认会：
- 扫描 `~/.pi/agent/sessions` 下的所有子目录和 `*.jsonl` 文件
- 根据文件名中的时间戳过滤指定范围内的 session
- 提取每个 session 的第一条 `role: "user"` 消息
- 按 session 所属目录（即项目/上下文）分组
- 输出结构化 JSON 到 stdout

选项：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--from` | 开始日期 YYYY-MM-DD | 必填 |
| `--to` | 结束日期 YYYY-MM-DD | 必填 |
| `--sessions-dir` | sessions 根目录 | `~/.pi/agent/sessions` |
| `--output` | 输出 JSON 文件路径 | stdout |

### 步骤 2：分析并编写 MD 文档

读取步骤 1 输出的 JSON 数据，按以下结构编写 Markdown 文档：

```markdown
# PI Agent 工作记录汇总

> 时间范围：YYYY-MM-DD ~ YYYY-MM-DD

## 统计摘要

| 指标 | 数值 |
|------|------|
| 总 session 数 | N |
| 涉及项目/目录数 | N |
| 最活跃项目 | 名称(N sessions) |

## 一、项目名

| 时间 | 任务 |
|------|------|
| MM-DD HH:MM | 任务简述 |

## 二、项目名

...
```

分类原则：

1. 将 session 按 `cwd`（工作目录）合并归类，同一项目不同子目录合并
2. 项目分组按 session 数量降序排列
3. 每个 session 取截断后的首条用户消息作为任务简述（超过 80 字截断加 `...`）
4. 同一项目内按时间顺序排列

### 步骤 3：归纳关键主题

在文档末尾添加关键主题归纳，将相似任务合并为一句总结，按领域分点列出。

## 注意事项

- `subagents.jsonl` 文件自动排除
- 仅提取 `type: "message"` 且 `role: "user"` 的第一条消息
- 若某 session 无 user 消息，记录为"（无用户消息）"
- 提取脚本已内嵌在 skill 目录下，执行前无需额外安装依赖
