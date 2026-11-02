---
name: branch-brief
description: 为当前分支生成一份可直接交付他人的简报——相对基线分支的 diff 规模（新增/删除行数、文件数，含剔除测试与文档后的代码改动规模）、按主题归类的主要更新、breaking change、其他人必须了解的迁移与配置变化、需要人工验证的清单。用于合并前通知、测试交接、发布说明初稿、接手分支时快速建立全局认知。
---

# 分支简报

把当前分支相对基线分支的全部改动压缩成一份可交付文档。读者是没有参与开发的人，简报要让他们知道变了什么、哪里会坏、需要自己动手做什么。

**开始时声明：** “我正在使用 branch-brief 技能生成当前分支简报。”

## 适用与不适用

适用：

- 合并前通知相关人员
- 把分支交给测试或运维验证
- 长期分支中断后恢复全局认知
- 发布说明的原始素材

不适用：

- 判断实现是否达成目标、代码质量如何：使用 `branch-review`
- 逐条核对文档与代码一致性：使用 `audit-and-grill`
- 生成 commit message：使用 `git-smart-commit`

## 1. 确定基线与范围

先确认三个坐标，全部基于事实取值，不猜：

```bash
git rev-parse --abbrev-ref HEAD
git status --short
git branch -a --no-color
git log --oneline -n 20
```

基线分支按以下顺序确定，前一项可用就不继续：

1. 用户显式指定（`main`、`develop`、`origin/main`、某个 tag 或 SHA）
2. `git merge-base HEAD origin/HEAD` 指向的远端默认分支
3. `origin/main`、`origin/master`、`main`、`master` 中第一个存在的本地或远端引用

基线确定后记录：

- `BASE_REF`：用于 diff 的引用
- `BASE_SHA`：`git merge-base <BASE_REF> HEAD`
- `HEAD_SHA`：`git rev-parse HEAD`
- 工作区是否干净：`git status --short`

工作区不干净时分两部分呈现：已提交部分用 `BASE_SHA..HEAD`，未提交部分单独列为"未提交改动"，不要把两者混进同一个统计口径。

基线无法确定（例如分支从零开始、没有共同祖先）时停止并询问用户，不要默认用空树。

## 2. 统计 diff 规模

```bash
git diff --shortstat $BASE_SHA..HEAD
git diff --stat $BASE_SHA..HEAD
git log --oneline --no-merges $BASE_SHA..HEAD
```

总规模之外再单独统计一份代码规模：剔除测试文件与文档之后的文件数、行数。这一项反映实际需要审阅的实现代码量，读者据此判断投入多少精力读 diff。

```bash
CODE_EXCLUDE=(
  ':(exclude,glob)*.md'
  ':(exclude,glob)**/*.md'
  ':(exclude,glob)**/*.mdx'
  ':(exclude,glob)**/*.rst'
  ':(exclude,glob)**/*.adoc'
  ':(exclude,glob)**/*.txt'
  ':(exclude,glob)docs/**'
  ':(exclude,glob)**/docs/**'
  ':(exclude,glob)test/**'
  ':(exclude,glob)**/test/**'
  ':(exclude,glob)**/tests/**'
  ':(exclude,glob)**/__tests__/**'
  ':(exclude,glob)**/testing/**'
  ':(exclude,glob)**/spec/**'
  ':(exclude,glob)**/testdata/**'
  ':(exclude,glob)**/__fixtures__/**'
  ':(exclude,glob)**/*.test.*'
  ':(exclude,glob)**/*.spec.*'
  ':(exclude,glob)**/*_test.go'
  ':(exclude,glob)**/*Test.java'
  ':(exclude,glob)**/test_*.py'
  ':(exclude,glob)**/*_test.py'
  ':(exclude,glob)**/conftest.py'
)

# 代码规模
git diff --shortstat $BASE_SHA..HEAD -- . "${CODE_EXCLUDE[@]}"
# 被剔除掉的文件清单（用于核对口径与自检相加关系）
comm -23 <(git diff --name-only $BASE_SHA..HEAD | sort) \
         <(git diff --name-only $BASE_SHA..HEAD -- . "${CODE_EXCLUDE[@]}" | sort)
```

被剔除部分的文件数与行数取差值：总规模减去代码规模。不要用只含排除项的路径规格单独跑一次 diff，git 对纯排除 pathspec 的结果不符合预期。

先核对仓库的实际目录约定（读 `ls`、测试配置、CI 脚本），把不存在的模式删掉，把命中的测试或文档目录补进去。例如测试集中在 `src/**/__mocks__/` 或文档在 `site/` 时，按实际路径调整，不要照抄模板路径而不验证。

自检：代码规模与被剔除部分相加必须等于总规模（文件数、新增行、删除行三项分别相等），对不上说明路径通配写错或命中范围有重叠，修正后再写进简报。工作区不干净时，未提交改动部分用同一套路径规格单独统计。

简报的 Diff 规模一节只写以下七项，不写取法说明与命令来源，不做按目录聚合：

