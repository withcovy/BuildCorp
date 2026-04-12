import { useCompanyStore } from '../../stores/companyStore';
import { useUIStore, type MainView } from '../../stores/uiStore';

const viewTabs: { key: MainView; label: string; icon: string }[] = [
  { key: 'office', label: '사무실', icon: '🏢' },
  { key: 'dashboard', label: '대시보드', icon: '📊' },
  { key: 'tasks', label: '태스크', icon: '📋' },
];

export function TitleBar() {
  const { currentCompany, companies } = useCompanyStore();
  const { mainView, setMainView } = useUIStore();

  return (
    <div className="drag-region h-10 bg-slate-950 flex items-center px-4 border-b border-slate-800 select-none">
      {/* App logo + Company name */}
      <div className="no-drag flex items-center gap-2 mr-6">
        <span className="font-pixel text-indigo-400 text-sm">BuildCorp</span>
        {currentCompany && (
          <>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 text-sm font-medium truncate max-w-[200px]">
              {currentCompany.name}
            </span>
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

      {/* Spacer for window controls */}
      <div className="flex-1" />
      <div className="no-drag text-slate-500 text-xs">
        {companies.length} companies
      </div>
    </div>
  );
}
