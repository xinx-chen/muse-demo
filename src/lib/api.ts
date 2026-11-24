// DeepSeek API — 流式 SSE + mock fallback

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
const DIRECT_BASE = (import.meta.env.VITE_DEEPSEEK_BASE_URL as string) || 'https://api.deepseek.com';
const MODEL = (import.meta.env.VITE_DEEPSEEK_MODEL as string) || 'deepseek-chat';

// DEV 走 vite proxy /api → 避开 CORS
const BASE_URL = import.meta.env.DEV ? '/api' : DIRECT_BASE;

export const IS_LIVE_MODE = Boolean(API_KEY);

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** 流式事件回调 */
export interface StreamCallbacks {
  /** 思考内容增量（reasoning_content） */
  onThinkingChunk?: (text: string) => void;
  /** 正文内容增量 */
  onContentChunk?: (text: string) => void;
  /** 最终完成 */
  onDone?: (result: { thinking: string; content: string; source: 'live' | 'mock' }) => void;
  /** 错误 */
  onError?: (err: Error) => void;
}

/** 构建 system prompt（注入记忆和笔记） */
export function buildSystemPrompt(params: {
  memories: Array<{ category: string; content: string; importance: number }>;
  relatedNotes: Array<{ title: string; tags: string[]; summary?: string }>;
}): string {
  const parts: string[] = [];
  parts.push(
    '你是 Muse，用户的第二大脑。你的语气温暖、简洁、像一个贴心的助手。回答使用 Markdown 格式。',
  );

  if (params.memories.length) {
    const sorted = [...params.memories].sort((a, b) => b.importance - a.importance);
    parts.push(
      '\n# 用户记忆（请在回答中自然地参考这些偏好/事实）：\n' +
        sorted.map((m) => `- [${m.category}] ${m.content}（重要度 ${m.importance}/5）`).join('\n'),
    );
  }

  if (params.relatedNotes.length) {
    parts.push(
      '\n# 用户相关笔记（可引用）：\n' +
        params.relatedNotes
          .map((n) => `- 《${n.title}》#${n.tags.join(' #')}${n.summary ? ' — ' + n.summary : ''}`)
          .join('\n'),
    );
  }

  return parts.join('\n');
}

/** 调 DeepSeek 流式 API（SSE） */
export async function callDeepSeekStream(
  messages: ChatMessage[],
  cbs: StreamCallbacks,
  signal?: AbortSignal,
) {
  if (!API_KEY) {
    mockStream(messages, cbs);
    return;
  }

  // 已有 signal 被 abort → 直接走 mock
  if (signal?.aborted) {
    mockStream(messages, cbs);
    return;
  }

  try {
    console.log('[Muse] 流式调用 →', BASE_URL + '/chat/completions');
    const resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages,
        temperature: 0.7,
      }),
      signal,
    });

    if (!resp.ok || !resp.body) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
    }

    // 加超时保护：30s 没新 chunk 就中断
    await parseSSE(resp.body, cbs, signal);
  } catch (err: unknown) {
    // AbortError 是正常的（比如用户取消、组件卸载），不算真正的错误
    const name = (err as { name?: string })?.name;
    if (name === 'AbortError') {
      console.log('[Muse] 流式请求被中止（正常）');
      cbs.onDone?.({ thinking: '', content: '', source: 'live' });
      return;
    }
    console.error('[Muse] 流式调用失败，回退 mock。原因：', err);
    cbs.onError?.(err as Error);
    mockStream(messages, cbs);
  }
}

/** 解析 SSE 流（健壮版） */
async function parseSSE(
  body: ReadableStream<Uint8Array>,
  cbs: StreamCallbacks,
  signal?: AbortSignal,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let buffer = '';
  let fullThinking = '';
  let fullContent = '';

  // 把 signal abort 和 reader.read 关联起来
  if (signal) {
    signal.addEventListener('abort', () => {
      try { reader.cancel(); } catch { /* noop */ }
    }, { once: true });
  }

  while (true) {
    let value: Uint8Array | undefined;
    let done = false;
    try {
      const r = await reader.read();
      value = r.value;
      done = r.done;
    } catch (err) {
      // reader.read() 抛错（通常是 abort）→ 优雅退出
      console.log('[Muse] reader.read() 结束:', (err as Error).name);
      break;
    }
    if (done) break;
    if (!value) continue;

    buffer += decoder.decode(value, { stream: true });

    // SSE 规范：事件之间用空行分隔（\n\n 或 \r\n\r\n）
    // 把 \r\n 全部归一成 \n
    buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const events = buffer.split('\n\n');
    buffer = events.pop() ?? ''; // 最后一个事件可能不完整，留到下次

    for (const event of events) {
      if (!event.trim()) continue;

      // 每个 SSE event 里有多行，找 data: 开头的
      const lines = event.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.reasoning_content) {
            fullThinking += delta.reasoning_content;
            cbs.onThinkingChunk?.(delta.reasoning_content);
          }
          if (delta.content) {
            fullContent += delta.content;
            cbs.onContentChunk?.(delta.content);
          }
        } catch {
          // 忽略无法解析的 chunk
        }
      }
    }
  }

  console.log('[Muse] 流式完成, thinking:', fullThinking.length, 'content:', fullContent.length);
  cbs.onDone?.({ thinking: fullThinking, content: fullContent, source: 'live' });
}

/** Mock 流式（模拟打字机效果） */
function mockStream(messages: ChatMessage[], cbs: StreamCallbacks) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const q = lastUser?.content ?? '';

  let answer = '';
  if (q.includes('你是谁') || q.includes('你能做什么')) {
    answer =
      '我是 **Muse** 🧠，你的第二大脑助手。\n\n我可以帮你：\n\n- **捕获想法** — 随手记\n- **记住你** — 跨对话记忆\n- **连接知识** — 笔记图谱\n\n配好 API key 就能变成真正的智能体～';
  } else if (!q) {
    answer = '（mock）没收到内容...';
  } else {
    answer = `收到："${q.slice(0, 40)}"\n\n（mock 模式 — 在 .env 里填 \`VITE_DEEPSEEK_API_KEY=sk-xxx\` 就能变成真正的 DeepSeek 驱动）`;
  }

  const thinking = `[mock] 分析: "${q.slice(0, 40)}"`;

  let i = 0;
  const timer = setInterval(() => {
    if (i < thinking.length) {
      cbs.onThinkingChunk?.(thinking[i]);
      i++;
    } else if (i - thinking.length < answer.length) {
      cbs.onContentChunk?.(answer[i - thinking.length]);
      i++;
    } else {
      clearInterval(timer);
      cbs.onDone?.({ thinking, content: answer, source: 'mock' });
    }
  }, 20);
}
