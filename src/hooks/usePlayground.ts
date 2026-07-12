import { useState, useCallback, useEffect } from 'react';

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  sha?: string;
  language: string;
  isDirty: boolean;
}

const STORAGE_KEY = 'playground_drafts';

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
    html: 'html', css: 'css', json: 'json', md: 'markdown',
    py: 'python', rs: 'rust', go: 'go', java: 'java',
    yaml: 'yaml', yml: 'yaml', xml: 'xml', sql: 'sql',
  };
  return map[ext || ''] || 'plaintext';
}

function loadDrafts(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveDraft(path: string, content: string) {
  const drafts = loadDrafts();
  drafts[path] = content;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

function removeDraft(path: string) {
  const drafts = loadDrafts();
  delete drafts[path];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

interface PlaygroundState {
  files: OpenFile[];
  activePath: string | null;
  theme: 'vs-dark' | 'light';
  repo: { owner: string; repo: string } | null;
  hasDrafts: boolean;
}

export function usePlayground() {
  const [state, setState] = useState<PlaygroundState>({
    files: [],
    activePath: null,
    theme: 'vs-dark',
    repo: null,
    hasDrafts: false,
  });

  useEffect(() => {
    const drafts = loadDrafts();
    setState((s) => ({ ...s, hasDrafts: Object.keys(drafts).length > 0 }));
  }, []);

  const setActiveFile = useCallback((path: string) => {
    setState((s) => ({ ...s, activePath: path }));
  }, []);

  const openFile = useCallback((path: string, content: string, sha?: string) => {
    const name = path.split('/').pop() || path;
    const drafts = loadDrafts();
    const draftContent = drafts[path];

    setState((s) => {
      const existing = s.files.find((f) => f.path === path);
      if (existing) return { ...s, activePath: path };

      const file: OpenFile = {
        path,
        name,
        content: draftContent || content,
        originalContent: content,
        sha,
        language: getLanguage(path),
        isDirty: !!draftContent,
      };

      return { ...s, files: [...s.files, file], activePath: path };
    });
  }, []);

  const closeFile = useCallback((path: string) => {
    setState((s) => {
      const remaining = s.files.filter((f) => f.path !== path);
      let nextActive = s.activePath;
      if (s.activePath === path) {
        nextActive = remaining.length > 0 ? remaining[remaining.length - 1].path : null;
      }
      return { ...s, files: remaining, activePath: nextActive };
    });
    removeDraft(path);
  }, []);

  const updateContent = useCallback((path: string, content: string) => {
    setState((s) => {
      const files = s.files.map((f) =>
        f.path === path
          ? { ...f, content, isDirty: content !== f.originalContent }
          : f,
      );
      return { ...s, files };
    });
    saveDraft(path, content);
    setState((s) => ({ ...s, hasDrafts: true }));
  }, []);

  const markClean = useCallback((path: string, newSha: string) => {
    setState((s) => {
      const files = s.files.map((f) =>
        f.path === path
          ? { ...f, originalContent: f.content, sha: newSha, isDirty: false }
          : f,
      );
      return { ...s, files };
    });
    removeDraft(path);
    const drafts = loadDrafts();
    setState((s) => ({ ...s, hasDrafts: Object.keys(drafts).length > 0 }));
  }, []);

  const setRepo = useCallback((owner: string, repo: string) => {
    setState((s) => ({ ...s, repo: { owner, repo }, files: [], activePath: null }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((s) => ({ ...s, theme: s.theme === 'vs-dark' ? 'light' : 'vs-dark' }));
  }, []);

  const activeFile = state.activePath
    ? state.files.find((f) => f.path === state.activePath) || null
    : null;

  return {
    ...state,
    activeFile,
    setActiveFile,
    openFile,
    closeFile,
    updateContent,
    markClean,
    setRepo,
    toggleTheme,
  };
}
