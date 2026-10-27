export const meta = {
  name: '<WORKFLOW_NAME>',
  description: '<WORKFLOW_DESCRIPTION>',
  whenToUse: '<WHEN_TO_USE>',
  phases: [
    { title: 'Scout', detail: '基线检查，记录 Stage 基线并提取未完成 Task 全文' },
    { title: 'TestDesign', detail: '先只写会失败的目标测试，确认红阶段原因正确' },
    { title: 'Implement', detail: '在已有失败测试上实现功能使其转绿，不执行 Git 写操作' },
    { title: 'SpecReview', detail: '审查差异是否符合 Task 与设计，无计划外内容' },
    { title: 'QualityReview', detail: '规格通过后审查代码质量' },
    { title: 'Commit', detail: '更新计划进度并提交当前 Task，Stage 状态 amend' },
    { title: 'StageReview', detail: 'Stage 整体审查与最终审查，必要时追加修复 Task' },
    { title: 'Verify', detail: 'Stage 记录性验证与最终全量验证' },
    { title: 'Merge', detail: '按配置 --no-ff 合并回基线分支' },
  ],
}

// smart-exec-plan-workflow 的固定模板。生成时只替换 meta 中的占位符与下方 CFG 配置块，
// 流程编排、schema、审查循环与停止条件保持原样，避免每个项目各自发明流程。
//
// 占位符清单：
//   <WORKFLOW_NAME> <WORKFLOW_DESCRIPTION> <WHEN_TO_USE>
//   <REPO> <INDEX> <CONTEXT> <FULL_VERIFY> <DEV_BRANCH> <BASE_BRANCH>
//   plans / designs 按 Stage 编号补全；没有索引或术语表时置为空字符串，没有设计文件时置为 null

const CFG = {
  repo: '<REPO>',
  index: '<INDEX>',
  context: '<CONTEXT>',
  fullVerify: '<FULL_VERIFY>',
  devBranch: '<DEV_BRANCH>',
  baseBranch: '<BASE_BRANCH>',
  // 开发分支与基线分支同名时无法合并，必须显式置为 false，preflight 会拦截这种配置。
  mergeEnabled: true,
  stages: [1],
  plans: {
    1: '<PLAN_1>',
  },
  designs: {
    1: null,
  },
  limits: {
    reviewRounds: 4,
    stageRepairs: 3,
    finalRepairs: 3, // 收尾阶段验证失败、Stage 复审与最终审查三类修复共享该上限
    implRetries: 1,
  },
}

const planPath = (stage) => CFG.plans[stage]
const designPath = (stage) => CFG.designs[stage] || null

// 术语表与设计文件可能不存在，统一降级，避免每个 prompt 各写一遍判断。
const contextLine = CFG.context ? `- 术语表：${CFG.context}` : '- 术语表：本项目未提供'
const designLine = (stage) =>
  designPath(stage) ? `- Stage ${stage} 设计：${designPath(stage)}` : `- Stage ${stage} 设计：未提供设计文件，以计划与需求索引为准`

const GIT_BAN =
  '禁止执行任何 Git 写操作：git add、git commit、git amend、git switch、git checkout、git merge、git rebase、git reset、git stash、git clean、git restore。只允许只读命令（git status、git diff、git log、git rev-parse、git show）。提交与分支操作由独立步骤完成。'

const GIT_RULES = '仓库约定：bash 命令不要用 && 串联多条命令；Python 用 uv；前端包管理用 pnpm；禁止 emoji；不写计划外的总结文档。'

// Stage 验证只做记录：失败是否阻塞由 Stage 审查归因（后续 Stage 未实现导致的失败不算本 Stage 问题）。
// 只有最终验证必须全绿，失败时先追加修复 Task 再重跑。
const verifyText = (verify) => {
  if (!verify) return '未取得验证结果'
  const head = `命令 ${verify.command}：${verify.passed ? '通过' : '未通过'}。${verify.summary}`
  const failures = verify.failures && verify.failures.length ? `\n失败项：\n${verify.failures.join('\n')}` : ''
  return head + failures
}

const extraContextFor = (stage, prev) =>
  `上一次返回 ${prev.status}：${prev.missingContext || prev.blockingReason}。补充：读 ${designPath(stage) || planPath(stage)} 全文与 ${planPath(stage)} 中相邻 Task 的依赖说明；仍无法判断时返回 BLOCKED 说明需要哪项计划外决策。`

const TASK_LIST_SCHEMA = {
  type: 'object',
  properties: {
    stage: { type: 'number' },
    stageTitle: { type: 'string' },
    headSha: { type: 'string' },
    clean: { type: 'boolean' },
    dirtyFiles: { type: 'array', items: { type: 'string' } },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          commitMessage: { type: 'string' },
          files: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'title', 'body', 'commitMessage', 'files'],
      },
    },
  },
  required: ['stage', 'stageTitle', 'headSha', 'clean', 'dirtyFiles', 'tasks'],
}

const PREFLIGHT_SCHEMA = {
  type: 'object',
  properties: {
    branch: { type: 'string' },
    headSha: { type: 'string' },
    clean: { type: 'boolean' },
    dirtyFiles: { type: 'array', items: { type: 'string' } },
    branchMatches: { type: 'boolean' },
  },
  required: ['branch', 'headSha', 'clean', 'dirtyFiles', 'branchMatches'],
}

const IMPL_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED', 'NEEDS_CONTEXT'] },
    baseSha: { type: 'string' },
    summary: { type: 'string' },
    redPhase: { type: 'string' },
    greenPhase: { type: 'string' },
    changedFiles: { type: 'array', items: { type: 'string' } },
    blockingReason: { type: 'string' },
    missingContext: { type: 'string' },
  },
  required: ['status', 'baseSha', 'summary', 'changedFiles'],
}

// 测试编写阶段只产出失败测试，因此没有 greenPhase；changedFiles 换成 testFiles，
// 便于实现阶段与审查阶段区分“谁写的测试”。
// NOT_APPLICABLE 只用于计划中该 Task 明确没有测试 Step 的纯文档、静态资源或无行为配置，避免编写虚假测试。
const TEST_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['TESTS_WRITTEN', 'NOT_APPLICABLE', 'BLOCKED', 'NEEDS_CONTEXT'] },
    baseSha: { type: 'string' },
    summary: { type: 'string' },
    redPhase: { type: 'string' },
    testFiles: { type: 'array', items: { type: 'string' } },
    blockingReason: { type: 'string' },
    missingContext: { type: 'string' },
  },
  required: ['status', 'baseSha', 'summary', 'redPhase', 'testFiles'],
}

