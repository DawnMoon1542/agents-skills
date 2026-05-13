# 纵深防御验证

## 概述

当你修复了一个由无效数据引起的 bug 时，在一个地方添加验证似乎就足够了。但那个单一的检查可以被不同的代码路径、重构或 mock 绕过。

**核心原则：** 在数据经过的每一层都进行验证。让 bug 在结构上不可能发生。

## 为什么需要多层

单层验证："我们修复了 bug"
多层验证："我们让 bug 不可能再发生"

不同层捕获不同情况：
- 入口验证捕获大多数 bug
- 业务逻辑捕获边界情况
- 环境守卫防止特定上下文中的危险操作
- 调试日志在其他层失效时提供帮助

## 四层防御

### 第 1 层：入口点验证
**目的：** 在 API 边界拒绝明显无效的输入

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory 不能为空');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory 不存在: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory 不是目录: ${workingDirectory}`);
  }
  // ... 继续
}
```

### 第 2 层：业务逻辑验证
**目的：** 确保数据对此操作有意义

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('工作区初始化需要 projectDir');
  }
  // ... 继续
}
```

### 第 3 层：环境守卫
**目的：** 防止在特定上下文中执行危险操作

```typescript
async function gitInit(directory: string) {
  // 在测试中，拒绝在临时目录之外执行 git init
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `测试期间拒绝在临时目录之外执行 git init: ${directory}`
      );
    }
  }
  // ... 继续
}
```

### 第 4 层：调试诊断工具
**目的：** 捕获上下文用于取证

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('即将执行 git init', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... 继续
}
```

## 应用此模式

当你发现一个 bug 时：

1. **追踪数据流** - 坏值从哪里产生？在哪里被使用？
2. **绘制所有检查点** - 列出数据经过的每一个点
3. **在每一层添加验证** - 入口、业务、环境、调试
4. **测试每一层** - 尝试绕过第 1 层，验证第 2 层能否捕获

## 实战示例

Bug：空的 `projectDir` 导致 `git init` 在源代码目录中执行

**数据流：**
1. 测试设置 → 空字符串
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` 在 `process.cwd()` 中运行

**添加的四层防御：**
- 第 1 层：`Project.create()` 验证非空/存在/可写
- 第 2 层：`WorkspaceManager` 验证 projectDir 非空
- 第 3 层：`WorktreeManager` 拒绝在测试环境的临时目录之外执行 git init
- 第 4 层：git init 之前的堆栈跟踪日志

**结果：** 全部 1847 个测试通过，bug 不可能复现

## 核心洞察

所有四层都是必要的。在测试过程中，每一层都捕获了其他层遗漏的 bug：
- 不同的代码路径绕过了入口验证
- Mock 绕过了业务逻辑检查
- 不同平台上的边界情况需要环境守卫
- 调试日志识别了结构性的误用

**不要只停留在一个验证点。** 在每一层都添加检查。
