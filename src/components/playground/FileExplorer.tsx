import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Loader2 } from 'lucide-react';
import type { GitHubContent } from '@/lib/github';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children: TreeNode[];
}

interface Props {
  files: GitHubContent[];
  isLoading: boolean;
  error: string | null;
  onFileClick: (path: string) => void;
  activeFile: string | null;
}

function buildTree(flat: GitHubContent[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  for (const item of flat) {
    const node: TreeNode = { name: item.name, path: item.path, type: item.type, children: [] };
    map.set(item.path, node);

    if (item.path.includes('/')) {
      const parts = item.path.split('/');
      const parentPath = parts.slice(0, -1).join('/');
      const parent = map.get(parentPath);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }
    root.push(node);
  }

  return root;
}

export default function FileExplorer({ files, isLoading, error, onFileClick, activeFile }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Auto-expand root dirs
    const dirs = new Set<string>();
    files.forEach((f) => {
      if (f.type === 'dir') dirs.add(f.path);
    });
    setCollapsed((prev) => {
      const next = new Set(prev);
      dirs.forEach((d) => { if (!next.has(d)) next.add(d); });
      return next;
    });
  }, [files]);

  const toggleDir = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-400 text-center">{error}</div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">No files</div>
    );
  }

  function renderNode(node: TreeNode, depth = 0) {
    const isCollapsed = collapsed.has(node.path);
    const isActive = activeFile === node.path;

    if (node.type === 'dir') {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleDir(node.path)}
            className={`w-full flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-gray-700/50 rounded transition-colors text-gray-300`}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
            {isCollapsed ? <Folder className="w-3.5 h-3.5 shrink-0 text-amber-400" /> : <FolderOpen className="w-3.5 h-3.5 shrink-0 text-amber-400" />}
            <span className="truncate">{node.name}</span>
          </button>
          {!isCollapsed && node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      );
    }

    return (
      <button
        key={node.path}
        onClick={() => onFileClick(node.path)}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-sm rounded transition-colors ${
          isActive
            ? 'bg-purple-600/20 text-purple-300'
            : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <File className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  const tree = buildTree(files);
  return <div className="p-2">{tree.map((node) => renderNode(node))}</div>;
}
