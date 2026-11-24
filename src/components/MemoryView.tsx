import { BrainCircuit, Star, Trash2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import type { MemoryCategory } from '@/types';

const CATEGORY_LABEL: Record<MemoryCategory, { label: string; emoji: string; color: string }> = {
  preference: { label: '偏好', emoji: '💫', color: 'text-purple-500' },
  fact: { label: '事实', emoji: '📌', color: 'text-blue-500' },
  habit: { label: '习惯', emoji: '⏰', color: 'text-amber-500' },
  project: { label: '项目', emoji: '🚀', color: 'text-emerald-500' },
};

export function MemoryView() {
  const { memories, deleteMemory, toggleMemoryImportance } = useApp();

  const grouped: Record<MemoryCategory, typeof memories> = {
    preference: [],
    fact: [],
    habit: [],
    project: [],
  };
  memories.forEach((m) => grouped[m.category].push(m));

  const totalImportance = memories.reduce((s, m) => s + m.importance, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-bg">
      {/* Header */}
      <header className="h-14 border-b border-border bg-surface px-6 flex items-center gap-3 shrink-0">
        <BrainCircuit size={18} className="text-brand" />
        <div className="font-semibold text-sm flex-1">记忆</div>
        <div className="text-xs text-text-muted">
          共 {memories.length} 条 · 总权重 {totalImportance}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 介绍卡片 */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand/10 to-brand-light/10 border border-brand/20">
            <div className="text-sm font-medium mb-1 flex items-center gap-2">
              🧠 Muse 正在学习你
            </div>
            <div className="text-xs text-text-muted leading-relaxed">
              在对话中提到"我喜欢…"、"我通常…"、"我正在做…"，我会自动提炼成记忆，以后回答会自动参考它们。
              点 ⭐ 可以提升重要度，越重要的记忆权重越高。
            </div>
          </div>

          {memories.length === 0 && (
            <div className="text-center text-text-muted py-10">
              还没有任何记忆 — 去和 Muse 聊聊你的偏好吧
            </div>
          )}

          {(Object.keys(grouped) as MemoryCategory[]).map((cat) => {
            const items = grouped[cat];
            if (items.length === 0) return null;
            const meta = CATEGORY_LABEL[cat];
            return (
              <div key={cat}>
                <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>{meta.emoji}</span> {meta.label}
                </div>
                <div className="space-y-2">
                  {items.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-surface border border-border group hover:border-brand/30 transition"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 ${meta.color}`}>{meta.emoji}</div>
                        <div className="flex-1">
                          <div className="text-sm leading-relaxed">{m.content}</div>
                          <div className="text-[11px] text-text-muted mt-1.5 flex items-center gap-2">
                            <span>来源: {m.source}</span>
                            <span>·</span>
                            <span>{new Date(m.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                          <button
                            onClick={() => toggleMemoryImportance(m.id)}
                            className="flex items-center gap-0.5 text-xs text-amber-500 hover:text-amber-600"
                            title="点击提升重要度"
                          >
                            <Star size={12} fill="currentColor" />
                            <span>{m.importance}</span>
                          </button>
                          <button
                            onClick={() => deleteMemory(m.id)}
                            className="p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition"
                            title="删除"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
