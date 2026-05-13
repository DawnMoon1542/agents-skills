#!/usr/bin/env bash
# 二分查找脚本：找出哪个测试创建了不需要的文件/状态
# 用法: ./find-polluter.sh <要检查的文件或目录> <测试模式>
# 示例: ./find-polluter.sh '.git' 'src/**/*.test.ts'

set -e

if [ $# -ne 2 ]; then
  echo "用法: $0 <要检查的文件> <测试模式>"
  echo "示例: $0 '.git' 'src/**/*.test.ts'"
  exit 1
fi

POLLUTION_CHECK="$1"
TEST_PATTERN="$2"

echo "正在搜索创建了 ${POLLUTION_CHECK} 的测试"
echo "测试模式: $TEST_PATTERN"
echo ""

# 获取测试文件列表
TEST_FILES=$(find . -path "$TEST_PATTERN" | sort)
TOTAL=$(echo "$TEST_FILES" | wc -l | tr -d ' ')

echo "找到 $TOTAL 个测试文件"
echo ""

COUNT=0
for TEST_FILE in $TEST_FILES; do
  COUNT=$((COUNT + 1))

  # 如果污染已经存在则跳过
  if [ -e "$POLLUTION_CHECK" ]; then
    echo "警告：在第 $COUNT/$TOTAL 个测试之前污染已存在"
    echo "   跳过: $TEST_FILE"
    continue
  fi

  echo "[$COUNT/$TOTAL] 测试中: $TEST_FILE"

  # 运行测试
  npm test "$TEST_FILE" > /dev/null 2>&1 || true

  # 检查是否出现了污染
  if [ -e "$POLLUTION_CHECK" ]; then
    echo ""
    echo "找到了造成污染的测试！"
    echo "   测试: $TEST_FILE"
    echo "   创建了: $POLLUTION_CHECK"
    echo ""
    echo "污染详情:"
    ls -la "$POLLUTION_CHECK"
    echo ""
    echo "进一步调查:"
    echo "  npm test $TEST_FILE    # 仅运行此测试"
    echo "  cat $TEST_FILE         # 查看测试代码"
    exit 1
  fi
done

echo ""
echo "未找到造成污染的测试 —— 所有测试干净！"
exit 0
