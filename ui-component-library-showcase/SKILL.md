---
name: ui-component-library-showcase
description: 比较 shadcn/ui、HeroUI、Material UI、UI TripleD、Tailark UI、ReUI、shadcnblocks、Kokonut UI，并维护 pnpm + React 展示项目。用于 UI 组件库选型、风格页面规划、shadcn 生态组件库比较、React 页面展示框架扩展。
metadata:
  tags: react, ui-components, shadcn, material-ui, heroui, tailwind, design-system
---

# UI 组件库选型与展示 skill

## When to use

使用本 skill 处理以下任务：

- 比较 React UI 组件库、shadcn 生态库或 Tailwind 组件库。
- 为产品、后台、营销站、AI 产品页选择组件基础。
- 维护本 skill 内的 `showcase/` React 展示项目。
- 为 shadcn/ui、HeroUI、Material UI、UI TripleD、Tailark UI、ReUI、shadcnblocks、Kokonut UI 编写风格页面。

## Local showcase project

展示项目位置：`ui-component-library-showcase/showcase`

技术栈：

- pnpm
- Vite
- React 19
- TypeScript
- Vitest
- Testing Library

常用命令：

```bash
cd /Users/dawnmoon/.agents/skills/ui-component-library-showcase/showcase
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm dev
```

页面文件：

| 组件库 | 页面文件 |
|---|---|
| shadcn/ui | `src/pages/showcases/ShadcnUiPage.tsx` |
| HeroUI | `src/pages/showcases/HeroUiPage.tsx` |
| Material UI | `src/pages/showcases/MaterialUiPage.tsx` |
| UI TripleD | `src/pages/showcases/UiTripledPage.tsx` |
| Tailark UI | `src/pages/showcases/TailarkUiPage.tsx` |
| ReUI | `src/pages/showcases/ReUiPage.tsx` |
| shadcnblocks | `src/pages/showcases/ShadcnblocksPage.tsx` |
| Kokonut UI | `src/pages/showcases/KokonutUiPage.tsx` |

共享数据：`src/data/libraries.ts`

页面注册：`src/pages/showcases/registry.ts`

## Selection matrix

| 组件库 | 类型 | 适合 | 不适合 |
|---|---|---|---|
| shadcn/ui | 源码分发基础组件系统 | 自建设计系统、需要源码所有权、shadcn registry、AI 辅助页面生成 | 只想安装 npm 包并由上游托管升级的团队 |
| HeroUI | 运行时 React 组件库 | 快速构建现代 React 应用、需要 React Aria 可访问性基础、偏好圆润动效视觉 | 必须完全拥有组件源码、严格 Material Design 项目 |
| Material UI | 成熟企业级 React 组件库 | 企业后台、管理系统、复杂表单、数据密集界面、长期生态稳定性 | 需要强品牌差异化且不想保留 Material Design 视觉痕迹 |
| UI TripleD | shadcn 动效组件与 blocks registry | 动效 landing page、hero、pricing、展示型页面、shadcn 项目扩展 | 严肃后台控件系统、禁用 Motion 的项目 |
| Tailark UI | shadcn 营销页面 blocks | SaaS 官网、创业项目、产品页、品牌营销页、bento feature | 复杂后台、表格密集应用、需要传统组件包升级 |
| ReUI | 企业级 shadcn registry 与组件扩展 | shadcn 中后台、Data Grid、Filters、Upload、Kanban、Sortable | 只需要少量营销区块、不使用 Tailwind 或 shadcn |
| shadcnblocks | shadcn blocks 与组件目录 | 大量页面区块、组件变体、搜索式挑选、复制或 registry 安装 | 需要高度统一单一设计语言且不想筛选变体 |
| Kokonut UI | 动画化 shadcn/Tailwind 组件集合 | AI 产品页、动画按钮、交互卡片、现代产品体验页 | 禁用 Motion、复杂企业后台、极度克制的规范视觉 |

## Library notes

### shadcn/ui

定位：不是传统运行时组件库，而是组件源码分发和构建设计系统的方法。它提供组件源码、CLI、registry schema 与跨框架分发能力。

适合：

- 团队需要拥有组件源码。
- 项目希望从可组合 primitives 建立长期设计系统。
- 页面生成、AI 辅助开发和 registry 管理是重要能力。

页面风格提示：中性底色、清晰边框、组合式 primitives、设计 token 面板、源码所有权叙事。

来源：

- https://ui.shadcn.com/docs
- https://ui.shadcn.com/blocks

### HeroUI

定位：原 NextUI，现代 React UI 库，基于 React Aria Components 与 Tailwind CSS v4，强调可访问性、默认美观和动画细节。

适合：