const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['SPEC_COMPLIANT', 'NEEDS_CHANGES'] },
    missing: { type: 'array', items: { type: 'string' } },
    extra: { type: 'array', items: { type: 'string' } },
    designDeviations: { type: 'array', items: { type: 'string' } },
    dataRisks: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'missing', 'extra', 'designDeviations', 'dataRisks'],
}

const QUALITY_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['APPROVED', 'NEEDS_CHANGES'] },
    critical: { type: 'array', items: { type: 'string' } },
    important: { type: 'array', items: { type: 'string' } },
    minor: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'critical', 'important', 'minor'],
}

const COMMIT_SCHEMA = {
  type: 'object',
  properties: {
    committed: { type: 'boolean' },
    sha: { type: 'string' },
    commitMessage: { type: 'string' },
    stagedFiles: { type: 'array', items: { type: 'string' } },
    cleanAfter: { type: 'boolean' },
    error: { type: 'string' },
  },
  required: ['committed', 'sha', 'stagedFiles', 'cleanAfter'],
}

const STAGE_REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['APPROVED', 'NEEDS_CHANGES'] },
    coverage: { type: 'string' },
    integration: { type: 'string' },
    issues: { type: 'array', items: { type: 'string' } },
    fixTasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          files: { type: 'array', items: { type: 'string' } },
          commitMessage: { type: 'string' },
        },
        required: ['title', 'body', 'files', 'commitMessage'],
      },
    },
  },
  required: ['verdict', 'coverage', 'integration', 'issues', 'fixTasks'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    command: { type: 'string' },
    summary: { type: 'string' },
    failures: { type: 'array', items: { type: 'string' } },
  },
  required: ['passed', 'command', 'summary', 'failures'],
}

const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['APPROVED', 'NEEDS_CHANGES'] },
    requirementStatus: { type: 'string' },
    integrationStatus: { type: 'string' },
    architectureStatus: { type: 'string' },
    verificationStatus: { type: 'string' },
    issues: { type: 'array', items: { type: 'string' } },
    // 与 Stage 审查同构，收尾修复直接按草案追加进最后一个 Stage 的计划。
    fixTasks: STAGE_REVIEW_SCHEMA.properties.fixTasks,
  },
  required: ['verdict', 'requirementStatus', 'integrationStatus', 'architectureStatus', 'verificationStatus', 'issues'],
}

const MERGE_SCHEMA = {
  type: 'object',
  properties: {
    merged: { type: 'boolean' },
    conflict: { type: 'boolean' },
    conflictFiles: { type: 'array', items: { type: 'string' } },
    baseHeadBefore: { type: 'string' },
    baseHeadAfter: { type: 'string' },
    mergeSha: { type: 'string' },
    devHead: { type: 'string' },
    cleanAfter: { type: 'boolean' },
    error: { type: 'string' },
  },
  required: ['merged', 'conflict', 'conflictFiles', 'baseHeadBefore', 'baseHeadAfter', 'devHead', 'cleanAfter'],
}

const preflightPrompt = () => `你在执行 smart-exec-plan-workflow 的基线检查。仓库 ${CFG.repo}，工作目录即仓库根。

执行：
1. git rev-parse --abbrev-ref HEAD
2. git rev-parse HEAD
3. git status --short

判定：
- branchMatches：当前分支是否为 ${CFG.devBranch}
- clean：是否没有已修改、已暂存与未跟踪文件。\`.claude/\` 下的本地工作流文件不入库，出现 \`?? .claude/\` 不算脏。
- dirtyFiles 列出导致不干净的具体路径。

只返回结构化结果，不修改任何文件。`

const readShaPrompt = (ref) => `仓库 ${CFG.repo}：执行 git rev-parse ${ref}，只返回 SHA 文本。不要修改任何文件。`

const scoutPrompt = (stage) => `你是 smart-exec-plan-workflow 的执行侦察步骤。仓库 ${CFG.repo}，工作目录即仓库根。当前应位于分支 ${CFG.devBranch}。

任务：读取 Stage ${stage} 的实现计划，产出当前仍未完成的 Task 列表。

必须读取：
- ${planPath(stage)}（实现计划，含 Task Group 提交信息表与进度清单）
${designLine(stage)}
${CFG.index ? `- ${CFG.index}（需求索引中 Stage ${stage} 的目标与成功标准）` : ''}
${contextLine}

步骤：
1. 执行 git rev-parse HEAD 得到当前 HEAD；执行 git status --short 判断工作区是否干净，并在 dirtyFiles 列出脏文件。
2. 按进度清单顺序找出所有 \`- [ ]\` 未完成 Task，一个也不遗漏。
3. 对每个未完成 Task，从计划正文复制完整 Task 正文（依赖、文件、提交信息、全部 Step），不要摘要，不要补充计划里没有的行号或细节。
4. commitMessage 取该 Task 的“提交信息”代码段内容；与 Group 提交信息表冲突时以 Task 自身为准，并在 body 末尾追加一行说明实际采用哪条。
5. files 列出该 Task 允许修改的文件（修改、新增、测试）。
6. 进度清单与正文 Task 数量或标题不一致时以正文为准，并保留清单原始条目文本，供后续勾选。

输出严格符合 schema。不要修改任何文件。`


const taskContext = ({ stage, task, extraContext }) => `## 上下文

${CFG.index ? `- 完整需求索引：${CFG.index}` : ''}
${designLine(stage)}（先读与本 Task 相关章节）
${contextLine}
- 允许修改的文件：${task.files.join('、')}
- 计划文件：${planPath(stage)}（只读，进度由提交步骤更新）
${extraContext ? `- 补充上下文：\n${extraContext}` : ''}`

