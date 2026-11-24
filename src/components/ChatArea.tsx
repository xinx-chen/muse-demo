import { useEffect, useRef } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { MessageBubble } from '@/components/MessageBubble';
import { ThinkingCard } from '@/components/ThinkingCard';
import { ChatInput } from '@/components/ChatInput';

export function ChatArea() {
  const { sessions, activeSessionId, memories, isThinking, createSession, createNote, setView } =
    useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const session = sessions.find((s) => s.id === activeSessionId);

  // 自动创建会话
  useEffect(() => {
    if (!activeSessionId) {
      createSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [session?.messages.length, isThinking]);

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <div className="text-center">
          <Sparkles size={48} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm">正在为你准备对话...</div>
        </div>
      </div>
    );
  }

  const messages = session.messages;

  const handleCaptureConversation = async () => {
    const fullText = messages
      .map((m) => `${m.role === 'user' ? '我' : 'Muse'}: ${m.content}`)
      .join('\n\n');
    await createNote({ content: fullText, quickTitle: session.title });
    setView('notes');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg">
      {/* Header */}
      <header className="h-14 border-b border-border bg-surface px-6 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white text-sm">
          🧠
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm flex items-center gap-2">
            {session.title}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success">MUSE</span>
          </div>
          <div className="text-xs text-text-muted truncate">
            你的第二大脑 · 记住你告诉我的每一件事
          </div>
        </div>
        {memories.length > 0 && (
          <div className="text-xs text-text-muted max-w-[200px] truncate hidden md:flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            已记住 {memories.length} 条
          </div>
        )}
        <button
          onClick={() => void handleCaptureConversation()}
          className="text-xs px-2.5 py-1 rounded-lg border border-border text-text-muted hover:border-brand hover:text-brand transition flex items-center gap-1"
          title="把这段对话捕获成笔记"
        >
          <BookOpen size={12} /> 捕获成笔记
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.length <= 1 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🧠</div>
              <div className="text-lg font-semibold mb-2">嗨，我是 Muse</div>
              <div className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                告诉我你在想什么、喜欢什么、正在做什么。
                <br />
                我会帮你捕获成笔记、提炼成记忆、连接成知识图谱。
              </div>
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} id={m.id} />
          ))}
          {isThinking && <ThinkingCard />}
        </div>
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
}
