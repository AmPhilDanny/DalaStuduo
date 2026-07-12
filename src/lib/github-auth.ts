// ============================================================
// GitHub OAuth helpers — connect, getToken, disconnect
// Token is stored in the `github_connections` Supabase table
// ============================================================

import { supabase } from '@/integrations/supabase/client';

export interface GitHubConnection {
  id: string;
  user_id: string;
  github_id: number;
  github_login: string;
  github_avatar_url: string | null;
  github_url: string | null;
  created_at: string;
}

/**
 * Exchange a GitHub OAuth code for an access token via a Supabase edge function,
 * then store it encrypted in github_connections.
 */
export async function connectGitHub(code: string): Promise<GitHubConnection> {
  const { data, error } = await supabase.functions.invoke('github-oauth', {
    body: { action: 'connect', code },
  });

  if (error) throw new Error(error.message);
  return data.connection;
}

/** Retrieve the current user's GitHub access token (decrypted server-side) */
export async function getGitHubToken(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('github-oauth', {
    body: { action: 'get_token' },
  });

  if (error || !data?.token) return null;
  return data.token;
}

/** Disconnect GitHub — removes token and connection record */
export async function disconnectGitHub(): Promise<void> {
  const { error } = await supabase.functions.invoke('github-oauth', {
    body: { action: 'disconnect' },
  });

  if (error) throw new Error(error.message);
}

/** Get the current user's GitHub connection metadata (no token) */
export async function getGitHubConnection(): Promise<GitHubConnection | null> {
  const { data, error } = await supabase
    .from('github_connections')
    .select('id, user_id, github_id, github_login, github_avatar_url, github_url, created_at')
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/** Get the GitHub OAuth URL from the edge function to initiate the flow */
export async function getGitHubOAuthUrl(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('github-oauth', {
    body: { action: 'get_url' },
  });

  if (error || !data?.url) throw new Error(error.message || 'Failed to get OAuth URL');
  return data.url;
}
