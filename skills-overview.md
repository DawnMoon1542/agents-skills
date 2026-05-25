# PI Coding Agent Skills 技能总览

> 本文档介绍 `/Users/dawnmoon/.agents/skills` 目录下全部 26 个技能，按功能领域分类整理。

---

## 技能评估与激活机制

所有技能在 Agent 会话开始时按三段式流程进行评估：

1. **检索**：提取上下文中提到的可用技能和工具列表
2. **评估**：对每个技能判断当前任务是否需要调用
3. **激活**：若评估为「是」则立即加载对应模块文档

---

## 一、工作流技能（9 个）

贯穿需求到交付的完整软件工程周期，每个环节有对应的技能覆盖。

### brainstorming — 需求探索与方向选型

在任何创造性工作之前必须调用。通过探索项目上下文、提出澄清问题、展示 2-3 种方向选型（含权衡和推荐），将模糊想法转化为明确的需求边界和方向。产出保存为 `docs/brainstorming/YYYY-MM-DD-<slug>.md`。

复杂需求支持多 Stage 分割，每个 Stage 独立经历完整工作流循环。终止状态是调用 grill-with-docs。

### grill-with-docs — 领域对质与方案精炼

接收 brainstorming 产出的需求与方向，逐一拷问每个设计决策。核心活动包括：术语校准（更新 `docs/CONTEXT.md`）、场景压测（用边界场景验证领域关系）、代码交叉验证（检查代码与陈述的一致性）。产出完整设计文档和必要的 ADR（架构决策记录）。

设计文档覆盖架构、接口定义、错误处理、测试策略五个维度。终止状态是调用 writing-plans。

### writing-plans — 编写实现计划

将 grill-with-docs 产出的设计文档转化为三层级实现计划：Task Group（可独立交付的工作分组）→ Task（独立可完成的单元）→ Step（2-5 分钟可完成的动作描述）。计划包含精确文件路径、具体要求、边界条件、测试场景列表。

同 Group 内 Task 必须文件层面互斥。计划头部的进度清单支持多 Stage 进度追踪和上下文压缩后的恢复定位。

### test-driven-development — 测试驱动开发

实现任何功能或修复 bug 前强制执行。遵循红-绿-重构循环：先写失败测试，写最小代码使其通过，绿色后重构。核心原则：没看到测试失败，就不写生产代码。bug 修复必须先写重现测试。

测试被定义为业务说明书而非覆盖率工具，要求表达行为背后的业务意图。

### executing-plans — 会话内执行计划

在当前会话中逐 Task 执行实现计划。按 Group → Task → Step 层级串行推进，每完成一个 Task 立即更新进度清单。Step 包含需求描述，执行者需根据规格自行编写代码和命令。

遇到阻塞时根据根因回退到对应上游 skill（设计缺陷回退 grill-with-docs，需求模糊回退 brainstorming，计划不足回退 writing-plans）。

### subagent-driven-development — 子代理驱动开发

为每个 Task 分派独立子代理实现，完成后进行两阶段审查：先 spec 合规审查（验证做对了事情），再代码质量审查（验证做的方式正确）。子代理拥有独立上下文，不继承父会话历史。

支持机械性实现用廉价模型、集成判断用标准模型、架构设计用最强模型的分级策略。审查循环确保问题在交接前捕获。

### code-review — 代码审查

定义三个层面的代码审查规范：何时发起审查（Task 完成后、主要功能完成时、合并前）、如何处理收到的审查反馈（禁止表演性同意，要求技术确认或有理有据的反驳）、审查者提示模板。

外部反馈被视为需要评估的建议而非需要服从的命令。提供 spec-reviewer 和 code-quality-reviewer 两类审查模板。

### systematic-debugging — 系统化调试

四阶段调试流程：根本原因调查（读取错误、稳定复现、检查变更、收集证据）→ 模式分析（寻找正常工作的示例、对比差异）→ 假设与测试（形成单个假设、最小化测试）→ 实施（创建失败测试、单一修复、验证）。

3 次以上修复失败触发架构质疑：停止修复症状，与用户讨论重新设计。提供 root-cause-tracing、defense-in-depth、condition-based-waiting 三项辅助技术。

### dispatching-parallel-agents — 并行分派代理

当面临 2 个以上独立任务（不同测试文件、不同子系统、不同 bug）时使用。每个独立问题领域分派一个代理，并发工作。代理获得聚焦的范围、清晰的目标、明确的约束和预期输出格式。

不适用于相关失败、需要完整系统上下文或存在共享状态的任务。

---

## 二、语言与框架技能（5 个）

覆盖 TypeScript、React、Node.js、CSS 设计体系等日常开发领域。

### typescript-magician — TypeScript 类型魔法

处理复杂泛型、条件类型、模板字面量类型、映射类型、类型守卫、opaque/brand 类型。核心能力：消除 `any` 类型（用精确类型替换并验证调用点）、类型推断调试、模块扩展与声明合并。

