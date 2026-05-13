---
name: subagent-driven-development
description: 在当前会话中执行包含独立 Task 的实现计划时使用
---

# Subagent-Driven Development（子代理驱动开发）

通过为每个 Task 分派全新的子代理来执行计划，每个 Task 后进行两阶段审查：先是 spec 合规审查，然后是代码质量审查。

**为什么使用子代理：** 你将 Task 委托给拥有独立上下文的专用代理。通过精确设定其指令和上下文，确保它们保持专注并成功完成 Task。它们不应继承你会话中的上下文或历史——你只构建它们需要的内容。这也能为你自己的协调工作保留上下文。

**核心原则：** 每个 Task 一个全新子代理 + 两阶段审查（先 spec 后质量）= 高质量，快速迭代

**持续执行：** 不要在 Task 之间暂停与用户确认。不间断地执行计划中的所有 Task。同 Group 内的 Task 按串行顺序逐个推进，Group 全部完成后进入下一 Group。唯一停止的理由是：无法解决的 BLOCKED 状态、真正阻碍进展的歧义，或所有 Task 已完成。"我应该继续吗？"这类提示和进度摘要是在浪费用户时间——用户要求你执行计划，那就执行它。

## 何时使用

```dot
digraph when_to_use {
    "有实现计划？" [shape=diamond];
    "Task 基本独立？" [shape=diamond];
    "使用子代理逐 Task 实现并自动审查？" [shape=diamond];
    "subagent-driven-development" [shape=box];
    "executing-plans" [shape=box];
    "手动执行或先梳理方案" [shape=box];

    "有实现计划？" -> "Task 基本独立？" [label="是"];
    "有实现计划？" -> "手动执行或先梳理方案" [label="否"];
    "Task 基本独立？" -> "使用子代理逐 Task 实现并自动审查？" [label="是"];
    "Task 基本独立？" -> "手动执行或先梳理方案" [label="否——高度耦合"];
    "使用子代理逐 Task 实现并自动审查？" -> "subagent-driven-development" [label="是"];
    "使用子代理逐 Task 实现并自动审查？" -> "executing-plans" [label="否"];
}
```

**对比 Executing Plans：**
- 同一会话（无需上下文切换）
- 每个 Task 全新子代理（无上下文污染）
- 每个 Task 后进行两阶段审查：先 spec 合规，再代码质量
- 更快的迭代（Task 之间无需人工介入）

## 流程