// TDD 拆成两个独立代理：测试编写者只改测试文件、不碰生产代码；
// 功能实现者只改生产代码、不改测试。这样“红阶段有效”由工作区里的客观事实保证，
// 而不是由写实现的人自己声称。
const testPrompt = ({ stage, task, extraContext }) => `你在为 ${task.id}：${task.title} 编写失败测试（TDD 红阶段）。这是 smart-exec-plan 的一个 Task，仓库 ${CFG.repo}，当前分支 ${CFG.devBranch}。

本阶段只写测试，不写功能实现。

## Task 完整说明

${task.body}

${taskContext({ stage, task, extraContext })}

## 开始前检查

1. 先执行 git rev-parse HEAD，把它作为 baseSha 返回。
2. 读取目标文件的导出与公共接口，读取直接调用方，查找已有可复用工具与测试模式。
3. 确认计划描述的文件、函数、字段与实际代码一致。

## 要求

1. 调用 test-driven-development 技能，只做红阶段。
2. 按 Task 的测试 Step 写出覆盖正常路径、边界条件与异常路径的测试，断言必须针对真实行为，不要只断言 mock 被调用。
3. 测试要因目标行为缺失而失败，失败原因必须是“功能未实现”（导入失败、属性不存在、返回值不符、断言不成立），不能是测试自身的语法错误、拼写错误或测试环境问题。
4. 运行这些测试，把真实输出记入 redPhase，写清失败的是哪一条断言、为什么这个失败证明目标行为缺失。
5. 只修改测试文件，严禁修改生产代码。需要生产代码配合才能写测试时，按最终接口写出调用，让它自然失败。
6. 不实现任何功能，不为了让测试通过而加桩代码、条件分支或临时实现。
7. 不要修改计划文件的进度勾选。
8. 计划中该 Task 明确没有测试 Step，且只涉及纯文档、静态资源或无行为配置时，返回 NOT_APPLICABLE，redPhase 写明依据，testFiles 返回空数组，不要编写虚假测试。

${GIT_BAN}

${GIT_RULES}

## 返回

状态只能是 TESTS_WRITTEN、NOT_APPLICABLE、BLOCKED、NEEDS_CONTEXT。需要计划外架构决策、计划与代码冲突、需要修改允许范围外文件、无法构造正确的失败测试时，返回 BLOCKED 或 NEEDS_CONTEXT 并说明原因，不要猜测。`

const testFilesText = (testReport) =>
  testReport && testReport.testFiles && testReport.testFiles.length ? testReport.testFiles.join('、') : '无（本 Task 不适用测试）'

const implPrompt = ({ stage, task, testReport, extraContext }) => `你在实现 ${task.id}：${task.title}（TDD 绿阶段）。这是 smart-exec-plan 的一个 Task，仓库 ${CFG.repo}，当前分支 ${CFG.devBranch}。

失败测试已由前一步写好并已验证为有效红阶段，本阶段让它们通过。

## Task 完整说明

${task.body}

## 已有的失败测试

- 测试文件：${testFilesText(testReport)}
- 红阶段记录：${testReport.redPhase || '未记录'}
- 测试编写者摘要：${testReport.summary || '无'}

这些测试即本 Task 的验收标准。不要删除、跳过、弱化或改写它们来迎合实现；确认某条测试与 Task 要求不符时，先说明理由再改，并在 summary 中列出改了哪条、与本 Task 的哪句要求冲突。

${taskContext({ stage, task, extraContext })}

## 开始前检查

1. 执行 git rev-parse HEAD，确认仍等于测试阶段的 baseSha ${testReport.baseSha}，把它作为 baseSha 返回。
2. 读取目标文件的导出与公共接口，读取直接调用方，查找已有可复用工具与测试模式。
3. 确认计划描述的文件、函数、字段与实际代码一致。

## 实现要求

1. 调用 test-driven-development 技能，只做绿阶段与重构：写最小实现让失败测试转绿，转绿后再整理代码。
2. 只实现当前 Task，不实现后续 Task 的职责。
3. 使用设计规定的最终接口与命名，不引入开发期兼容层（新旧接口并存、adapter、双读双写、临时 schema、feature flag 分批切换）。
4. 当前 Task 不是部署边界：完整构建或服务可以暂时不可用，前提是未完成部分明确属于后续已定义 Task。当前 Task 自己新增或修改的测试必须全部通过，数据不得丢失或损坏。
5. 优先修改生产代码让测试通过，不要修改测试。
6. 运行计划中该 Task 列出的验证命令，把真实输出记入 greenPhase。
7. 自审实际差异后返回。

${GIT_BAN}

${GIT_RULES}

## 返回

状态只能是 DONE、DONE_WITH_CONCERNS、BLOCKED、NEEDS_CONTEXT。需要计划外架构决策、计划与代码冲突、需要修改允许范围外文件时，返回 BLOCKED 或 NEEDS_CONTEXT 并说明原因，不要猜测。`

const fixPrompt = ({ task, reviewKind, issues, testReport }) => `你在修复 ${task.id}：${task.title} 的${reviewKind}问题。仓库 ${CFG.repo}，当前分支 ${CFG.devBranch}。审查已发现下列问题，全部修正后重新运行该 Task 的目标测试。

## 问题清单

${issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}

## Task 要求（用于判断修复边界）

${task.body}

## 已存在的验收测试

${testFilesText(testReport)}

这些测试是红阶段产物，除非审查问题明确指出测试本身有误，否则不要删改或弱化它们来让审查通过。

只修上述问题，不扩大到后续 Task，不引入开发期兼容层。计划文件不要改动，进度由提交步骤更新。

${GIT_BAN}

${GIT_RULES}

返回同样符合 schema：status、baseSha（保持原 BASE_SHA 不变）、summary、redPhase、greenPhase、changedFiles。`

const specPrompt = ({ stage, task, baseSha, impl }) => `你在做 ${task.id}：${task.title} 的规格审查（先于代码质量审查）。仓库 ${CFG.repo}。

## 输入

- Task 完整说明：\n${task.body}
${designLine(stage)}
${CFG.index ? `- 需求索引：${CFG.index}` : ''}
- 实现者报告：status=${impl.status}；summary=${impl.summary}；changedFiles=${impl.changedFiles.join('、')}
- BASE_SHA：${baseSha}
- 计划文件 ${planPath(stage)} 中本 Stage 后续 Task 用于判断哪些集成由后续承担

## 独立验证

不要信任实现者报告。读取：git status --short、git diff ${baseSha}、git diff --stat ${baseSha}，以及 status 中列出的新增未跟踪文件。

## 检查

1. 缺失要求：Task 每项要求、计划规定的测试与边界行为是否实现。
2. 多余内容：是否实现后续 Task 职责、是否增加最终需求未要求的功能、是否过度抽象。
3. 最终状态设计：是否使用设计定义的最终接口与命名，是否偏离术语表。
4. 开发期兼容机制：新旧接口并存、adapter、双读双写、临时 schema、feature flag 分批迁移、为中间服务保留的旧调用链。除非设计明确要求长期兼容，否则判为多余实现。
5. 数据安全：是否可能丢失、重复或错误转换数据，计划要求的数据保护是否实现。
6. 计划进度勾选、只读文件是否被误改。

当前 Task 无法完整构建、服务无法启动、旧调用方暂时不可用，本身不是问题；只有当前 Task 自身职责缺失，或未完成内容没有后续 Task 承担，才判 NEEDS_CHANGES。

不要修改任何文件，不要执行 Git 写操作。输出严格符合 schema。`

