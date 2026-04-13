import { useState } from 'react';
import { useCompanyStore } from '../../stores/companyStore';
import { useUIStore } from '../../stores/uiStore';
import { FileExplorer } from './FileExplorer';
import type { Team, Agent } from '../../../shared/types';

type SidebarTab = 'teams' | 'files';

export function Sidebar() {
  const { currentCompany, teams, agents, createTeam, deleteTeam, createAgent } = useCompanyStore();
  const { selectedTeamId, selectTeam, selectAgent, sidebarCollapsed } = useUIStore();
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [tab, setTab] = useState<SidebarTab>('teams');

  if (sidebarCollapsed || !currentCompany) return null;

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    await createTeam({ companyId: currentCompany.id, name: newTeamName.trim() });
    setNewTeamName('');
    setShowNewTeam(false);
  };

  const handleAddAgent = async (team: Team) => {
    await createAgent({
      teamId: team.id,
      companyId: currentCompany.id,
      name: `Agent ${(agents[team.id]?.length || 0) + 1}`,
    });
  };

  return (
    <div className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setTab('teams')}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            tab === 'teams' ? 'text-slate-300 border-b-2 border-indigo-500' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          Teams
        </button>
        <button
          onClick={() => setTab('files')}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            tab === 'files' ? 'text-slate-300 border-b-2 border-indigo-500' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          Files
        </button>
      </div>

      {tab === 'files' ? (
        <div className="flex-1 overflow-y-auto">
          <FileExplorer />
        </div>
      ) : (<>

      {/* Teams header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Teams</span>
        <button
          onClick={() => setShowNewTeam(true)}
          className="text-slate-500 hover:text-indigo-400 text-lg leading-none transition-colors"
          title="Add team"
        >
          +
        </button>
      </div>

      {/* New team input */}
      {showNewTeam && (
        <div className="p-2 border-b border-slate-800">
          <input
            autoFocus
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateTeam();
              if (e.key === 'Escape') setShowNewTeam(false);
            }}
            onBlur={() => { if (!newTeamName.trim()) setShowNewTeam(false); }}
            placeholder="Team name..."
            className="w-full bg-slate-800 text-slate-200 text-sm rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
          />
        </div>
      )}

      {/* Teams list */}
      <div className="flex-1 overflow-y-auto">
        {teams.length === 0 && (
          <div className="p-4 text-slate-600 text-sm text-center">
            No teams yet. Click + to create one.
          </div>
        )}
        {teams.map((team) => (
          <TeamItem
            key={team.id}
            team={team}
            agents={agents[team.id] || []}
            isSelected={selectedTeamId === team.id}
            onSelect={() => selectTeam(team.id)}
            onSelectAgent={(agentId) => selectAgent(agentId)}
            onAddAgent={() => handleAddAgent(team)}
            onDelete={() => deleteTeam(team.id)}
          />
        ))}
      </div>

      {/* Company funds */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Funds</span>
          <span className="font-pixel text-emerald-400">
            ${currentCompany.funds.toLocaleString()}
          </span>
        </div>
      </div>
      </>)}
    </div>
  );
}

function TeamItem({
  team,
  agents,
  isSelected,
  onSelect,
  onSelectAgent,
  onAddAgent,
  onDelete,
}: {
  team: Team;
  agents: Agent[];
  isSelected: boolean;
  onSelect: () => void;
  onSelectAgent: (id: string) => void;
  onAddAgent: () => void;
  onDelete: () => void;
}) {
  const { updateTeam } = useCompanyStore();
  const [expanded, setExpanded] = useState(true);
  const [editingTeam, setEditingTeam] = useState(false);
  const [teamName, setTeamName] = useState(team.name);

  const handleTeamRename = () => {
    if (teamName.trim() && teamName.trim() !== team.name) {
      updateTeam(team.id, { name: teamName.trim() });
    }
    setEditingTeam(false);
  };

  return (
    <div className="border-b border-slate-800/50">
      {/* Team header */}
      <div
        onClick={() => { if (!editingTeam) { onSelect(); setExpanded(!expanded); } }}
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
          isSelected ? 'bg-slate-800/70' : 'hover:bg-slate-800/30'
        }`}
      >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
        {editingTeam ? (
          <input
            autoFocus
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTeamRename();
              if (e.key === 'Escape') { setTeamName(team.name); setEditingTeam(false); }
            }}
            onBlur={handleTeamRename}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-slate-800 text-slate-200 text-sm rounded px-1 py-0.5 outline-none border border-indigo-500"
          />
        ) : (
          <span
            className="text-slate-300 text-sm font-medium flex-1 truncate"
            onDoubleClick={(e) => { e.stopPropagation(); setTeamName(team.name); setEditingTeam(true); }}
            title="Double-click to rename"
          >
            {team.name}
          </span>
        )}
        <span className="text-slate-600 text-xs">{agents.length}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onAddAgent(); }}
          className="text-slate-600 hover:text-indigo-400 text-xs transition-colors"
          title="Add agent"
        >
          +
        </button>
      </div>

      {/* Agent list */}
      {expanded && agents.length > 0 && (
        <div className="pb-1">
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} onSelect={() => onSelectAgent(agent.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentRow({ agent, onSelect }: { agent: Agent; onSelect: () => void }) {
  const { updateAgent } = useCompanyStore();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(agent.name);

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== agent.name) {
      updateAgent(agent.id, { name: editName.trim() });
    }
    setEditing(false);
  };

  return (
    <div
      onClick={() => !editing && onSelect()}
      onContextMenu={(e) => {
        e.preventDefault();
        (window as any).__openInventory?.(agent.id);
      }}
      className="flex items-center gap-2 px-3 py-1.5 pl-7 cursor-pointer hover:bg-slate-800/30 transition-colors group"
    >
      <StatusDot status={agent.status} />
      {editing ? (
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') { setEditName(agent.name); setEditing(false); }
          }}
          onBlur={handleRename}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-slate-800 text-slate-200 text-xs rounded px-1 py-0.5 outline-none border border-indigo-500"
        />
      ) : (
        <span
          className="text-slate-400 text-xs truncate flex-1"
          onDoubleClick={(e) => { e.stopPropagation(); setEditName(agent.name); setEditing(true); }}
          title="Double-click to rename"
        >
          {agent.name}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); (window as any).__openAgentEdit?.(agent.id); }}
        className="text-slate-700 text-[10px] group-hover:text-slate-400 transition-colors"
        title="Agent settings"
      >
        ⚙
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); (window as any).__openInventory?.(agent.id); }}
        className="text-slate-700 text-[10px] group-hover:text-indigo-400 transition-colors"
        title="Inventory"
      >
        🎒
      </button>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-slate-500',
    working: 'bg-emerald-400 animate-pulse',
    break: 'bg-amber-400',
    meeting: 'bg-indigo-400',
  };
  return <div className={`w-1.5 h-1.5 rounded-full ${colors[status] || colors.idle}`} />;
}
