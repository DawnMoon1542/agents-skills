# ui-component-library-showcase 需求与方向

## 需求边界

创建一个新的 skill，整理 shadcn/ui、HeroUI、Material UI、UI TripleD、Tailark UI、ReUI、shadcnblocks、Kokonut UI 的定位、适用场景、技术基础与选型建议。

创建一个 pnpm + React + TypeScript 展示项目框架，包含八个组件库的页面入口、共享数据源、基础导航与测试基线。本阶段只建立框架，不完成八个页面的精细视觉实现。

## 不纳入范围

- 不安装八个组件库的真实组件依赖。
- 不复制各官网付费或授权受限代码。
- 不完成每个页面的最终视觉设计。
- 不配置部署平台。

## 成功标准

- 新 skill 能说明八个组件库各自适合的产品类型与前端团队状态。
- React 展示项目能通过 pnpm 安装、测试、类型检查和构建。
- 八个页面路由或入口存在，并能读取统一组件库元数据。
- 交接 prompt 能让下一会话使用 sub agent 分别实现八个展示页面。

## 方向选型

采用一个 skill 目录承载知识文档与展示项目：

- `SKILL.md` 提供组件库比较、使用建议与调研来源。
- `showcase/` 使用 Vite、React、TypeScript、Vitest 作为轻量展示框架。
- 八个页面先以数据驱动方式生成基础页面，后续再由 sub agent 分别增强。

排除方案：

- Next.js：对当前静态展示框架偏重。
- 同时安装八套 UI 依赖：会引入大量版本兼容和样式冲突。
- 只写 Markdown 不建项目：无法承载后续风格页面实现。

## Stage 进度

- [x] Stage 1 — 建立 skill 与 React 展示项目框架
- [ ] Stage 2 — 使用 sub agent 完成八个组件库页面的风格实现

## Stage 1: 建立 skill 与 React 展示项目框架

### 范围

创建 skill 文档、统一元数据、React 页面框架、基础测试、后续 session prompt。

### 成功标准

pnpm 项目可安装、测试、构建；skill 文档能作为组件库选型参考；交接 prompt 可独立指导下一会话。

## Stage 2: 使用 sub agent 完成八个组件库页面的风格实现

### 范围

每个组件库页面由独立 sub agent 实现该库风格的原创展示页，保持统一布局契约。

### 成功标准

八个页面视觉风格彼此可辨认，并通过统一测试、类型检查和构建。
