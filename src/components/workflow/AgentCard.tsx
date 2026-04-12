import { useRef, useState, useCallback } from 'react';
import type { WorkflowNode } from '../../../shared/workflow';
import type { NodeStatus } from '../../../shared/workflow';
import type { Agent } from '../../../shared/types';

interface Props {
  node: WorkflowNode;
  agent: Agent | undefined;
  runStatus?: NodeStatus;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
  onConnectStart: (x: number, y: number) => void;
  onConnectEnd: () => void;
}

const STATUS_STYLES: Record<string, { border: string; glow: string; emoji: string }> = {
  pending: { border: 'border-slate-600', glow: '', emoji: '⏳' },
  running: { border: 'border-emerald-500', glow: 'shadow-emerald-500/20 shadow-lg', emoji: '⌨️' },
  waiting_approval: { border: 'border-amber-500', glow: 'shadow-amber-500/20 shadow-lg', emoji: '✋' },
  completed: { border: 'border-emerald-400', glow: '', emoji: '✅' },
  failed: { border: 'border-rose-500', glow: '', emoji: '❌' },
};

export function AgentCard({ node, agent, runStatus, onMove, onRemove, onConnectStart, onConnectEnd }: Props) {
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const style = runStatus ? STATUS_STYLES[runStatus] || STATUS_STYLES.pending : STATUS_STYLES.pending;
  const agentStatus = agent?.status || 'idle';

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.connector) return;
    e.preventDefault();
    setDragging(true);
    dragOffset.current = { x: e.clientX - node.x, y: e.clientY - node.y };

    const handleMouseMove = (e: MouseEvent) => {
      onMove(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y);
    };
    const handleMouseUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleConnectorMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnectStart(node.x + 140, node.y + 45);
  };

  return (
    <div
      className={`absolute select-none ${dragging ? 'z-20' : 'z-10'}`}
      style={{ left: node.x, top: node.y }}
      onMouseDown={handleMouseDown}
      onMouseUp={onConnectEnd}
    >
      <div
        className={`w-36 bg-slate-800 rounded-lg border-2 ${style.border} ${style.glow} p-2.5 cursor-grab active:cursor-grabbing transition-shadow group`}
      >
        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 hover:bg-rose-500 text-slate-400 hover:text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30"
        >
          ✕
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 mx-auto mb-1.5 bg-slate-700 rounded border border-slate-600 flex items-center justify-center font-pixel text-lg pixel-art">
          {runStatus ? style.emoji : (agentStatus === 'working' ? '⌨️' : '💤')}
        </div>

        {/* Name */}
        <div className="text-center">
          <div className="text-slate-200 text-xs font-medium truncate">
            {agent?.name || 'Unknown'}
          </div>
          <div className="text-slate-500 text-[10px] truncate mt-0.5">
            {node.label || agent?.specialty || ''}
          </div>
          {runStatus && (
            <div className={`text-[10px] mt-1 font-pixel ${
              runStatus === 'running' ? 'text-emerald-400' :
              runStatus === 'waiting_approval' ? 'text-amber-400 animate-pulse' :
              runStatus === 'completed' ? 'text-emerald-300' :
              runStatus === 'failed' ? 'text-rose-400' :
              'text-slate-500'
            }`}>
              {runStatus.replace('_', ' ')}
            </div>
          )}
        </div>

        {/* Output connector (right side) */}
        <div
          data-connector="output"
          onMouseDown={handleConnectorMouseDown}
          className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-800 cursor-crosshair hover:bg-indigo-400 hover:scale-125 transition-all z-30"
        />

        {/* Input connector (left side) */}
        <div
          className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-500 rounded-full border-2 border-slate-800 z-30"
        />
      </div>
    </div>
  );
}
