# Workflow 编排规范

本文件是 `smart-exec-plan-workflow` 生成脚本时的固定契约。生成新脚本时只允许替换占位符与 `CFG` 配置块，下列结构、phase 名称、顺序、schema 与停止条件保持不变。

## 1. 文件约定

- 位置：项目内 `.claude/workflows/<slug>-stages.js`
- 语言：纯 JavaScript，不带 TypeScript 注解
- 顶层必须先声明 `export const meta`
- 配置集中在单个 `CFG` 常量，流程代码不出现散落的硬编码路径与分支名

## 2. meta 结构

```js
export const meta = {
  name: '<slug>-stages',
  description: '<一句话说明执行哪个需求的哪个 Stage 区间>',
  whenToUse: '<计划文件路径或触发场景>',
  phases: [
    { title: 'Scout', detail: '...' },
    { title: 'TestDesign', detail: '...' },
    { title: 'TestReview', detail: '...' },
    { title: 'TestFix', detail: '...' },
    { title: 'Implement', detail: '...' },
    { title: 'ImplReview', detail: '...' },
    { title: 'ImplFix', detail: '...' },
    { title: 'Commit', detail: '...' },
    { title: 'StageRev', detail: '...' },
    { title: 'Verify', detail: '...' },
    { title: 'Merge', detail: '...' },
  ],
}
```

硬性要求：

- `meta` 是纯字面量：不能出现变量、函数调用、对象展开、模板字符串插值
- `phases` 十一项固定，标题与 `phase` 字段完全一致，不增不减
- `Phase` 名称按此顺序出现，最终审查复用 `StageRev` phase，不新增 `FinalReview`

## 3. Phase 契约

| 顺序 | Phase | 输入 | 输出 schema | 允许 Git 写操作 |
|---|---|---|---|---|
| 1 | Scout | 分支、HEAD、工作区状态；计划进度清单 | `PREFLIGHT_SCHEMA`、`TASK_LIST_SCHEMA` | 否 |
| 2 | TestDesign | Task 全文、设计、术语表、允许文件 | `TEST_SCHEMA` | 否 |
| 3 | TestReview | Task 全文、设计、测试文件、红阶段记录、baseSha | `TEST_REVIEW_SCHEMA` | 否 |
| 4 | TestFix | Task 全文、测试审查问题清单 | `TEST_SCHEMA` | 否 |
| 5 | Implement | Task 全文、测试报告（红阶段与测试文件） | `IMPL_SCHEMA` | 否 |
| 6 | ImplReview | Task 全文、BASE_SHA、实现者报告、红/绿阶段结果 | `SPEC_SCHEMA`、`QUALITY_SCHEMA` | 否 |
| 7 | ImplFix | Task 全文、规格与质量审查问题清单、测试报告 | `IMPL_SCHEMA` | 否 |
| 8 | Commit | Task 提交信息、审查结论；需求索引执行状态 | `COMMIT_SCHEMA` | 是：`git add`、`git commit`、`git commit --amend` |
| 9 | StageRev | STAGE_BASE_SHA..HEAD、设计、计划、Stage 验证结果 | `STAGE_REVIEW_SCHEMA`、`FINAL_SCHEMA` | 否 |
| 10 | Verify | 计划中的真实验证命令 | `VERIFY_SCHEMA` | 否 |
| 11 | Merge | 基线分支期望 HEAD、开发分支 | `MERGE_SCHEMA` | 是：`git switch`、`git merge` |

`mergeEnabled=false` 时跳过 Merge phase，`devBranch` 与 `baseBranch` 同名时必须设为 `false`，否则脚本在基线检查前停止。Stage 状态 amend 在 Commit phase 执行，与是否合并无关。

TestDesign、TestReview 与 Implement 由三个独立代理完成：

