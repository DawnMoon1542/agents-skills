# Workflow Skills

本目录下的研发流程技能套件来源于以下项目的总结与改造。

## 来源

| 仓库 | 贡献 |
|---|---|
| [obra/superpowers](https://github.com/obra/superpowers) | 核心工作流技能的原始来源。brainstorming、writing-plans、executing-plans、subagent-driven-development、dispatching-parallel-agents、test-driven-development、code-review 七个技能均提取自 superpowers/skills，经中文翻译、术语统一、结构重构后保留；systematic-debugging 的调试框架则提取自本地 Claude 配置（`~/.claude/CLAUDE.md`），原始框架同样源自 superpowers 生态 |
| [mattpocock/skills](https://github.com/mattpocock/skills) | TypeScript 类型体操技能（typescript-magician）的参考来源，推动了对 AI agent 技能组织形式的系统化思考 |
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | Andrej Karpathy 风格的 AI 协作技能集，为 prompt 工程和 agent 行为设计提供了实践参考 |
| [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) | 提供了多 agent 协作系统的参考设计，其 Task 拆分、Stage 分层的理念对 writing-plans 和 subagent-driven-development 的层级结构有直接影响 |

## 技能清单

```
brainstorming              → 需求探索与方向选型
grill-with-docs            → 领域对质与方案精炼（原创设计）
writing-plans              → 编写可执行实现计划
executing-plans            → 在当前会话逐 Task 实现
subagent-driven-development → 子代理驱动实现与多层审查
code-review                → 代码审查
test-driven-development    → 测试驱动开发
systematic-debugging       → 系统化调试
dispatching-parallel-agents → 并行代理分派
```

- 全局采用 dot 流程图替换原来的 mermaid 流程图
