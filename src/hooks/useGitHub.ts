import { useState, useEffect, useCallback } from 'react';
import {
  getGitHubConnection,
  getGitHubToken,
  disconnectGitHub,
  getGitHubOAuthUrl,
  type GitHubConnection,
} from '@/lib/github-auth';
import { listRepos, type GitHubRepo } from '@/lib/github';

interface GitHubState {
  isConnected: boolean;
  connection: GitHubConnection | null;
  repos: GitHubRepo[];
  isLoading: boolean;
  error: string | null;
}

export function useGitHub() {
  const [state, setState] = useState<GitHubState>({
    isConnected: false,
    connection: null,
    repos: [],
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const connection = await getGitHubConnection();
      if (!connection) {
        setState({ isConnected: false, connection: null, repos: [], isLoading: false, error: null });
        return;
      }

      const token = await getGitHubToken();
      if (!token) {
        setState({ isConnected: false, connection: null, repos: [], isLoading: false, error: null });
        return;
      }

      const repos = await listRepos(token);
      setState({ isConnected: true, connection, repos, isLoading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: err instanceof Error ? err.message : 'Failed to load GitHub data' }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const connect = useCallback(async () => {
    try {
      const url = await getGitHubOAuthUrl();
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      const popup = window.open(
        url,
        'github-oauth',
        `width=${width},height=${height},left=${left},top=${top},popup=1`,
      );

      if (!popup) {
        // Popup blocked — redirect fallback
        window.location.href = url;
        return;
      }

      // Poll for the OAuth result via a broadcast channel or check connection
      const checkInterval = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkInterval);
          await refresh();
        }
      }, 1000);
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const disconnect = useCallback(async () => {
    await disconnectGitHub();
    setState({ isConnected: false, connection: null, repos: [], isLoading: false, error: null });
  }, []);

  return { ...state, connect, disconnect, refresh };
}
