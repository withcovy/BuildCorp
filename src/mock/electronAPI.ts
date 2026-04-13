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
      workingDir: data.workingDir || '',
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

  // Chat - 브라우저에서도 실제 LLM API 호출
  chatSend: async (agentId: string, message: string) => {
    const agent = getStore<Agent>('agents').find((a) => a.id === agentId);
    if (!agent) return { success: false, error: 'Agent not found' };

    // 사용자 메시지 저장
    const chatKey = `chat_${agentId}`;
    const history = getStore<any>(chatKey);
    history.push({ id: uuidv4(), agentId, role: 'user', content: message, timestamp: new Date().toISOString() });
    setStore(chatKey, history);

    // API 키 확인: 에이전트별 키 우선, 없으면 글로벌 키
    const provider = agent.llmProvider;
    const agentApiKey = localStorage.getItem(`buildcorp_agent_apikey_${agentId}`) || '';
    const globalApiKey = provider === 'claude'
      ? getSettings('llm.claude.apiKey')
      : provider === 'openai'
      ? getSettings('llm.openai.apiKey')
      : null;
    const apiKey = agentApiKey || globalApiKey;

    if (!apiKey) {
      const noKeyMsg = `에이전트 설정(⚙)에서 ${provider} API 키를 입력해주세요.`;
      // 스트림 콜백으로 전달
      setTimeout(() => {
        chatStreamListeners.forEach((cb) => cb({ agentId, type: 'text', content: noKeyMsg }));
        chatStreamListeners.forEach((cb) => cb({ agentId, type: 'done', content: noKeyMsg }));
      }, 100);
      history.push({ id: uuidv4(), agentId, role: 'assistant', content: noKeyMsg, timestamp: new Date().toISOString() });
      setStore(chatKey, history);
      return { success: true, content: noKeyMsg };
    }

    // 대화 히스토리 구성 (최근 20개)
    const recentHistory = history.slice(-21, -1).map((m: any) => ({ role: m.role, content: m.content }));

    // System prompt
    const systemPrompt = agent.systemPrompt || `You are ${agent.name}. ${agent.specialty ? `Your specialty is ${agent.specialty}.` : ''} ${agent.personality || ''}`.trim();

    try {
      let result = '';
      if (provider === 'claude-cli') {
        const cliMsg = 'Claude CLI는 Electron 앱에서만 사용 가능합니다. "npm run dev"로 Electron 앱을 실행해주세요.';
        setTimeout(() => {
          chatStreamListeners.forEach((cb) => cb({ agentId, type: 'text', content: cliMsg }));
          chatStreamListeners.forEach((cb) => cb({ agentId, type: 'done', content: cliMsg }));
        }, 100);
        result = cliMsg;
      } else if (provider === 'claude') {
        result = await callClaudeAPI(apiKey, agent.llmModel, systemPrompt, recentHistory, message, agentId);
      } else if (provider === 'openai') {
        result = await callOpenAIAPI(apiKey, agent.llmModel, systemPrompt, recentHistory, message, agentId);
      }

      history.push({ id: uuidv4(), agentId, role: 'assistant', content: result, timestamp: new Date().toISOString() });
      setStore(chatKey, history);
      return { success: true, content: result };
    } catch (err: any) {
      const errorMsg = `Error: ${err.message}`;
      chatStreamListeners.forEach((cb) => cb({ agentId, type: 'error', error: errorMsg }));
      chatStreamListeners.forEach((cb) => cb({ agentId, type: 'done', content: errorMsg }));
      history.push({ id: uuidv4(), agentId, role: 'assistant', content: errorMsg, timestamp: new Date().toISOString() });
      setStore(chatKey, history);
      return { success: false, error: errorMsg };
    }
  },

  chatStop: async (_agentId: string) => ({ success: true }),

  chatHistory: async (agentId: string) => getStore<any>(`chat_${agentId}`),

  onChatStream: (callback: (data: any) => void) => {
    chatStreamListeners.add(callback);
    return () => { chatStreamListeners.delete(callback); };
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

  // Dialog & File system (browser mode: limited)
  selectFolder: async () => prompt('Enter project folder path:'),
  listDir: async (_dirPath: string) => [],
};

// --- 스트리밍 리스너 ---
const chatStreamListeners = new Set<(data: any) => void>();

// --- Claude API 호출 (브라우저 fetch) ---
async function callClaudeAPI(
  apiKey: string, model: string, systemPrompt: string,
  history: { role: string; content: string }[], userMessage: string, agentId: string,
): Promise<string> {
  const messages = [...history, { role: 'user', content: userMessage }]
    .filter((m) => m.role === 'user' || m.role === 'assistant');

  // dev 서버에서는 Vite 프록시 사용, 그 외에는 직접 호출
  const baseUrl = import.meta.env.DEV ? '/api/claude' : 'https://api.anthropic.com';
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API (${response.status}): ${errText}`);
  }

  return streamSSE(response, agentId);
}

// --- OpenAI API 호출 ---
async function callOpenAIAPI(
  apiKey: string, model: string, systemPrompt: string,
  history: { role: string; content: string }[], userMessage: string, agentId: string,
): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const baseUrl = import.meta.env.DEV ? '/api/openai' : 'https://api.openai.com';
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API (${response.status}): ${errText}`);
  }

  return streamSSE(response, agentId);
}

// --- SSE 스트림 파서 (Claude / OpenAI 공통) ---
async function streamSSE(response: Response, agentId: string): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);

        // Claude format
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullText += parsed.delta.text;
          chatStreamListeners.forEach((cb) => cb({ agentId, type: 'text', content: parsed.delta.text }));
        }
        // OpenAI format
        if (parsed.choices?.[0]?.delta?.content) {
          const chunk = parsed.choices[0].delta.content;
          fullText += chunk;
          chatStreamListeners.forEach((cb) => cb({ agentId, type: 'text', content: chunk }));
        }
      } catch {
        // skip
      }
    }
  }

  chatStreamListeners.forEach((cb) => cb({ agentId, type: 'done', content: fullText }));
  return fullText;
}
