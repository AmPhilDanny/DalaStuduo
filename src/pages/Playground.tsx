import { useState, useCallback } from 'react';
import { useGitHub } from '@/hooks/useGitHub';
import { useGitHubRepo } from '@/hooks/useGitHubRepo';
import { usePlayground } from '@/hooks/usePlayground';
import { getGitHubToken } from '@/lib/github-auth';
import { getFile } from '@/lib/github';
import CodeEditor from '@/components/playground/CodeEditor';
import RepoSelector from '@/components/playground/RepoSelector';
import FileExplorer from '@/components/playground/FileExplorer';
import FileTabs from '@/components/playground/FileTabs';
import PlaygroundToolbar from '@/components/playground/PlaygroundToolbar';
import CodeRunner from '@/components/playground/CodeRunner';
import CommitDialog from '@/components/playground/CommitDialog';
import { GitHubConnect } from '@/components/git/GitHubConnect';
import { Loader2, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function Playground() {
  const { isConnected, repos, isLoading: ghLoading, connect } = useGitHub();
  const { files: repoFiles, isLoading: filesLoading, error: filesError, fetchContents, fetchFile, saveFile } = useGitHubRepo();
  const playground = usePlayground();

  const [showExplorer, setShowExplorer] = useState(true);
  const [showOutput, setShowOutput] = useState(false);
  const [commitTarget, setCommitTarget] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRepoSelect = useCallback(
    async (owner: string, repo: string) => {
      playground.setRepo(owner, repo);
      await fetchContents(owner, repo);
    },
    [playground, fetchContents],
  );

  const handleFileClick = useCallback(
    async (path: string) => {
      if (!playground.repo) return;

      const existing = playground.files.find((f) => f.path === path);
      if (existing) {
        playground.setActiveFile(path);
        return;
      }

      const file = await fetchFile(playground.repo.owner, playground.repo.repo, path);
      if (file) {
        playground.openFile(path, file.content, file.sha);
      }
    },
    [playground, fetchFile],
  );

  const handleRun = useCallback(() => {
    const file = playground.activeFile;
    if (!file) return;
    setIsRunning(true);
    setShowOutput(true);
    // Small delay to let the iframe mount
    setTimeout(() => setIsRunning(false), 100);
  }, [playground.activeFile]);

  const handleCommitClick = useCallback(() => {
    if (playground.activeFile) {
      setCommitTarget(playground.activeFile.path);
    }
  }, [playground.activeFile]);

  const handleCommit = useCallback(
    async (message: string, description?: string) => {
      if (!playground.activeFile || !playground.repo) return;

      const file = playground.activeFile;
      const fullMessage = description ? `${message}\n\n${description}` : message;

      const result = await saveFile(
        playground.repo.owner,
        playground.repo.repo,
        file.path,
        file.content,
        fullMessage,
        file.sha,
      );

      if (result?.content?.sha) {
        playground.markClean(file.path, result.content.sha);
      }
    },
    [playground, saveFile],
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Code Playground</h1>
          <p className="text-gray-400 text-sm mb-8">
            Edit files in your GitHub repositories directly from your browser. 
            Connect your GitHub account to get started.
          </p>
          <GitHubConnect onConnected={connect} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14 bg-gray-950 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800">
        <RepoSelector
          repos={repos}
          selected={playground.repo}
          onSelect={handleRepoSelect}
          isLoading={ghLoading}
        />

        <div className="flex-1" />

        <button
          onClick={() => setShowExplorer(!showExplorer)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title={showExplorer ? 'Hide explorer' : 'Show explorer'}
        >
          {showExplorer ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File explorer */}
        {showExplorer && (
          <aside className="w-56 bg-gray-900 border-r border-gray-800 overflow-y-auto shrink-0">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800">
              Files
            </div>
            <FileExplorer
              files={repoFiles}
              isLoading={filesLoading}
              error={filesError}
              onFileClick={handleFileClick}
              activeFile={playground.activePath}
            />
          </aside>
        )}

        {/* Editor + Output */}
        <div className="flex-1 flex flex-col min-w-0">
          <FileTabs
            files={playground.files}
            activePath={playground.activePath}
            onSelect={playground.setActiveFile}
            onClose={playground.closeFile}
          />

          <PlaygroundToolbar
            onRun={handleRun}
            onCommit={handleCommitClick}
            onThemeToggle={playground.toggleTheme}
            theme={playground.theme}
            hasDirtyFiles={playground.files.some((f) => f.isDirty)}
            isRunning={isRunning}
          />

          <div className={`flex-1 flex ${showOutput ? 'flex-row' : 'flex-col'}`}>
            <div className="flex-1 min-h-0">
              <CodeEditor
                file={playground.activeFile}
                theme={playground.theme}
                onContentChange={playground.updateContent}
              />
            </div>

            {showOutput && playground.activeFile && (
              <div className={`${showOutput ? 'w-1/2 border-l border-gray-700' : ''} min-h-0`}>
                <CodeRunner
                  code={playground.activeFile.content}
                  language={playground.activeFile.language}
                  onClose={() => setShowOutput(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Commit dialog */}
      <CommitDialog
        open={!!commitTarget}
        onOpenChange={(o) => { if (!o) setCommitTarget(null); }}
        onCommit={handleCommit}
        fileName={playground.activeFile?.name || ''}
      />
    </div>
  );
}
