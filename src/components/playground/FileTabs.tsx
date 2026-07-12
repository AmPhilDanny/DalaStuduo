import { X, Circle } from 'lucide-react';
import type { OpenFile } from '@/hooks/usePlayground';

interface Props {
  files: OpenFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export default function FileTabs({ files, activePath, onSelect, onClose }: Props) {
  if (files.length === 0) return null;

  return (
    <div className="flex items-center bg-gray-900/50 border-b border-gray-700 overflow-x-auto">
      {files.map((file) => (
        <div
          key={file.path}
          onClick={() => onSelect(file.path)}
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-gray-700 whitespace-nowrap transition-colors ${
            activePath === file.path
              ? 'bg-gray-800 text-white border-b-2 border-b-purple-500'
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
          }`}
        >
          {file.isDirty ? (
            <Circle className="w-2 h-2 fill-amber-400 text-amber-400" />
          ) : (
            <span className="w-2 h-2" />
          )}
          <span>{file.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(file.path); }}
            className="p-0.5 rounded hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
