import { useState } from 'react';
import { useCompanyStore } from '../../stores/companyStore';
import { useUIStore, type MainView } from '../../stores/uiStore';

const viewTabs: { key: MainView; label: string; icon: string }[] = [
  { key: 'office', label: 'Office', icon: '🏢' },
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'tasks', label: 'Tasks', icon: '📋' },
  { key: 'workflow', label: 'Workflow', icon: '🔀' },
];

export function TitleBar({ onSettingsClick }: { onSettingsClick?: () => void }) {
  const { currentCompany, companies, selectCompany } = useCompanyStore();
  const { mainView, setMainView } = useUIStore();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const handleBackToSelector = () => {
    // Reset current company to go back to selector
    useCompanyStore.setState({ currentCompany: null, teams: [], agents: {} });
  };

  return (
    <div className="drag-region h-10 bg-slate-950 flex items-center px-4 border-b border-slate-800 select-none">
      {/* App logo + Company switcher */}
      <div className="no-drag flex items-center gap-2 mr-6 relative">
        <span className="font-pixel text-indigo-400 text-sm cursor-pointer" onClick={handleBackToSelector}>
          BuildCorp
        </span>
        {currentCompany && (
          <>
            <span className="text-slate-600">/</span>
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="text-slate-300 text-sm font-medium truncate max-w-[200px] hover:text-white transition-colors flex items-center gap-1"
            >
              {currentCompany.name}
              <span className="text-slate-600 text-[10px]">▼</span>
            </button>

            {/* Company switcher dropdown */}
            {showSwitcher && (
              <div className="absolute top-8 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 w-56 py-1">
                {companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { selectCompany(c); setShowSwitcher(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 transition-colors ${
                      c.id === currentCompany.id ? 'text-indigo-400' : 'text-slate-300'
                    }`}
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className="text-slate-500 text-[10px]">{c.industry || 'No industry'}</div>
                  </button>
                ))}
                <div className="border-t border-slate-700 mt-1 pt-1">
                  <button
                    onClick={() => { handleBackToSelector(); setShowSwitcher(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    + New Company...
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View tabs */}
      {currentCompany && (
        <div className="no-drag flex items-center gap-1">
          {viewTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMainView(tab.key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                mainView === tab.key
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <button
        onClick={onSettingsClick}
        className="no-drag text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded hover:bg-slate-800/50 transition-colors"
        title="Settings"
      >
        Settings
      </button>
    </div>
  );
}
