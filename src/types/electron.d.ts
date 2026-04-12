import type { Company, Team, Agent, Task } from '../../shared/types';

export interface ElectronAPI {
  // Company
  companyList: () => Promise<Company[]>;
  companyGet: (id: string) => Promise<Company | null>;
  companyCreate: (data: Partial<Company>) => Promise<Company>;
  companyUpdate: (id: string, data: Partial<Company>) => Promise<Company | null>;
  companyDelete: (id: string) => Promise<{ success: boolean }>;
  // Team
  teamList: (companyId: string) => Promise<Team[]>;
  teamCreate: (data: Partial<Team> & { companyId: string }) => Promise<Team>;
  teamUpdate: (id: string, data: Partial<Team>) => Promise<Team | null>;
  teamDelete: (id: string) => Promise<{ success: boolean }>;
  // Agent
  agentList: (teamId: string) => Promise<Agent[]>;
  agentGet: (id: string) => Promise<Agent | null>;
  agentCreate: (data: Partial<Agent> & { teamId: string; companyId: string }) => Promise<Agent>;
  agentUpdate: (id: string, data: Partial<Agent>) => Promise<Agent | null>;
  agentDelete: (id: string) => Promise<{ success: boolean }>;
  // Task
  taskList: (companyId: string) => Promise<Task[]>;
  taskCreate: (data: Partial<Task> & { companyId: string; teamId: string }) => Promise<Task>;
  taskUpdate: (id: string, data: Partial<Task>) => Promise<Task | null>;
  taskDelete: (id: string) => Promise<{ success: boolean }>;
  // Chat
  chatSend: (agentId: string, message: string) => Promise<any>;
  chatStop: (agentId: string) => Promise<{ success: boolean }>;
  chatHistory: (agentId: string) => Promise<any[]>;
  onChatStream: (callback: (data: any) => void) => () => void;
  // Settings
  settingsGet: (key: string) => Promise<any>;
  settingsSet: (key: string, value: any) => Promise<{ success: boolean }>;
  settingsGetAll: () => Promise<Record<string, any>>;
  // LLM
  llmValidate: (provider: string) => Promise<boolean>;
  llmModels: (provider: string) => Promise<string[]>;
  llmProviders: () => Promise<string[]>;
  // Dialog
  selectFolder: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