执行流程：`tsc --noEmit` 捕获错误 → 定位根因 → 设计类型安全方案 → 确认编译通过。提供 16 个专业规则文件覆盖从 as const 到函数重载的全部类型技巧。

### react-best-practices — React 与 Next.js 最佳实践

Vercel 维护的 45 条性能优化规则，按优先级分 8 类：消除请求瀑布（CRITICAL）→ 包体积优化（CRITICAL）→ 服务端性能（HIGH）→ 客户端数据获取（MEDIUM-HIGH）→ 重渲染优化（MEDIUM）→ 渲染性能（MEDIUM）→ JavaScript 性能（LOW-MEDIUM）→ 高级模式（LOW）。

每条规则包含错误示例和正确示例的代码对比。完整文档位于 `AGENTS.md`。

### node-best-practices — Node.js 最佳实践

覆盖 Node.js 全栈开发的核心领域：TypeScript 类型剥离（Node 22.6+ 原生 .ts 运行）、异步模式（Promise.all 并行、错误传播）、流处理（背压控制、管道组合）、模块系统（ESM/CJS 互操作）、测试策略、性能优化、缓存、日志、优雅关闭。

包含 14 个专项规则文件，从错误处理到类型配置均有详细指导和代码示例。

### design-taste-frontend — 前端设计品味

高代理前端设计技能，通过三个可调参数控制设计风格：DESIGN_VARIANCE（对称 1 → 混乱 10，默认 8）、MOTION_INTENSITY（静态 1 → 电影级 10，默认 6）、VISUAL_DENSITY（画廊 1 → 驾驶舱 10，默认 4）。

强制执行的设计规则：排版确定性（禁用 Inter，推荐 Geist/Outfit/Satoshi）、色彩校准（禁用紫色 AI 美学，单强调色饱和度 < 80%）、布局多样化（禁用居中 Hero）。包含 100 条禁止的 AI 设计模式（The 100 AI Tells）和 40+ 创意概念（Magnetic Button、Bento Grid、Liquid Glass 等）。

### frontend-ui-design-morandi-color-scheme — 莫兰迪配色方案

前端 UI 设计的低饱和配色体系。核心特征：灰度统一（所有颜色加入灰度）、明度分层优先于色相对比、暖冷均衡（蓝灰理性 + 粉棕温润 + 灰绿稳定）。

提供 4 步配色流程、UI Token 映射（中性色/品牌色/状态色）、推荐色板（附带 CSS 变量可直接落地）、组件使用要点（按钮/标签/图表）和交付检查清单。

---

## 三、工具与实用技能（4 个）

### agent-browser — 浏览器自动化

通过 Chrome CDP 协议实现完整的浏览器自动化。核心工作流：导航 → 快照（获取元素引用 @e1、@e2）→ 交互 → 重新快照。

支持表单填写、身份认证（5 种方案：导入浏览器认证/持久化 Profile/会话名/认证保险库/状态文件）、数据提取、截图、PDF 导出、视觉 diff、iframe 操作、并行会话、设备模拟、iOS 模拟器。提供命令行链式调用和 JSON 批量执行两种模式。安全功能包括内容边界标记、域名白名单、操作策略控制和输出限制。

### yt-dlp-downloader — 视频下载器

基于 yt-dlp 的视频下载技能，支持 YouTube、Bilibili、Twitter、TikTok 等数千个站点。核心功能：视频下载、音频提取（MP3）、字幕下载、格式选择、播放列表批量下载。

YouTube 场景自动使用浏览器 cookie 避免 403 错误。包含子技能 video-to-tagged-audio（下载视频并添加歌词元数据）。

### md2html — Markdown 转 HTML

将长文 Markdown 文档（计划、规格、系统设计、RFC、操作手册、复盘等）转换为自包含 HTML 页面。产出包含 Mermaid 图表渲染、步骤时间线、标注卡片、侧边栏目录导航。

支持 Claude 橙色明暗主题切换，UI 标签根据源文档语言自动翻译（中/英/日/韩/越/西等 11+ 种语言）。通过模板 HTML 骨架 + 组件目录标准化输出质量。构建方式采用分阶段追加，避免大文档的工具调用失败。

### linting-neostandard-eslint9 — ESLint v9 与 neostandard 配置

配置 ESLint v9 扁平化配置系统和 neostandard（Standard JS 风格的现代替代）。覆盖场景：新建项目 ESLint 配置、从 .eslintrc 迁移到扁平配置、从 standard 迁移到 neostandard、CI/编辑器集成。

核心原则：最小化显式配置、固定主版本保证可复现性、lint 失败作为 CI 质量门禁。提供 5 个专项规则文件。

---

## 四、搜索技能（3 个）

### search-layer — 多源搜索层

默认搜索入口，四源同级并行检索：Brave Search + Exa + Tavily + Grok。五阶段执行流程：意图分类（7 种意图自动识别）→ 查询分解与扩展（技术同义词、中英文变体）→ 多源并行检索 → 去重与意图加权评分 → 知识合成结构化输出。

