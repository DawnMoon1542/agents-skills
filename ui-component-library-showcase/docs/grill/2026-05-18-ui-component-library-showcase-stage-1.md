# ui-component-library-showcase Stage 1 设计

## 概述

本阶段创建一个组件库选型 skill，并建立 React 展示项目框架。skill 负责沉淀组件库比较知识，showcase 负责承载后续八个风格页面。

## 架构

目录结构：

- `ui-component-library-showcase/SKILL.md`：skill 入口文档，包含触发场景、选型矩阵、每个组件库的适用场景和来源。
- `ui-component-library-showcase/NEXT_SESSION_PROMPT.md`：后续会话使用的 sub agent 实现提示。
- `ui-component-library-showcase/showcase/`：Vite React TypeScript 应用。
- `ui-component-library-showcase/showcase/src/data/libraries.ts`：八个组件库的统一元数据。
- `ui-component-library-showcase/showcase/src/pages/LibraryPage.tsx`：根据组件库标识分发页面组件。
- `ui-component-library-showcase/showcase/src/pages/showcases/*.tsx`：八个组件库的独立页面文件。
- `ui-component-library-showcase/showcase/src/App.tsx`：导航、首页与页面选择。

数据流向：`libraries.ts` 提供数据，`App.tsx` 负责导航与当前页面状态，`LibraryPage.tsx` 按 `registry.ts` 选择对应页面。

## 接口定义

`LibraryProfile` 包含以下字段：

- `id`：稳定页面标识。
- `name`：组件库名称。
- `category`：组件库类型。
- `bestFor`：适合场景列表。
- `avoidWhen`：不适合场景列表。
- `styleSignals`：风格特征列表。
- `technicalBase`：技术基础列表。
- `sourceLinks`：调研来源列表。
- `pageBrief`：后续页面实现说明。

## 错误处理

展示项目不连接外部接口。未找到页面标识时回到第一个组件库页面。来源链接以静态数据呈现，不在运行时抓取远程内容。

## 测试策略

使用 Vitest 与 Testing Library 覆盖：

- 应用能渲染八个组件库导航入口。
- 切换组件库后展示对应标题与页面说明。
- 元数据包含八个唯一标识，且每个条目具备适用场景、风格特征和来源链接。

## 设计自审

- 范围限定为框架与知识 skill，不实现八个最终页面。
- 技术栈轻量，避免引入八套组件库依赖。
- 后续页面实现具有明确数据契约和分工边界。
