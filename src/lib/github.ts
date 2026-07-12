// ============================================================
// GitHub Contents API — list repos, read/write files
// All calls require a valid GitHub access token
// ============================================================

const GITHUB_API = 'https://api.github.com';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  private: boolean;
  owner: { login: string; avatar_url: string };
}

export interface GitHubContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size: number;
  download_url: string | null;
}

export interface GitHubFile {
  content: string;
  sha: string;
  path: string;
}

export interface CommitResponse {
  content: { sha: string; path: string };
  commit: { sha: string };
}

export class GitHubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
  }
}

async function ghFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new GitHubError(
      `GitHub API error (${res.status}): ${body || res.statusText}`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/** List repos for the authenticated user */
export async function listRepos(token: string): Promise<GitHubRepo[]> {
  return ghFetch<GitHubRepo[]>('/user/repos?per_page=100&sort=updated&type=all', token);
}

/** List contents of a directory in a repo */
export async function listContents(
  token: string,
  owner: string,
  repo: string,
  path = '',
): Promise<GitHubContent[]> {
  const p = path ? `/${path}` : '';
  return ghFetch<GitHubContent[]>(`/repos/${owner}/${repo}/contents${p}`, token);
}

/** Get a single file's content and SHA */
export async function getFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
): Promise<GitHubFile> {
  const data = await ghFetch<GitHubContent & { content: string }>(
    `/repos/${owner}/${repo}/contents/${path}`,
    token,
  );
  return {
    content: atob(data.content),
    sha: data.sha,
    path: data.path,
  };
}

/** Create or update a file. Provide sha for updates (existing file). */
export async function putFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<CommitResponse> {
  return ghFetch<CommitResponse>(`/repos/${owner}/${repo}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: btoa(content),
      sha,
    }),
  });
}

/** Get the authenticated user's GitHub profile */
export async function getGitHubUser(token: string): Promise<{
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
}> {
  return ghFetch('/user', token);
}