const qualityPrompt = ({ stage, task, baseSha, impl, testReport }) => `你在做 ${task.id}：${task.title} 的代码质量审查（规格审查已通过）。仓库 ${CFG.repo}。

## 输入

- Task 摘要：${task.title}
${designLine(stage)}
- BASE_SHA：${baseSha}
- 测试文件（红阶段由独立测试编写者产出）：${testFilesText(testReport)}
- 测试结果：红阶段 ${(testReport && testReport.redPhase) || '未记录'}；绿阶段 ${impl.greenPhase || '未记录'}
- 若实现者改动了上述测试文件，核对其 summary 是否给出与 Task 要求冲突的理由；无理由的弱化判为 critical。

## 审查范围

读取 git status --short、git diff --stat ${baseSha}、git diff ${baseSha}，以及状态中列出的新增未跟踪文件。只审查本 Task 产生的差异，不报告未修改的既有问题。

## 检查

1. 正确性：逻辑、边界与错误条件、数据损坏或无声吞错。
2. 清晰度与维护性：命名是否符合术语表，职责是否清晰，是否有重复或不必要抽象，是否遵循代码库已有模式。
3. 测试质量：是否观察到有效红阶段，是否有真实行为断言而不是只断言 mock，正常/边界/错误是否覆盖。
4. 文件范围：是否只改允许文件，新文件是否有明确职责，是否漏查直接调用方。
5. 最终状态优先：标记新旧接口并存、adapter、双读双写、临时 schema、feature flag 迁移与旧调用链保留。

当前 Task 无法完整构建或无法部署不是质量问题，前提是未完成集成属于后续 Task；本 Task 自身测试失败、计划外失败或数据风险仍阻塞。

不要修改任何文件，不要执行 Git 写操作。输出严格符合 schema。`

const commitPrompt = ({ stage, task, allowPlanAppend }) => `你负责提交 ${task.id}：${task.title}。仓库 ${CFG.repo}，当前分支 ${CFG.devBranch}。实现、规格审查、质量审查均已通过。

## 步骤

1. 读取 ${planPath(stage)}，把进度清单中 “${task.id}” 对应的 \`- [ ]\` 改为 \`- [x]\`，只改这一行。${allowPlanAppend ? '计划末尾已追加的修复 Task 小节一并保留，不要删除。' : ''}
2. git status --short，确认待提交内容只包含本 Task 的代码、测试与计划进度更新；出现无关文件时不要提交，返回 committed=false 并说明。\`.claude/\` 下的本地工作流文件不入库，忽略即可，不得 git add。
3. git add 只添加这些文件与 ${planPath(stage)}（不要 git add -A，不要 git add .）。
4. 使用下面提交信息提交，标题与正文之间空一行，正文末尾追加 trailer 行 \`Co-Authored-By: Claude <noreply@anthropic.com>\`：

标题：${task.commitMessage.split('\n')[0]}
${task.commitMessage.split('\n').slice(1).join('\n') || '（按计划补充中文正文，说明本 Task 的行为变化）'}

5. 提交后执行 git status --short 确认工作区干净，并用 git rev-parse HEAD 取 sha。

${GIT_RULES}

不要修改任何生产代码或测试，不要 amend 历史，不要 push。输出严格符合 schema。`

const stageStatusPrompt = (stage) => `你在更新 Stage ${stage} 的执行状态。仓库 ${CFG.repo}，当前分支 ${CFG.devBranch}。

步骤：
1. 读取 ${CFG.index}，找到 “#### Stage ${stage}：” 小节中的 “- 执行状态：” 行，改为 “- 执行状态：已完成”。只改这一行。
2. git status --short，确认只有 ${CFG.index} 被修改；出现其他改动时不要提交，返回 committed=false 并说明。
3. git add ${CFG.index}
4. git commit --amend --no-edit
5. git rev-parse HEAD 取 amend 后的 SHA，再执行 git status --short 确认工作区干净。

${GIT_RULES}

不要修改计划文件、代码或测试。输出严格符合 schema。`

const stageAppendPrompt = ({ stage, review, source = 'Stage 审查返回 NEEDS_CHANGES' }) => `你在为 Stage ${stage} 追加修复 Task。仓库 ${CFG.repo}，当前分支 ${CFG.devBranch}。

${source}，问题如下：

${review.issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}
${(review.fixTasks || []).length ? `\n审查者已给出修复 Task 草案，按草案落笔，缺失字段自行补全：\n${review.fixTasks.map((t, i) => `${i + 1}. ${t.title}\n   文件：${(t.files || []).join('、')}\n   提交信息：${t.commitMessage}\n   正文：${t.body}`).join('\n')}` : ''}

步骤：
1. 读取 ${planPath(stage)}，在文件末尾“## Stage 审查”之前追加 “### Task ${stage}-修复N：标题” 小节，一个修复 Task 对应一个 Draft，包含 **依赖**、**文件**、**提交信息**、#### Step 1 编写失败测试 / #### Step 2 实现最终行为 / #### Step 3 验证与整理，格式与既有 Task 完全一致。
2. 同时在进度清单末尾追加对应的 \`- [ ] Task ${stage}-修复N：标题\`，顺序与正文一致。
3. 修复 Task 必须有明确文件、行为、测试与提交信息，不新增设计决策。问题之间存在依赖时在 **依赖** 中写明先后。

只修改计划文件，不改代码，不执行 git add 或 git commit。完成后返回新增 Task 标题，每行一个。`

