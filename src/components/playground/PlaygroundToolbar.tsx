import { Play, Save, Sun, Moon, RotateCcw } from 'lucide-react';

interface Props {
  onRun: () => void;
  onCommit: () => void;
  onThemeToggle: () => void;
  onFormat?: () => void;
  theme: 'vs-dark' | 'light';
  hasDirtyFiles: boolean;
  isRunning: boolean;
}

export default function PlaygroundToolbar({
  onRun,
  onCommit,
  onThemeToggle,
  theme,
  hasDirtyFiles,
  isRunning,
}: Props) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-700">
      <div className="flex items-center gap-1">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <Play className={`w-3 h-3 ${isRunning ? 'animate-pulse' : ''}`} />
          Run
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onCommit}
          disabled={!hasDirtyFiles}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Commit changes to GitHub"
        >
          <Save className="w-3 h-3" />
          Commit
        </button>

        <button
          onClick={onThemeToggle}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title={theme === 'vs-dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'vs-dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
