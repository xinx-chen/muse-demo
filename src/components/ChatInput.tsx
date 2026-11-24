import { useEffect, useRef, useState } from 'react';
import { Send, BookOpen, Sparkles } from 'lucide-react';
import { useApp } from '@/store/AppContext';

const SUGGESTIONS = [
  '我喜欢简洁的回答，记住这个偏好',
  '帮我把刚才的想法捕获成笔记',
  '我正在做一个 React 项目',
  '总结一下我之前记过的笔记',
  '帮我连接一下我关于第二大脑的想法',
];

export function ChatInput() {
  const { sendMessage, isThinking } = useApp();
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [value]);

  const handleSend = () => {
    const v = value.trim();
    if (!v || isThinking) return;
    void sendMessage(v);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-surface px-6 py-4">
      {/* Suggestions */}
      {!value && (
        <div className="flex gap-2 flex-wrap mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setValue(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-surface hover:border-brand hover:text-brand transition text-text-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative flex items-end gap-2 bg-surface-2 rounded-2xl border border-border focus-within:border-brand transition p-2">
        <button className="p-2 text-text-muted hover:text-brand transition shrink-0" title="捕获到笔记">
          <BookOpen size={18} />
        </button>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={isThinking ? 'Muse 正在思考中...' : '和 Muse 说点什么... Enter 发送，Shift+Enter 换行'}
          disabled={isThinking}
          className="flex-1 bg-transparent resize-none outline-none text-sm py-2 px-1 placeholder:text-text-muted max-h-[200px] disabled:opacity-60"
        />
        <button
          disabled={!value.trim() || isThinking}
          onClick={handleSend}
          className="p-2.5 rounded-xl bg-brand text-white hover:bg-brand-dark disabled:opacity-40 disabled:hover:bg-brand transition shrink-0"
          title="发送"
        >
          {isThinking ? <Sparkles size={17} className="animate-pulse" /> : <Send size={17} />}
        </button>
      </div>
      <div className="text-[11px] text-text-muted text-center mt-2">
        💡 试试说 "我喜欢..." 或 "我正在做..." — Muse 会自动提炼成记忆
      </div>
    </div>
  );
}