- 测试编写者只写会失败的目标测试，运行后在 `redPhase` 记录失败原因，确认是功能缺失而不是语法或导入错误；不得修改生产代码
- 测试审查者在实现之前检查测试的必要性、充分性、与 Task 和设计的一致性、红阶段有效性；未通过时把问题打回测试编写者修复（测试修复归属 TestFix phase），复审通过才进入 Implement
- 没有测试 Step 的 Task（纯文档、静态资源、无行为配置）返回 `NOT_APPLICABLE` 并在 `redPhase` 写明理由，跳过 TestReview，实现者照常执行
- 实现者拿到测试文件清单与红阶段输出，只改生产代码使其转绿，在 `greenPhase` 记录真实输出；不得删改、跳过或放宽测试
- 两者都返回 BLOCKED / NEEDS_CONTEXT 时各自最多补充 `implRetries` 次上下文，每次交给新代理
- Task 审查范围从测试编写者返回的 `baseSha` 起算，测试与实现差异一并审查

## 4. 串行约束

Stage 严格串行，Task 严格串行。原因不是流程偏好，而是所有 agent 共享同一个工作区：

- 两个实现者同时修改同一仓库会互相覆盖彼此的编辑
- Task 的审查范围是 `TASK_BASE_SHA..工作区`，并行会让差异混入其他 Task
- 提交必须一次只包含当前 Task 的文件
- Stage 审查的范围是 `STAGE_BASE_SHA..HEAD`，并行提交会破坏边界

因此脚本中：

- 禁止对实现、修复、提交、Stage 审查相关步骤使用 `parallel()`，全程不使用 `pipeline()`
- 唯一允许的 `parallel()` 是 ImplReview phase 内同一轮的规格审查与质量审查：两者只读，审查同一份工作区快照，不会互相干扰
- TestReview 只有一个审查者，串行执行
- 不使用 `isolation: 'worktree'`：本流程依赖单一工作区与线性历史

## 5. 审查循环

Task 内两个审查循环，顺序固定：

```text
TestDesign → TestReview ─ 通过 → Implement → ImplReview（spec ∥ quality）─ 通过 → Commit
                 └─ 未通过 → TestFix → 复审                  └─ 未通过 → ImplFix → 并行复审
```

两个循环共用的规则：

- 复审时附上上一轮问题清单：审查者先逐条确认是否解决，再检查修复是否引入新问题；上一轮已审查过且未提出的代码，复审时不再新增问题，除非属于阻塞级缺陷（规格缺失、数据风险、critical）
- 轮次上限为 `reviewRounds`；最后一轮仍未通过时不再修复，直接停止并上报最后一轮问题清单
- 修复失败（BLOCKED / NEEDS_CONTEXT）即停止，不上报通过
- `baseSha` 始终保持测试编写者返回的原值，保证审查范围不漂移

测试审查循环：

- 问题取 `necessary`、`sufficient`、`alignment`、`redValidity`，分别加 `[必要性]`、`[充分性]`、`[一致性]`、`[红阶段]` 前缀
- 修复者只改测试文件，修复后必须重新给出 `TESTS_WRITTEN`、红阶段证据与完整测试文件清单，否则停止

实现审查循环：

- 两个审查都返回后再判断，任一无返回即停止
- 阻塞问题只有规格问题（`missing`、`extra`、`designDeviations`、`dataRisks`）与质量问题中的 `critical`、`important`，分别加 `[规格]`、`[质量]` 前缀合并为一份清单，交给同一个修复者
- `minor` 不触发修复：只有 minor 时按通过处理，最后一轮的 minor 以 `[minor]` 前缀写入该 Task 的 `concerns`，留待人工处理
- 修复后两个审查都重新执行，即使上一轮其中一方已通过，因为修复可能破坏它的结论

Stage 审查循环：

