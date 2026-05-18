# CONTEXT.md 格式

## 结构

```md
# {Context 名称}

{一到两句话描述这个 context 是什么、为什么存在。}

## Language

**Order**:
{对该术语的简明定义}
_Avoid_: Purchase, transaction

**Invoice**:
交付后向客户发出的付款请求。
_Avoid_: Bill, payment request

**Customer**:
下单的个人或组织。
_Avoid_: Client, buyer, account

## Relationships

- 一个 **Order** 产生一个或多个 **Invoice**
- 一个 **Invoice** 只属于一个 **Customer**

## Example dialogue

> **Dev:** "当 **Customer** 下了一个 **Order** 时，我们是否立即创建 **Invoice**？"
> **Domain expert:** "不是——只有在 **Fulfillment** 确认后才生成 **Invoice**。"

## Flagged ambiguities

- "account" 曾被同时用于表示 **Customer** 和 **User**——已澄清：这是两个不同的概念。
```

## 规则

- **态度明确。** 当多个词指代同一概念时，选定最合适的一个，将其余列为应避免使用的别名。
- **显式标记冲突。** 如果某个术语被模糊使用，在 "Flagged ambiguities" 中指出并给出明确的澄清结论。
- **定义简洁。** 最多一句话。定义它**是什么**，而非它**做什么**。
- **展示关系。** 使用加粗的术语名称，在关系明确时标注基数。
- **只收录项目 context 特有的术语。** 通用编程概念（超时、错误类型、工具函数模式）不属于术语表，即使项目广泛使用它们。添加术语前先判断：这是本 context 特有的概念，还是通用编程概念？只有前者才应收录。
- **按子标题分组。** 当术语自然聚成若干类别时，按类别分组。如果所有术语属于同一个领域，扁平列表即可。
- **编写示例对话。** 一段开发者与领域专家之间的对话，展示术语如何自然交互，并澄清相关概念之间的边界。

## 单 context 与多 context 仓库

**单 context（多数仓库）：** 一个 `docs/CONTEXT.md`。

**多 context：** 在 `docs/CONTEXT-MAP.md` 中列出所有 context 的位置和相互关系：

```md
# Context Map

## Contexts

- [Ordering](../src/ordering/CONTEXT.md) — 接收和跟踪客户订单
- [Billing](../src/billing/CONTEXT.md) — 生成发票和处理付款
- [Fulfillment](../src/fulfillment/CONTEXT.md) — 管理仓库拣货和发货

## Relationships

- **Ordering → Fulfillment**: Ordering 发出 `OrderPlaced` 事件；Fulfillment 消费该事件以启动拣货
- **Fulfillment → Billing**: Fulfillment 发出 `ShipmentDispatched` 事件；Billing 消费该事件以生成发票
- **Ordering ↔ Billing**: 共享 `CustomerId` 和 `Money` 类型
```

技能按以下逻辑推断适用哪种结构：

- 如果存在 `docs/CONTEXT-MAP.md`，读取它以定位各 context
- 如果只存在 `docs/CONTEXT.md`，按单 context 处理
- 如果两者都不存在，在首个术语确认时懒创建 `docs/CONTEXT.md`

存在多个 context 时，推断当前话题属于哪个 context。不确定时向用户询问。
