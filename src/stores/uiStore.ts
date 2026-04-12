import { create } from 'zustand';

export type MainView = 'office' | 'dashboard' | 'tasks' | 'workflow';

interface UIState {
  mainView: MainView;
  viewHistory: MainView[];
  selectedTeamId: string | null;
  selectedAgentId: string | null;
  chatPanelOpen: boolean;
  sidebarCollapsed: boolean;

  setMainView: (view: MainView) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  selectTeam: (teamId: string | null) => void;
  selectAgent: (agentId: string | null) => void;
  toggleChatPanel: (open?: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  mainView: 'office',
  viewHistory: [],
  selectedTeamId: null,
  selectedAgentId: null,
  chatPanelOpen: false,
  sidebarCollapsed: false,

  setMainView: (view) => set((state) => ({
    viewHistory: [...state.viewHistory, state.mainView].slice(-10),
    mainView: view,
  })),
  goBack: () => set((state) => {
    if (state.viewHistory.length === 0) return state;
    const prev = state.viewHistory[state.viewHistory.length - 1];
    return {
      mainView: prev,
      viewHistory: state.viewHistory.slice(0, -1),
    };
  }),
  canGoBack: () => get().viewHistory.length > 0,
  selectTeam: (teamId) => set({ selectedTeamId: teamId }),
  selectAgent: (agentId) => set({ selectedAgentId: agentId, chatPanelOpen: !!agentId }),
  toggleChatPanel: (open) => set((state) => ({ chatPanelOpen: open ?? !state.chatPanelOpen })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
