import { useApp } from '@/store/AppContext';

export function MessageBubble({ id }: { id: string }) {
  const { sessions, activeSessionId } = useApp();
  const session = sessions.find((s) => s.id === activeSessionId);
  const msg = session?.messages.find((m) => m.id === id);

  if (!msg) return null;

  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 anim-fade-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white text-xs font-medium">
            U
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center text-sm">
            🧠
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2.5 rounded-[14px] text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-brand text-white rounded-tr-sm'
              : 'bg-surface border border-border rounded-tl-sm'
          }`}
        >
          {msg.content}
        </div>
        {msg.thinking && !isUser && (
          <details className="text-xs text-text-muted">
            <summary className="cursor-pointer hover:text-brand select-none">🧠 思考过程</summary>
            <div className="mt-1 px-3 py-2 rounded-lg bg-surface-2 border border-border italic">
              {msg.thinking}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