- 审查者同时拿到 Stage 验证结果，判断失败属于本 Stage 缺陷还是计划中后续 Stage 承接的中间状态；前者判 `NEEDS_CHANGES`，后者可以放行并在 `integration` 中写明承接 Stage
- 循环只由审查 `verdict` 驱动，Stage 验证失败本身不停止流程
- `NEEDS_CHANGES` 时由审查者给出 `issues` 与 `fixTasks` 草案
- 修复 Task 追加进计划文件，单独提交后重新扫描未完成 Task
- 修复后重新执行 Stage 验证与 Stage 审查，复审时附上上一轮问题清单
- 超过 `stageRepairs` 停止

最终验证与最终审查循环：

- 只在配置中最后一个 Stage 执行，且 Stage 审查通过之后、状态 amend 与合并之前；通过 `args.stages` 只跑前几个 Stage 时不执行
- 最终验证是硬门槛：失败时把失败明细作为修复 Task 追加到最后一个 Stage 计划，走完整 Task 循环
- 每轮收尾修复提交后执行收尾复审（`stageReviewPrompt` 的 `finalState=true`）：此时已是最终状态，不再有“归属后续 Stage”的豁免；复审 `NEEDS_CHANGES` 时按其 `fixTasks` 继续修复
- 复审通过后回到最终验证；最终审查只在最终验证通过后执行，`NEEDS_CHANGES` 时按 `FINAL_SCHEMA.fixTasks` 追加修复并重新走复审与验证
- 三类修复共享 `finalRepairs` 轮次上限（默认 3），上限用尽仍未通过即停止，原因写明是哪类修复超限

## 6. 提交规则

Task commit：

1. 勾选计划进度清单中该 Task 的 `- [ ]` 为 `- [x]`，只改这一行
2. `git status --short` 确认只包含本 Task 的代码、测试与计划进度
3. 按文件列表逐个 `git add`，禁止 `git add -A` 与 `git add .`
4. 使用计划中的提交信息，正文末尾追加 `Co-Authored-By` trailer
5. 提交后确认工作区干净并返回 SHA

Stage 状态更新：

1. 修改需求索引中的执行状态行
2. 确认只有该文件变化
3. `git commit --amend --no-edit` 合入本 Stage 最后一个 Task commit
4. 该更新不形成独立 commit

合并：

- 切到 `x`，确认 HEAD 等于记录的期望值
- `git merge --no-ff <y>`
- 合并信息使用 `merge: 完成 <功能> Stage N` 加中文正文
- 冲突时 `git merge --abort`，切回 `y`，报告冲突文件与两个 SHA，停止
- 合并后切回 `y` 继续下一 Stage，`y` 不需要合并刚产生的 merge commit

## 7. 停止条件与上报

必须停止并上报的情况：

| 条件 | 上报内容 |
|---|---|
| 当前分支不是 `y` | 实际分支、期望分支 |
| 工作区不干净 | 具体文件列表 |
| 实现阻塞 | Stage、Task、原因、已完成范围 |
| 审查超限 | 最后一轮问题清单 |
| 测试或实现缺证据 | 缺失的红阶段、测试文件或绿阶段 |
| 收尾修复超限 | 超限的修复来源、最后一轮问题；验证失败时附命令、输出片段、失败项 |
| Stage 审查未通过 | 未解决的设计覆盖或集成问题 |
| 最终审查未通过 | `FINAL_SCHEMA` 全部字段 |
| 合并冲突 | 冲突文件、`x` 与 `y` 的 SHA |
| 基线 HEAD 变化 | 期望 SHA 与实际 SHA |

返回对象固定包含：

```js
{
  implementationBaseSha,
  stages: [{ stage, title, stageBaseSha, tasks: [{ id, sha, concerns }], commitShas, stageReview, verify, statusSha, merge }],
  blocked: { stage, task?, reason, dirtyFiles? } | null,
  finalVerify,
  finalReview,
}
```

## 8. Schema 清单

以下 schema 为固定签名，字段名不得改动，下游步骤按字段名汇总问题：

