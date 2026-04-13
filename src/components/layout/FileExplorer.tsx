import { useState, useEffect } from 'react';
import { useCompanyStore } from '../../stores/companyStore';

interface FileItem {
  name: string;
  isDir: boolean;
  path: string;
}

export function FileExplorer() {
  const { currentCompany } = useCompanyStore();
  const workingDir = currentCompany?.workingDir;

  if (!workingDir) {
    return (
      <div className="p-4 text-slate-600 text-xs text-center">
        Dashboard → Company Info → Edit에서<br/>Project Folder를 설정해주세요
      </div>
    );
  }

  return <DirTree dirPath={workingDir} depth={0} />;
}

function DirTree({ dirPath, depth }: { dirPath: string; depth: number }) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    window.electronAPI?.listDir(dirPath).then((result) => {
      setItems(result || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dirPath]);

  if (loading && depth === 0) {
    return <div className="px-3 py-2 text-slate-600 text-xs">Loading...</div>;
  }

  const toggleDir = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const fileIcon = (name: string, isDir: boolean) => {
    if (isDir) return '📁';
    const ext = name.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return '📄';
    if (['json', 'yaml', 'yml', 'toml'].includes(ext || '')) return '⚙';
    if (['md', 'txt', 'doc'].includes(ext || '')) return '📝';
    if (['css', 'scss', 'less'].includes(ext || '')) return '🎨';
    if (['png', 'jpg', 'svg', 'gif'].includes(ext || '')) return '🖼';
    return '📄';
  };

  return (
    <div>
      {items.map((item) => (
        <div key={item.path}>
          <div
            onClick={() => item.isDir && toggleDir(item.path)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-800/30 cursor-pointer transition-colors"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {item.isDir && (
              <span className="text-slate-600 text-[10px] w-3">
                {expanded.has(item.path) ? '▼' : '▶'}
              </span>
            )}
            {!item.isDir && <span className="w-3" />}
            <span className="text-[10px]">{fileIcon(item.name, item.isDir)}</span>
            <span className={`text-xs truncate ${item.isDir ? 'text-slate-300' : 'text-slate-500'}`}>
              {item.name}
            </span>
          </div>
          {item.isDir && expanded.has(item.path) && (
            <DirTree dirPath={item.path} depth={depth + 1} />
          )}
        </div>
      ))}
      {items.length === 0 && depth === 0 && (
        <div className="px-3 py-2 text-slate-600 text-xs text-center">Empty folder</div>
      )}
    </div>
  );
}