```dot
digraph process {
    rankdir=TB;

    subgraph cluster_per_task {
        label="每个 Task";
        "分派实现者子代理 (./implementer-prompt.md)" [shape=box];
        "实现者子代理提出问题？" [shape=diamond];
        "回答问题，提供上下文" [shape=box];
        "实现者子代理实现、测试、提交、自审" [shape=box];
        "分派 spec 合规审查者子代理 (./spec-reviewer-prompt.md)" [shape=box];
        "Spec 合规审查者子代理确认代码匹配 spec？" [shape=diamond];
        "实现者子代理修复 spec 差异" [shape=box];
        "分派代码质量审查者子代理 (./code-quality-reviewer-prompt.md)" [shape=box];
        "代码质量审查者子代理通过？" [shape=diamond];
        "实现者子代理修复质量问题" [shape=box];
        "在计划头部进度清单标记 Task 完成" [shape=box];
    }

    "读取计划（若有 Stage 则按 Stage 顺序加载），提取当前 Group 内 Task 的完整文本，更新进度清单" [shape=box];
    "还有更多 Task？" [shape=diamond];
    "当前 Group 全部 Task 完成？" [shape=diamond];
    "分派最终代码审查者子代理（整体实现）" [shape=box];

    "读取计划（若有 Stage 则按 Stage 顺序加载），提取当前 Group 内 Task 的完整文本，更新进度清单" -> "分派实现者子代理 (./implementer-prompt.md)";
    "分派实现者子代理 (./implementer-prompt.md)" -> "实现者子代理提出问题？";
    "实现者子代理提出问题？" -> "回答问题，提供上下文" [label="是"];
    "回答问题，提供上下文" -> "分派实现者子代理 (./implementer-prompt.md)";
    "实现者子代理提出问题？" -> "实现者子代理实现、测试、提交、自审" [label="否"];
    "实现者子代理实现、测试、提交、自审" -> "分派 spec 合规审查者子代理 (./spec-reviewer-prompt.md)";
    "分派 spec 合规审查者子代理 (./spec-reviewer-prompt.md)" -> "Spec 合规审查者子代理确认代码匹配 spec？";
    "Spec 合规审查者子代理确认代码匹配 spec？" -> "实现者子代理修复 spec 差异" [label="否"];
    "实现者子代理修复 spec 差异" -> "分派 spec 合规审查者子代理 (./spec-reviewer-prompt.md)" [label="重新审查"];
    "Spec 合规审查者子代理确认代码匹配 spec？" -> "分派代码质量审查者子代理 (./code-quality-reviewer-prompt.md)" [label="是"];
    "分派代码质量审查者子代理 (./code-quality-reviewer-prompt.md)" -> "代码质量审查者子代理通过？";
    "代码质量审查者子代理通过？" -> "实现者子代理修复质量问题" [label="否"];
    "实现者子代理修复质量问题" -> "分派代码质量审查者子代理 (./code-quality-reviewer-prompt.md)" [label="重新审查"];
    "代码质量审查者子代理通过？" -> "在计划头部进度清单标记 Task 完成" [label="是"];
    "在计划头部进度清单标记 Task 完成" -> "还有更多 Task？";
    "还有更多 Task？" -> "分派实现者子代理 (./implementer-prompt.md)" [label="是，同 Group 内"];
    "还有更多 Task？" -> "当前 Group 全部 Task 完成？" [label="否"];
    "当前 Group 全部 Task 完成？" -> "读取计划（若有 Stage 则按 Stage 顺序加载），提取当前 Group 内 Task 的完整文本，更新进度清单" [label="否，进入下一 Group", style=dotted];
    "当前 Group 全部 Task 完成？" -> "分派最终代码审查者子代理（整体实现）" [label="是所有 Stage 已完成"];
}
```
```

## 模型选择

使用每个角色所需的最低能力模型，以节省成本并提高速度。

**机械性实现 Task**（独立函数、清晰 spec、1-2 个文件）：使用快速、廉价的模型。当计划制定得足够清晰时，大多数实现 Task 都是机械性的。

**集成与判断 Task**（多文件协调、模式匹配、调试）：使用标准模型。

**架构、设计与审查 Task**：使用可用的最强模型。

**Task 复杂度信号：**
- 涉及 1-2 个文件且有完整 spec → 廉价模型
- 涉及多个文件且有集成关注点 → 标准模型
- 需要设计判断或广泛的代码库理解 → 最强模型

## 处理实现者状态

实现者子代理报告四种状态之一。适当处理每种状态：

**DONE：** 进入 spec 合规审查。

**DONE_WITH_CONCERNS：** 实现者完成了工作但标记了疑虑。在继续之前阅读这些顾虑。如果顾虑涉及正确性或范围，在审查之前解决它们。如果是观察性意见（例如"这个文件越来越大了"），记录它们并进入审查。

**NEEDS_CONTEXT：** 实现者需要未提供的信息。提供缺失的上下文并重新分派。

**BLOCKED：** 实现者无法完成 Task。评估阻塞原因：
1. 如果是上下文问题，提供更多上下文并用相同模型重新分派
2. 如果 Task 需要更强的推理能力，使用更强的模型重新分派
3. 如果 Task 太大，将其拆分为更小的部分
4. 如果计划本身有问题，升级给用户

**绝不**忽略升级或在没有任何改变的情况下强制同一模型重试。如果实现者说卡住了，就一定有需要改变的地方。

## 提示词模板

- `./implementer-prompt.md` - 分派实现者子代理
- `./spec-reviewer-prompt.md` - 分派 spec 合规审查者子代理
- `./code-quality-reviewer-prompt.md` - 分派代码质量审查者子代理

## 示例工作流程

```
你：我正在使用 Subagent-Driven Development 来执行此计划。

[检查计划目录：有 Stage 索引文件，从 Stage 1 开始]
[读取当前 Stage 文件，理解 Group 划分
  Group 1: Task 1-1, Task 1-2 (可并行，文件互斥已验证)
  Group 2: Task 2-1]