- 变更文件数：`git diff --shortstat` 的 `N files changed`
- 新增行：同一输出的 `X insertions(+)`
- 删除行：同一输出的 `Y deletions(-)`
- commit 数：`git log --oneline --no-merges $BASE_SHA..HEAD` 的行数
- 剔除测试与文档后的变更文件数：`CODE_EXCLUDE` 路径规格过滤后的 `--shortstat`
- 剔除测试与文档后的新增行：同一过滤后的输出
- 剔除测试与文档后的删除行：同一过滤后的输出

剔除测试与文档是并列的独立指标，不是替换总规模，两组数字同时出现。排除口径在内部核对时确定：剔除了哪些目录与后缀、是否包含快照与 fixture。生成的锁文件、快照、vendor 目录、格式化产生的整文件重写单独核对，不从总数里悄悄扣掉。

## 3. 提取主要更新

按主题归类，不按文件罗列。归类方法：

1. 读 commit message 建立主题线
2. 读 `git diff --stat` 定位每个主题落到的模块
3. 对每个主题读实际差异，确认主题线是否被 commit message 夸大或遗漏
4. commit message 与实际差异冲突时以代码为准，并在简报中标注

每个主题写四件事：

- 做了什么，一句话
- 落在哪些模块（路径）
- 对使用者的可见影响：新增能力、行为变化、或纯内部改动
- 对应 commit 范围

纯内部重构、测试补充、文档更新单独成节，不混进功能主题。

## 4. 识别 breaking change

逐项检查以下类别，命中的必须写进 breaking change 节：

- 公开接口变更：导出符号、路由、CLI 参数、事件名、环境变量的增删改
- 数据格式与 Schema：迁移文件、序列化字段重命名、必填字段新增、枚举值删除
- 配置与部署：新增必填配置、默认值变化、端口或路径改变
- 依赖：主版本升级、移除的传递依赖、运行时版本要求变化
- 构建与工具链：脚本命令改名、产物路径变化、Node/Python 版本底线
- 行为语义：同一输入产生不同输出、错误类型变化、排序或分页规则变化
- 删除的能力：被移除的旧实现、旧调用链、兼容层

判定标准：**不修改调用方或部署配置就能继续工作的，不算 breaking。**

无法从差异确定是否 breaking 时（例如内部函数签名变化但不确定外部是否引用），标记为"待确认"并写明需要确认的引用位置，不要猜测。

## 5. 其他人需要了解的内容

这是简报里最容易被省略的部分。至少覆盖：

- 本地开发需要额外执行的步骤（安装依赖、生成代码、启动服务、迁移数据库）
- 新增或变化的环境变量与密钥
- 与其它进行中分支可能冲突的文件或模块
- 已知未完成项、临时开关、被后续计划承接的部分
- 回滚方式与回滚时的数据风险
- 受影响的监控、日志、告警口径

## 6. 需要人工验证的内容

自动测试覆盖不到的必须列出来，每条写明验证步骤与预期结果：

- 需要真实设备、真实账号、真实第三方服务的路径
- UI 与交互在真实浏览器中的表现
- 数据迁移在真实数据量下的行为与耗时
- 权限、并发、失败恢复、重试
- 与外部系统的联调
- 无法在 CI 中稳定复现的时序问题

每条验证项给出：操作步骤、预期结果、失败时的判断依据。不要写"测试一下登录"这种无法执行的条目。

自动测试已覆盖的部分注明覆盖范围与命令，不要重复列出。

## 7. 输出

默认写入 `docs/briefs/YYYY-MM-DD-<branch-slug>.md`；用户指定路径时从其指定。用户只要求查看时直接输出到对话，不写文件。

模板：

```markdown
# 分支简报：<分支名>

## 概要

- 基线：<BASE_REF> @ <BASE_SHA 前 8 位>
- HEAD：<HEAD_SHA 前 8 位>
- 一句话：<这个分支解决什么问题>

## Diff 规模

- 变更文件数：
- 新增行：
- 删除行：
- commit 数：
- 剔除测试与文档后变更文件数：
- 剔除测试与文档后新增行：
- 剔除测试与文档后删除行：

## 主要更新

### <主题一>
- 内容：
- 模块：
- 可见影响：
- commit：

## Breaking change

无 breaking change 时写“无”，并说明依据（例如仅新增可选参数、无公开接口变化）。有则每条按四项写：

- 变更：
- 影响面：
- 迁移方式：
- 确认状态：

## 其他人需要了解

<本地步骤、环境变量、冲突风险、未完成项、回滚方式>

## 需要人工验证

每条按四项写：

- 验证项：
- 步骤：
- 预期结果：
- 依据：

## 自动化覆盖

- 命令：
- 结果：
- 未覆盖：

## 风险与未确认项

<需要对方判断或补充信息的内容>
```

## 质量控制

- 每个数字来自实际命令输出，不在简报中写取法说明与命令来源
- 简报正文不使用 markdown 表格，一律用列表
- 主题归类与 commit message 冲突时以代码为准并标注
- breaking change 宁可标“待确认”也不默认安全
- 人工验证项必须可执行
- 剔除测试与文档的统计与总规模自洽，两者相加等于总量
- 不写"改动较多""优化了性能"这类无法核对的说法

## 禁止事项

- 用 commit message 代替读实际差异
- 把未提交改动计入已提交统计
- 把生成文件、锁文件、快照从总数里静默扣掉
- 把内部重构描述为用户可见的变化
- 在没有基线的情况下给出 diff 数字
