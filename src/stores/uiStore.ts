import { create } from 'zustand';

export type MainView = 'office' | 'dashboard' | 'tasks';

interface UIState {
  mainView: MainView;
  selectedTeamId: string | null;
  selectedAgentId: string | null;
  chatPanelOpen: boolean;
  sidebarCollapsed: boolean;

  setMainView: (view: MainView) => void;
  selectTeam: (teamId: string | null) => void;
  selectAgent: (agentId: string | null) => void;
  toggleChatPanel: (open?: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mainView: 'office',
  selectedTeamId: null,
  selectedAgentId: null,
  chatPanelOpen: false,
  sidebarCollapsed: false,

  setMainView: (view) => set({ mainView: view }),
  selectTeam: (teamId) => set({ selectedTeamId: teamId }),
  selectAgent: (agentId) => set({ selectedAgentId: agentId, chatPanelOpen: !!agentId }),
  toggleChatPanel: (open) => set((state) => ({ chatPanelOpen: open ?? !state.chatPanelOpen })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
