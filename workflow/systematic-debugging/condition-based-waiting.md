# 基于条件的等待

## 概述

不稳定的测试常常通过任意延迟来猜测时机。这会产生竞态条件：测试在快速机器上通过，但在负载下或 CI 中失败。

**核心原则：** 等待你真正关心的条件，而不是猜测它需要多长时间。

## 何时使用

```dot
digraph when_to_use {
    "测试使用了 setTimeout/sleep？" [shape=diamond];
    "是在测试时间行为吗？" [shape=diamond];
    "记录为什么需要超时" [shape=box];
    "使用基于条件的等待" [shape=box];

    "测试使用了 setTimeout/sleep？" -> "是在测试时间行为吗？" [label="是"];
    "是在测试时间行为吗？" -> "记录为什么需要超时" [label="是"];
    "是在测试时间行为吗？" -> "使用基于条件的等待" [label="否"];
}
```

**适用场景：**
- 测试中有任意延迟（`setTimeout`、`sleep`、`time.sleep()`）
- 测试不稳定（有时通过，负载下失败）
- 并行运行时测试超时
- 等待异步操作完成

**不适用场景：**
- 测试实际的时间行为（防抖、节流间隔）
- 如果使用任意超时，务必记录原因

## 核心模式

```typescript
// 修复前：猜测时机
await new Promise(r => setTimeout(r, 50));
const result = getResult();
expect(result).toBeDefined();

// 修复后：等待条件
await waitFor(() => getResult() !== undefined);
const result = getResult();
expect(result).toBeDefined();
```

## 快速模式参考

| 场景 | 模式 |
|----------|---------|
| 等待事件 | `waitFor(() => events.find(e => e.type === 'DONE'))` |
| 等待状态 | `waitFor(() => machine.state === 'ready')` |
| 等待数量 | `waitFor(() => items.length >= 5)` |
| 等待文件 | `waitFor(() => fs.existsSync(path))` |
| 复杂条件 | `waitFor(() => obj.ready && obj.value > 10)` |

## 实现

通用轮询函数：
```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startTime = Date.now();

  while (true) {
    const result = condition();
    if (result) return result;

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`等待 ${description} 超时，已等待 ${timeoutMs}ms`);
    }

    await new Promise(r => setTimeout(r, 10)); // 每 10ms 轮询一次
  }
}
```

完整的实现（含领域相关的辅助函数 `waitForEvent`、`waitForEventCount`、`waitForEventMatch`）请参阅本目录中的 `condition-based-waiting-example.ts`，来自实际调试实践。

## 常见错误

**错误做法：** 轮询太快：`setTimeout(check, 1)` —— 浪费 CPU
**正确做法：** 每 10ms 轮询一次

**错误做法：** 没有超时：条件永远不满足时无限循环
**正确做法：** 始终包含超时并给出清晰的错误信息

**错误做法：** 过期数据：在循环外缓存状态
**正确做法：** 在循环内调用 getter 以获取最新数据

## 何时使用任意超时是正确的

```typescript
// 工具每 100ms 计时一次 —— 需要 2 个周期来验证部分输出
await waitForEvent(manager, 'TOOL_STARTED'); // 首先：等待条件
await new Promise(r => setTimeout(r, 200));   // 然后：等待时间行为
// 200ms = 以 100ms 间隔的 2 个周期 —— 已记录并说明原因
```

**要求：**
1. 首先等待触发条件
2. 基于已知的时间（不是猜测）
3. 注释说明原因

## 实际影响

来自调试实践（2025-10-03）：
- 修复了 3 个文件中的 15 个不稳定测试
- 通过率：60% → 100%
- 执行时间：快 40%
- 不再有竞态条件
