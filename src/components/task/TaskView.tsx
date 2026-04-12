import { useEffect, useState } from 'react';
import { useCompanyStore } from '../../stores/companyStore';
import { useTaskStore } from '../../stores/taskStore';
import type { Task, TaskStatus } from '../../../shared/types';

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo', label: 'Todo', color: 'bg-slate-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
  { key: 'review', label: 'Review', color: 'bg-indigo-500' },
  { key: 'done', label: 'Done', color: 'bg-emerald-500' },
];

export function TaskView() {
  const { currentCompany, teams, agents } = useCompanyStore();
  const { tasks, loadTasks, createTask, moveTask, deleteTask } = useTaskStore();
  const [showCreate, setShowCreate] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    if (currentCompany) loadTasks(currentCompany.id);
  }, [currentCompany]);

  if (!currentCompany) return null;

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDrop = (status: TaskStatus) => {
    if (dragId) {
      moveTask(dragId, status);
      setDragId(null);
    }
  };

  return (
    <div className="flex-1 bg-slate-900 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-slate-200 text-lg font-semibold">Task Board</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            + New Task
          </button>
        </div>

        {/* Create task modal */}
        {showCreate && (
          <CreateTaskForm
            companyId={currentCompany.id}
            teams={teams}
            onClose={() => setShowCreate(false)}
            onCreate={createTask}
          />
        )}

        {/* Kanban columns */}
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-3 min-h-[400px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/30">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-slate-400 text-xs font-semibold uppercase">
                  {col.label}
                </span>
                <span className="text-slate-600 text-xs ml-auto">
                  {tasksByStatus(col.key).length}
                </span>
              </div>
              <div className="space-y-2">
                {tasksByStatus(col.key).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    agents={agents}
                    teams={teams}
                    onDragStart={() => setDragId(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onMove={(status) => moveTask(task.id, status)}
                  />
                ))}
                {tasksByStatus(col.key).length === 0 && (
                  <div className="text-center text-slate-700 text-xs py-6">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  agents,
  teams,
  onDragStart,
  onDelete,
  onMove,
}: {
  task: Task;
  agents: Record<string, any[]>;
  teams: any[];
  onDragStart: () => void;
  onDelete: () => void;
  onMove: (status: TaskStatus) => void;
}) {
  const team = teams.find((t) => t.id === task.teamId);
  const assignedAgents = Object.values(agents)
    .flat()
    .filter((a) => task.assignedAgentIds.includes(a.id));

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-slate-800 rounded-lg border border-slate-700/50 p-3 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-slate-300 text-sm font-medium truncate">{task.title}</div>
          {task.description && (
            <div className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-slate-700 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/30">
        <div className="flex items-center gap-1">
          {team && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: team.color + '20', color: team.color }}
            >
              {team.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {assignedAgents.map((a) => (
            <div
              key={a.id}
              className="w-5 h-5 bg-slate-700 rounded text-[8px] flex items-center justify-center"
              title={a.name}
            >
              {a.status === 'working' ? '⌨️' : '💤'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateTaskForm({
  companyId,
  teams,
  onClose,
  onCreate,
}: {
  companyId: string;
  teams: any[];
  onClose: () => void;
  onCreate: (data: any) => Promise<any>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id || '');

  const handleSubmit = async () => {
    if (!title.trim() || !teamId) return;
    await onCreate({ companyId, teamId, title: title.trim(), description: description.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-[450px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-slate-200 font-semibold mb-4">New Task</h2>
        <div className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600 resize-none"
          />
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-700 focus:border-indigo-500 transition-colors"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            {teams.length === 0 && <option value="">No teams</option>}
          </select>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !teamId}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
            >
              Create
            </button>
            <button onClick={onClose} className="px-4 text-slate-400 hover:text-slate-300 text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
