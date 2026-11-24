import type { ChatSession, MemoryEntry, Note } from '@/types';

export const MOCK_NOTES: Note[] = [
  {
    id: 'n1',
    title: '第二大脑的设计思路',
    content:
      '## 第二大脑 (Second Brain)\n\n一个关于如何组织个人知识的想法：\n- **Capture** 捕获一切灵感、阅读、对话\n- **Connect** 让想法之间产生连接\n- **Recall** 需要时随时找回\n\n关键原则：原子化、双向链接、渐进式总结。',
    format: 'quick',
    tags: ['第二大脑', '知识管理', '方法论'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    links: ['n3', 'n5'],
    summary: '关于第二大脑方法论的初步构想，涵盖捕获、连接、回忆三个核心环节。',
  },
  {
    id: 'n2',
    title: '周末杭州 2 日游',
    content:
      'Day 1: 西湖、断桥、河坊街\nDay 2: 灵隐寺、龙井村\n\n交通：高铁 1h\n预算：约 1000 元',
    format: 'quick',
    tags: ['旅行', '杭州', '计划'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    links: [],
    summary: '杭州周末两日行程规划，含景点与预算。',
  },
  {
    id: 'n3',
    title: 'Zettelkasten 卡片盒笔记法',
    content:
      '## Zettelkasten\n\n- 每张卡片一个想法\n- 卡片之间互相链接\n- 渐进式总结：不断把小卡片归纳成大卡片\n- 类似维基，但更轻量\n\n参考：Niklas Luhmann 的方法',
    format: 'quick',
    tags: ['Zettelkasten', '笔记法', '知识管理'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    links: ['n1'],
    summary: 'Zettelkasten 卡片盒笔记法的核心原则。',
  },
  {
    id: 'n4',
    title: '产品评审会议纪要',
    content:
      '**参会人**：A、B、C\n\n**讨论要点**：\n1. Q4 目标聚焦增长\n2. 首页改版方案待定\n3. 下周一 demo\n\n**待办**：\n- [ ] 写竞品分析\n- [ ] 出高保真原型',
    format: 'meeting',
    tags: ['会议', '产品', '工作'],
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 10,
    links: [],
    summary: '产品评审会议要点：Q4 增长目标、首页改版待定、周一 demo。',
  },
  {
    id: 'n5',
    title: '番茄工作法实践心得',
    content:
      '## 番茄钟\n\n- 25min 专注 + 5min 休息\n- 4 个番茄后长休 15min\n- 配合第二大脑的 capture：休息时记下脑子里冒出来的想法\n\n**今天实践**：完成了 6 个番茄，效果不错。',
    format: 'journal',
    tags: ['效率', '番茄钟', '第二大脑'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    links: ['n1'],
    summary: '番茄工作法与第二大脑结合的实践体会。',
  },
  {
    id: 'n6',
    title: 'React 19 新特性',
    content:
      '## React 19\n\n- Actions & useActionState\n- useOptimistic\n- ref 作为 prop 直接传递\n- 原生支持文档元数据\n\n待办：升级到 19 验证兼容性',
    format: 'quick',
    tags: ['React', '前端', '技术'],
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 6,
    links: [],
    summary: 'React 19 主要新特性梳理。',
  },
];

export const MOCK_MEMORIES: MemoryEntry[] = [
  {
    id: 'm1',
    category: 'preference',
    content: '喜欢简洁的中文回答，不要太啰嗦',
    source: 'chat-s1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    importance: 4,
  },
  {
    id: 'm2',
    category: 'habit',
    content: '通常上午 9-12 点是深度工作时间',
    source: 'note-n5',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    importance: 3,
  },
  {
    id: 'm3',
    category: 'project',
    content: '正在做一个第二大脑 demo 项目，用 React + Vite',
    source: 'note-n1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    importance: 5,
  },
  {
    id: 'm4',
    category: 'fact',
    content: '从上海出发，喜欢周末短途旅行',
    source: 'note-n2',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    importance: 3,
  },
];

export const MOCK_SESSIONS: ChatSession[] = [
  {
    id: 's1',
    title: '如何组织我的第二大脑',
    messages: [
      {
        id: 'sm1',
        role: 'user',
        content: '我想建一个自己的第二大脑，你有什么建议？',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: 'sm2',
        role: 'agent',
        content:
          '好问题！根据我对你的了解，你喜欢简洁、从上海出发、正在用 React 做项目 👇\n\n建议的三步法：\n\n**1. Capture（捕获）**\n- 灵感、阅读、对话都随手记下\n- 不要想"要不要"，先记下来再说\n\n**2. Connect（连接）**\n- 每记一条，反问"这和我已知的 X 有什么关系？"\n- 双向链接让知识形成网络\n\n**3. Recall（回忆）**\n- 定期回顾标签页\n- 写作/总结时调用相关卡片\n\n你可以试试从 **Zettelkasten 卡片法** 开始，我已经帮你记了相关笔记 📚',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 + 60000,
        thinking:
          '用户之前提到了第二大脑和 Zettelkasten，我应该把这些内容整合起来回答。用户偏好简洁，所以回答要精炼。',
      },
    ],
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
];
