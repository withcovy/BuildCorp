import { useEffect } from 'react';
import { useInventoryStore, type ToolItem } from '../../stores/inventoryStore';
import { useCompanyStore } from '../../stores/companyStore';
import type { Agent } from '../../../shared/types';

interface Props {
  agentId: string;
  onClose: () => void;
}

export function InventoryPanel({ agentId, onClose }: Props) {
  const { agents } = useCompanyStore();
  const {
    loadEquipped, equipTool, unequipTool,
    getEquippedTools, getUnequippedTools,
  } = useInventoryStore();

  // Find agent
  let agent: Agent | undefined;
  for (const teamAgents of Object.values(agents)) {
    agent = teamAgents?.find((a) => a.id === agentId);
    if (agent) break;
  }

  useEffect(() => {
    loadEquipped(agentId);
  }, [agentId]);

  if (!agent) return null;

  const equipped = getEquippedTools(agentId);
  const unequipped = getUnequippedTools(agentId);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-[420px] max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <div className="w-10 h-10 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center font-pixel text-lg">
            🎒
          </div>
          <div className="flex-1">
            <div className="text-slate-200 font-semibold text-sm">{agent.name}'s Inventory</div>
            <div className="text-slate-500 text-xs">{agent.specialty || agent.llmProvider}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Equipped */}
          <section>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Equipped ({equipped.length})
            </div>
            <div className="grid grid-cols-4 gap-2">
              {equipped.map((tool) => (
                <ToolSlot
                  key={tool.id}
                  tool={tool}
                  equipped={true}
                  onClick={() => unequipTool(agentId, tool.id)}
                />
              ))}
              {equipped.length === 0 && (
                <div className="col-span-4 py-4 text-center text-slate-700 text-xs">No tools equipped</div>
              )}
            </div>
          </section>

          {/* Storage */}
          <section>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Storage ({unequipped.length})
            </div>
            <div className="grid grid-cols-4 gap-2">
              {unequipped.map((tool) => (
                <ToolSlot
                  key={tool.id}
                  tool={tool}
                  equipped={false}
                  onClick={() => equipTool(agentId, tool.id)}
                />
              ))}
              {unequipped.length === 0 && (
                <div className="col-span-4 py-4 text-center text-slate-700 text-xs">All tools equipped</div>
              )}
            </div>
          </section>

          {/* MCP Store link */}
          <section>
            <button className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 rounded-lg py-3 text-xs font-medium transition-all">
              MCP Store - Find More Tools →
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function ToolSlot({
  tool,
  equipped,
  onClick,
}: {
  tool: ToolItem;
  equipped: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg border p-2 text-center transition-all hover:scale-105 group ${
        equipped
          ? 'bg-slate-800 border-slate-600 hover:border-rose-500/50'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50'
      }`}
      title={`${tool.name}: ${tool.description}\n${equipped ? 'Click to unequip' : 'Click to equip'}`}
    >
      <div className="text-xl mb-1">{tool.icon}</div>
      <div className="text-slate-400 text-[9px] font-medium truncate">{tool.name}</div>
      {tool.type === 'mcp' && (
        <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-indigo-500 rounded-full" title="MCP Tool" />
      )}
      <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/40 text-[10px] font-medium ${
        equipped ? 'text-rose-400' : 'text-indigo-400'
      }`}>
        {equipped ? 'Unequip' : 'Equip'}
      </div>
    </button>
  );
}
