// 브라우저 환경에서 Electron IPC 없이 동작하도록 하는 mock API
// 데이터를 localStorage에 저장

import { v4 as uuidv4 } from 'uuid';
import type { Company, Team, Agent, Task } from '../../shared/types';

function getStore<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(`buildcorp_${key}`) || '[]');
  } catch {
    return [];
  }
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(`buildcorp_${key}`, JSON.stringify(data));
}

function getSettings(key: string): any {
  try {
    return JSON.parse(localStorage.getItem(`buildcorp_settings_${key}`) || 'null');
  } catch {
    return null;
  }
}

function setSettings(key: string, value: any) {
  localStorage.setItem(`buildcorp_settings_${key}`, JSON.stringify(value));
}

export const mockElectronAPI = {
  // Company
  companyList: async (): Promise<Company[]> => getStore<Company>('companies'),

  companyGet: async (id: string): Promise<Company | null> =>
    getStore<Company>('companies').find((c) => c.id === id) || null,

  companyCreate: async (data: Partial<Company>): Promise<Company> => {
    const company: Company = {
      id: uuidv4(),
      name: data.name || 'New Company',
      industry: data.industry || '',
      description: data.description || '',
      funds: data.funds ?? 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const companies = getStore<Company>('companies');
    companies.unshift(company);
    setStore('companies', companies);
    return company;
  },

  companyUpdate: async (id: string, data: Partial<Company>): Promise<Company | null> => {
    const companies = getStore<Company>('companies');
    const idx = companies.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    companies[idx] = { ...companies[idx], ...data, updatedAt: new Date().toISOString() };
    setStore('companies', companies);
    return companies[idx];
  },

  companyDelete: async (id: string) => {
    setStore('companies', getStore<Company>('companies').filter((c) => c.id !== id));
    setStore('teams', getStore<Team>('teams').filter((t) => t.companyId !== id));
    setStore('agents', getStore<Agent>('agents').filter((a) => a.companyId !== id));
    return { success: true };
  },

  // Team
  teamList: async (companyId: string): Promise<Team[]> =>
    getStore<Team>('teams').filter((t) => t.companyId === companyId),

  teamCreate: async (data: Partial<Team> & { companyId: string }): Promise<Team> => {
    const team: Team = {
      id: uuidv4(),
      companyId: data.companyId,
      name: data.name || 'New Team',
      role: data.role || '',
      color: data.color || '#6366f1',
      createdAt: new Date().toISOString(),
    };
    const teams = getStore<Team>('teams');
    teams.push(team);
    setStore('teams', teams);
    return team;
  },

  teamUpdate: async (id: string, data: Partial<Team>): Promise<Team | null> => {
    const teams = getStore<Team>('teams');
    const idx = teams.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    teams[idx] = { ...teams[idx], ...data };
    setStore('teams', teams);
    return teams[idx];
  },

  teamDelete: async (id: string) => {
    setStore('teams', getStore<Team>('teams').filter((t) => t.id !== id));
    setStore('agents', getStore<Agent>('agents').filter((a) => a.teamId !== id));
    return { success: true };
  },

  // Agent
  agentList: async (teamId: string): Promise<Agent[]> =>
    getStore<Agent>('agents').filter((a) => a.teamId === teamId),

  agentGet: async (id: string): Promise<Agent | null> =>
    getStore<Agent>('agents').find((a) => a.id === id) || null,

  agentCreate: async (data: Partial<Agent> & { teamId: string; companyId: string }): Promise<Agent> => {
    const agent: Agent = {
      id: uuidv4(),
      teamId: data.teamId,
      companyId: data.companyId,
      name: data.name || 'New Agent',
      spriteId: data.spriteId || 'default',
      specialty: data.specialty || '',
      personality: data.personality || '',
      systemPrompt: data.systemPrompt || '',
      llmProvider: data.llmProvider || 'claude',
      llmModel: data.llmModel || 'claude-sonnet-4-20250514',
      stats: data.stats || { tasksCompleted: 0, totalWorkTimeMs: 0, specialtyScores: {} },
      status: 'idle',
      createdAt: new Date().toISOString(),
    };
    const agents = getStore<Agent>('agents');
    agents.push(agent);
    setStore('agents', agents);
    return agent;
  },

  agentUpdate: async (id: string, data: Partial<Agent>): Promise<Agent | null> => {
    const agents = getStore<Agent>('agents');
    const idx = agents.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    agents[idx] = { ...agents[idx], ...data };
    setStore('agents', agents);
    return agents[idx];
  },

  agentDelete: async (id: string) => {
    setStore('agents', getStore<Agent>('agents').filter((a) => a.id !== id));
    return { success: true };
  },

  // Task
  taskList: async (companyId: string): Promise<Task[]> =>
    getStore<Task>('tasks').filter((t) => t.companyId === companyId),

  taskCreate: async (data: Partial<Task> & { companyId: string; teamId: string }): Promise<Task> => {
    const task: Task = {
      id: uuidv4(),
      companyId: data.companyId,
      teamId: data.teamId,
      title: data.title || 'New Task',
      description: data.description || '',
      type: data.type || 'board',
      status: data.status || 'todo',
      assignedAgentIds: data.assignedAgentIds || [],
      attachments: data.attachments || [],
      createdAt: new Date().toISOString(),
    };
    const tasks = getStore<Task>('tasks');
    tasks.unshift(task);
    setStore('tasks', tasks);
    return task;
  },

  taskUpdate: async (id: string, data: Partial<Task>): Promise<Task | null> => {
    const tasks = getStore<Task>('tasks');
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...data };
    if (data.status === 'done') tasks[idx].completedAt = new Date().toISOString();
    setStore('tasks', tasks);
    return tasks[idx];
  },

  taskDelete: async (id: string) => {
    setStore('tasks', getStore<Task>('tasks').filter((t) => t.id !== id));
    return { success: true };
  },

  // Chat (mock - no real LLM in browser)
  chatSend: async (_agentId: string, message: string) => {
    return {
      success: true,
      content: `[Mock Response] I received your message: "${message}". Connect an API key in Settings to enable real AI responses.`,
    };
  },

  chatHistory: async (_agentId: string) => [],

  onChatStream: (callback: (data: any) => void) => {
    // No-op in browser mode
    return () => {};
  },

  // Settings
  settingsGet: async (key: string) => getSettings(key),
  settingsSet: async (key: string, value: any) => { setSettings(key, value); return { success: true }; },
  settingsGetAll: async () => {
    const result: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('buildcorp_settings_')) {
        result[k.replace('buildcorp_settings_', '')] = JSON.parse(localStorage.getItem(k) || 'null');
      }
    }
    return result;
  },

  // LLM
  llmValidate: async (_provider: string) => false,
  llmModels: async (provider: string) => {
    if (provider === 'claude') return ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'];
    if (provider === 'openai') return ['gpt-4.1', 'gpt-4o'];
    return [];
  },
  llmProviders: async () => ['claude', 'openai', 'ollama'],
};
