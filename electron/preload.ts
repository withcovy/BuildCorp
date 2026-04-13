const { contextBridge, ipcRenderer } = require('electron');

// IPC 채널을 직접 정의 (외부 import 없이 preload 안정성 확보)
const CH = {
  COMPANY_LIST: 'company:list',
  COMPANY_GET: 'company:get',
  COMPANY_CREATE: 'company:create',
  COMPANY_UPDATE: 'company:update',
  COMPANY_DELETE: 'company:delete',
  TEAM_LIST: 'team:list',
  TEAM_CREATE: 'team:create',
  TEAM_UPDATE: 'team:update',
  TEAM_DELETE: 'team:delete',
  AGENT_LIST: 'agent:list',
  AGENT_GET: 'agent:get',
  AGENT_CREATE: 'agent:create',
  AGENT_UPDATE: 'agent:update',
  AGENT_DELETE: 'agent:delete',
  TASK_LIST: 'task:list',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  CHAT_SEND: 'chat:send',
  CHAT_HISTORY: 'chat:history',
  CHAT_STREAM: 'chat:stream',
};

contextBridge.exposeInMainWorld('electronAPI', {
  // Company
  companyList: () => ipcRenderer.invoke(CH.COMPANY_LIST),
  companyGet: (id: string) => ipcRenderer.invoke(CH.COMPANY_GET, id),
  companyCreate: (data: any) => ipcRenderer.invoke(CH.COMPANY_CREATE, data),
  companyUpdate: (id: string, data: any) => ipcRenderer.invoke(CH.COMPANY_UPDATE, id, data),
  companyDelete: (id: string) => ipcRenderer.invoke(CH.COMPANY_DELETE, id),

  // Team
  teamList: (companyId: string) => ipcRenderer.invoke(CH.TEAM_LIST, companyId),
  teamCreate: (data: any) => ipcRenderer.invoke(CH.TEAM_CREATE, data),
  teamUpdate: (id: string, data: any) => ipcRenderer.invoke(CH.TEAM_UPDATE, id, data),
  teamDelete: (id: string) => ipcRenderer.invoke(CH.TEAM_DELETE, id),

  // Agent
  agentList: (teamId: string) => ipcRenderer.invoke(CH.AGENT_LIST, teamId),
  agentGet: (id: string) => ipcRenderer.invoke(CH.AGENT_GET, id),
  agentCreate: (data: any) => ipcRenderer.invoke(CH.AGENT_CREATE, data),
  agentUpdate: (id: string, data: any) => ipcRenderer.invoke(CH.AGENT_UPDATE, id, data),
  agentDelete: (id: string) => ipcRenderer.invoke(CH.AGENT_DELETE, id),

  // Task
  taskList: (companyId: string) => ipcRenderer.invoke(CH.TASK_LIST, companyId),
  taskCreate: (data: any) => ipcRenderer.invoke(CH.TASK_CREATE, data),
  taskUpdate: (id: string, data: any) => ipcRenderer.invoke(CH.TASK_UPDATE, id, data),
  taskDelete: (id: string) => ipcRenderer.invoke(CH.TASK_DELETE, id),

  // Chat
  chatSend: (agentId: string, message: string) => ipcRenderer.invoke(CH.CHAT_SEND, agentId, message),
  chatStop: (agentId: string) => ipcRenderer.invoke('chat:stop', agentId),
  chatClear: (agentId: string) => ipcRenderer.invoke('chat:clear', agentId),
  chatHistory: (agentId: string) => ipcRenderer.invoke(CH.CHAT_HISTORY, agentId),
  onChatStream: (callback: (data: any) => void) => {
    ipcRenderer.on(CH.CHAT_STREAM, (_event: any, data: any) => callback(data));
    return () => ipcRenderer.removeAllListeners(CH.CHAT_STREAM);
  },

  // Settings
  settingsGet: (key: string) => ipcRenderer.invoke('settings:get', key),
  settingsSet: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
  settingsGetAll: () => ipcRenderer.invoke('settings:getAll'),

  // LLM
  llmValidate: (provider: string) => ipcRenderer.invoke('llm:validate', provider),
  llmModels: (provider: string) => ipcRenderer.invoke('llm:models', provider),
  llmProviders: () => ipcRenderer.invoke('llm:providers'),

  // Dialog & File system
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  listDir: (dirPath: string) => ipcRenderer.invoke('fs:listDir', dirPath),
});
