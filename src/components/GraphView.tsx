import { useMemo, useRef, useState } from 'react';
import { Network, ZoomIn, ZoomOut } from 'lucide-react';
import { useApp } from '@/store/AppContext';

interface Node {
  id: string;
  title: string;
  x: number;
  y: number;
  r: number;
  tags: string[];
  color: string;
}

interface Edge {
  from: string;
  to: string;
}

const COLORS = ['#7c5cff', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#6366f1', '#f97316'];

export function GraphView() {
  const { notes, setView, setActiveNote } = useApp();
  const [scale, setScale] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { nodes, edges } = useMemo(() => {
    const n: Node[] = [];
    const e: Edge[] = [];

    if (notes.length === 0) return { nodes: n, edges: e };

    // 环形布局
    const cx = 400;
    const cy = 320;
    const radius = Math.min(cx, cy) * 0.7;
    const tagColors = new Map<string, string>();
    let ci = 0;

    notes.forEach((note, i) => {
      const angle = (i / notes.length) * Math.PI * 2 - Math.PI / 2;
      const mainTag = note.tags[0] ?? '笔记';
      if (!tagColors.has(mainTag)) tagColors.set(mainTag, COLORS[ci++ % COLORS.length]);

      n.push({
        id: note.id,
        title: note.title,
        x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
        y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
        r: 24 + Math.min(note.tags.length, 3) * 3,
        tags: note.tags,
        color: tagColors.get(mainTag) ?? COLORS[0],
      });

      note.links.forEach((lid) => {
        if (note.id < lid) e.push({ from: note.id, to: lid });
      });
    });

    return { nodes: n, edges: e };
  }, [notes]);

  const hoveredNode = nodes.find((n) => n.id === hoverId);

  return (
    <div className="flex-1 flex flex-col h-full bg-bg">
      {/* Header */}
      <header className="h-14 border-b border-border bg-surface px-6 flex items-center gap-3 shrink-0">
        <Network size={18} className="text-brand" />
        <div className="font-semibold text-sm flex-1">知识图谱</div>
        <div className="text-xs text-text-muted">
          {nodes.length} 节点 · {edges.length} 连接
        </div>
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-2 transition"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-text-muted w-10 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-2 transition"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* 图谱画布 */}
        <div className="flex-1 relative overflow-hidden">
          <svg
            ref={svgRef}
            viewBox="0 0 800 640"
            className="w-full h-full"
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
          >
            {/* 背景网格 */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity="0.04" strokeWidth="1" />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* 边 */}
            {edges.map((edge, i) => {
              const a = nodes.find((n) => n.id === edge.from);
              const b = nodes.find((n) => n.id === edge.to);
              if (!a || !b) return null;
              const highlighted = hoverId && (hoverId === edge.from || hoverId === edge.to);
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={highlighted ? '#7c5cff' : '#94a3b8'}
                  strokeOpacity={highlighted ? 0.7 : 0.2}
                  strokeWidth={highlighted ? 2 : 1}
                />
              );
            })}

            {/* 节点 */}
            {nodes.map((node) => {
              const isHover = node.id === hoverId;
              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoverId(node.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => {
                    setActiveNote(node.id);
                    setView('notes');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={node.color}
                    fillOpacity={isHover ? 0.9 : 0.6}
                    stroke={node.color}
                    strokeWidth={2}
                    filter={isHover ? 'url(#glow)' : undefined}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {isHover && (
                    <text
                      x={node.x}
                      y={node.y - node.r - 8}
                      textAnchor="middle"
                      className="fill-text"
                      style={{ fontSize: 11, fontWeight: 600 }}
                    >
                      {node.title.length > 18 ? node.title.slice(0, 18) + '…' : node.title}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <Network size={48} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">写一些笔记并连接它们，图谱会自动呈现</div>
                <button
                  onClick={() => setView('notes')}
                  className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark transition"
                >
                  去写第一条笔记
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧详情 */}
        <aside className="w-72 shrink-0 border-l border-border bg-surface p-5 overflow-y-auto">
          {hoveredNode ? (
            <div>
              <div
                className="w-full h-2 rounded-full mb-4"
                style={{ background: hoveredNode.color }}
              />
              <div className="text-sm font-semibold mb-2">{hoveredNode.title}</div>
              <div className="flex gap-1 flex-wrap mb-4">
                {hoveredNode.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-muted"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              {(() => {
                const note = notes.find((n) => n.id === hoveredNode.id);
                const linkedNodes = nodes.filter((n) =>
                  note?.links.includes(n.id),
                );
                return linkedNodes.length > 0 ? (
                  <div>
                    <div className="text-[11px] text-text-muted uppercase tracking-wider mb-2">
                      连接到
                    </div>
                    {linkedNodes.map((ln) => (
                      <div
                        key={ln.id}
                        onClick={() => setHoverId(ln.id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border mb-1 cursor-pointer hover:border-brand/40"
                      >
                        {ln.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-text-muted">暂无连接 — 去笔记里连接想法吧</div>
                );
              })()}
              <button
                onClick={() => {
                  setActiveNote(hoveredNode.id);
                  setView('notes');
                }}
                className="mt-4 w-full text-xs px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark transition"
              >
                打开笔记 →
              </button>
            </div>
          ) : (
            <div>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                图例
              </div>
              <div className="text-[11px] text-text-muted mb-4 leading-relaxed">
                节点颜色按首个标签分组，节点大小按标签数量变化。鼠标悬停查看详情，点击跳转到笔记。
              </div>
              <div className="space-y-1.5">
                {(() => {
                  const tagColors = new Map<string, string>();
                  let ci = 0;
                  notes.forEach((note) => {
                    const t = note.tags[0];
                    if (t && !tagColors.has(t)) tagColors.set(t, COLORS[ci++ % COLORS.length]);
                  });
                  return Array.from(tagColors.entries()).map(([tag, color]) => (
                    <div key={tag} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="text-text-muted">#{tag}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
