interface MeetingControlsProps {
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onScreenShare: () => void;
  onEndCall: () => void;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  roomId: string;
}

function ControlButton({
  onClick,
  active,
  activeColor,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  activeColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-3 rounded-full transition-all duration-200 ${
        active
          ? `${activeColor} hover:opacity-80`
          : 'bg-gray-700 hover:bg-gray-600 text-red-400'
      }`}
    >
      {children}
    </button>
  );
}

export function MeetingControls({
  onToggleMic,
  onToggleCamera,
  onScreenShare,
  onEndCall,
  isMicOn,
  isCameraOn,
  isScreenSharing,
  roomId,
}: MeetingControlsProps) {
  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-gray-900/90 backdrop-blur px-6 py-4 rounded-2xl">
      {/* Mic */}
      <ControlButton
        onClick={onToggleMic}
        active={isMicOn}
        activeColor="bg-gray-600"
        label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isMicOn ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        )}
      </ControlButton>

      {/* Camera */}
      <ControlButton
        onClick={onToggleCamera}
        active={isCameraOn}
        activeColor="bg-gray-600"
        label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {isCameraOn ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        )}
      </ControlButton>

      {/* Screen Share */}
      <ControlButton
        onClick={onScreenShare}
        active={!isScreenSharing}
        activeColor="bg-gray-600"
        label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </ControlButton>

      {/* Copy Invite Link */}
      <button
        onClick={copyInviteLink}
        title="Copy invite link"
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-200"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>

      {/* End Call */}
      <button
        onClick={onEndCall}
        title="End call"
        className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-all duration-200"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </button>
    </div>
  );
}
