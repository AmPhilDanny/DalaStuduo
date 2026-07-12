import { useState, useRef, useEffect } from 'react';
import { Loader2, X, Play } from 'lucide-react';

interface Props {
  code: string;
  language: string;
  onClose: () => void;
}

function isRunnable(lang: string): boolean {
  return ['javascript', 'html', 'typescript'].includes(lang);
}

function buildHtml(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>
<script>${code}<\/script>
</body>
</html>`;
}

export default function CodeRunner({ code, language, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      let html = '';
      if (language === 'html') {
        html = code;
      } else if (language === 'javascript' || language === 'typescript') {
        html = buildHtml(code);
      } else {
        setError(`Cannot run ${language} files`);
        setIsLoading(false);
        return;
      }

      iframe.srcdoc = html;
      setIsLoading(false);
    } catch {
      setError('Failed to execute code');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (code.trim()) run();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-medium text-gray-600">Output</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          </div>
        )}

        {error ? (
          <div className="p-4 text-sm text-red-500">{error}</div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            title="Code Output"
          />
        )}

        {!code.trim() && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            Run some code to see output here
          </div>
        )}
      </div>
    </div>
  );
}
