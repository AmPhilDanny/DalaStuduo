import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import RepoCard, { type RepoCardData } from './RepoCard';

interface Props {
  repos: RepoCardData[];
  featuredIds?: Set<number>;
  onToggleFeatured?: (repoId: number, featured: boolean) => void;
  showFeaturedToggle?: boolean;
}

export default function RepoList({ repos, featuredIds, onToggleFeatured, showFeaturedToggle }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return repos;
    const q = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q),
    );
  }, [repos, search]);

  if (repos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No repositories found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((repo) => (
          <RepoCard
            key={repo.id}
            repo={repo}
            isFeatured={featuredIds?.has(repo.id)}
            onToggleFeatured={onToggleFeatured}
            showFeatured={showFeaturedToggle}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">
          No repositories match "{search}"
        </p>
      )}
    </div>
  );
}