- 快速建立完整 React 应用界面。
- 需要键盘导航、focus 管理和屏幕阅读器友好基础。
- 需要比传统企业库更现代的默认视觉。

页面风格提示：圆润组件、柔和阴影、明亮 focus ring、暗色模式友好、轻量动效。

来源：

- https://heroui.com/docs/react/getting-started
- https://github.com/heroui-inc/heroui
- https://www.npmjs.com/package/@heroui/react

### Material UI

定位：MUI Core 中的 Material UI，成熟 React 组件库，实现 Google Material Design，配套主题、设计工具和 MUI X 扩展生态。

适合：

- 企业后台、管理端、表单密集应用。
- 需要成熟文档、稳定 API、长期维护生态。
- 需要 Data Grid、Date Pickers、Charts 等高级扩展。

页面风格提示：Material elevation、状态层、规范表单、数据表、主题色与企业信息密度。

来源：

- https://mui.com/material-ui/getting-started/
- https://github.com/mui/material-ui
- https://www.npmjs.com/package/@mui/material

### UI TripleD

定位：shadcn/ui 与 Framer Motion 生态中的组件、motion blocks 和 landing page 模板集合。公开资料中常见写法是 UI TripleD，用户也可能写作 UI Tripled。

适合：

- 带动效的 landing page、hero、pricing、CTA、模板页。
- 已采用 shadcn/ui，希望扩充页面表现力。
- 需要 registry 形式的页面级资源。

页面风格提示：大视觉焦点、运动轨迹、模板卡片、动态 hero、营销页面节奏。

来源：

- https://www.registry.directory/moumen-soliman/uitripled
- https://tripled.dev/
- https://shadcnstudio.com/blog/modern-ui-components-tools-from-ui-tripled

### Tailark UI

定位：围绕 shadcn/ui 和 Tailwind CSS 的营销网站区块系统，强调产品页、landing page、feature、pricing、品牌页面。

适合：

- SaaS、创业项目和产品营销网站。
- 需要完整页面结构而非单个控件。
- 偏好 shadcn 技术底座和可编辑 blocks。

页面风格提示：非对称 hero、bento feature、产品插画、高留白、清晰转化区。

来源：

- https://tailark.com/
- https://github.com/tailark/blocks
- https://www.tailawesome.com/resources/tailark-blocks

### ReUI

定位：面向 shadcn 项目的组件和 blocks registry，支持 Base UI 与 Radix UI 版本，覆盖 Data Grid、Filters、File Upload、Kanban、Sortable 等复合组件。

适合：

- shadcn 中后台和产品应用。
- 需要应用级复合组件，而非只要基础按钮、输入框。
- 希望在 Base UI 与 Radix UI primitive 之间保持选择空间。

页面风格提示：数据视图、过滤器、上传、看板、复杂控件组合、应用级密度。

来源：

- https://reui.io/
- https://reui.io/docs
- https://github.com/keenthemes/reui

### shadcnblocks

定位：大量 shadcn UI blocks 与组件目录，支持下载、复制和 shadcn registry 安装，覆盖基础组件和页面区块。

适合：

- 需要大量现成区块和组件变体。
- 希望用目录搜索 hero、pricing、nav、dashboard block。
- 需要免费和付费资源混合选择。

页面风格提示：搜索目录、分类筛选、区块预览卡片、安装入口、shadcn 中性系统气质。

来源：

- https://www.shadcnblocks.com/
- https://www.shadcnblocks.com/components/ui
- https://shadcnblocks.com/blocks

### Kokonut UI

定位：开源 React 组件集合，基于 Tailwind CSS、shadcn/ui 和 Motion，强调现代视觉、交互动效与 shadcn CLI 安装。

适合：

- AI 产品页、动画按钮、交互卡片、现代展示界面。
- shadcn 项目中加入更强表现力的组件。
- React 或 Next.js 产品体验页。

页面风格提示：粒子按钮、浮动卡片、AI 输入框、动效背景、强交互组件预览。

来源：

- https://kokonutui.com/
- https://kokonutui.com/docs
- https://github.com/kokonut-labs/kokonutui

## Implementation rules for showcase pages

- 保持 `src/data/libraries.ts` 中的 `LibraryProfile` 数据契约稳定。
- 每个组件库页面优先只修改自己的页面文件。
- 共享布局修改只在所有页面都需要时进行。
- 不复制官网代码或付费模板代码；所有页面实现保持原创。
- 不使用 emoji。
- 不新增依赖，除非页面实现确实需要，并通过 `pnpm add` 安装。
- 动画只使用 transform 和 opacity，避免动画宽高、top、left。
- 页面必须在移动端回到单列布局。
- 改动后运行 `pnpm test`、`pnpm typecheck`、`pnpm build`。
