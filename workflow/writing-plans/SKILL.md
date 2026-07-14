---
name: writing-plans
description: grill-with-docs 完成全部 Stage 设计后使用——依次生成全部 Stage 的可执行计划，再统一交给 smart-exec-plan
---

# 编写全部 Stage 实现计划

将全部 Stage 设计转化为按顺序执行的计划。计划面向一次连续完成的开发，不为 Task 或 Stage 的中间状态设计服务兼容机制。

**开始时声明：** “我正在使用 writing-plans 技能依次编写全部 Stage 的实现计划。”

## 输入

必须读取：

- brainstorming 需求索引
- 全部 Stage 设计文件
- `docs/CONTEXT.md` 或对应 context 文件
- 设计引用的 ADR
- 相关代码、测试和项目命令

只有全部 Stage 设计完成并确认后才能开始。不得写完一个 Stage 计划后提前进入实现。

## 输出

每个 Stage 生成独立计划文件：

```text
docs/plans/YYYY-MM-DD-<slug>-stage-1.md
docs/plans/YYYY-MM-DD-<slug>-stage-2.md
docs/plans/YYYY-MM-DD-<slug>-stage-N.md
```

无显式 Stage 时仍使用 Stage 1 文件名。

每完成一个计划，更新 brainstorming 索引中的计划状态和计划文件。全部计划完成后统一调用 smart-exec-plan。

## 计划层级

```text
Stage → Task Group → Task → Step
```

Stage 由 brainstorming 定义，writing-plans 不新增、删除或重新划分 Stage。设计规模仍然无法形成可执行计划时，停止并指出具体设计缺口。

### Task Group

Task Group 表达实现依赖。Group 之间严格串行。后一个 Group 依赖前一个 Group 的产物。

同 Group 内 Task 应尽量避免修改同一文件。当前执行仍按串行顺序进行，文件互斥用于保持 Task 边界清晰，不表示必须并行。

### Task

每个 Task 是适合实现、TDD、审查和提交的原子单元。Task 不要求：

- 独立部署
- 独立发布
- 完整服务可启动
- 旧调用方继续可用
- 全仓库构建和测试通过

Task 必须：

- 有明确职责和文件范围
- 有当前 Task 可验证的目标行为
- 说明依赖的前置 Task
- 形成一个有意义的 commit
- 不包含纯开发过渡用途的兼容代码

### Step

Task 内 Step 严格串行。每个 Step 描述一个具体动作，包含：

- 修改或创建的精确文件
- 目标函数、类型、接口或配置
- 行为要求和边界条件
- 当前 Step 的预期结果

涉及行为变更时，测试 Step 必须位于生产实现 Step 之前。

## 最终状态优先

除非最终设计明确要求长期兼容，否则计划不得加入：

- 新旧接口并存 Task
- compatibility adapter Task
- 双读或双写 Task
- 临时 Schema 或临时数据格式
- feature flag 分批迁移
- 先保留旧调用链、再迁移、最后删除的重复步骤
- 仅用于让中间 commit 可部署的代码

计划应按最终结构组织修改。中间 Task 或 Stage 可以暂时无法完整构建、启动或部署。

数据安全仍是必要要求。涉及持久化数据时，计划必须覆盖：

- 数据转换正确性
- 不可逆操作保护
- 最终约束验证
- 防止数据丢失和重复

## 验证边界

### Task 验证

每个 Task 只要求运行与其目标行为直接相关的测试和必要静态检查。计划必须写明：

- 测试文件
- 测试场景
- 红阶段的预期失败原因
- 绿阶段应通过的测试

不要求计划列举中间状态下全仓库会失败的命令。

### Stage 审查

Stage 完成后检查设计覆盖、Task 完成情况和 Stage 内集成，不要求该 Stage 可独立部署或服务可启动。

### 最终验证

最后一个 Stage 完成后，smart-exec-plan 统一运行完整验证。每个计划头部应记录项目适用的完整命令，包括：

