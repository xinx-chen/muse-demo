import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, FileText, Link as LinkIcon, Plus, Search, Sparkles, Tags, Trash2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import type { Note } from '@/types';

export function NotesView() {
  const { notes, activeNoteId, setActiveNote, createNote, allTags } = useApp();

  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase().trim();
    return notes
      .filter((n) => {
        if (n.archived) return false;
        if (tagFilter && !n.tags.includes(tagFilter)) return false;
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, search, tagFilter]);

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? filteredNotes[0] ?? null;

  // 自动选中第一条
  useEffect(() => {
    if (!activeNoteId && filteredNotes[0]) setActiveNote(filteredNotes[0].id);
  }, [activeNoteId, filteredNotes, setActiveNote]);

  const handleNewNote = async () => {
    const n = await createNote({ content: '在这里写点什么...', quickTitle: '新笔记' });
    setActiveNote(n.id);
  };

  return (
    <div className="flex-1 flex h-full bg-bg">
      {/* 左侧：列表 + 搜索 */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col bg-surface">
        <div className="h-14 border-b border-border px-4 flex items-center gap-2 shrink-0">
          <FileText size={18} className="text-brand" />
          <div className="font-semibold text-sm flex-1">笔记</div>
          <button
            onClick={() => void handleNewNote()}
            className="p-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark transition"
            title="新建笔记"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* 搜索 */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题、内容、标签..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-2 border border-border text-sm outline-none focus:border-brand transition placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* 标签过滤 */}
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Tags size={12} className="text-text-muted" />
            <span className="text-[11px] text-text-muted uppercase tracking-wider">标签</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {tagFilter && (
              <button
                onClick={() => setTagFilter(null)}
                className="text-[11px] px-2 py-0.5 rounded-full bg-brand text-white"
              >
                全部 ×
              </button>
            )}
            {allTags().slice(0, 12).map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(tagFilter === t ? null : t)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                  tagFilter === t
                    ? 'bg-brand/15 text-brand border-brand/40'
                    : 'bg-surface-2 border-border text-text-muted hover:border-brand'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 && (
            <div className="text-center text-xs text-text-muted py-10">
              {search || tagFilter ? '没有匹配的笔记' : '还没有笔记，点 + 开始写吧'}
            </div>
          )}
          {filteredNotes.map((n) => (
            <div
              key={n.id}
              onClick={() => setActiveNote(n.id)}
              className={`px-4 py-3 border-b border-border cursor-pointer transition ${
                n.id === activeNote?.id ? 'bg-surface-2' : 'hover:bg-surface-2/60'
              }`}
            >
              <div className="text-sm font-medium truncate mb-1">{n.title}</div>
              <div className="text-[11px] text-text-muted line-clamp-2 whitespace-pre-wrap">
                {n.summary ?? n.content.slice(0, 60)}
              </div>
              <div className="flex gap-1 mt-1.5">
                {n.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] text-brand/70">
                    #{t}
                  </span>
                ))}
                {n.links.length > 0 && (
                  <span className="text-[10px] text-text-muted flex items-center gap-0.5 ml-auto">
                    <LinkIcon size={10} /> {n.links.length}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：编辑区 */}
      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <NoteEditor note={activeNote} taRef={taRef} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">还没有选中笔记</div>
              <button
                onClick={() => void handleNewNote()}
                className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark transition"
              >
                新建第一条笔记
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteEditor({ note, taRef }: { note: Note; taRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const { notes, updateNote, deleteNote, linkNotes } = useApp();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  // 切换到不同 note 时同步本地 state
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  const handleBlur = () => {
    updateNote(note.id, { title: title.trim() || '未命名', content });
  };

  const linkedNotes = notes.filter((n) => note.links.includes(n.id));
  const availableNotesToLink = notes.filter((n) => n.id !== note.id && !note.links.includes(n.id));

  const formatLabel = { quick: '速记', journal: '日志', meeting: '会议' }[note.format];

  return (
    <>
      {/* 工具栏 */}
      <header className="h-14 border-b border-border bg-surface px-6 flex items-center gap-3 shrink-0">
        <span className="text-[11px] px-2 py-0.5 rounded bg-brand/15 text-brand border border-brand/20">
          {formatLabel}
        </span>
        <span className="text-xs text-text-muted flex items-center gap-1">
          <Sparkles size={12} /> AI 标签自动生成
        </span>
        <div className="flex-1" />
        <span className="text-[11px] text-text-muted">
          {new Date(note.updatedAt).toLocaleString('zh-CN')}
        </span>
        <button
          onClick={() => deleteNote(note.id)}
          className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition"
          title="删除笔记"
        >
          <Trash2 size={14} />
        </button>
      </header>

      {/* 编辑 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            placeholder="标题"
            className="w-full text-2xl font-bold bg-transparent outline-none mb-2 placeholder:text-text-muted/50"
          />

          {/* 标签 */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {note.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20"
              >
                #{t}
              </span>
            ))}
          </div>

          {/* AI 摘要 */}
          {note.summary && (
            <div className="mb-5 px-3 py-2 rounded-lg bg-surface-2 border border-border">
              <div className="text-[11px] text-text-muted mb-1 flex items-center gap-1">
                <Sparkles size={11} /> AI 摘要
              </div>
              <div className="text-sm text-text-muted">{note.summary}</div>
            </div>
          )}

          <textarea
            ref={taRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            rows={12}
            placeholder="开始写... (Markdown 可用)"
            className="w-full text-sm leading-relaxed bg-transparent outline-none resize-none placeholder:text-text-muted/40 whitespace-pre-wrap"
          />

          {/* 双向链接区 */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm font-medium mb-3 text-text-muted">
              <LinkIcon size={14} /> 想法连接 ({linkedNotes.length})
            </div>
            {linkedNotes.length === 0 ? (
              <div className="text-xs text-text-muted mb-3">还没有连接这条笔记到其他想法</div>
            ) : (
              <div className="flex gap-2 flex-wrap mb-3">
                {linkedNotes.map((ln) => (
                  <div
                    key={ln.id}
                    className="text-xs px-2.5 py-1 rounded-lg bg-surface-2 border border-border flex items-center gap-1"
                  >
                    <BookOpen size={11} className="text-brand" />
                    {ln.title}
                  </div>
                ))}
              </div>
            )}
            {availableNotesToLink.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {availableNotesToLink.slice(0, 6).map((an) => (
                  <button
                    key={an.id}
                    onClick={() => linkNotes(note.id, an.id)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-border text-text-muted hover:border-brand hover:text-brand transition"
                  >
                    + {an.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
