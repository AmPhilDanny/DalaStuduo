import type { ConnectionState } from '../types/index';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  displayName: string;
}

const stateConfig: Record<ConnectionState, { color: string; label: string }> = {
  new: { color: 'bg-gray-500', label: 'Connecting...' },
  connecting: { color: 'bg-yellow-400', label: 'Connecting...' },
  connected: { color: 'bg-green-400', label: 'Connected' },
  disconnected: { color: 'bg-yellow-400', label: 'Reconnecting' },
  failed: { color: 'bg-red-400', label: 'Failed' },
  closed: { color: 'bg-gray-400', label: 'Closed' },
};

export function ConnectionStatus({ connectionState, displayName }: ConnectionStatusProps) {
  const config = stateConfig[connectionState];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="truncate max-w-[120px]">{displayName}</span>
      <span className={`inline-block w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-gray-400 text-xs">{config.label}</span>
    </div>
  );
}
