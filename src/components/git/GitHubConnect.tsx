import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github, Loader2 } from 'lucide-react';

interface Props {
  onConnected?: () => void;
  variant?: 'default' | 'compact';
}

export function GitHubConnect({ onConnected, variant = 'default' }: Props) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Open OAuth URL from edge function
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.functions.invoke('github-oauth', {
        body: { action: 'get_url' },
      });

      if (!data?.url) throw new Error('Failed to get OAuth URL');

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      const popup = window.open(
        data.url,
        'github-oauth',
        `width=${width},height=${height},left=${left},top=${top},popup=1`,
      );

      if (!popup) {
        // Popup blocked — redirect
        window.location.href = data.url;
        return;
      }

      // Poll for popup close then refresh
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          setIsConnecting(false);
          onConnected?.();
        }
      }, 1000);
    } catch (err) {
      setIsConnecting(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
      >
        {isConnecting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Github className="w-3.5 h-3.5" />
        )}
        Connect GitHub
      </button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
      size="lg"
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Github className="w-4 h-4 mr-2" />
      )}
      Connect GitHub Account
    </Button>
  );
}