- 构建
- 类型检查
- lint
- 单元测试
- 集成测试

不存在某类命令时明确写“项目未配置”，不得编造命令。

## 计划文件头部

每个计划必须以以下结构开始：

```markdown
# <功能名称> Stage N 实现计划

> **执行者须知：** 使用 smart-exec-plan 连续执行全部 Stage。本 Stage 不是独立部署版本。

**目标：** <本 Stage 在最终系统中完成的职责>

**需求索引：** `docs/brainstorming/YYYY-MM-DD-<slug>.md`

**设计文档：** `docs/grill/YYYY-MM-DD-<slug>-stage-N.md`

**术语表：** `docs/CONTEXT.md`

**Stage：** N / 总 Stage 数

**依赖 Stage：** 无或 Stage N-1

**完整验证命令：**
- 构建：`<项目命令>` 或项目未配置
- 类型检查：`<项目命令>` 或项目未配置
- lint：`<项目命令>` 或项目未配置
- 单元测试：`<项目命令>` 或项目未配置
- 集成测试：`<项目命令>` 或项目未配置

---

## 进度清单

### Group 1
- [ ] Task 1-1 — <简要描述>
- [ ] Task 1-2 — <简要描述>

### Group 2
- [ ] Task 2-1 — <简要描述>

---
```

计划生成时必须把尖括号字段替换成实际内容。

## Task 结构

```markdown
### Task 1-1：<Task 名称>

**依赖：** 无或具体 Task

**文件：**
- 创建：`exact/path/to/file`
- 修改：`exact/path/to/file`
- 测试：`exact/path/to/test`

**提交信息：**

`feat: <中文简介>`

<中文正文，说明该 Task 形成的代码结果。>

#### Step 1：编写失败测试

在 `exact/path/to/test` 增加具体测试，覆盖明确场景和断言。运行当前测试，确认因目标行为缺失而失败。

#### Step 2：实现最终行为

在 `exact/path/to/file` 实现设计定义的最终接口和行为，写明函数签名、边界条件和错误信息。

#### Step 3：验证与整理

运行当前 Task 的测试，确认通过。只在测试通过后整理命名和重复代码，并再次运行相同测试。
```

计划不包含 Git 提交 Step。提交由 smart-exec-plan 在审查通过并更新进度后执行。

## 文件规划

定义 Task 前先检查：

- 文件的 exports 和公共接口
- 直接调用方
- 可复用工具和现有模式
- 测试组织方式
- 同 Group 内文件冲突
- 跨 Stage 文件的重复修改

允许不同 Stage 修改同一文件，因为 Stage 严格串行。每次修改必须服务于最终设计，不得添加随后删除的兼容层。

## 禁止模糊内容

每个 Step 必须提供实际信息。不得使用：

- “添加适当的错误处理”
- “补充验证”
- “处理边界情况”
- “参考前一个 Task”
- 未定义的函数、类型或文件
- 空测试说明
- 以后再确定的实现细节

## 自审

每个 Stage 计划完成后，先内联检查：

1. 设计中的每项职责是否有对应 Task。
2. Task 是否包含具体文件、行为和测试。
3. 标识符是否与 CONTEXT 一致。
4. 同 Group 文件修改是否清晰。
5. 是否加入纯过渡兼容代码。
6. 最终数据安全要求是否覆盖。
7. 最终验证命令是否真实存在。

随后使用 [plan-document-reviewer-prompt.md](./plan-document-reviewer-prompt.md) 完整审查。

## 全部计划完成条件

满足以下条件后调用 smart-exec-plan：

1. 每个 Stage 都有独立计划文件。
2. 所有计划通过审查。
3. brainstorming 索引记录全部计划文件和已完成状态。
4. Stage 顺序和依赖一致。
5. 最终验证命令已确认。
6. 不存在为了开发期间服务连续运行而增加的兼容 Task。

交接内容包括 brainstorming 索引和按顺序排列的全部计划文件，不再提供执行方式选择。随后调用 `$skill:smart-exec-plan`。
