import { useState, useCallback } from 'react';
import { getGitHubToken } from '@/lib/github-auth';
import {
  listContents,
  getFile,
  putFile,
  type GitHubContent,
  type GitHubFile,
} from '@/lib/github';

interface RepoState {
  files: GitHubContent[];
  isLoading: boolean;
  error: string | null;
}

export function useGitHubRepo() {
  const [state, setState] = useState<RepoState>({ files: [], isLoading: false, error: null });

  const fetchContents = useCallback(async (owner: string, repo: string, path = '') => {
    setState({ files: [], isLoading: true, error: null });
    try {
      const token = await getGitHubToken();
      if (!token) throw new Error('Not connected to GitHub');

      const files = await listContents(token, owner, repo, path);
      setState({ files, isLoading: false, error: null });
      return files;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load files';
      setState({ files: [], isLoading: false, error: msg });
      return null;
    }
  }, []);

  const fetchFile = useCallback(async (owner: string, repo: string, path: string): Promise<GitHubFile | null> => {
    try {
      const token = await getGitHubToken();
      if (!token) throw new Error('Not connected to GitHub');
      return await getFile(token, owner, repo, path);
    } catch (err) {
      return null;
    }
  }, []);

  const saveFile = useCallback(async (
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
  ) => {
    try {
      const token = await getGitHubToken();
      if (!token) throw new Error('Not connected to GitHub');
      return await putFile(token, owner, repo, path, content, message, sha);
    } catch (err) {
      throw err;
    }
  }, []);

  return { ...state, fetchContents, fetchFile, saveFile };
}
