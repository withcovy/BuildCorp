import { useState } from 'react';
import { useCompanyStore } from '../stores/companyStore';

const TEAM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export function CompanySelector() {
  const { companies, createCompany, selectCompany, deleteCompany } = useCompanyStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', description: '', workingDir: '' });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const company = await createCompany(form);
    await selectCompany(company);
    setForm({ name: '', industry: '', description: '', workingDir: '' });
    setShowCreate(false);
  };

  return (
    <div className="flex-1 bg-slate-900 flex items-center justify-center">
      <div className="w-full max-w-lg p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-pixel text-4xl text-indigo-400 mb-2">BuildCorp</h1>
          <p className="text-slate-500 text-sm">Your AI-Powered Virtual Office</p>
        </div>

        {/* Company list */}
        {companies.length > 0 && !showCreate && (
          <div className="space-y-3 mb-6">
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Your Companies
            </h2>
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => selectCompany(company)}
                className="w-full bg-slate-800 hover:bg-slate-800/80 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl p-4 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 font-medium">{company.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">
                      {company.industry || 'No industry'} &middot; ${company.funds.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 text-xs group-hover:text-slate-500 transition-colors">
                      Open &rarr;
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${company.name}"?`)) deleteCompany(company.id);
                      }}
                      className="text-slate-700 hover:text-rose-400 text-xs transition-colors p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Create new company form */}
        {showCreate ? (
          <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 space-y-4">
            <h2 className="text-slate-300 text-sm font-semibold">New Company</h2>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Company name"
              className="w-full bg-slate-900 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600"
            />
            <input
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              placeholder="Industry (e.g., Tech, Design, Marketing)"
              className="w-full bg-slate-900 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)"
              rows={3}
              className="w-full bg-slate-900 text-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600 resize-none"
            />
            <div>
              <label className="text-slate-500 text-xs mb-1 block">Project Folder</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-900 text-sm rounded-lg px-3 py-2.5 border border-slate-700 min-h-[38px] flex items-center">
                  {form.workingDir ? (
                    <span className="text-slate-200 font-mono text-xs truncate">{form.workingDir}</span>
                  ) : (
                    <span className="text-slate-600">No folder selected</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const folder = await window.electronAPI?.selectFolder?.();
                    if (folder) setForm({ ...form, workingDir: folder });
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  Browse
                </button>
              </div>
              <div className="text-slate-600 text-[10px] mt-1">AI agents will work in this folder</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!form.name.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
              >
                Create Company
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 text-slate-400 hover:text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 rounded-xl p-4 text-sm font-medium transition-all"
          >
            + Create New Company
          </button>
        )}
      </div>
    </div>
  );
}
