import { useCompanyStore } from '../../stores/companyStore';

// Placeholder task view - will be fully built in Phase 3
export function TaskView() {
  const { currentCompany, teams } = useCompanyStore();

  if (!currentCompany) return null;

  return (
    <div className="flex-1 bg-slate-900 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-slate-200 text-lg font-semibold">Task Board</h1>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            + New Task
          </button>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-4 gap-4">
          {['Todo', 'In Progress', 'Review', 'Done'].map((column) => (
            <div
              key={column}
              className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-3"
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/30">
                <ColumnDot status={column} />
                <span className="text-slate-400 text-xs font-semibold uppercase">
                  {column}
                </span>
                <span className="text-slate-600 text-xs ml-auto">0</span>
              </div>
              <div className="min-h-[200px] text-center text-slate-700 text-xs pt-8">
                No tasks
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColumnDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Todo: 'bg-slate-500',
    'In Progress': 'bg-amber-500',
    Review: 'bg-indigo-500',
    Done: 'bg-emerald-500',
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-slate-500'}`} />;
}
