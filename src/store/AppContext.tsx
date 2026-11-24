import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ChatSession, MemoryEntry, MemoryCategory, Message, Note, NoteFormat, View } from '@/types';
import { MOCK_MEMORIES, MOCK_NOTES, MOCK_SESSIONS } from '@/data/mock';
import { generateId } from '@/lib/mockApi';
import { buildSystemPrompt, callDeepSeekStream } from '@/lib/api';

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
    const agentMsgId = generateId();

    // 先插入 userMsg + 空的 agent 占位消息
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        const firstUserMsg = s.messages.find((m) => m.role === 'user');
        return {
          ...s,
          title: firstUserMsg ? s.title : content.slice(0, 24),
          messages: [
            ...s.messages,
            userMsg,
            {
              id: agentMsgId,
              role: 'agent',
              content: '', // 流式填充
              thinking: '',
              createdAt: Date.now(),
            },
          ],
          updatedAt: Date.now(),
        };
      }),
    );

    setIsThinking(true);

    // 构建 system prompt + api messages（同之前逻辑）
    const relatedNotes = notes
      .filter((n) => {
        const t = content.toLowerCase();
        return (
          n.tags.some((tag) => content.includes(tag)) ||
          n.title.toLowerCase().includes(t.slice(0, 6)) ||
          n.content.toLowerCase().includes(t.slice(0, 10))
        );
      })
      .slice(0, 3);

    const systemPrompt = buildSystemPrompt({
      memories: memories.map((m) => ({ category: m.category, content: m.content, importance: m.importance })),
      relatedNotes: relatedNotes.map((n) => ({ title: n.title, tags: n.tags, summary: n.summary })),
    });

    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...session.messages.map((m) => ({
        role: (m.role === 'agent' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content },
    ];

    // 流式回调
    callDeepSeekStream(apiMessages, {
      onThinkingChunk: (chunk) => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === agentMsgId ? { ...m, thinking: (m.thinking ?? '') + chunk } : m,
                  ),
                }
              : s,
          ),
        );
      },
      onContentChunk: (chunk) => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === agentMsgId ? { ...m, content: m.content + chunk } : m,
                  ),
                }
              : s,
          ),
        );
      },
      onDone: (result) => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === agentMsgId
                      ? { ...m, content: result.content, thinking: result.thinking || undefined }
                      : m,
                  ),
                  updatedAt: Date.now(),
                }
              : s,
          ),
        );

        // 自动抽取记忆
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
      },
      onError: () => {
        setIsThinking(false);
      },
    });
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
