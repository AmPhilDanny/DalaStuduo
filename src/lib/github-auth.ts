// GitHub OAuth helpers — connect, getToken, disconnect
// Routes through the Express backend API

import { githubApi } from '@/lib/api-client';

export interface GitHubConnection {
  id: string;
  user_id: string;
  github_id: number;
  github_login: string;
  github_avatar_url: string | null;
  github_url: string | null;
  created_at: string;
}

export async function connectGitHub(code: string): Promise<GitHubConnection> {
  const res = await githubApi.connect(code);
  return res.data;
}

export async function getGitHubToken(): Promise<string | null> {
  const res = await githubApi.getToken();
  return res.data?.token ?? null;
}

export async function disconnectGitHub(): Promise<void> {
  await githubApi.disconnect();
}

export async function getGitHubConnection(): Promise<GitHubConnection | null> {
  const res = await githubApi.getConnection();
  return res.data ?? null;
}

export async function getGitHubOAuthUrl(): Promise<string> {
  const res = await githubApi.getUrl();
  if (!res.data?.url) throw new Error('Failed to get OAuth URL');
  return res.data.url;
}
