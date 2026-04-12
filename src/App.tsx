import { useEffect, useState } from 'react';
import { useCompanyStore } from './stores/companyStore';
import { useUIStore } from './stores/uiStore';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { CompanySelector } from './components/CompanySelector';
import { OfficeView } from './components/office/OfficeView';
import { DashboardView } from './components/dashboard/DashboardView';
import { TaskView } from './components/task/TaskView';
import { WorkflowView } from './components/workflow/WorkflowView';
import { ChatPanel } from './components/chat/ChatPanel';
import { SettingsModal } from './components/settings/SettingsModal';

function MainContent() {
  const { mainView } = useUIStore();

  switch (mainView) {
    case 'office':
      return <OfficeView />;
    case 'dashboard':
      return <DashboardView />;
    case 'tasks':
      return <TaskView />;
    case 'workflow':
      return <WorkflowView />;
    default:
      return <OfficeView />;
  }
}

export default function App() {
  const { currentCompany, loadCompanies } = useCompanyStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <TitleBar onSettingsClick={() => setSettingsOpen(true)} />

      {currentCompany ? (
        <>
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <MainContent />
            <ChatPanel />
          </div>
          <StatusBar />
        </>
      ) : (
        <CompanySelector />
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