支持引用追踪（Thread Pulling），自动从搜索结果中提取 GitHub issue/PR 引用链并深度追踪。降级策略确保单一源失败不阻塞主流程。

### content-extract — 内容提取统一入口

URL 转 Markdown 的统一入口。决策流程：先判断域名是否命中反爬白名单（微信/知乎等直接走 MinerU），否则用低成本 web_fetch 探针检测，内容不完整时回退 MinerU 官方 API 高保真解析。

输出统一的 Result Contract：包含来源 URL、解析引擎、Markdown 内容、产物路径和下一步建议。从不说谎来源——永远给出可追溯入口。

### mineru-extract — MinerU 官方 API 解析

调用 MinerU（mineru.net）官方 API 将 URL 转为干净 Markdown + 结构化输出。支持 HTML 页面（微信文章）、PDF、Office 文档、图片等格式。

通过 MCP 风格脚本 `mineru_parse_documents.py` 实现：提交 URL → 轮询 → 下载结果 zip → 提取主 Markdown。支持 OCR、表格识别、公式识别。认证通过环境变量 `MINERU_TOKEN` 配置。

---

## 五、效率与质量技能（5 个）

### continuously-work — 持续执行与渐进提交

将任务拆解为可验证的步骤序列，每完成一个步骤或里程碑立即 git commit，不停不等直到全部完成。遵循「完成即提交」铁律，每个 commit 是可独立回退的原子变更。

错误分级处理：P0 阻断（暂停等待用户）→ P1 可绕过（记录后继续）→ P2 可忽略。提交前自动执行项目对应的编译/测试/lint 检查。工作完成后生成提交记录总结。

### full-output-enforcement — 完整输出强制执行

覆盖默认 LLM 截断行为，强制完整代码生成。禁止模式包括：代码中的 `// ...` 占位符、散文中的「其余类似」、结构性捷径（骨架代完整实现）。

令牌接近上限时在干净断点暂停，标注完成进度和恢复点。响应前强制执行禁止模式检查和交付物计数核对。

### pi-session-summarizer — PI Agent 会话汇总

提取指定时间范围内所有 pi agent session 记录，按项目分类整理为结构化 Markdown 文档。执行流程：运行 `extract-sessions.py` 提取 JSONL 中的首条用户消息 → 按工作目录归类分组 → 生成含统计摘要、项目分组、关键主题归纳的汇总文档。

支持 `--from` 和 `--to` 参数指定日期范围，自动排除 subagents.jsonl 文件。

### git-smart-commit — 智能提交

分析当前工作目录的 git 变更，自动生成结构化的 commit message。先 dry-run 展示待提交的 commit message，用户确认后再执行 `git commit`。支持按任务上下文自动筛选范围，支持用户显式指定包含/排除的文件路径。

### ui-component-library-showcase — UI 组件库选型与展示

比较 8 个 React/Tailwind UI 组件库：shadcn/ui、HeroUI、Material UI、UI TripleD、Tailark UI、ReUI、shadcnblocks、Kokonut UI。维护本地 pnpm + Vite + React 19 + TypeScript 展示项目。

每个库有独立页面文件，按统一的 LibraryProfile 数据契约管理元信息。提供选型矩阵（类型/适合/不适合三个维度）和各库的风格设计提示。Implement 规则禁止使用 emoji，动画仅使用 transform 和 opacity。

---

## 技能关系图谱

```
需求输入
    ↓
brainstorming ──→ grill-with-docs ──→ writing-plans
                                         ↓
                              ┌──────────┴──────────┐
                              ↓                      ↓
                    subagent-driven-dev    executing-plans
                              ↓                      ↓
                         code-review            code-review
                              ↓                      ↓
                         测试 / 验证 ←── test-driven-development
                              ↓
                    交付 & 持续改进
```

辅助技能在各阶段注入：
- **语言层**：typescript-magician、react-best-practices、node-best-practices
- **设计层**：design-taste-frontend、morandi-color-scheme
- **搜索层**：search-layer、content-extract、mineru-extract
- **工具层**：agent-browser、yt-dlp-downloader、md2html、linting-neostandard
- **质量层**：continuous-work、full-output-enforcement、systematic-debugging、dispatching-parallel-agents
- **管理**：pi-session-summarizer、ui-component-library-showcase

---

## 统计摘要

| 分类 | 技能数 | 技能名称 |
|------|--------|---------|
| 工作流 | 9 | brainstorming, grill-with-docs, writing-plans, test-driven-development, executing-plans, subagent-driven-development, code-review, systematic-debugging, dispatching-parallel-agents |
| 语言与框架 | 5 | typescript-magician, react-best-practices, node-best-practices, design-taste-frontend, frontend-ui-design-morandi-color-scheme |
| 工具与实用 | 4 | agent-browser, yt-dlp-downloader, md2html, linting-neostandard-eslint9 |
| 搜索 | 3 | search-layer, content-extract, mineru-extract |
| 效率与质量 | 5 | continuously-work, full-output-enforcement, pi-session-summarizer, git-smart-commit, ui-component-library-showcase |
| **总计** | **26** | |