const verifyPrompt = (label) => `你在执行全量验证（${label}）。仓库 ${CFG.repo}。

运行：
cd ${CFG.repo}
${CFG.fullVerify}

这是记录性验证，结果交给后续审查判断：失败时引用真实输出片段，不要猜测原因，不要自行修复，也不要因失败中止。输出严格符合 schema。`

// finalState=true 用于收尾复审：此时全部 Stage 已完成，不再有“归属后续 Stage”的豁免，
// 也不附验证结果，因为复审通过后会重新执行最终全量验证。
const stageReviewPrompt = ({ stage, stageBaseSha, verify, previousIssues, finalState = false }) => `你在${previousIssues ? '复审' : '审查'} Stage ${stage} 的整体实现。仓库 ${CFG.repo}。

## 输入

${CFG.index ? `- 需求索引：${CFG.index}` : ''}
${designLine(stage)}
- Stage 计划：${planPath(stage)}
- STAGE_BASE_SHA：${stageBaseSha}
- HEAD_SHA：用 git rev-parse HEAD 获取
${previousIssues ? `\n## 上一轮问题\n\n${previousIssues.join('\n')}\n\n修复 Task 已提交，逐条确认是否解决，并检查修复是否引入新问题。\n` : ''}
${finalState ? `## 收尾状态

这是收尾阶段追加修复 Task 后的复审，全部 Stage 已完成，此时就是最终状态，不再存在“归属后续 Stage”的豁免。任何缺失、断连调用或过渡代码都计入 issues。复审通过后会重新执行最终全量验证。
` : `## 全量验证结果（记录性，非阻塞）

${verifyText(verify)}

验证失败本身不构成阻塞项。先归因：失败是否由本 Stage 的代码或测试缺陷造成，还是由后续 Stage 尚未实现的部分造成。
只有归因到本 Stage 的失败才计入 issues 并要求修复；属于后续 Stage 责任的失败在 coverage 中说明“归属后续 Stage”，不要求本 Stage 修复。
确实无法归因时按保守口径处理：写明判断依据与不确定性，不要臆断。
`}
## 范围

阅读 git diff ${stageBaseSha}..HEAD 与当前代码，不要信任计划勾选或历史报告。

## 检查

1. 设计覆盖：本 Stage 每项职责是否完成，计划的 Task 是否都有实际实现，是否遗漏接口、数据、错误处理或测试。
2. Task 间集成：各 Task 建立的接口与数据结构是否一致，是否有断连调用或重复职责，是否为后续 Stage 提供约定产物。
3. 最终状态方向：是否朝全部 Stage 完成后的最终架构推进，是否引入设计未要求的新旧接口并存、adapter、双读双写、临时 schema、feature flag 迁移或旧调用链。
4. 数据安全：是否可能丢失、重复或错误转换数据。

${finalState ? '' : 'Stage 不是部署边界：整体构建暂时失败、服务暂时无法启动、后续 Stage 负责的调用方未迁移本身不是问题。\n'}
若 NEEDS_CHANGES，在 issues 中给出可直接执行的问题条目，在 fixTasks 中给出对应的修复 Task（标题、完整正文、文件、提交信息）。

不要修改文件，不要执行 Git 写操作。输出严格符合 schema。`

const finalPrompt = ({ base, head }) => `你在做全需求的最终审查。仓库 ${CFG.repo}。

## 输入

${CFG.index ? `- 需求索引：${CFG.index}` : ''}
- 全部设计：${CFG.stages.map((s) => designPath(s)).filter(Boolean).join('、') || '未提供设计文件'}
- 全部计划：${CFG.stages.map(planPath).join('、')}
${contextLine}
- IMPLEMENTATION_BASE_SHA：${base}
- HEAD_SHA：${head}

## 审查范围

阅读 git diff ${base}..${head} 与最终代码，不要信任计划勾选或历史报告。

## 检查

1. 完整需求：需求索引中每项成功标准是否满足，明确排除的功能是否没有实现，全部 Stage 职责是否完成。
2. 跨 Stage 集成：组件接口、数据结构、错误类型是否一致，数据流是否符合设计，是否存在断连调用链或未迁移调用方。
3. 最终架构：是否符合设计的最终结构，术语是否与术语表一致，旧实现、临时接口、过渡代码是否清除。
4. 数据安全：迁移与最终约束是否正确，是否会丢失、重复或错误转换数据。

若 NEEDS_CHANGES，在 issues 中给出问题条目，在 fixTasks 中给出可直接执行的修复 Task（标题、完整正文、文件、提交信息），修复会追加到最后一个 Stage 的计划。

不要修改文件，不要执行 Git 写操作。输出严格符合 schema。`

const mergePrompt = ({ stage, expectedBaseSha }) => `你在执行 Stage ${stage} 的分支合并。仓库 ${CFG.repo}。

设原分支 x=${CFG.baseBranch}，开发分支 y=${CFG.devBranch}。

## 步骤

1. 执行 git switch ${CFG.baseBranch}
2. 执行 git rev-parse HEAD，确认等于 ${expectedBaseSha}。不一致时不要合并，返回 merged=false 并在 error 中说明两个 SHA。
3. 执行 git merge --no-ff ${CFG.devBranch}，合并信息：

merge: 完成 Stage ${stage}

集成 Stage ${stage} 的全部 Task、测试及进度记录。

4. 出现冲突时执行 git merge --abort，返回 conflict=true 并列出冲突文件，不要自行选择冲突内容。
5. 合并成功后记录 merge commit SHA，执行 git switch ${CFG.devBranch} 回到开发分支。
6. 执行 git status --short 确认工作区干净。

${GIT_RULES}

