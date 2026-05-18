# ui-component-library-showcase Stage 1 实现计划

> **执行者须知：** 推荐使用 subagent-driven-development 技能逐 Task 实现；也可在当前会话中执行。

**目标：** 创建组件库选型 skill，并建立 pnpm + React + TypeScript 展示项目框架。

**架构：** skill 文档沉淀八个组件库的比较知识；showcase 使用 Vite React 承载页面框架；统一元数据驱动导航与页面基础内容。

**技术栈：** pnpm、Vite、React、TypeScript、Vitest、Testing Library。

**设计文档：** `docs/grill/2026-05-18-ui-component-library-showcase-stage-1.md`

**术语表：** `docs/CONTEXT.md`

---

## 进度清单

### Group 1
- [x] Task 1-1 — 创建 skill 文档与后续会话 prompt
- [x] Task 1-2 — 创建 React 展示项目配置与测试基线

### Group 2
- [x] Task 2-1 — 创建统一元数据与页面框架
- [x] Task 2-2 — 验证测试、类型检查和构建

---

## 文件结构

- `ui-component-library-showcase/SKILL.md`：组件库选型 skill 入口。
- `ui-component-library-showcase/NEXT_SESSION_PROMPT.md`：后续会话提示。
- `ui-component-library-showcase/showcase/package.json`：pnpm 项目脚本和依赖。
- `ui-component-library-showcase/showcase/src/data/libraries.ts`：组件库元数据。
- `ui-component-library-showcase/showcase/src/pages/LibraryPage.tsx`：页面分发器。
- `ui-component-library-showcase/showcase/src/pages/showcases/*.tsx`：八个组件库的页面文件。
- `ui-component-library-showcase/showcase/src/App.tsx`：应用导航。
- `ui-component-library-showcase/showcase/src/App.test.tsx`：渲染与交互测试。

## Task 1-1: 创建 skill 文档与后续会话 prompt

**依赖：** 无
**文件：**
- 创建: `ui-component-library-showcase/SKILL.md`
- 创建: `ui-component-library-showcase/NEXT_SESSION_PROMPT.md`

### Step 1: 创建 skill 入口文档

对 `ui-component-library-showcase/SKILL.md` 写入 frontmatter、触发场景、选型矩阵、八个组件库说明和调研来源。每个组件库必须包含适合场景、不适合场景、技术基础和风格提示。

预期结果：skill 可被 pi 识别，且文档能独立用于组件库选型。

### Step 2: 创建后续会话 prompt

对 `ui-component-library-showcase/NEXT_SESSION_PROMPT.md` 写入一段完整提示，要求下一会话读取本 skill 与 showcase，调用 sub agent 分别完成八个组件库页面。

预期结果：后续会话无需重新询问即可按页面分派任务。

## Task 1-2: 创建 React 展示项目配置与测试基线

**依赖：** 无
**文件：**
- 创建: `ui-component-library-showcase/showcase/package.json`
- 创建: `ui-component-library-showcase/showcase/index.html`
- 创建: `ui-component-library-showcase/showcase/tsconfig.json`
- 创建: `ui-component-library-showcase/showcase/vite.config.ts`
- 创建: `ui-component-library-showcase/showcase/src/setupTests.ts`

### Step 1: 写入项目配置

创建 Vite React TypeScript 项目配置，脚本包含 `dev`、`test`、`typecheck`、`build`。依赖包含 React、Vite、TypeScript、Vitest 与 Testing Library。

预期结果：pnpm 能安装依赖，项目脚本名称稳定。

### Step 2: 写入测试环境配置

创建 `src/setupTests.ts` 并在 Vite 配置中启用 jsdom 测试环境。

预期结果：React 组件测试可读取 DOM matcher。

## Task 2-1: 创建统一元数据与页面框架

**依赖：** Task 1-1、Task 1-2 完成
**文件：**
- 创建: `ui-component-library-showcase/showcase/src/data/libraries.ts`
- 创建: `ui-component-library-showcase/showcase/src/pages/LibraryPage.tsx`
- 创建: `ui-component-library-showcase/showcase/src/App.tsx`
- 创建: `ui-component-library-showcase/showcase/src/main.tsx`
- 创建: `ui-component-library-showcase/showcase/src/styles.css`
- 创建: `ui-component-library-showcase/showcase/src/App.test.tsx`

### Step 1: 先写测试

对 `src/App.test.tsx` 新增测试，覆盖八个导航入口、页面切换、元数据完整性。运行测试时应因生产代码尚未存在或行为未完成而失败。

预期结果：测试失败原因指向缺失模块或缺失界面行为。

### Step 2: 写入元数据

对 `src/data/libraries.ts` 创建 `LibraryProfile` 类型和 `libraries` 常量。八个组件库标识分别为 `shadcn-ui`、`heroui`、`material-ui`、`ui-tripled`、`tailark-ui`、`reui`、`shadcnblocks`、`kokonut-ui`。

预期结果：元数据可被 App 和测试共享。

### Step 3: 写入页面与应用入口

创建 `LibraryPage.tsx`、`App.tsx`、`main.tsx` 和 `styles.css`。应用提供左侧导航、首页概览、单库页面框架和当前选择状态。

预期结果：测试通过，页面可在本地开发服务器显示。

## Task 2-2: 验证测试、类型检查和构建

**依赖：** Task 2-1 完成
**文件：**
- 修改: `ui-component-library-showcase/showcase/package.json`

### Step 1: 安装依赖并运行测试

在 `showcase` 目录使用 pnpm 安装依赖，运行测试，确认全部测试通过。

预期结果：测试输出无失败用例。

### Step 2: 运行类型检查和构建

运行 TypeScript 类型检查和 Vite 构建，修复所有错误。

预期结果：`dist/` 构建成功，类型检查无错误。
