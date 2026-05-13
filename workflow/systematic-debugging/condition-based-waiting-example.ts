// 基于条件等待工具函数的完整实现
// 来源：测试基础设施改进（2025-10-03）
// 背景：通过替换任意超时修复了 15 个不稳定测试

import type { ThreadManager } from '~/threads/thread-manager';
import type { LaceEvent, LaceEventType } from '~/threads/types';

/**
 * 等待特定事件类型在线程中出现
 *
 * @param threadManager - 要查询的线程管理器
 * @param threadId - 要检查事件的线程
 * @param eventType - 要等待的事件类型
 * @param timeoutMs - 最大等待时间（默认 5000ms）
 * @returns Promise，解析为第一个匹配的事件
 *
 * 示例：
 *   await waitForEvent(threadManager, agentThreadId, 'TOOL_RESULT');
 */
export function waitForEvent(
  threadManager: ThreadManager,
  threadId: string,
  eventType: LaceEventType,
  timeoutMs = 5000
): Promise<LaceEvent> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const events = threadManager.getEvents(threadId);
      const event = events.find((e) => e.type === eventType);

      if (event) {
        resolve(event);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`等待 ${eventType} 事件超时，已等待 ${timeoutMs}ms`));
      } else {
        setTimeout(check, 10); // 每 10ms 轮询一次以提高效率
      }
    };

    check();
  });
}

/**
 * 等待指定数量、特定类型的事件
 *
 * @param threadManager - 要查询的线程管理器
 * @param threadId - 要检查事件的线程
 * @param eventType - 要等待的事件类型
 * @param count - 要等待的事件数量
 * @param timeoutMs - 最大等待时间（默认 5000ms）
 * @returns Promise，解析为数量达标后的所有匹配事件
 *
 * 示例：
 *   // 等待 2 个 AGENT_MESSAGE 事件（初始响应 + 继续）
 *   await waitForEventCount(threadManager, agentThreadId, 'AGENT_MESSAGE', 2);
 */
export function waitForEventCount(
  threadManager: ThreadManager,
  threadId: string,
  eventType: LaceEventType,
  count: number,
  timeoutMs = 5000
): Promise<LaceEvent[]> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const events = threadManager.getEvents(threadId);
      const matchingEvents = events.filter((e) => e.type === eventType);

      if (matchingEvents.length >= count) {
        resolve(matchingEvents);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(
          new Error(
            `等待 ${count} 个 ${eventType} 事件超时，已等待 ${timeoutMs}ms（收到 ${matchingEvents.length} 个）`
          )
        );
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
}

/**
 * 等待匹配自定义谓词的事件
 * 适用于需要检查事件数据而不仅仅是事件类型的情况
 *
 * @param threadManager - 要查询的线程管理器
 * @param threadId - 要检查事件的线程
 * @param predicate - 当事件匹配时返回 true 的函数
 * @param description - 用于错误消息的人类可读描述
 * @param timeoutMs - 最大等待时间（默认 5000ms）
 * @returns Promise，解析为第一个匹配的事件
 *
 * 示例：
 *   // 等待带有特定 ID 的 TOOL_RESULT
 *   await waitForEventMatch(
 *     threadManager,
 *     agentThreadId,
 *     (e) => e.type === 'TOOL_RESULT' && e.data.id === 'call_123',
 *     'TOOL_RESULT with id=call_123'
 *   );
 */
export function waitForEventMatch(
  threadManager: ThreadManager,
  threadId: string,
  predicate: (event: LaceEvent) => boolean,
  description: string,
  timeoutMs = 5000
): Promise<LaceEvent> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const events = threadManager.getEvents(threadId);
      const event = events.find(predicate);

      if (event) {
        resolve(event);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`等待 ${description} 超时，已等待 ${timeoutMs}ms`));
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
}

// 来自实际调试实践的使用示例：
//
// 修复前（不稳定）：
// ---------------
// const messagePromise = agent.sendMessage('Execute tools');
// await new Promise(r => setTimeout(r, 300)); // 希望工具在 300ms 内启动
// agent.abort();
// await messagePromise;
// await new Promise(r => setTimeout(r, 50));  // 希望结果在 50ms 内到达
// expect(toolResults.length).toBe(2);         // 随机失败
//
// 修复后（可靠）：
// ----------------
// const messagePromise = agent.sendMessage('Execute tools');
// await waitForEventCount(threadManager, threadId, 'TOOL_CALL', 2); // 等待工具启动
// agent.abort();
// await messagePromise;
// await waitForEventCount(threadManager, threadId, 'TOOL_RESULT', 2); // 等待结果
// expect(toolResults.length).toBe(2); // 始终成功
//
// 结果：60% 通过率 → 100%，执行速度快 40%