| Schema | 关键字段 |
|---|---|
| `PREFLIGHT_SCHEMA` | `branch`、`headSha`、`clean`、`dirtyFiles`、`branchMatches` |
| `TASK_LIST_SCHEMA` | `stage`、`stageTitle`、`headSha`、`clean`、`dirtyFiles`、`tasks[]` |
| `TEST_SCHEMA` | `status`（`TESTS_WRITTEN` / `NOT_APPLICABLE` / `BLOCKED` / `NEEDS_CONTEXT`）、`baseSha`、`summary`、`redPhase`、`testFiles` |
| `TEST_REVIEW_SCHEMA` | `verdict`、`necessary`、`sufficient`、`alignment`、`redValidity` |
| `IMPL_SCHEMA` | `status`、`baseSha`、`summary`、`redPhase`、`greenPhase`、`changedFiles` |
| `SPEC_SCHEMA` | `status`、`missing`、`extra`、`designDeviations`、`dataRisks` |
| `QUALITY_SCHEMA` | `verdict`、`critical`、`important`、`minor` |
| `COMMIT_SCHEMA` | `committed`、`sha`、`commitMessage`、`stagedFiles`、`cleanAfter`、`error` |
| `STAGE_REVIEW_SCHEMA` | `verdict`、`coverage`、`integration`、`issues`、`fixTasks` |
| `VERIFY_SCHEMA` | `passed`、`command`、`summary`、`failures` |
| `FINAL_SCHEMA` | `verdict`、`requirementStatus`、`integrationStatus`、`architectureStatus`、`verificationStatus`、`issues`、`fixTasks` |
| `MERGE_SCHEMA` | `merged`、`conflict`、`conflictFiles`、`baseHeadBefore`、`baseHeadAfter`、`mergeSha`、`devHead`、`cleanAfter` |

所有子代理都通过 `call(kind, prompt, opts)` 发起，由 `CALL_PHASE` 决定 phase、由 `CFG.efforts` 决定 effort，脚本中不直接调用 `agent()`。每个调用必须传入对应 schema；没有 schema 的调用只允许用于返回短文本的只读步骤（读取 SHA、追加修复 Task 的标题列表）。

## 9. effort 配置

`CFG.efforts` 控制每类调用的 reasoning effort，`model` 不配置，始终继承主 agent。

- 取值顺序：`efforts.calls[kind]` → `efforts.phases[phase]` → 不传 effort（继承主 agent）
- 调用类型与 phase 的对应关系固定在 `CALL_PHASE` 中，不随项目修改

| Phase | 调用类型 | 默认 effort |
|---|---|---|
| Scout | `preflight`、`readSha` | low |
| Scout | `scout` | medium（calls 覆盖） |
| TestDesign | `test` | high |
| TestReview | `testReview` | high |
| TestFix | `testFix` | high |
| Implement | `impl` | high |
| ImplReview | `spec`、`quality` | high |
| ImplFix | `reviewFix` | high |
| Commit | `commit`、`stageStatus` | low |
| StageRev | `stageReview`、`finalReview` | xhigh |
| StageRev | `append` | medium（calls 覆盖） |
| Verify | `verify` | low |
| Merge | `merge` | low |

`readSha` 在收尾时以 Verify phase 展示，effort 仍按其调用类型取值。

### agent label

label 统一为 `{前缀}: S{stage} T{group}-{task} #{n}`，由 `taskTag` 与 `nth` 生成：

- `T{group}-{task}` 取 Task id 去掉 `Task ` 前缀，修复 Task 为 `T{stage}-修复N`
- `#n` 表示第 n 次修复、复审或阻塞重试，首次执行不带 `#`
- 不针对单个 Task 的调用只保留 `S{stage}`；收尾修复用 `S{stage} final`，最终验证与最终审查用 `final`

