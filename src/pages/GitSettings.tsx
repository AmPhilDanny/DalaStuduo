import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGitHub } from '@/hooks/useGitHub';
import { GitHubConnect } from '@/components/git/GitHubConnect';
import RepoList from '@/components/git/RepoList';
import { getGitHubConnection, disconnectGitHub } from '@/lib/github-auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Loader2, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function GitSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isConnected, connection, repos, isLoading, refresh, disconnect } = useGitHub();
  const [featuredIds, setFeaturedIds] = useState<Set<number>>(new Set());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  // Load featured repos from DB
  useEffect(() => {
    if (!user?.id || !isConnected) return;
    supabase
      .from('user_repos')
      .select('github_repo_id')
      .eq('user_id', user.id)
      .eq('is_featured', true)
      .then(({ data }) => {
        if (data) setFeaturedIds(new Set(data.map((r) => r.github_repo_id)));
      });
  }, [user?.id, isConnected]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Disconnected from GitHub');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleSyncRepos = async () => {
    if (!user?.id) return;
    setSyncing(true);
    try {
      // Upsert repos into user_repos table
      const rows = repos.map((r) => ({
        user_id: user.id,
        github_repo_id: r.id,
        repo_name: r.name,
        repo_full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        topics: r.topics,
        last_synced_at: new Date().toISOString(),
      }));

      for (const row of rows) {
        await supabase.from('user_repos').upsert(row, {
          onConflict: 'user_id,github_repo_id',
          ignoreDuplicates: false,
        });
      }
      toast.success(`Synced ${rows.length} repositories`);
      await refresh();
    } catch {
      toast.error('Failed to sync repositories');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleFeatured = async (repoId: number, featured: boolean) => {
    if (!user?.id) return;
    try {
      await supabase
        .from('user_repos')
        .update({ is_featured: featured })
        .eq('github_repo_id', repoId)
        .eq('user_id', user.id);

      setFeaturedIds((prev) => {
        const next = new Set(prev);
        if (featured) next.add(repoId);
        else next.delete(repoId);
        return next;
      });
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Github className="w-8 h-8 text-gray-900" />
          <div>
            <h1 className="text-3xl font-bold">GitHub Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your GitHub connection and repositories</p>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Github className="w-5 h-5" />
              Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </div>
            ) : isConnected && connection ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {connection.github_avatar_url && (
                    <img
                      src={connection.github_avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {connection.github_login}
                      <a
                        href={connection.github_url || `https://github.com/${connection.github_login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </p>
                    <p className="text-xs text-gray-500">Connected since {new Date(connection.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-red-500 hover:text-red-600">
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-4">Connect your GitHub account to use the Code Playground and showcase repos on your profile.</p>
                <GitHubConnect onConnected={refresh} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repositories */}
        {isConnected && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Repositories</CardTitle>
                <Button variant="outline" size="sm" onClick={handleSyncRepos} disabled={syncing}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <RepoList
                  repos={repos}
                  featuredIds={featuredIds}
                  onToggleFeatured={handleToggleFeatured}
                  showFeaturedToggle
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
