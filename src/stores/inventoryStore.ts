import { create } from 'zustand';

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'builtin' | 'mcp';
  mcpServerId?: string;
}

// 기본 제공 도구
export const BUILTIN_TOOLS: ToolItem[] = [
  { id: 'readFile', name: 'Read File', description: 'Read file contents', icon: '📄', type: 'builtin' },
  { id: 'writeFile', name: 'Write File', description: 'Create or modify files', icon: '✏️', type: 'builtin' },
  { id: 'listDir', name: 'List Dir', description: 'Browse folder structure', icon: '📁', type: 'builtin' },
  { id: 'search', name: 'Search', description: 'Search text in files', icon: '🔍', type: 'builtin' },
  { id: 'runCommand', name: 'Terminal', description: 'Execute shell commands', icon: '💻', type: 'builtin' },
];

interface InventoryState {
  // agentId -> equipped tool IDs
  equipped: Record<string, string[]>;
  // All installed tools (builtin + MCP)
  installedTools: ToolItem[];

  loadEquipped: (agentId: string) => void;
  equipTool: (agentId: string, toolId: string) => void;
  unequipTool: (agentId: string, toolId: string) => void;
  isEquipped: (agentId: string, toolId: string) => boolean;
  getEquippedTools: (agentId: string) => ToolItem[];
  getUnequippedTools: (agentId: string) => ToolItem[];
  installMCPTool: (tool: ToolItem) => void;
  uninstallMCPTool: (toolId: string) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  equipped: {},
  installedTools: [...BUILTIN_TOOLS],

  loadEquipped: (agentId) => {
    // Default: equip all builtin tools for new agents
    const state = get();
    if (!state.equipped[agentId]) {
      set((s) => ({
        equipped: {
          ...s.equipped,
          [agentId]: BUILTIN_TOOLS.map((t) => t.id),
        },
      }));
    }
  },

  equipTool: (agentId, toolId) => {
    set((s) => ({
      equipped: {
        ...s.equipped,
        [agentId]: [...(s.equipped[agentId] || []).filter((id) => id !== toolId), toolId],
      },
    }));
  },

  unequipTool: (agentId, toolId) => {
    set((s) => ({
      equipped: {
        ...s.equipped,
        [agentId]: (s.equipped[agentId] || []).filter((id) => id !== toolId),
      },
    }));
  },

  isEquipped: (agentId, toolId) => {
    return (get().equipped[agentId] || []).includes(toolId);
  },

  getEquippedTools: (agentId) => {
    const equippedIds = get().equipped[agentId] || [];
    return get().installedTools.filter((t) => equippedIds.includes(t.id));
  },

  getUnequippedTools: (agentId) => {
    const equippedIds = get().equipped[agentId] || [];
    return get().installedTools.filter((t) => !equippedIds.includes(t.id));
  },

  installMCPTool: (tool) => {
    set((s) => ({
      installedTools: [...s.installedTools.filter((t) => t.id !== tool.id), tool],
    }));
  },

  uninstallMCPTool: (toolId) => {
    set((s) => ({
      installedTools: s.installedTools.filter((t) => t.id !== toolId),
      equipped: Object.fromEntries(
        Object.entries(s.equipped).map(([agentId, tools]) => [agentId, tools.filter((id) => id !== toolId)])
      ),
    }));
  },
}));
