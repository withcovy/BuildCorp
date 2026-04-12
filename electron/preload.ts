import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';

// Expose protected methods that allow the renderer process
// to use ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Company
  companyList: () => ipcRenderer.invoke(IPC_CHANNELS.COMPANY_LIST),
  companyGet: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.COMPANY_GET, id),
  companyCreate: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.COMPANY_CREATE, data),
  companyUpdate: (id: string, data: any) => ipcRenderer.invoke(IPC_CHANNELS.COMPANY_UPDATE, id, data),
  companyDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.COMPANY_DELETE, id),

  // Team
  teamList: (companyId: string) => ipcRenderer.invoke(IPC_CHANNELS.TEAM_LIST, companyId),
  teamCreate: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.TEAM_CREATE, data),
  teamUpdate: (id: string, data: any) => ipcRenderer.invoke(IPC_CHANNELS.TEAM_UPDATE, id, data),
  teamDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TEAM_DELETE, id),

  // Agent
  agentList: (teamId: string) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_LIST, teamId),
  agentGet: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_GET, id),
  agentCreate: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_CREATE, data),
  agentUpdate: (id: string, data: any) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_UPDATE, id, data),
  agentDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_DELETE, id),

  // Task
  taskList: (companyId: string) => ipcRenderer.invoke(IPC_CHANNELS.TASK_LIST, companyId),
  taskCreate: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.TASK_CREATE, data),
  taskUpdate: (id: string, data: any) => ipcRenderer.invoke(IPC_CHANNELS.TASK_UPDATE, id, data),
  taskDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TASK_DELETE, id),

  // Chat
  chatSend: (agentId: string, message: string) => ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEND, agentId, message),
  chatHistory: (agentId: string) => ipcRenderer.invoke(IPC_CHANNELS.CHAT_HISTORY, agentId),
  onChatStream: (callback: (data: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM, (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.CHAT_STREAM);
  },
});
