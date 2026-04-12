import { useState, useEffect } from 'react';
import { useCompanyStore } from '../../stores/companyStore';
import { useWorkflowStore } from '../../stores/workflowStore';
import { WorkflowCanvas } from './WorkflowCanvas';
import type { Workflow } from '../../../shared/workflow';

export function WorkflowView() {
  const { currentCompany } = useCompanyStore();
  const { workflows, currentWorkflow, createWorkflow, selectWorkflow, deleteWorkflow } = useWorkflowStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  if (!currentCompany) return null;

  const companyWorkflows = workflows.filter((w) => w.companyId === currentCompany.id);
  const templates = companyWorkflows.filter((w) => w.isTemplate);
  const active = companyWorkflows.filter((w) => !w.isTemplate);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createWorkflow(currentCompany.id, newName.trim());
    setNewName('');
    setShowCreate(false);
  };

  return (
    <div className="flex-1 bg-slate-900 flex overflow-hidden">
      {/* Workflow list sidebar */}
      <div className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Workflows</span>
          <button
            onClick={() => setShowCreate(true)}
            className="text-slate-500 hover:text-indigo-400 text-lg leading-none transition-colors"
          >
            +
          </button>
        </div>

        {showCreate && (
          <div className="p-2 border-b border-slate-800">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowCreate(false);
              }}
              placeholder="Workflow name..."
              className="w-full bg-slate-800 text-slate-200 text-sm rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {active.length > 0 && (
            <WorkflowGroup label="Active" items={active} current={currentWorkflow} onSelect={selectWorkflow} onDelete={deleteWorkflow} />
          )}
          {templates.length > 0 && (
            <WorkflowGroup label="Templates" items={templates} current={currentWorkflow} onSelect={selectWorkflow} onDelete={deleteWorkflow} />
          )}
          {companyWorkflows.length === 0 && (
            <div className="p-4 text-slate-600 text-xs text-center">
              No workflows yet
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      {currentWorkflow ? (
        <WorkflowCanvas />
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
          Select or create a workflow
        </div>
      )}
    </div>
  );
}

function WorkflowGroup({
  label,
  items,
  current,
  onSelect,
  onDelete,
}: {
  label: string;
  items: Workflow[];
  current: Workflow | null;
  onSelect: (w: Workflow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="border-b border-slate-800/50">
      <div className="px-3 py-1.5 text-slate-600 text-[10px] font-semibold uppercase">{label}</div>
      {items.map((w) => (
        <div
          key={w.id}
          onClick={() => onSelect(w)}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group ${
            current?.id === w.id ? 'bg-slate-800/70' : 'hover:bg-slate-800/30'
          }`}
        >
          <span className="text-slate-400 text-xs flex-1 truncate">{w.name}</span>
          <span className="text-slate-700 text-[10px]">{w.nodes.length}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(w.id); }}
            className="text-slate-700 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