[更新进度清单标记各 Task 为待办]

========== Stage 1 ==========

--- Group 1 ---

=== Task 1-1：Hook 安装脚本 ===

[获取 Task 1-1 文本和上下文]
[使用完整 Task 文本 + 上下文分派实现者子代理]

实现者："开始之前——Step 1 说要在用户级别安装 hook，安装路径是哪里？"

你："用户级别 (~/.config/hooks/)"

实现者："明白了。现在根据 Step 要求开始实现……"
[稍后] 实现者：
  - 根据 Step 1 描述的要求实现了 install-hook 命令
  - 根据 Step 2 的测试场景列表编写了测试，5/5 通过
  - 自审通过
  - 已提交

[分派 spec 合规审查者]
Spec 审查者：✅ Spec 合规——所有需求已满足，无多余内容

[分派代码质量审查者]
代码审查者：优势：测试覆盖良好，代码干净。问题：无。通过。

[在进度清单标记 Task 1-1 完成]

=== Task 1-2：卸载脚本（与 Task 1-1 同 Group，独立文件，可并行） ===

[分派实现者子代理]
……
[标记 Task 1-2 完成]

--- Group 1 完成，进入 Group 2 ---

=== Task 2-1：集成验证 ===

……
[标记 Task 2-1 完成]

========== Stage 1 完成，进入 Stage 2 (如有) ==========

[所有 Task 完成后]
[分派最终代码审查者]
最终审查者：所有需求已满足，可以合并

完成！
```

## 优势

**对比手动执行：**
- 子代理自然遵循 TDD
- 每个 Task 全新上下文（不会混淆）
- 并行安全（子代理不会互相干扰）
- 子代理可以提问（工作前和工作期间均可）

**对比 Executing Plans：**
- 同一会话（无需交接）
- 持续进展（无需等待）
- 自动审查检查点

**效率提升：**
- 无需文件读取开销（控制器提供完整 Task 文本）
- 控制器精确筛选所需上下文
- 子代理预先获得完整信息
- 问题在工作开始前提出（而非之后）

**质量关卡：**
- 自审在交接前捕获问题
- 两阶段审查：Spec 合规，然后是代码质量
- 审查循环确保修复真正有效
- Spec 合规防止过度构建或构建不足
- 代码质量确保实现构建良好

**成本：**
- 更多子代理调用（每个 Task：实现者 + 2 个审查者）
- 控制器做更多前期工作（预先提取所有 Task）
- 审查循环带来额外迭代
- 但早期捕获问题比后续调试成本更低

## 红线

**绝不：**
- 未经用户明确同意在 main/master 分支上开始实现
- 跳过审查（spec 合规或代码质量任一）
- 带着未修复的问题继续
- 并行分派多个实现者子代理（会导致冲突）
- 让子代理自行读取计划文件（应提供完整 Task 文本）
- 跳过场景设定上下文（子代理需要理解 Task 在整个计划中的位置）
- 忽略子代理的提问（在让他们继续之前必须回答）
- 接受 spec 合规"差不多"（spec 审查者发现问题 = 未完成）
- 跳过审查循环（审查者发现问题 = 实现者修复 = 再次审查）
- 让实现者自审替代实际审查（两者都需要）
- **在 spec 合规通过之前开始代码质量审查**（顺序错误）
- 在任一审查仍有未解决问题时进入下一个 Task

**如果子代理提出问题：**
- 清晰完整地回答
- 必要时提供额外上下文
- 不要催促他们进入实现阶段

**如果审查者发现问题：**
- 实现者（同一子代理）修复问题
- 审查者再次审查
- 重复直到通过
- 不要跳过重新审查

**如果子代理任务失败：**
- 用具体指令分派修复子代理
- 不要尝试手动修复（会污染上下文）

## 集成

**相关技能：**
- **writing-plans 技能** - 创建本技能所执行的计划（产生 Stage — Task Group — Task — Step 层级）
- **code review 流程** - 为审查者子代理提供代码审查规范
- **test-driven-development 技能** - 子代理在每个 Task 中遵循 TDD

**替代工作流：**
- **executing-plans 技能** - 在当前会话中自行实现，配合审查检查点
