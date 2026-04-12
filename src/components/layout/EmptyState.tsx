import { useUIStore } from '../../stores/uiStore';

interface Props {
  icon: string;
  title: string;
  description: string;
  showBack?: boolean;
}

export function EmptyState({ icon, title, description, showBack = true }: Props) {
  const { goBack, canGoBack } = useUIStore();

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">{icon}</div>
        <div className="text-slate-300 font-medium mb-1">{title}</div>
        <div className="text-slate-500 text-sm mb-4">{description}</div>
        {showBack && canGoBack() && (
          <button
            onClick={goBack}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            ← Go Back
          </button>
        )}
      </div>
    </div>
  );
}
