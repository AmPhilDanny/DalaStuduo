import { useState, useRef, useEffect } from 'react';
import { ChevronDown, GitBranch } from 'lucide-react';
import type { GitHubRepo } from '@/lib/github';

interface Props {
  repos: GitHubRepo[];
  selected: { owner: string; repo: string } | null;
  onSelect: (owner: string, repo: string) => void;
  isLoading: boolean;
}

export default function RepoSelector({ repos, selected, onSelect, isLoading }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedName = selected ? `${selected.owner}/${selected.repo}` : 'Select a repository';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg border border-gray-700 min-w-[180px] transition-colors"
        disabled={isLoading}
      >
        <GitBranch className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate flex-1 text-left">{isLoading ? 'Loading…' : selectedName}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
          {repos.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center">No repositories found</p>
          ) : (
            repos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => {
                  onSelect(repo.owner.login, repo.name);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                  selected?.repo === repo.name ? 'bg-gray-700 text-white' : 'text-gray-300'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{repo.name}</p>
                  <p className="text-xs text-gray-500 truncate">{repo.description || repo.owner.login}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