不要修改任何文件，不要 push，不要删除分支。输出严格符合 schema。`


const fail = (blocked) => {
  report.blocked = blocked
}

async function runReviewLoop(kind, task, stage, baseSha, initialImpl, testReport) {
  const isSpec = kind === 'spec'
  let impl = initialImpl
  for (let round = 0; round < CFG.limits.reviewRounds; round++) {
    const prompt = isSpec
      ? specPrompt({ stage, task, baseSha, impl })
      : qualityPrompt({ stage, task, baseSha, impl, testReport })
    const result = await agent(prompt, {
      label: `${kind}:${task.id}${round ? `#${round}` : ''}`,
      phase: isSpec ? 'SpecReview' : 'QualityReview',
      schema: isSpec ? SPEC_SCHEMA : QUALITY_SCHEMA,
    })
    if (!result) return { ok: false, reason: `${kind} reviewer 无返回` }

    const passed = isSpec ? result.status === 'SPEC_COMPLIANT' : result.verdict === 'APPROVED'
    if (passed) return { ok: true, impl }

    const issues = isSpec
      ? [...result.missing, ...result.extra, ...result.designDeviations, ...result.dataRisks]
      : [...result.critical, ...result.important, ...result.minor]
    if (!issues.length) return { ok: false, reason: `${kind} 审查未通过但未给出具体问题` }
    log(`${task.id} ${isSpec ? '规格' : '质量'}审查 NEEDS_CHANGES（第 ${round + 1} 轮）：${issues.length} 条`)

    const fixed = await agent(fixPrompt({ task, reviewKind: isSpec ? '规格' : '代码质量', issues, testReport }), {
      label: `${kind}-fix:${task.id}#${round + 1}`,
      phase: 'Implement',
      schema: IMPL_SCHEMA,
    })
    if (!fixed) return { ok: false, reason: `${kind} 问题修复无返回` }
    if (fixed.status === 'BLOCKED' || fixed.status === 'NEEDS_CONTEXT') {
      return { ok: false, reason: `${kind} 问题修复失败：${fixed.blockingReason || fixed.missingContext}` }
    }
    impl = fixed
  }
  return { ok: false, reason: `${kind} 审查在 ${CFG.limits.reviewRounds} 轮内未通过` }
}

// 阻塞类返回最多补 implRetries 次上下文，每次都交给全新代理，避免沿用上一次的错误假设。
async function withContextRetry(run, label, phaseName, schema, isBlocked, stage) {
  let result = await agent(run(''), { label, phase: phaseName, schema })
  for (let retry = 0; result && isBlocked(result) && retry < CFG.limits.implRetries; retry++) {
    result = await agent(run(extraContextFor(stage, result)), { label: `${label}-retry#${retry + 1}`, phase: phaseName, schema })
  }
  return result
}

const isBlockedStatus = (result) => result.status === 'BLOCKED' || result.status === 'NEEDS_CONTEXT'

async function implementOneTask(stage, task, allowPlanAppend) {
  // 第一步：只写失败测试。测试编写者不得改生产代码，因此红阶段是工作区里的客观事实。
  const tests = await withContextRetry(
    (extraContext) => testPrompt({ stage, task, extraContext }),
    `test:${task.id}`,
    'TestDesign',
    TEST_SCHEMA,
    isBlockedStatus,
    stage,
  )
  if (!tests) return { ok: false, reason: '测试编写者无返回' }
  if (isBlockedStatus(tests)) return { ok: false, reason: `测试编写阻塞：${tests.blockingReason || tests.missingContext}` }
  if (!tests.baseSha) return { ok: false, reason: `${task.id} 测试编写者未返回 BASE_SHA` }
  if (tests.status === 'TESTS_WRITTEN') {
    if (!tests.redPhase) return { ok: false, reason: `${task.id} 测试编写者未提供红阶段证据` }
    if (!tests.testFiles.length) return { ok: false, reason: `${task.id} 测试编写者未返回测试文件清单` }
    log(`${task.id} 红阶段就绪：${tests.testFiles.length} 个测试文件`)
  } else {
    log(`${task.id} 不适用测试：${tests.redPhase}`)
  }

  // 第二步：让已存在的失败测试转绿。实现者不得删改测试来迎合自己。
  const impl = await withContextRetry(
    (extraContext) => implPrompt({ stage, task, testReport: tests, extraContext }),
    `impl:${task.id}`,
    'Implement',
    IMPL_SCHEMA,
    isBlockedStatus,
    stage,
  )
  if (!impl) return { ok: false, reason: '实现者无返回' }
  if (isBlockedStatus(impl)) return { ok: false, reason: `实现阻塞：${impl.blockingReason || impl.missingContext}` }
  if (tests.status === 'TESTS_WRITTEN' && !impl.greenPhase) return { ok: false, reason: `${task.id} 实现者未提供绿阶段证据` }

  // 审查范围固定从测试阶段开始前的 HEAD 起算，测试与实现差异一起纳入审查。
  const baseSha = tests.baseSha

  const spec = await runReviewLoop('spec', task, stage, baseSha, impl, tests)
  if (!spec.ok) return { ok: false, reason: spec.reason }

  const quality = await runReviewLoop('quality', task, stage, baseSha, spec.impl, tests)
  if (!quality.ok) return { ok: false, reason: quality.reason }

  const commit = await agent(commitPrompt({ stage, task, allowPlanAppend }), {
    label: `commit:${task.id}`,
    phase: 'Commit',
    schema: COMMIT_SCHEMA,
  })
  if (!commit || !commit.committed) return { ok: false, reason: `提交失败：${commit ? commit.error : '无返回'}` }
  if (!commit.cleanAfter) return { ok: false, reason: `${task.id} 提交后工作区不干净` }

  log(`${task.id} 已提交 ${commit.sha.slice(0, 8)}：${(commit.commitMessage || task.commitMessage).split('\n')[0]}`)
  return {
    ok: true,
    sha: commit.sha,
    concerns: quality.impl.status === 'DONE_WITH_CONCERNS' ? quality.impl.summary : '',
  }
}

// allowDirtyPlan：追加修复 Task 后计划文件必然处于未提交状态，此时只允许计划文件是脏的。
async function runStageTasks({ stage, stageReport, allowDirtyPlan, label }) {
  const plan = await agent(scoutPrompt(stage), { label, phase: 'Scout', schema: TASK_LIST_SCHEMA })
  if (!plan) return { ok: false, reason: 'scout 无返回' }

  const unexpected = allowDirtyPlan ? plan.dirtyFiles.filter((file) => file !== planPath(stage)) : plan.dirtyFiles
  if (!plan.clean && unexpected.length) {
    return { ok: false, reason: `工作区存在非计划文件改动：${unexpected.join('、')}` }
  }
  if (allowDirtyPlan && !plan.tasks.length) return { ok: false, reason: '追加修复 Task 后未读到未完成 Task' }

  for (const task of plan.tasks) {
    const result = await implementOneTask(stage, task, allowDirtyPlan)
    if (!result.ok) return { ok: false, taskId: task.id, reason: result.reason }
    stageReport.tasks.push({ id: task.id, sha: result.sha, concerns: result.concerns })
    stageReport.commitShas.push(result.sha)
  }
  return { ok: true, stageTitle: plan.stageTitle }
}

