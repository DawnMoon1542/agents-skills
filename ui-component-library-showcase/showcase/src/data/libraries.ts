export type LibraryId =
  | 'shadcn-ui'
  | 'heroui'
  | 'material-ui'
  | 'ui-tripled'
  | 'tailark-ui'
  | 'reui'
  | 'shadcnblocks'
  | 'kokonut-ui'

export type SourceLink = {
  label: string
  url: string
}

export type LibraryProfile = {
  id: LibraryId
  name: string
  category: string
  summary: string
  bestFor: string[]
  avoidWhen: string[]
  styleSignals: string[]
  technicalBase: string[]
  sourceLinks: SourceLink[]
  pageBrief: string
  visualTone: string
  accent: string
}

export const libraries: LibraryProfile[] = [
  {
    id: 'shadcn-ui',
    name: 'shadcn/ui',
    category: '源码分发基础组件系统',
    summary: '以 Radix UI、Tailwind CSS 和 CLI registry 为核心，提供可复制、可维护、可深度定制的组件源码。',
    bestFor: [
      '需要建立自有设计系统的 React 或 Next.js 项目',
      '团队愿意维护组件源码并掌控细节',
      '需要与 AI 编程工具结合生成页面和 blocks'
    ],
    avoidWhen: [
      '团队希望通过 npm 包获得完整托管式升级',
      '缺少维护 Tailwind 与组件源码的能力',
      '项目不能接受复制源码进入代码库'
    ],
    styleSignals: [
      '中性底色',
      '可组合 primitives',
      '克制边框',
      '工程化组件命名'
    ],
    technicalBase: ['React', 'Radix UI', 'Tailwind CSS', 'TypeScript', 'shadcn CLI'],
    sourceLinks: [
      { label: '官方文档', url: 'https://ui.shadcn.com/docs' },
      { label: '官方 blocks', url: 'https://ui.shadcn.com/blocks' }
    ],
    pageBrief: '页面应表现“属于自己代码库的组件系统”：强调源码所有权、组合式 primitives、设计 token 与工程控制感。',
    visualTone: 'neutral-system',
    accent: '#334155'
  },
  {
    id: 'heroui',
    name: 'HeroUI',
    category: '运行时 React 组件库',
    summary: '原 NextUI，基于 React Aria Components 与 Tailwind CSS v4，强调可访问性、现代默认视觉和完整组件体验。',
    bestFor: [
      '希望快速获得完整 React 组件库的产品团队',
      '需要较强可访问性基础和键盘交互支持的应用',
      '偏好现代柔和视觉、暗色模式和动画细节的界面'
    ],
    avoidWhen: [
      '必须完全拥有组件源码的项目',
      '已有复杂 Tailwind v3 体系且暂不升级',
      '需要严格遵循 Material Design 规范'
    ],
    styleSignals: [
      '圆润控件',
      '柔和阴影',
      '明亮焦点态',
      '内建动效'
    ],
    technicalBase: ['React', 'React Aria Components', 'Tailwind CSS v4', 'TypeScript'],
    sourceLinks: [
      { label: '官方文档', url: 'https://heroui.com/docs/react/getting-started' },
      { label: 'GitHub', url: 'https://github.com/heroui-inc/heroui' },
      { label: 'npm', url: 'https://www.npmjs.com/package/@heroui/react' }
    ],
    pageBrief: '页面应表现现代 SaaS 应用感：圆润面板、清晰 focus ring、深浅模式友好、轻量微动效。',
    visualTone: 'polished-accessible',
    accent: '#2563eb'
  },
  {
    id: 'material-ui',
    name: 'Material UI',
    category: '成熟企业级 React 组件库',
    summary: 'MUI Core 的 Material UI 实现 Google Material Design，提供大量生产级组件、主题能力和扩展生态。',
    bestFor: [
      '企业后台、管理系统和中大型表单界面',
      '需要稳定文档、长期生态和复杂组件扩展的团队',
      '认可 Material Design 交互和视觉规范的产品'
    ],
    avoidWhen: [
      '品牌视觉需要完全摆脱 Material Design 语言',
      '极度关注首屏 bundle 体积且只需少量组件',
      '团队不希望引入 Emotion 或 MUI 样式体系'
    ],
    styleSignals: [
      'Material elevation',
      '明确状态层',
      '规范化表单',
      '企业级信息密度'
    ],
    technicalBase: ['React', '@mui/material', 'Emotion', 'Material Design', 'MUI X'],
    sourceLinks: [
      { label: '官方文档', url: 'https://mui.com/material-ui/getting-started/' },
      { label: 'GitHub', url: 'https://github.com/mui/material-ui' },
      { label: 'npm', url: 'https://www.npmjs.com/package/@mui/material' }
    ],
    pageBrief: '页面应表现企业应用成熟度：清晰表单、状态层级、数据表预览、Material 规范下的主题化能力。',
    visualTone: 'enterprise-material',
    accent: '#1976d2'
  },
  {
    id: 'ui-tripled',
    name: 'UI TripleD',
    category: 'shadcn 风格动效组件与 blocks registry',
    summary: '面向 Next.js、React、Tailwind CSS 和 shadcn 系统的组件、motion blocks 与 landing page 模板集合。',
    bestFor: [
      '需要带动效的 landing page、hero、pricing 和展示区块',
      '已经采用 shadcn/ui 并希望扩充视觉表现的项目',
      '希望用 registry 快速接入页面级组件的团队'
    ],
    avoidWhen: [
      '需要严肃企业后台的稳定控件体系',
      '项目禁止 Framer Motion 或 Motion 相关运行时代码',
      '需要完整官方大型组织背书的基础库'
    ],
    styleSignals: [
      '动效区块',
      '现代 landing page',
      '大号视觉焦点',
      'shadcn 结构底座'
    ],
    technicalBase: ['React', 'Next.js', 'Tailwind CSS', 'shadcn/ui', 'Framer Motion'],
    sourceLinks: [
      { label: 'registry.directory', url: 'https://www.registry.directory/moumen-soliman/uitripled' },
      { label: '站点', url: 'https://tripled.dev/' },
      { label: '相关文章', url: 'https://shadcnstudio.com/blog/modern-ui-components-tools-from-ui-tripled' }
    ],
    pageBrief: '页面应表现动效组件集合：用分层 hero、运动轨迹、template card 和 registry 片段表达营销页面速度感。',
    visualTone: 'motion-landing',
    accent: '#0f766e'
  },
  {
    id: 'tailark-ui',
    name: 'Tailark UI',
    category: 'shadcn 营销页面 blocks',
    summary: '围绕 shadcn/ui 与 Tailwind CSS 的营销网站区块系统，适合创建 landing page、产品页和品牌型页面。',
    bestFor: [
      'SaaS、创业项目和产品营销网站',
      '需要完整营销页面结构而不只是基础控件的团队',
      '偏好 shadcn 技术底座和可编辑 blocks 的项目'
    ],
    avoidWhen: [
      '核心需求是后台复杂表格、树形控件或业务表单',
      '项目已经有强约束品牌视觉且不能采用现成区块结构',
      '需要运行时组件库而非可复制源码'
    ],
    styleSignals: [
      '营销叙事区块',
      'bento feature',
      '产品插画',
      '高留白布局'
    ],
    technicalBase: ['React', 'Next.js', 'Tailwind CSS', 'shadcn/ui'],
    sourceLinks: [
      { label: '官网', url: 'https://tailark.com/' },
      { label: 'GitHub blocks', url: 'https://github.com/tailark/blocks' },
      { label: '资源页', url: 'https://www.tailawesome.com/resources/tailark-blocks' }
    ],
    pageBrief: '页面应表现现代营销站：非对称 hero、品牌文案区、bento 特性和清晰转化区。',
    visualTone: 'marketing-editorial',
    accent: '#9a3412'
  },
  {
    id: 'reui',
    name: 'ReUI',
    category: '企业级 shadcn registry 与组件扩展',
    summary: '面向 shadcn 项目的开放组件与 blocks 集合，支持 Base UI 与 Radix UI 版本，覆盖 Data Grid、Filters、Kanban 等应用级组件。',
    bestFor: [
      '已采用 shadcn/ui 的中后台或产品应用',
      '需要 Data Grid、Filters、File Upload、Kanban、Sortable 等复合组件',
      '希望在 Base UI 与 Radix UI 之间保留选择空间的团队'
    ],
    avoidWhen: [
      '只需要少量营销区块',
      '不希望接入 registry 或维护复制组件源码',
      '项目不使用 Tailwind CSS 或 shadcn 体系'
    ],
    styleSignals: [
      '应用级密度',
      '复合控件',
      '过滤与表格',
      '企业功能块'
    ],
    technicalBase: ['React 19', 'Tailwind CSS v4', 'shadcn/ui', 'Base UI', 'Radix UI'],
    sourceLinks: [
      { label: '官网', url: 'https://reui.io/' },
      { label: '文档', url: 'https://reui.io/docs' },
      { label: 'GitHub', url: 'https://github.com/keenthemes/reui' }
    ],
    pageBrief: '页面应表现应用组件扩展：数据视图、过滤器、上传、看板和复杂控件组合。',
    visualTone: 'application-kit',
    accent: '#475569'
  },
  {
    id: 'shadcnblocks',
    name: 'shadcnblocks',
    category: 'shadcn blocks 与组件目录',
    summary: '提供大量 shadcn UI blocks 与组件，支持复制、下载或通过 shadcn registry 安装，覆盖 UI 组件与页面区块。',
    bestFor: [
      '需要大量现成页面区块和组件变体的 shadcn 项目',
      '希望用搜索目录快速挑选 hero、pricing、nav、dashboard block 的团队',
      '需要免费与付费资源混合选择的产品开发'
    ],
    avoidWhen: [
      '团队需要统一单一设计语言而不希望筛选大量变体',
      '项目不采用 shadcn 或 Tailwind CSS',
      '需要传统 npm 包式组件升级机制'
    ],
    styleSignals: [
      '区块目录',
      '组件变体丰富',
      'copy-paste 模式',
      '快速页面拼装'
    ],
    technicalBase: ['React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'shadcn registry'],
    sourceLinks: [
      { label: '官网', url: 'https://www.shadcnblocks.com/' },
      { label: '组件目录', url: 'https://www.shadcnblocks.com/components/ui' },
      { label: 'blocks', url: 'https://shadcnblocks.com/blocks' }
    ],
    pageBrief: '页面应表现资源目录感：搜索、分类、预览卡片和安装入口，并保留 shadcn 的中性系统气质。',
    visualTone: 'catalog-system',
    accent: '#52525b'
  },
  {
    id: 'kokonut-ui',
    name: 'Kokonut UI',
    category: '动画化 shadcn/Tailwind 组件集合',
    summary: '开源 React 组件集合，基于 Tailwind CSS、shadcn/ui 和 Motion，强调现代视觉、交互动效与可通过 shadcn CLI 安装。',
    bestFor: [
      '需要更有表现力的按钮、AI 组件、卡片和交互动效',
      '希望在 shadcn 底座上加入 Motion 动画的产品页面',
      'React 或 Next.js 项目中的展示型界面和产品体验页'
    ],
    avoidWhen: [
      '严格禁用持续动画或 Motion 依赖的系统',
      '主要需求是复杂后台业务控件',
      '团队需要极度克制的企业规范视觉'
    ],
    styleSignals: [
      '高表现力动画',
      '现代组件卡片',
      'AI 产品气质',
      'shadcn registry 安装'
    ],
    technicalBase: ['React', 'Next.js', 'Tailwind CSS', 'shadcn/ui', 'Motion'],
    sourceLinks: [
      { label: '官网', url: 'https://kokonutui.com/' },
      { label: '文档', url: 'https://kokonutui.com/docs' },
      { label: 'GitHub', url: 'https://github.com/kokonut-labs/kokonutui' }
    ],
    pageBrief: '页面应表现动画化产品界面：粒子按钮、浮动卡片、AI 输入框和强交互组件预览。',
    visualTone: 'animated-product',
    accent: '#be123c'
  }
]

export const libraryIds = libraries.map((library) => library.id)
