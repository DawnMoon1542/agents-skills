# 测试反模式

**在以下情况下加载此参考：** 编写或修改测试、添加 mock、或想要向生产代码添加仅测试用的方法时。

## 概述

测试必须验证真实行为，而非 mock 行为。Mock 是隔离的手段，不是被测试的对象。

**核心原则：** 测试代码做什么，而不是测试 mock 做什么。

**遵循严格的 TDD 可以防止这些反模式。**

## 铁律

```
1. 绝不测试 mock 行为
2. 绝不向生产类添加仅测试用的方法
3. 绝不在不理解依赖的情况下 mock
```

## 反模式 1：测试 Mock 行为

**违规：**
```typescript
// 错误：测试 mock 存在
test('渲染侧边栏', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**为什么错误：**
- 你在验证 mock 有效，而不是组件有效
- mock 存在时测试通过，不存在时失败
- 关于真实行为，什么都没告诉你

**修正：**
```typescript
// 正确：测试真实组件或不 mock 它
test('渲染侧边栏', () => {
  render(<Page />);  // 不 mock 侧边栏
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

// 或者如果侧边栏必须被 mock 以进行隔离：
// 不要断言 mock —— 测试 Page 在侧边栏存在时的行为
```

### 门函数

```
在断言任何 mock 元素之前：
  问："我在测试真实组件行为还是仅仅 mock 存在？"

  如果测试 mock 存在：
    停止 —— 删除断言或取消 mock 组件

  改为测试真实行为
```

## 反模式 2：生产代码中的仅测试用方法

**违规：**
```typescript
// 错误：destroy() 仅在测试中使用
class Session {
  async destroy() {  // 看起来像生产 API！
    await this._workspaceManager?.destroyWorkspace(this.id);
    // ... 清理
  }
}

// 在测试中
afterEach(() => session.destroy());
```

**为什么错误：**
- 生产类被仅测试用的代码污染
- 如果在生产中意外调用会危险
- 违反 YAGNI 和关注点分离
- 混淆对象生命周期和实体生命周期

**修正：**
```typescript
// 正确：测试工具处理测试清理
// Session 没有 destroy() —— 在生产中它是无状态的

// 在 test-utils/ 中
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// 在测试中
afterEach(() => cleanupSession(session));
```

### 门函数

```
在向生产类添加任何方法之前：
  问："这仅被测试使用吗？"

  如果是：
    停止 —— 不要添加它
    放到测试工具中

  问："这个类拥有此资源的生命周期吗？"

  如果否：
    停止 —— 这个方法不应该在这个类中
```

## 反模式 3：不理解就 Mock

**违规：**
```typescript
// 错误：Mock 破坏了测试逻辑
test('检测重复服务器', () => {
  // Mock 阻止了测试依赖的配置写入！
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // 应该抛出 —— 但不会！
});
```

**为什么错误：**
- Mock 的方法有测试依赖的副作用（写入配置）
- 为了"安全"过度 mock 破坏了实际行为
- 测试因错误原因通过或神秘失败

**修正：**
```typescript
// 正确：在正确的层级 mock
test('检测重复服务器', () => {
  // Mock 慢的部分，保留测试需要的行为
  vi.mock('MCPServerManager'); // 只 mock 慢的服务器启动

  await addServer(config);  // 配置已写入
  await addServer(config);  // 检测到重复
});
```

### 门函数

```
在 mock 任何方法之前：
  停止 —— 先不要 mock

  1. 问："真实方法有哪些副作用？"
  2. 问："这个测试依赖其中哪些副作用？"
  3. 问："我完全理解这个测试需要什么吗？"

  如果依赖副作用：
    在更低层级 mock（真正慢的/外部操作）
    或使用保留必要行为的测试替身
    不要 mock 测试依赖的高层方法

  如果不确定测试依赖什么：
    先用真实实现运行测试
    观察实际需要发生什么
    然后在正确的层级添加最小 mock

  红旗：
    - "我 mock 这个以防万一"
    - "这可能很慢，最好 mock 它"
    - 在不理解依赖链的情况下 mock
```

## 反模式 4：不完整的 Mock

**违规：**
```typescript
// 错误：部分 mock —— 只有你认为需要的字段
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // 缺失：下游代码使用的 metadata
};

// 之后：当代码访问 response.metadata.requestId 时崩溃
```

**为什么错误：**
- 部分 mock 隐藏了结构假设 —— 你只 mock 了你了解的字段
- 下游代码可能依赖你没包含的字段 —— 静默失败
- 测试通过但集成失败 —— mock 不完整，真实 API 完整
- 虚假信心 —— 测试证明不了真实行为

**铁律：** Mock 完整的数据结构，如现实中存在的那样，而不只是你当前测试使用的字段。

**修正：**
```typescript
// 正确：反映真实 API 的完整性
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
  // 真实 API 返回的所有字段
};
```

### 门函数

```
在创建 mock 响应之前：
  检查："真实 API 响应包含哪些字段？"

  操作：
    1. 检查文档/示例中的实际 API 响应
    2. 包含系统下游可能消费的所有字段
    3. 验证 mock 完全匹配真实响应模式

  关键：
    如果你在创建 mock，你必须理解整个结构
    部分 mock 在代码依赖省略字段时静默失败

  如果不确定：包含所有文档化字段
```

## 反模式 5：集成测试作为事后补充

**违规：**
```
实现完成
没有编写测试
"准备好测试了"
```

**为什么错误：**
- 测试是实现的一部分，不是可选的后续步骤
- TDD 会捕获这一点
- 没有测试就不能声称完成

**修正：**
```
TDD 循环：
1. 写失败测试
2. 实现使其通过
3. 重构
4. 然后才能声称完成
```

## 当 Mock 变得过于复杂时

**警告信号：**
- Mock 设置比测试逻辑还长
- Mock 所有东西来使测试通过
- Mock 缺少真实组件有的方法
- 测试在 mock 变更时失败

**应该考虑：** 使用真实组件的集成测试通常比复杂的 mock 更简单

## TDD 防止这些反模式

**TDD 为什么有帮助：**
1. **先写测试** —— 迫使你思考你真正在测试什么
2. **看它失败** —— 确认测试测试的是真实行为，不是 mock
3. **最小实现** —— 没有仅测试用的方法悄悄进入
4. **真实依赖** —— 在 mock 之前看到测试真正需要什么

**如果你在测试 mock 行为，你就违反了 TDD** —— 你在没有先看测试针对真实代码失败的情况下添加了 mock。

## 快速参考

| 反模式 | 修正 |
|--------------|-----|
| 断言 mock 元素 | 测试真实组件或不 mock 它 |
| 生产代码中的仅测试用方法 | 移到测试工具中 |
| 不理解就 mock | 先理解依赖，最小化 mock |
| 不完整的 mock | 完全反映真实 API |
| 测试作为事后补充 | TDD —— 测试先行 |
| 过度复杂的 mock | 考虑集成测试 |

## 红旗

- 断言检查 `*-mock` 测试 ID
- 只在测试文件中调用的方法
- Mock 设置超过测试的 50%
- 移除 mock 后测试失败
- 无法解释为什么需要 mock
- "以防万一"而 mock

## 底线

**Mock 是隔离的工具，不是测试的对象。**

如果 TDD 揭示你在测试 mock 行为，你就走错了。

修正：测试真实行为，或质疑你为什么一开始就在 mock。
