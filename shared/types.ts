// === Company ===
export interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  funds: number;
  createdAt: string;
  updatedAt: string;
}

// === Team ===
export interface Team {
  id: string;
  companyId: string;
  name: string;
  role: string;
  color: string; // 팀 구분 색상
  createdAt: string;
}

// === Agent (직원) ===
export type AgentStatus = 'idle' | 'working' | 'break' | 'meeting';
export type LLMProvider = 'claude' | 'openai' | 'ollama';

export interface AgentStats {
  tasksCompleted: number;
  totalWorkTimeMs: number;
  specialtyScores: Record<string, number>;
}

export interface Agent {
  id: string;
  teamId: string;
  companyId: string;
  name: string;
  spriteId: string;
  specialty: string;
  personality: string;
  systemPrompt: string;
  llmProvider: LLMProvider;
  llmModel: string;
  stats: AgentStats;
  status: AgentStatus;
  createdAt: string;
}

// === Task ===
export type TaskType = 'chat' | 'board';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Attachment {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
}

export interface TaskResult {
  content: string;
  attachments: Attachment[];
  completedAt: string;
}

export interface Task {
  id: string;
  companyId: string;
  teamId: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  assignedAgentIds: string[];
  attachments: Attachment[];
  result?: TaskResult;
  createdAt: string;
  completedAt?: string;
}

// === Chat ===
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  agentId: string;
  role: ChatRole;
  content: string;
  attachments: Attachment[];
  timestamp: string;
}

// === IPC Channels ===
export const IPC_CHANNELS = {
  // Company
  COMPANY_LIST: 'company:list',
  COMPANY_GET: 'company:get',
  COMPANY_CREATE: 'company:create',
  COMPANY_UPDATE: 'company:update',
  COMPANY_DELETE: 'company:delete',
  // Team
  TEAM_LIST: 'team:list',
  TEAM_CREATE: 'team:create',
  TEAM_UPDATE: 'team:update',
  TEAM_DELETE: 'team:delete',
  // Agent
  AGENT_LIST: 'agent:list',
  AGENT_GET: 'agent:get',
  AGENT_CREATE: 'agent:create',
  AGENT_UPDATE: 'agent:update',
  AGENT_DELETE: 'agent:delete',
  // Task
  TASK_LIST: 'task:list',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  // Chat
  CHAT_SEND: 'chat:send',
  CHAT_HISTORY: 'chat:history',
  CHAT_STREAM: 'chat:stream',
} as const;
