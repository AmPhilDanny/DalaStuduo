import { Star, GitFork } from 'lucide-react';

export interface RepoCardData {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
}

interface Props {
  repo: RepoCardData;
  isFeatured?: boolean;
  onToggleFeatured?: (repoId: number, featured: boolean) => void;
  showFeatured?: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572a5',
  Go: '#00add8', Rust: '#dea584', Java: '#b07219',
  HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
  Ruby: '#701516', C: '#555555', 'C++': '#f34b7d',
  PHP: '#4f5d95', Swift: '#ffac45', Kotlin: '#A97BFF',
};

export default function RepoCard({ repo, isFeatured, onToggleFeatured, showFeatured }: Props) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 truncate transition-colors">
            {repo.name}
          </h3>
          {repo.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{repo.description}</p>
          )}
        </div>

        {showFeatured && onToggleFeatured && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFeatured(repo.id, !isFeatured);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-500'
            }`}
            title={isFeatured ? 'Unfeature' : 'Feature on profile'}
          >
            <Star className={`w-4 h-4 ${isFeatured ? 'fill-amber-500' : ''}`} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#858585' }}
            />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          {repo.stars}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          {repo.forks}
        </span>
      </div>

      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {repo.topics.slice(0, 4).map((topic) => (
            <span
              key={topic}
              className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded-md"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}