// 追加修复 Task 并走完标准 Task 循环（测试、实现、双审查、提交）。
async function repairWith({ stage, stageReport, issues, fixTasks, source, label }) {
  const appended = await agent(stageAppendPrompt({ stage, review: { issues, fixTasks }, source }), {
    label: `append-${label}`,
    phase: 'StageReview',
  })
  if (!appended) return { ok: false, reason: '追加修复 Task 失败' }
  return runStageTasks({ stage, stageReport, allowDirtyPlan: true, label: `scout-${label}` })
}

const stageList = (args && Array.isArray(args.stages) && args.stages.length ? args.stages : CFG.stages)
  .slice()
  .sort((a, b) => a - b)
const report = {
  implementationBaseSha: null,
  devBranch: CFG.devBranch,
  baseBranch: CFG.baseBranch,
  stages: [],
  blocked: null,
  finalVerify: null,
  finalReview: null,
}

const mergeEnabled = CFG.mergeEnabled && stageList.length > 0
// 最终验证与最终审查只在配置里的最后一个 Stage 执行；通过 args 只跑前几个 Stage 时不触发。
const lastConfiguredStage = CFG.stages.slice().sort((a, b) => a - b)[CFG.stages.length - 1]

const unknownStages = stageList.filter((stage) => !planPath(stage))
if (unknownStages.length) {
  fail({ stage: 'preflight', reason: `Stage ${unknownStages.join('、')} 没有对应计划文件` })
  return report
}
if (mergeEnabled && CFG.devBranch === CFG.baseBranch) {
  fail({ stage: 'preflight', reason: `devBranch 与 baseBranch 同为 ${CFG.devBranch}，无法执行 Stage 合并，请修正 CFG 后重跑` })
  return report
}

// ---- Scout：基线检查，任何不满足都直接停止，不带着脏工作区开始 ----
const preflight = await agent(preflightPrompt(), { label: 'preflight', phase: 'Scout', schema: PREFLIGHT_SCHEMA })
if (!preflight) {
  fail({ stage: 'preflight', reason: '基线检查无返回' })
  return report
}
if (!preflight.branchMatches) {
  fail({ stage: 'preflight', reason: `当前分支 ${preflight.branch} 不是约定的开发分支 ${CFG.devBranch}` })
  return report
}
if (!preflight.clean) {
  fail({ stage: 'preflight', reason: '工作区不干净', dirtyFiles: preflight.dirtyFiles })
  return report
}
report.implementationBaseSha = preflight.headSha
log(`IMPLEMENTATION_BASE_SHA=${preflight.headSha}`)

let expectedBaseSha = ''
if (mergeEnabled) {
  const baseHead = await agent(readShaPrompt(CFG.baseBranch), { label: 'base-head:init', phase: 'Scout' })
  expectedBaseSha = baseHead ? baseHead.trim() : ''
  if (!expectedBaseSha) {
    fail({ stage: 'preflight', reason: `无法读取基线分支 ${CFG.baseBranch} 的 HEAD` })
    return report
  }
}

