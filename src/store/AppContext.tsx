import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ChatSession, MemoryEntry, MemoryCategory, Message, Note, NoteFormat, View } from '@/types';
import { MOCK_MEMORIES, MOCK_NOTES, MOCK_SESSIONS } from '@/data/mock';
import { generateId } from '@/lib/mockApi';

interface AppState {
  view: View;
  setView: (v: View) => void;

  // Notes
  notes: Note[];
  activeNoteId: string | null;

  // Memory
  memories: MemoryEntry[];

  // Chat
  sessions: ChatSession[];
  activeSessionId: string | null;
  isThinking: boolean;
}

interface AppActions {
  // Notes
  createNote: (input: { content: string; format?: NoteFormat; quickTitle?: string }) => Promise<Note>;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  linkNotes: (aId: string, bId: string) => void;
  allTags: () => string[];

  // Memory
  deleteMemory: (id: string) => void;
  toggleMemoryImportance: (id: string) => void;

  // Chat
  createSession: () => ChatSession;
  setActiveSession: (id: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  deleteSession: (id: string) => void;
}

type AppCtx = AppState & AppActions;

const Ctx = createContext<AppCtx | null>(null);

// ---------- AI mock helpers ----------

function mockTag(content: string): string[] {
  const text = content.toLowerCase();
  const rules: [string[], string][] = [
    [['react', '组件', 'hook', 'jsx'], 'React'],
    [['前端', '浏览器', 'css', 'html'], '前端'],
    [['旅行', '行程', '景点', '杭州', '上海'], '旅行'],
    [['第二大脑', 'zettelkasten', '卡片', '笔记法'], '第二大脑'],
    [['番茄', '专注', '效率'], '效率'],
    [['会议', '评审', '产品', '待办'], '会议'],
    [['工作', '项目', 'task'], '工作'],
    [['读书', '论文', 'pdf', '研究'], '阅读'],
    [['想法', '灵感', 'idea'], '灵感'],
  ];
  const hit = rules.filter(([kws]) => kws.some((k) => text.includes(k))).map(([, tag]) => tag);
  const extra: string[] = [];
  if (content.length > 200) extra.push('长文');
  if (content.includes('## ') || content.includes('### ')) extra.push('结构化');
  const base = hit.length ? hit : ['速记'];
  return Array.from(new Set([...base, ...extra])).slice(0, 4);
}

function mockSummary(content: string): string {
  const plain = content.replace(/[#*>\-`]/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.slice(0, 80) + (plain.length > 80 ? '...' : '');
}

function mockAiReply(content: string, memories: MemoryEntry[], notes: Note[]): { thinking: string; answer: string } {
  const relevantPrefs = memories.filter((m) => m.category === 'preference');
  const relatedNotes = notes
    .filter((n) => {
      const t = content.toLowerCase();
      return n.tags.some((tag) => content.includes(tag)) || n.content.toLowerCase().slice(0, 50).split(' ').some((w) => t.includes(w));
    })
    .slice(0, 2);

  const prefHint = relevantPrefs.length
    ? `（用户偏好：${relevantPrefs.map((p) => p.content).join('；')}）`
    : '';

  const thinking = `分析用户输入 "${content.slice(0, 40)}"${prefHint}\n${
    relatedNotes.length ? `发现 ${relatedNotes.length} 条相关笔记可以引用` : '暂无直接相关笔记'
  }\n决定给出简洁、可执行的建议。`;

  let answer = '';
  if (content.includes('你是谁') || content.includes('你能做什么')) {
    answer =
      '我是你的 **Muse 第二大脑** 🧠\n\n我可以：\n\n📝 **捕获想法** — 随手记，自动整理成结构化笔记\n🔗 **连接记忆** — 帮你发现想法之间的关系\n💬 **记住你** — 你的偏好、习惯、项目我都记着\n🗺️ **知识图谱** — 可视化你积累的内容\n\n直接告诉我你在想什么就行～';
  } else if (content.includes('记住') || content.includes('记一下')) {
    const extracted = content.replace(/^(帮我|请|记住|记一下)/g, '').trim();
    answer = `好的，我已经帮你记下了 ✨\n\n**"${extracted}"**\n\n这会成为你的一条记忆。以后相关的问题我会自动参考它。`;
  } else if (relatedNotes.length) {
    const refs = relatedNotes.map((n) => `  - 《${n.title}》（#${n.tags.join(' #')}）`).join('\n');
    answer = `我想到你之前记过这些相关笔记 📚\n\n${refs}\n\n关于"${content}"——结合你的现有知识，我的建议是：先从其中最相关的一条开始回顾，然后决定要深入还是拓展。需要我帮你把这几个想法连接起来吗？${prefHint}\n\n（另外：我可以把这个对话也捕获成一条笔记 ✍️）`;
  } else {
    answer = `收到！让我想想...${prefHint}\n\n建议你把这个想法也**捕获**下来——记得越多，Muse 越懂你 🧠\n\n直接点左边"速记"或在笔记页随手写就行。`;
  }
  return { thinking, answer };
}

// ---------- Provider ----------

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('chat');

  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(MOCK_NOTES[0]?.id ?? null);

  const [memories, setMemories] = useState<MemoryEntry[]>(MOCK_MEMORIES);

  const [sessions, setSessions] = useState<ChatSession[]>(MOCK_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(MOCK_SESSIONS[0]?.id ?? null);
  const [isThinking, setIsThinking] = useState(false);

  // ----- Notes -----
  const createNote = async (input: { content: string; format?: NoteFormat; quickTitle?: string }): Promise<Note> => {
    const { content, format = 'quick', quickTitle } = input;
    const now = Date.now();
    const note: Note = {
      id: generateId(),
      title: quickTitle ?? (content.slice(0, 24).replace(/[\n#*]/g, '') || '新笔记'),
      content,
      format,
      tags: mockTag(content),
      summary: mockSummary(content),
      createdAt: now,
      updatedAt: now,
      links: [],
    };
    setNotes((prev) => [note, ...prev]);
    return note;
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              ...patch,
              updatedAt: Date.now(),
              tags: patch.content ? mockTag(patch.content) : patch.tags ?? n.tags,
              summary: patch.content ? mockSummary(patch.content) : patch.summary ?? n.summary,
            }
          : n,
      ),
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id).map((n) => ({ ...n, links: n.links.filter((l) => l !== id) })));
    if (activeNoteId === id) setActiveNoteId(notes.find((n) => n.id !== id)?.id ?? null);
  };

  const setActiveNote = (id: string | null) => setActiveNoteId(id);

  const linkNotes = (aId: string, bId: string) => {
    if (aId === bId) return;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === aId && !n.links.includes(bId)) return { ...n, links: [...n.links, bId], updatedAt: Date.now() };
        if (n.id === bId && !n.links.includes(aId)) return { ...n, links: [...n.links, aId], updatedAt: Date.now() };
        return n;
      }),
    );
  };

  const allTags = () => Array.from(new Set(notes.flatMap((n) => n.tags))).sort();

  // ----- Memory -----
  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleMemoryImportance = (id: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, importance: m.importance >= 5 ? 1 : m.importance + 1 } : m)),
    );
  };

  // ----- Chat -----
  const createSession = () => {
    const session: ChatSession = {
      id: generateId(),
      title: '新对话',
      messages: [
        {
          id: generateId(),
          role: 'agent',
          content:
            '嗨 👋 我是 Muse，你的第二大脑。\n\n直接说你在想什么、想记什么，或者问我什么都行。我记得你告诉我的每一件事 🧠',
          createdAt: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    return session;
  };

  const setActiveSession = (id: string | null) => setActiveSessionId(id);

  const sendMessage = async (content: string) => {
    if (!activeSessionId || isThinking) return;

    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        const firstUserMsg = s.messages.find((m) => m.role === 'user');
        return {
          ...s,
          title: firstUserMsg ? s.title : (content.slice(0, 24) ?? '新对话'),
          messages: [...s.messages, userMsg],
          updatedAt: Date.now(),
        };
      }),
    );

    setIsThinking(true);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));

    const { thinking, answer } = mockAiReply(content, memories, notes);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [
                ...s.messages,
                {
                  id: generateId(),
                  role: 'agent',
                  content: answer,
                  createdAt: Date.now(),
                  thinking,
                },
              ],
              updatedAt: Date.now(),
            }
          : s,
      ),
    );

    // 自动从对话里抽取一条记忆（简化版：含"我喜欢" / "我通常" 的句子）
    const patterns: Array<[RegExp, MemoryCategory]> = [
      [/我(?:喜欢|偏好|习惯).+/, 'preference'],
      [/我(?:通常|一般|总是).+/, 'habit'],
      [/我(?:在做|正在做|做).+项目/, 'project'],
    ];
    for (const [re, cat] of patterns) {
      const match = content.match(re);
      if (match) {
        const extracted = match[0];
        const exists = memories.some((m) => m.content === extracted);
        if (!exists) {
          const newMem: MemoryEntry = {
            id: generateId(),
            category: cat,
            content: extracted,
            source: `chat-${activeSessionId}`,
            createdAt: Date.now(),
            importance: cat === 'project' ? 5 : 3,
          };
          setMemories((prev) => [newMem, ...prev]);
        }
        break;
      }
    }

    setIsThinking(false);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(sessions.find((s) => s.id !== id)?.id ?? null);
    }
  };

  const value = useMemo<AppCtx>(
    () => ({
      view,
      setView,
      notes,
      activeNoteId,
      memories,
      sessions,
      activeSessionId,
      isThinking,
      createNote,
      updateNote,
      deleteNote,
      setActiveNote,
      linkNotes,
      allTags,
      deleteMemory,
      toggleMemoryImportance,
      createSession,
      setActiveSession,
      sendMessage,
      deleteSession,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, notes, activeNoteId, memories, sessions, activeSessionId, isThinking],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
