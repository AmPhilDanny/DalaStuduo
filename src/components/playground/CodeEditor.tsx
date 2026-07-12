import { useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { OpenFile } from '@/hooks/usePlayground';

interface Props {
  file: OpenFile | null;
  theme: 'vs-dark' | 'light';
  onContentChange: (path: string, content: string) => void;
}

export default function CodeEditor({ file, theme, onContentChange }: Props) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (file && value !== undefined) {
        onContentChange(file.path, value);
      }
    },
    [file, onContentChange],
  );

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Select a file from the explorer to start editing
      </div>
    );
  }

  return (
    <Editor
      key={file.path}
      height="100%"
      language={file.language}
      theme={theme}
      value={file.content}
      onChange={handleChange}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        padding: { top: 8 },
      }}
      loading={
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          Loading editor…
        </div>
      }
    />
  );
}
