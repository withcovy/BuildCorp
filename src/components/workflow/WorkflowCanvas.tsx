import { useRef, useState, useCallback } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useCompanyStore } from '../../stores/companyStore';
import { AgentCard } from './AgentCard';
import { EdgeLine } from './EdgeLine';
import type { Agent } from '../../../shared/types';
import type { TransitionCondition } from '../../../shared/workflow';

export function WorkflowCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    currentWorkflow, currentRun,
    addNode, removeNode, moveNode,
    addEdge, removeEdge, updateEdgeCondition,
    startRun, saveAsTemplate,
  } = useWorkflowStore();
  const { agents } = useCompanyStore();

  const [connecting, setConnecting] = useState<{ sourceId: string; x: number; y: number } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [showAgentPicker, setShowAgentPicker] = useState<{ x: number; y: number } | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateSave, setShowTemplateSave] = useState(false);

  const allAgents = Object.values(agents).flat().filter(Boolean) as Agent[];

  if (!currentWorkflow) return null;

  // Double-click canvas to add agent
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    setShowAgentPicker({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Select agent from picker
  const handlePickAgent = (agent: Agent) => {
    if (!showAgentPicker) return;
    addNode(agent.id, agent.specialty || agent.name, showAgentPicker.x - 70, showAgentPicker.y - 40);
    setShowAgentPicker(null);
  };

  // Start edge connection from a node
  const handleConnectStart = (nodeId: string, x: number, y: number) => {
    setConnecting({ sourceId: nodeId, x, y });
  };

  // End edge connection on a node
  const handleConnectEnd = (targetNodeId: string) => {
    if (connecting && connecting.sourceId !== targetNodeId) {
      addEdge(connecting.sourceId, targetNodeId);
    }
    setConnecting(null);
  };

  // Mouse move while connecting
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!connecting) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    setConnecting({ ...connecting, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    setConnecting(null);
  };

  // Get node center position for edge drawing
  const getNodeCenter = (nodeId: string) => {
    const node = currentWorkflow.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + 70, y: node.y + 45 }; // card half-size
  };

  const getNodeStatus = (nodeId: string) => {
    if (!currentRun) return undefined;
    return currentRun.nodeStates.find((ns) => ns.nodeId === nodeId)?.status;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="h-10 bg-slate-800/50 border-b border-slate-700/30 flex items-center px-4 gap-3">
        <span className="text-slate-300 text-sm font-medium truncate">{currentWorkflow.name}</span>
        <span className="text-slate-600 text-xs">{currentWorkflow.nodes.length} nodes</span>
        <div className="flex-1" />
        <button
          onClick={() => setShowTemplateSave(true)}
          className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
        >
          Save Template
        </button>
        <button
          onClick={startRun}
          disabled={currentWorkflow.nodes.length === 0 || !!currentRun}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          {currentRun ? 'Running...' : 'Run'}
        </button>
      </div>

      {/* Template save dialog */}
      {showTemplateSave && (
        <div className="absolute top-14 right-4 bg-slate-800 border border-slate-700 rounded-lg p-3 z-20 shadow-lg">
          <input
            autoFocus
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && templateName.trim()) {
                saveAsTemplate(templateName.trim());
                setTemplateName('');
                setShowTemplateSave(false);
              }
              if (e.key === 'Escape') setShowTemplateSave(false);
            }}
            placeholder="Template name..."
            className="bg-slate-900 text-slate-200 text-sm rounded px-2 py-1.5 outline-none border border-slate-600 focus:border-indigo-500 placeholder-slate-600 w-48"
          />
        </div>
      )}

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto bg-slate-950/50"
        onDoubleClick={handleCanvasDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        {/* Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {currentWorkflow.edges.map((edge) => {
            const from = getNodeCenter(edge.sourceNodeId);
            const to = getNodeCenter(edge.targetNodeId);
            return (
              <EdgeLine
                key={edge.id}
                id={edge.id}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                condition={edge.condition}
                selected={selectedEdge === edge.id}
                onClick={() => setSelectedEdge(selectedEdge === edge.id ? null : edge.id)}
                onDelete={() => removeEdge(edge.id)}
                onConditionChange={(c) => updateEdgeCondition(edge.id, c)}
              />
            );
          })}
          {/* Connecting line */}
          {connecting && (
            <line
              x1={getNodeCenter(connecting.sourceId).x}
              y1={getNodeCenter(connecting.sourceId).y}
              x2={connecting.x}
              y2={connecting.y}
              stroke="#6366f1"
              strokeWidth="2"
              strokeDasharray="6 3"
              opacity="0.6"
            />
          )}
        </svg>

        {/* Nodes */}
        {currentWorkflow.nodes.map((node) => {
          const agent = allAgents.find((a) => a.id === node.agentId);
          return (
            <AgentCard
              key={node.id}
              node={node}
              agent={agent}
              runStatus={getNodeStatus(node.id)}
              onMove={(x, y) => moveNode(node.id, x, y)}
              onRemove={() => removeNode(node.id)}
              onConnectStart={(x, y) => handleConnectStart(node.id, x, y)}
              onConnectEnd={() => handleConnectEnd(node.id)}
            />
          );
        })}

        {/* Agent picker */}
        {showAgentPicker && (
          <div
            className="absolute bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg z-30 w-48"
            style={{ left: showAgentPicker.x, top: showAgentPicker.y }}
          >
            <div className="text-slate-500 text-[10px] font-semibold uppercase mb-1 px-1">Add Agent</div>
            {allAgents.length === 0 && (
              <div className="text-slate-600 text-xs px-1 py-2">No agents available</div>
            )}
            {allAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handlePickAgent(agent)}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <span className="text-sm">{agent.status === 'working' ? '⌨️' : '💤'}</span>
                <span className="truncate">{agent.name}</span>
              </button>
            ))}
            <button
              onClick={() => setShowAgentPicker(null)}
              className="w-full text-left px-2 py-1 rounded text-[10px] text-slate-600 hover:text-slate-400 mt-1"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Empty state */}
        {currentWorkflow.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-slate-600 text-sm text-center">
              <div className="font-pixel text-slate-500 text-lg mb-2">Empty Workflow</div>
              <div>Double-click to add an agent</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
