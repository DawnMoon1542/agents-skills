# 根本原因追踪

## 概述

Bug 往往在调用栈深处表现出来（在错误的目录中执行 git init、文件创建在错误的位置、数据库用错误的路径打开）。你的本能是在错误出现的地方进行修复，但那只是在处理症状。

**核心原则：** 沿着调用链反向追踪，直到找到原始触发点，然后在源头修复。

## 何时使用

```dot
digraph when_to_use {
    "Bug 出现在栈深处？" [shape=diamond];
    "能否反向追踪？" [shape=diamond];
    "在症状点修复" [shape=box];
    "追溯到原始触发点" [shape=box];
    "更好：同时添加纵深防御" [shape=box];

    "Bug 出现在栈深处？" -> "能否反向追踪？" [label="是"];
    "能否反向追踪？" -> "追溯到原始触发点" [label="是"];
    "能否反向追踪？" -> "在症状点修复" [label="否 - 死胡同"];
    "追溯到原始触发点" -> "更好：同时添加纵深防御";
}
```

**适用场景：**
- 错误发生在执行深处（而非入口点）
- 堆栈跟踪显示较长的调用链
- 不清楚无效数据从哪里产生
- 需要找到是哪个测试/代码触发了问题

## 追踪流程

### 1. 观察症状
```
Error: git init 在 ~/project/packages/core 中失败
```

### 2. 找到直接原因
**什么代码直接导致了这个问题？**
```typescript
await execFileAsync('git', ['init'], { cwd: projectDir });
```

### 3. 追问：是什么调用了这里？
```typescript
SessionManager.createSessionWorkspace(projectDir, sessionId)
  → 由 Session.initializeWorkspace() 调用
  → 由 Session.create() 调用
  → 由 test 在 Project.create() 处调用
```

### 4. 继续向上追踪
**传递了什么值？**
- `projectDir = ''`（空字符串！）
- 空字符串作为 `cwd` 解析为 `process.cwd()`
- 那就是源代码目录！

### 5. 找到原始触发点
**空字符串从哪里来的？**
```typescript
const context = setupCoreTest(); // 返回 { tempDir: '' }
Project.create('name', context.tempDir); // 在 beforeEach 之前访问！
```

## 添加堆栈跟踪

当你无法手动追踪时，添加诊断工具：

```typescript
// 在有问题操作之前
async function gitInit(directory: string) {
  const stack = new Error().stack;
  console.error('DEBUG git init:', {
    directory,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack,
  });

  await execFileAsync('git', ['init'], { cwd: directory });
}
```

**关键：** 在测试中使用 `console.error()`（不要用 logger——可能不会显示）

**运行并捕获：**
```bash
npm test 2>&1 | grep 'DEBUG git init'
```

**分析堆栈跟踪：**
- 查找测试文件名
- 找到触发调用的行号
- 识别模式（同一个测试？同一个参数？）

## 查找哪个测试造成污染

如果在测试过程中出现了某些东西，但你不知道是哪个测试：

使用本目录中的二分查找脚本 `find-polluter.sh`：

```bash
./find-polluter.sh '.git' 'src/**/*.test.ts'
```

逐个运行测试，在第一个造成污染的测试处停止。用法见脚本。

## 真实示例：空的 projectDir

**症状：** `.git` 创建在 `packages/core/`（源代码目录）

**追踪链：**
1. `git init` 在 `process.cwd()` 中运行 ← 空的 cwd 参数
2. SessionManager 收到了空的 projectDir
3. Session.create() 传递了空字符串
4. 测试在 beforeEach 之前访问了 `context.tempDir`
5. setupCoreTest() 最初返回 `{ tempDir: '' }`

**根本原因：** 顶层变量初始化访问了空值

**修复：** 将 tempDir 改为 getter，如果在 beforeEach 之前访问则抛出异常

**同时添加了纵深防御：**
- 第 1 层：Project.create() 验证目录
- 第 2 层：WorkspaceManager 验证非空
- 第 3 层：NODE_ENV 守卫拒绝在 tmpdir 之外执行 git init
- 第 4 层：git init 前的堆栈跟踪日志

## 核心原则

```dot
digraph principle {
    "找到直接原因" [shape=ellipse];
    "能否向上一层追踪？" [shape=diamond];
    "反向追踪" [shape=box];
    "这是源头吗？" [shape=diamond];
    "在源头修复" [shape=box];
    "在每一层添加验证" [shape=box];
    "Bug 不可能再发生" [shape=doublecircle];
    "绝不要仅修复症状" [shape=octagon, style=filled, fillcolor=red, fontcolor=white];

    "找到直接原因" -> "能否向上一层追踪？";
    "能否向上一层追踪？" -> "反向追踪" [label="是"];
    "能否向上一层追踪？" -> "绝不要仅修复症状" [label="否"];
    "反向追踪" -> "这是源头吗？";
    "这是源头吗？" -> "反向追踪" [label="否 - 继续"];
    "这是源头吗？" -> "在源头修复" [label="是"];
    "在源头修复" -> "在每一层添加验证";
    "在每一层添加验证" -> "Bug 不可能再发生";
}
```

**绝不要仅修复错误出现的位置。** 反向追踪以找到原始触发点。

## 堆栈跟踪技巧

**在测试中：** 使用 `console.error()` 而非 logger —— logger 可能被屏蔽
**在操作之前：** 在危险操作之前记录日志，而非失败之后
**包含上下文：** 目录、cwd、环境变量、时间戳
**捕获堆栈：** `new Error().stack` 显示完整调用链

## 实际影响

来自调试实践（2025-10-03）：
- 通过 5 层追踪找到根本原因
- 在源头修复（getter 验证）
- 添加了 4 层防御
- 1847 个测试全部通过，零污染
