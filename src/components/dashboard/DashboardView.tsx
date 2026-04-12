import { useState } from 'react';
import { useCompanyStore } from '../../stores/companyStore';

export function DashboardView() {
  const { currentCompany, teams, agents, updateCompany } = useCompanyStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', description: '', workingDir: '' });

  if (!currentCompany) return null;

  const totalAgents = Object.values(agents).flat().length;
  const workingAgents = Object.values(agents).flat().filter((a) => a.status === 'working').length;
  const idleAgents = Object.values(agents).flat().filter((a) => a.status === 'idle').length;

  const startEdit = () => {
    setForm({
      name: currentCompany.name,
      industry: currentCompany.industry,
      description: currentCompany.description,
      workingDir: currentCompany.workingDir || '',
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateCompany(currentCompany.id, form);
    setEditing(false);
  };

  return (
    <div className="flex-1 bg-slate-900 overflow-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Teams" value={teams.length.toString()} color="text-indigo-400" />
          <StatCard label="Total Agents" value={totalAgents.toString()} color="text-emerald-400" />
          <StatCard label="Active Now" value={workingAgents.toString()} color="text-amber-400" />
          <StatCard label="Available" value={idleAgents.toString()} color="text-slate-400" />
        </div>

        {/* Team overview */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h2 className="text-slate-300 text-sm font-semibold mb-4">Team Overview</h2>
          {teams.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm">No teams created yet</div>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => {
                const teamAgents = agents[team.id] || [];
                const working = teamAgents.filter((a) => a.status === 'working').length;
                return (
                  <div key={team.id} className="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: team.color }} />
                    <div className="flex-1">
                      <div className="text-slate-300 text-sm font-medium">{team.name}</div>
                      <div className="text-slate-500 text-xs">{team.role || 'No role set'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-sm">{teamAgents.length} agents</div>
                      <div className="text-slate-600 text-xs">{working} working</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Company info */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-300 text-sm font-semibold">Company Info</h2>
            {!editing && (
              <button
                onClick={startEdit}
                className="text-slate-500 hover:text-indigo-400 text-xs transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <EditField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <EditField label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
              <EditField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <div>
                <label className="text-slate-500 text-xs mb-1 block">Project Folder</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-800 text-sm rounded-lg px-3 py-2 border border-slate-700 flex items-center">
                    {form.workingDir ? (
                      <span className="text-slate-200 font-mono text-xs truncate">{form.workingDir}</span>
                    ) : (
                      <span className="text-slate-600 text-sm">No folder selected</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const folder = await window.electronAPI?.selectFolder?.();
                      if (folder) setForm({ ...form, workingDir: folder });
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 rounded-lg transition-colors"
                  >
                    Browse
                  </button>
                </div>
                <div className="text-slate-600 text-[10px] mt-1">AI agents will work in this folder</div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={saveEdit}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-slate-400 hover:text-slate-300 text-sm px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Name:</span>{' '}
                  <span className="text-slate-300">{currentCompany.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Industry:</span>{' '}
                  <span className="text-slate-300">{currentCompany.industry || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Funds:</span>{' '}
                  <span className="font-pixel text-emerald-400">${currentCompany.funds.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">Created:</span>{' '}
                  <span className="text-slate-300">{new Date(currentCompany.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Project Folder:</span>{' '}
                  <span className="text-slate-300 font-mono text-xs">{currentCompany.workingDir || 'Not set'}</span>
                </div>
              </div>
              {currentCompany.description && (
                <p className="mt-3 text-slate-400 text-sm">{currentCompany.description}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
      <div className="text-slate-500 text-xs mb-1">{label}</div>
      <div className={`font-pixel text-2xl ${color}`}>{value}</div>
    </div>
  );
}

function EditField({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="text-slate-500 text-xs mb-1 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600"
      />
      {hint && <div className="text-slate-600 text-[10px] mt-1">{hint}</div>}
    </div>
  );
}
