读取 `/Users/dawnmoon/.agents/skills/ui-component-library-showcase/SKILL.md`，再检查 `/Users/dawnmoon/.agents/skills/ui-component-library-showcase/showcase` 的代码结构。

目标：使用 sub agent 分别完成八个组件库展示页面的原创风格实现，并保持 pnpm + React + TypeScript 项目通过测试、类型检查和构建。

约束：

- 禁止使用 git worktree。
- 不复制官网源码、付费模板源码或授权不明代码。
- 不使用 emoji。
- 不新增依赖，除非单个页面确实需要；新增依赖必须使用 `pnpm add` 或 `pnpm add -D`。
- 八个页面优先只修改各自文件，避免多个 sub agent 修改同一文件。
- 共享数据契约 `src/data/libraries.ts` 不得破坏。
- 每个页面必须支持移动端单列布局。
- 动画只使用 `transform` 与 `opacity`，避免动画 `width`、`height`、`top`、`left`。
- 完成后运行 `pnpm test`、`pnpm typecheck`、`pnpm build`。

先执行一次基线验证：

```bash
cd /Users/dawnmoon/.agents/skills/ui-component-library-showcase/showcase
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

分派八个 sub agent。每个 sub agent 的任务边界如下：

1. shadcn/ui 页面
   - 文件：`src/pages/showcases/ShadcnUiPage.tsx`
   - 风格：中性设计系统、源码所有权、组合式 primitives、token 面板、CLI registry 感。
   - 只在确有必要时新增局部 CSS class 到 `src/styles.css`，class 名使用 `shadcn-showcase-` 前缀。

2. HeroUI 页面
   - 文件：`src/pages/showcases/HeroUiPage.tsx`
   - 风格：圆润面板、React Aria 可访问性、清晰 focus ring、柔和阴影、现代应用感。
   - 局部 CSS class 前缀：`heroui-showcase-`。

3. Material UI 页面
   - 文件：`src/pages/showcases/MaterialUiPage.tsx`
   - 风格：Material elevation、状态层、企业表单、数据表预览、主题色系统。
   - 局部 CSS class 前缀：`mui-showcase-`。

4. UI TripleD 页面
   - 文件：`src/pages/showcases/UiTripledPage.tsx`
   - 风格：motion blocks、landing page、hero 动效、pricing 和 CTA 结构、shadcn 底座。
   - 局部 CSS class 前缀：`tripled-showcase-`。

5. Tailark UI 页面
   - 文件：`src/pages/showcases/TailarkUiPage.tsx`
   - 风格：现代营销站、非对称 hero、bento feature、产品插画、高留白转化区。
   - 局部 CSS class 前缀：`tailark-showcase-`。

6. ReUI 页面
   - 文件：`src/pages/showcases/ReUiPage.tsx`
   - 风格：应用级组件扩展、Data Grid、Filters、Upload、Kanban、Sortable、企业密度。
   - 局部 CSS class 前缀：`reui-showcase-`。

7. shadcnblocks 页面
   - 文件：`src/pages/showcases/ShadcnblocksPage.tsx`
   - 风格：blocks 目录、搜索、分类筛选、区块预览卡片、registry 安装入口。
   - 局部 CSS class 前缀：`shadcnblocks-showcase-`。

8. Kokonut UI 页面
   - 文件：`src/pages/showcases/KokonutUiPage.tsx`
   - 风格：动画化产品界面、AI 输入框、粒子按钮、浮动卡片、Motion 气质。
   - 局部 CSS class 前缀：`kokonut-showcase-`。

推荐分派方式：

- 使用 `Agent` 工具启动八个 `general-purpose` sub agent。
- 每个 sub agent 的 prompt 只包含自己的文件、风格约束、共享契约、验证命令。
- 不使用 worktree 隔离。
- 若 sub agent 需要改 `src/styles.css`，要求它只追加自己前缀的 class，不改其他页面 class。
- 所有 sub agent 完成后，统一检查 `git diff`，解决共享 CSS 冲突，再运行完整验证。

每个 sub agent prompt 模板：

```text
在 `/Users/dawnmoon/.agents/skills/ui-component-library-showcase/showcase` 中工作。只实现 [组件库名称] 展示页面。

读取 `src/data/libraries.ts`、`src/pages/showcases/types.ts`、`src/pages/showcases/LibraryLayout.tsx`、目标页面文件 `[目标页面文件]`、`src/styles.css`。保持 `LibraryProfile` 数据契约不变。

目标：将 `[目标页面文件]` 从通用布局改为原创的 [组件库名称] 风格页面。页面必须展示该库的定位、适合场景、技术基础、风格特征和来源链接。页面应体现以下风格：[风格描述]。

修改范围：
- 主要修改 `[目标页面文件]`。
- 如需样式，向 `src/styles.css` 追加 `[`前缀`]` 开头的 class。
- 不修改其他组件库页面文件。
- 不新增依赖，除非该页面无法用现有 React 与 CSS 完成；新增依赖必须用 pnpm 命令。

质量要求：
- 不使用 emoji。
- 不复制官网或付费模板源码。
- 移动端单列布局可用。
- 动画只使用 transform 和 opacity。
- 不删除测试。

完成后运行：
`pnpm test`
`pnpm typecheck`
`pnpm build`

返回修改文件列表、验证结果和任何未解决的冲突。
```
