import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  BrainCircuit,
  MessageSquare,
  Network,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import type { View } from '@/types';

const NAV: { key: View; label: string; icon: typeof MessageSquare }[] = [
  { key: 'chat', label: '对话', icon: MessageSquare },
  { key: 'notes', label: '笔记', icon: BookOpen },
  { key: 'memory', label: '记忆', icon: BrainCircuit },
  { key: 'graph', label: '图谱', icon: Network },
];

export function Sidebar() {
  const {
    view,
    setView,
    notes,
    memories,
    sessions,
    activeSessionId,
    setActiveSession,
    deleteSession,
    createNote,
    activeNoteId,
    setActiveNote,
  } = useApp();

  const [quickText, setQuickText] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [quickText]);

  const handleQuickCapture = async () => {
    const v = quickText.trim();
    if (!v) return;
    await createNote({ content: v });
    setQuickText('');
    setView('notes');
  };

  return (
    <aside className="w-72 shrink-0 h-full flex flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white text-lg shadow-md">
          <Sparkles size={18} />
        </div>
        <div>
          <div className="font-semibold text-text">Muse</div>
          <div className="text-xs text-text-muted">你的第二大脑</div>
        </div>
      </div>

      {/* 快速捕获 */}
      <div className="p-3">
        <div className="text-xs font-medium text-text-muted uppercase tracking-wider px-2 mb-2">
          ✨ 快速捕获
        </div>
        <div className="bg-surface-2 rounded-xl border border-border p-2 focus-within:border-brand transition">
          <textarea
            ref={taRef}
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleQuickCapture();
              }
            }}
            rows={1}
            placeholder="脑子里冒出来啥？随手记..."
            className="w-full bg-transparent resize-none outline-none text-sm py-1 px-1 placeholder:text-text-muted max-h-[120px]"
          />
          <div className="flex justify-end">
            <button
              onClick={() => void handleQuickCapture()}
              disabled={!quickText.trim()}
              className="text-[11px] px-2 py-1 rounded-md bg-brand text-white hover:bg-brand-dark disabled:opacity-40 disabled:hover:bg-brand transition"
            >
              捕获
            </button>
          </div>
        </div>
      </div>

      {/* 导航 */}
      <div className="px-3 pb-2">
        <div className="text-xs font-medium text-text-muted uppercase tracking-wider px-2 mb-2">工作台</div>
        <div className="space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const count =
              n.key === 'notes'
                ? notes.length
                : n.key === 'memory'
                  ? memories.length
                  : n.key === 'chat'
                    ? sessions.length
                    : null;
            const active = view === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  active ? 'bg-brand/10 text-brand border border-brand/20' : 'hover:bg-surface-2/70'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium flex-1">{n.label}</span>
                {count !== null && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded ${
                      active ? 'bg-brand/20 text-brand' : 'bg-surface-2 text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 历史对话列表（仅在 Chat 视图时显示高亮） */}
      {view === 'chat' && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider px-2 mb-2 mt-2 flex items-center justify-between">
            <span>历史对话</span>
            <button
              onClick={() => {
                setActiveSession(null);
                // 触发 App.tsx 里的自动创建
              }}
              className="hover:text-brand transition"
              title="新对话"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="space-y-0.5">
            {sessions.length === 0 && (
              <div className="text-center text-xs text-text-muted py-6">暂无对话</div>
            )}
            {sessions.map((s) => {
              const active = s.id === activeSessionId;
              const lastMsg = [...s.messages].reverse().find((m) => m.role === 'user' || m.role === 'agent');
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s.id)}
                  className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                    active ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                  }`}
                >
                  <MessageSquare size={14} className="text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{s.title}</div>
                    <div className="text-[11px] text-text-muted truncate">
                      {lastMsg?.content.slice(0, 30) ?? '空对话'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 笔记计数 & 当前激活提示 */}
      {view === 'notes' && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider px-2 mb-2 mt-2">
            全部笔记
          </div>
          <div className="space-y-0.5">
            {notes.map((n) => {
              const active = n.id === activeNoteId;
              return (
                <div
                  key={n.id}
                  onClick={() => setActiveNote(n.id)}
                  className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                    active ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                  }`}
                >
                  <BookOpen size={14} className="text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{n.title}</div>
                    <div className="text-[11px] text-text-muted truncate">
                      # {n.tags.slice(0, 3).join(' · ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部用户信息 */}
      <div className="border-t border-border px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white text-sm font-medium">
          U
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">Guest</div>
          <div className="text-xs text-text-muted">Free · 隐私优先</div>
        </div>
      </div>
    </aside>
  );
}

// 避免 Search 未用告警（未来搜索功能预留）
export const _unusedSearch = Search;
