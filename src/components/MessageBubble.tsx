import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '@/store/AppContext';

export function MessageBubble({ id }: { id: string }) {
  const { sessions, activeSessionId } = useApp();
  const session = sessions.find((s) => s.id === activeSessionId);
  const msg = session?.messages.find((m) => m.id === id);

  if (!msg) return null;

  const isUser = msg.role === 'user';
  // 是否正在流式生成（空内容还没完全填上 + isThinking 全局状态）
  const isStreaming = !isUser && msg.content === '';

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
          className={`px-4 py-2.5 rounded-[14px] text-sm leading-relaxed break-words chat-bubble ${
            isUser
              ? 'bg-brand text-white rounded-tr-sm whitespace-pre-wrap'
              : 'bg-surface border border-border rounded-tl-sm markdown-body'
          }`}
        >
          {isUser ? (
            msg.content || '...'
          ) : msg.content ? (
            // AI 回复：渲染 Markdown
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          ) : (
            // 还没开始输出，显示占位光标
            <span className="typing-cursor">▌</span>
          )}
          {!isUser && msg.content && isStreaming && (
            <span className="typing-cursor">▌</span>
          )}
        </div>
        {msg.thinking && !isUser && (
          <details className="text-xs text-text-muted">
            <summary className="cursor-pointer hover:text-brand select-none">
              🧠 思考过程
              {msg.content === '' && <span className="ml-1 text-brand animate-pulse">(思考中...)</span>}
            </summary>
            <div className="mt-1 px-3 py-2 rounded-lg bg-surface-2 border border-border italic whitespace-pre-wrap">
              {msg.thinking || '...'}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