| Phase | 前缀 | 示例 |
|---|---|---|
| Scout | `Scout` | `Scout: preflight`、`Scout: S2`、`Scout: S2 #1`（追加修复后重扫） |
| TestDesign | `Test` | `Test: S2 T3-2`、`Test: S2 T3-2 #1`（阻塞重试） |
| TestReview | `TestRev` | `TestRev: S2 T3-2`、`TestRev: S2 T3-2 #1`（复审） |
| TestFix | `TestFix` | `TestFix: S2 T3-2 #1` |
| Implement | `Impl` | `Impl: S2 T3-2` |
| ImplReview | `Spec`、`Quality` | `Spec: S2 T3-2`、`Quality: S2 T3-2 #1` |
| ImplFix | `ImplFix` | `ImplFix: S2 T3-2 #1` |
| Commit | `Commit` | `Commit: S2 T3-2`、`Commit: S2`（Stage 状态 amend） |
| StageRev | `StageRev` | `StageRev: S2`、`StageRev: S2 #1`、`StageRev: S2 append #1`、`StageRev: final` |
| Verify | `Verify` | `Verify: S2`、`Verify: S2 #1`、`Verify: final #1` |
| Merge | `Merge` | `Merge: S2` |

## 10. 恢复与重跑

- 中断后优先用 `resumeFromRunId` 复用未变化的调用，避免重复实现已提交的 Task
- 恢复前先确认工作区状态与 HEAD，已提交的 Task 不会因为重跑而重复提交
- 计划进度清单是唯一可信的完成标记，历史报告不构成完成证据
- 改动脚本后不得沿用旧 runId 声称原结果

中断发生在 Task 提交之前（TestDesign 到 ImplReview 之间）时，工作区会残留该 Task 未提交的测试或实现，重跑时 preflight 会因工作区不干净而停止。处理步骤：

1. 用 `git status --short` 与 `git diff` 列出残留改动，对照 `blocked.task` 与计划确认属于哪个 Task
2. 把残留文件、所属 Task、是否已有红阶段或绿阶段证据报告给用户
3. 由用户决定：保留改动并手动完成该 Task 的提交后重跑，或由用户自行丢弃改动后重跑；不得自动执行 `git stash`、`git reset`、`git clean`、`git restore`
4. 中断发生在 Stage 状态 amend 或合并阶段时，先确认 `y` 的 HEAD、`x` 的 HEAD 与索引执行状态，再决定从哪个 Stage 重跑

## 11. 生成前自查

生成脚本后逐项确认：

1. `meta` 是纯字面量，phases 十一项且顺序正确
2. `CFG` 中的路径、分支、验证命令都来自实际文件，没有占位符残留
3. `CALL_PHASE` 中的 phase 值都在 `meta.phases` 中存在，除 `call` 内部外没有直接调用 `agent()`
4. `parallel` 只出现在 ImplReview phase 的规格与质量审查，没有 `pipeline` / `isolation`
5. 每个审查循环都有轮次上限与超限返回值；TestReview 通过才进入 Implement，ImplReview 循环两个审查都通过才返回成功，minor 不触发修复
6. 每条停止路径都写入 `blocked` 并 `break`
7. Git 写操作只出现在 `Commit` 与 `Merge` phase 的提示中
8. 测试编写者、测试审查者、实现者与审查者的提示包含禁止 Git 写操作的约束；测试编写者与测试修复者禁止改生产代码，实现者禁止删改测试
9. 最终验证与最终审查只在配置的最后一个 Stage 执行，位于状态 amend 与合并之前，验证通过后才审查；收尾修复后先复审再重新验证，三类修复共享 `finalRepairs`
10. Stage 验证失败不直接停止，只作为 Stage 审查的输入
11. 脚本没有使用 `Date.now()`、`Math.random()` 或其它不可恢复的调用
12. `CFG.efforts` 的键都是 `meta.phases` 中的 phase 或 `CALL_PHASE` 中的调用类型，没有配置 `model`
