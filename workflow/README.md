# Workflow Skills

本目录提供从完整需求确认、最终状态设计、实现计划到连续执行和审查的一组研发流程技能。

## 来源

| 仓库 | 贡献 |
|---|---|
| [obra/superpowers](https://github.com/obra/superpowers) | 核心工作流技能的原始来源。brainstorming、writing-plans、executing-plans、subagent-driven-development、dispatching-parallel-agents、test-driven-development、code-review 七个技能均提取自 superpowers/skills，经中文翻译、术语统一、结构重构后保留；systematic-debugging 的调试框架则提取自本地 Claude 配置（`~/.claude/CLAUDE.md`），原始框架同样源自 superpowers 生态 |
| [mattpocock/skills](https://github.com/mattpocock/skills) | TypeScript 类型体操技能（typescript-magician）的参考来源，推动了对 AI agent 技能组织形式的系统化思考 |
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | Andrej Karpathy 风格的 AI 协作技能集，为 prompt 工程和 agent 行为设计提供了实践参考 |
| [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) | 提供了多 agent 协作系统的参考设计 |

## 主流程

```text
brainstorming
→ grill-with-docs：依次完成全部 Stage 设计
→ writing-plans：依次生成全部 Stage 计划
→ smart-exec-plan：一次连续执行全部 Stage
   ├── executing-plans
   ├── test-driven-development
   └── subagent-driven-development
```

## 技能清单

| 技能 | 职责 |
|---|---|
| `brainstorming` | 一次确认完整需求、方向和全部 Stage |
| `grill-with-docs` | 依次对质全部 Stage，设计最终系统状态 |
| `writing-plans` | 依次生成全部 Stage 的实现计划 |
| `smart-exec-plan` | 管理开发分支、Task commit 和 Stage `--no-ff` 合并 |
| `executing-plans` | 解析计划并按 Stage、Task Group、Task、Step 推进 |
| `test-driven-development` | 在每个 Task 内执行红—绿—重构 |
| `subagent-driven-development` | 分派实现者并执行 Task、Stage 和最终审查 |
| `code-review` | 通用代码审查和审查反馈处理 |
| `systematic-debugging` | 系统化定位和修复故障 |
| `dispatching-parallel-agents` | 分派无共享状态的独立任务 |

## Stage 语义

Stage 用于：

- 控制设计和计划文档规模
- 表达实现依赖顺序
- 形成 Git 合并检查点

Stage 不表示可部署版本。Task 和 Stage 的拆分不考虑开发期间如何保持服务正常运行，也不为中间状态增加兼容层、双轨接口、临时 Schema 或分批切换机制。

全部 Stage 在一次 brainstorming 中确认，随后依次完成全部 grill 和全部 plan，再由 smart-exec-plan 连续执行。Stage 之间不重新讨论需求，也不暂停选择执行方式。

## Git 规则

smart-exec-plan 设启动分支为 `x`，按实际开发内容创建分支 `y`：

- 当前需求尚未提交的 brainstorming、grill、plan、CONTEXT 和 ADR 在 `y` 上形成一个文档 commit。
- 每个 Task 在 `y` 上形成一个包含代码、测试和计划进度的 commit。
- Stage 执行状态 amend 到该 Stage 最后一个 Task commit。
- 每个 Stage 完成后使用 `--no-ff` 合并到 `x`。
- 最后一个 Stage 合并前执行完整验证和最终审查。
- 全部完成后保留 `y`，不自动 push 或删除分支。

## 验证边界

- Task：当前行为的失败测试和目标测试。
- Stage：设计覆盖、Task 集成和后续契约。
- 全部 Stage：完整构建、类型检查、lint、单元测试、集成测试和最终审查。

中间 Task 或 Stage 可以暂时无法构建、启动或部署；最终状态必须满足完整需求和全部验证。

## 来源

本套技能参考并改造自：

- [obra/superpowers](https://github.com/obra/superpowers)
- [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done)
- 本地系统化调试实践

流程图统一使用 Graphviz dot 语法。
