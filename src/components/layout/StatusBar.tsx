import { useCompanyStore } from '../../stores/companyStore';

export function StatusBar() {
  const { currentCompany, teams, agents } = useCompanyStore();

  if (!currentCompany) return null;

  const totalAgents = Object.values(agents).flat().length;
  const workingAgents = Object.values(agents).flat().filter((a) => a.status === 'working').length;

  return (
    <div className="h-6 bg-slate-950 border-t border-slate-800 flex items-center px-4 gap-4 text-[11px] text-slate-500 select-none">
      <span>
        <span className="text-slate-600">Teams:</span>{' '}
        <span className="text-slate-400">{teams.length}</span>
      </span>
      <span>
        <span className="text-slate-600">Agents:</span>{' '}
        <span className="text-slate-400">{workingAgents}/{totalAgents}</span>
        <span className="text-slate-600"> active</span>
      </span>
      <span>
        <span className="text-slate-600">Funds:</span>{' '}
        <span className="font-pixel text-emerald-500">${currentCompany.funds.toLocaleString()}</span>
      </span>
      <div className="flex-1" />
      <span className="text-slate-700">{currentCompany.industry || 'No industry set'}</span>
    </div>
  );
}
