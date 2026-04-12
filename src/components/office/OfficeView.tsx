import { useCompanyStore } from '../../stores/companyStore';
import { useUIStore } from '../../stores/uiStore';
import type { Agent } from '../../../shared/types';

// Placeholder office view - will be replaced with PixiJS canvas in Phase 4
export function OfficeView() {
  const { teams, agents } = useCompanyStore();
  const { selectAgent } = useUIStore();

  return (
    <div className="flex-1 bg-slate-900 overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Office floor */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 min-h-[500px]">
          <div className="font-pixel text-slate-500 text-xs mb-6 text-center">
            -- Office Floor --
          </div>

          {teams.length === 0 ? (
            <div className="flex items-center justify-center h-80 text-slate-600 text-sm">
              Create a team from the sidebar to get started
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-slate-800 rounded-lg border border-slate-700/50 p-4"
                >
                  {/* Team room header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-pixel text-slate-300 text-xs">{team.name}</span>
                    <span className="text-slate-600 text-[10px] ml-auto">
                      {(agents[team.id] || []).length} members
                    </span>
                  </div>

                  {/* Agent desks */}
                  <div className="grid grid-cols-2 gap-2">
                    {(agents[team.id] || []).map((agent) => (
                      <AgentDesk
                        key={agent.id}
                        agent={agent}
                        onClick={() => selectAgent(agent.id)}
                      />
                    ))}
                    {(agents[team.id] || []).length === 0 && (
                      <div className="col-span-2 py-6 text-center text-slate-600 text-xs">
                        No agents yet
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentDesk({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    idle: 'border-slate-600',
    working: 'border-emerald-500/50',
    break: 'border-amber-500/50',
    meeting: 'border-indigo-500/50',
  };

  const statusEmoji: Record<string, string> = {
    idle: '💤',
    working: '⌨️',
    break: '☕',
    meeting: '💬',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-slate-900/50 rounded-lg border ${statusColors[agent.status]} p-3 text-left hover:bg-slate-900 transition-all group`}
    >
      {/* Pixel avatar placeholder */}
      <div className="w-10 h-10 mx-auto mb-2 bg-slate-700 rounded border border-slate-600 flex items-center justify-center font-pixel text-lg pixel-art">
        {statusEmoji[agent.status]}
      </div>
      <div className="text-center">
        <div className="text-slate-300 text-xs font-medium truncate">{agent.name}</div>
        <div className="text-slate-600 text-[10px] truncate">{agent.specialty || agent.llmProvider}</div>
      </div>
    </button>
  );
}