for (const stage of stageList) {
  const stageReport = {
    stage,
    title: null,
    stageBaseSha: null,
    tasks: [],
    commitShas: [],
    stageReview: null,
    verify: null,
    statusSha: null,
    merge: null,
  }
  // 先登记再执行，任何 break 路径都不需要再补 push，报告里每个 Stage 只出现一次。
  report.stages.push(stageReport)

  const headNow = await agent(readShaPrompt('HEAD'), { label: `base:stage-${stage}`, phase: 'Scout' })
  stageReport.stageBaseSha = headNow ? headNow.trim() : ''
  if (!stageReport.stageBaseSha) {
    fail({ stage, reason: '无法读取 Stage 基线 SHA' })
    break
  }

  const tasks = await runStageTasks({ stage, stageReport, allowDirtyPlan: false, label: `scout:stage-${stage}` })
  if (!tasks.ok) {
    fail({ stage, task: tasks.taskId, reason: tasks.reason })
    break
  }
  stageReport.title = tasks.stageTitle || `Stage ${stage}`

  // ---- Verify：Stage 验证只做记录，交给 Stage 审查归因 ----
  stageReport.verify = await agent(verifyPrompt(`Stage ${stage}`), { label: `verify:stage-${stage}`, phase: 'Verify', schema: VERIFY_SCHEMA })
  if (stageReport.verify && !stageReport.verify.passed) log(`Stage ${stage} 全量验证未通过，交 Stage 审查归因`)

  // ---- StageReview：审查驱动修复，修复后重新验证与复审 ----
  let review = await agent(stageReviewPrompt({ stage, stageBaseSha: stageReport.stageBaseSha, verify: stageReport.verify }), {
    label: `stage-review:${stage}`,
    phase: 'StageReview',
    schema: STAGE_REVIEW_SCHEMA,
  })

  for (let repair = 0; review && review.verdict === 'NEEDS_CHANGES' && repair < CFG.limits.stageRepairs; repair++) {
    if (!review.issues.length) break
    log(`Stage ${stage} 审查 NEEDS_CHANGES：${review.issues.length} 条，追加修复 Task（第 ${repair + 1} 轮）`)
    const fixed = await repairWith({
      stage,
      stageReport,
      issues: review.issues,
      fixTasks: review.fixTasks,
      label: `fix:${stage}#${repair + 1}`,
    })
    if (!fixed.ok) {
      fail({ stage, task: fixed.taskId, reason: fixed.reason })
      break
    }

    stageReport.verify = await agent(verifyPrompt(`Stage ${stage} 修复后第 ${repair + 1} 轮`), {
      label: `reverify:${stage}#${repair + 1}`,
      phase: 'Verify',
      schema: VERIFY_SCHEMA,
    })
    review = await agent(
      stageReviewPrompt({ stage, stageBaseSha: stageReport.stageBaseSha, verify: stageReport.verify, previousIssues: review.issues }),
      { label: `stage-review:${stage}#${repair + 1}`, phase: 'StageReview', schema: STAGE_REVIEW_SCHEMA },
    )
  }
  stageReport.stageReview = review
  if (report.blocked) break
  if (!review || review.verdict !== 'APPROVED') {
    fail({ stage, reason: `Stage ${stage} 审查未通过：${review ? review.issues.join('；') || '未给出具体问题' : '无返回'}` })
    break
  }

  // ---- 最终验证与最终审查：只在最后一个 Stage、状态 amend 与合并之前执行 ----
  if (stage === lastConfiguredStage) {
    // 最终验证必须全绿。验证失败、收尾复审 NEEDS_CHANGES、最终审查 NEEDS_CHANGES 三类修复
    // 共享 finalRepairs 轮次上限，避免某一类问题反复横跳时无限追加修复 Task。
    let fixRound = 0
    let attempt = 0

    // 追加修复 Task 并走标准 Task 循环，随后复审最后一个 Stage；复审再要求修改时继续修复。
    // 返回 null 表示修复与复审都已通过，否则返回阻塞原因。
    const finalRepair = async (issues, fixTasks, source) => {
      let pending = { issues, fixTasks, source }
      while (true) {
        if (fixRound >= CFG.limits.finalRepairs) {
          return `${pending.source}，收尾修复已达 ${CFG.limits.finalRepairs} 轮上限：${pending.issues.join('；')}`
        }
        fixRound++
        log(`${pending.source}：${pending.issues.length} 条，追加修复 Task 到 Stage ${stage}（收尾第 ${fixRound} 轮）`)
        const fixed = await repairWith({
          stage,
          stageReport,
          issues: pending.issues,
          fixTasks: pending.fixTasks,
          source: pending.source,
          label: `final-fix#${fixRound}`,
        })
        if (!fixed.ok) return `${fixed.taskId ? `${fixed.taskId}：` : ''}${fixed.reason}`

        const recheck = await agent(
          stageReviewPrompt({ stage, stageBaseSha: stageReport.stageBaseSha, previousIssues: pending.issues, finalState: true }),
          { label: `stage-review:final#${fixRound}`, phase: 'StageReview', schema: STAGE_REVIEW_SCHEMA },
        )
        stageReport.stageReview = recheck
        if (!recheck) return `Stage ${stage} 收尾复审无返回`
        if (recheck.verdict === 'APPROVED') return null
        if (!recheck.issues.length) return `Stage ${stage} 收尾复审未通过但未给出具体问题`
        pending = { issues: recheck.issues, fixTasks: recheck.fixTasks, source: `Stage ${stage} 收尾复审返回 NEEDS_CHANGES` }
      }
    }

    // 每次修复与复审通过后都回到循环顶部：重新完整验证，验证通过才做最终审查。
    while (true) {
      attempt++
      report.finalVerify = await agent(verifyPrompt(`全部 Stage 最终验证第 ${attempt} 次`), {
        label: `verify:final#${attempt}`,
        phase: 'Verify',
        schema: VERIFY_SCHEMA,
      })
      if (!report.finalVerify || !report.finalVerify.passed) {
        // 最终审查只看全绿的代码，验证失败时先修复，不浪费一次审查。
        report.finalReview = null
        const failures = report.finalVerify && report.finalVerify.failures.length ? report.finalVerify.failures : ['最终全量验证未通过，未取得失败明细']
        const blocked = await finalRepair(failures, [], '最终全量验证未通过')
        if (blocked) {
          fail({ stage: 'final', reason: `${blocked}\n${verifyText(report.finalVerify)}` })
          break
        }
        continue
      }

      const head = await agent(readShaPrompt('HEAD'), { label: `final-head#${attempt}`, phase: 'Verify' })
      report.finalReview = await agent(finalPrompt({ base: report.implementationBaseSha, head: (head || '').trim() || 'HEAD' }), {
        label: `final-review#${attempt}`,
        phase: 'StageReview',
        schema: FINAL_SCHEMA,
      })
      if (!report.finalReview) {
        fail({ stage: 'final', reason: '最终审查无返回' })
        break
      }
      if (report.finalReview.verdict === 'APPROVED') break
      if (!report.finalReview.issues.length) {
        fail({ stage: 'final', reason: '最终审查未通过但未给出具体问题' })
        break
      }
      const blocked = await finalRepair(report.finalReview.issues, report.finalReview.fixTasks || [], '最终审查返回 NEEDS_CHANGES')
      if (blocked) {
        fail({ stage: 'final', reason: blocked })
        break
      }
    }
    if (report.blocked) break
  }

  // ---- Commit：Stage 执行状态 amend 进本 Stage 最后一个 Task commit ----
  if (CFG.index) {
    const statusCommit = await agent(stageStatusPrompt(stage), { label: `stage-status:${stage}`, phase: 'Commit', schema: COMMIT_SCHEMA })
    if (!statusCommit || !statusCommit.committed || !statusCommit.cleanAfter) {
      fail({ stage, reason: `Stage ${stage} 状态更新失败：${statusCommit ? statusCommit.error || '工作区不干净' : '无返回'}` })
      break
    }
    stageReport.statusSha = statusCommit.sha
    log(`Stage ${stage} 执行状态已 amend 进 ${statusCommit.sha.slice(0, 8)}`)
  }

  // ---- Merge：按配置 --no-ff 合并回基线分支 ----
  if (mergeEnabled) {
    const merge = await agent(mergePrompt({ stage, expectedBaseSha }), {
      label: `merge:stage-${stage}`,
      phase: 'Merge',
      schema: MERGE_SCHEMA,
    })
    stageReport.merge = merge
    if (!merge) {
      fail({ stage, reason: `Stage ${stage} 合并无返回` })
      break
    }
    if (merge.conflict) {
      fail({ stage, reason: `Stage ${stage} 合并冲突：${(merge.conflictFiles || []).join('、')}；x=${merge.baseHeadBefore}，y=${merge.devHead}` })
      break
    }
    if (!merge.merged) {
      fail({ stage, reason: `Stage ${stage} 合并失败：${merge.error || '基线 HEAD 已变化'}` })
      break
    }
    if (!merge.cleanAfter) {
      fail({ stage, reason: `Stage ${stage} 合并后工作区不干净` })
      break
    }
    expectedBaseSha = merge.baseHeadAfter
    log(`Stage ${stage} 已 --no-ff 合并到 ${CFG.baseBranch}：${(merge.mergeSha || '').slice(0, 8)}`)
  }
}

return report
