import { create } from 'zustand';
import type { Company, Team, Agent } from '../../shared/types';

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  teams: Team[];
  agents: Record<string, Agent[]>; // teamId -> agents
  loading: boolean;

  // Company actions
  loadCompanies: () => Promise<void>;
  selectCompany: (company: Company) => Promise<void>;
  createCompany: (data: Partial<Company>) => Promise<Company>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  // Team actions
  loadTeams: (companyId: string) => Promise<void>;
  createTeam: (data: Partial<Team> & { companyId: string }) => Promise<Team>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;

  // Agent actions
  loadAgents: (teamId: string) => Promise<void>;
  createAgent: (data: Partial<Agent> & { teamId: string; companyId: string }) => Promise<Agent>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string, teamId: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  currentCompany: null,
  teams: [],
  agents: {},
  loading: false,

  // Company
  loadCompanies: async () => {
    set({ loading: true });
    const companies = await window.electronAPI.companyList();
    set({ companies, loading: false });
  },

  selectCompany: async (company) => {
    set({ currentCompany: company, teams: [], agents: {} });
    await get().loadTeams(company.id);
  },

  createCompany: async (data) => {
    const company = await window.electronAPI.companyCreate(data);
    set((state) => ({ companies: [company, ...state.companies] }));
    return company;
  },

  updateCompany: async (id, data) => {
    const updated = await window.electronAPI.companyUpdate(id, data);
    if (updated) {
      set((state) => ({
        companies: state.companies.map((c) => (c.id === id ? updated : c)),
        currentCompany: state.currentCompany?.id === id ? updated : state.currentCompany,
      }));
    }
  },

  deleteCompany: async (id) => {
    await window.electronAPI.companyDelete(id);
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== id),
      currentCompany: state.currentCompany?.id === id ? null : state.currentCompany,
    }));
  },

  // Team
  loadTeams: async (companyId) => {
    const teams = await window.electronAPI.teamList(companyId);
    set({ teams });
    // Load agents for each team
    for (const team of teams) {
      await get().loadAgents(team.id);
    }
  },

  createTeam: async (data) => {
    const team = await window.electronAPI.teamCreate(data);
    set((state) => ({ teams: [...state.teams, team] }));
    return team;
  },

  updateTeam: async (id, data) => {
    const updated = await window.electronAPI.teamUpdate(id, data);
    if (updated) {
      set((state) => ({
        teams: state.teams.map((t) => (t.id === id ? updated : t)),
      }));
    }
  },

  deleteTeam: async (id) => {
    await window.electronAPI.teamDelete(id);
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== id),
      agents: { ...state.agents, [id]: undefined } as any,
    }));
  },

  // Agent
  loadAgents: async (teamId) => {
    const agents = await window.electronAPI.agentList(teamId);
    set((state) => ({
      agents: { ...state.agents, [teamId]: agents },
    }));
  },

  createAgent: async (data) => {
    const agent = await window.electronAPI.agentCreate(data);
    set((state) => ({
      agents: {
        ...state.agents,
        [data.teamId]: [...(state.agents[data.teamId] || []), agent],
      },
    }));
    return agent;
  },

  updateAgent: async (id, data) => {
    const updated = await window.electronAPI.agentUpdate(id, data);
    if (updated) {
      set((state) => {
        const newAgents = { ...state.agents };
        for (const teamId of Object.keys(newAgents)) {
          newAgents[teamId] = newAgents[teamId]?.map((a) => (a.id === id ? updated : a));
        }
        return { agents: newAgents };
      });
    }
  },

  deleteAgent: async (id, teamId) => {
    await window.electronAPI.agentDelete(id);
    set((state) => ({
      agents: {
        ...state.agents,
        [teamId]: state.agents[teamId]?.filter((a) => a.id !== id) || [],
      },
    }));
  },
}));
