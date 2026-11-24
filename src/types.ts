// ===== Chat =====
export type Role = 'user' | 'agent';

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  thinking?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

// ===== Muse: Notes =====
export type NoteFormat = 'quick' | 'journal' | 'meeting';

export interface Note {
  id: string;
  title: string;
  content: string;
  format: NoteFormat;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  /** 关联的 note id 列表（知识图谱连线） */
  links: string[];
  /** AI 摘要 */
  summary?: string;
  /** 是否已归档 */
  archived?: boolean;
}

// ===== Muse: Memory =====
export type MemoryCategory = 'preference' | 'fact' | 'habit' | 'project';

export interface MemoryEntry {
  id: string;
  category: MemoryCategory;
  content: string;
  source: string; // 来源：来自哪条对话 / 哪条笔记
  createdAt: number;
  importance: number; // 1-5
}

// ===== Muse: View =====
export type View = 'notes' | 'chat' | 'memory' | 'graph';
