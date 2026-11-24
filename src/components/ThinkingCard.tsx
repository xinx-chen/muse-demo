export function ThinkingCard() {
  return (
    <div className="flex gap-3 anim-fade-up">
      <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center text-sm shrink-0">
        🧠
      </div>
      <div className="bg-surface border border-border rounded-[14px] rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="dot w-2 h-2 rounded-full bg-brand inline-block" />
          <span className="dot w-2 h-2 rounded-full bg-brand inline-block" />
          <span className="dot w-2 h-2 rounded-full bg-brand inline-block" />
        </div>
        <div className="text-xs text-text-muted mt-2 flex items-center gap-1.5">
          <span className="inline-block animate-spin-slow">🧠</span>
          Muse 正在思考...
        </div>
      </div>
    </div>
  );
}
