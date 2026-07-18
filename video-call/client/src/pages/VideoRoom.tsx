import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoPlayer } from '../components/VideoPlayer';
import { MeetingControls } from '../components/MeetingControls';
import { ConnectionStatus } from '../components/ConnectionStatus';

export function VideoRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [displayName, setDisplayName] = useState('');
  const [showLobby, setShowLobby] = useState(true);

  const {
    localStream,
    remotePeers,
    connectionState,
    toggleMic,
    toggleCamera,
    endCall,
    screenShare,
    isMicOn,
    isCameraOn,
    isScreenSharing,
  } = useWebRTC(roomId || '', displayName);

  if (showLobby || !displayName) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md mx-4 border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Join Video Room</h1>
          <p className="text-gray-400 text-sm mb-6 text-center break-all">
            Room: <span className="text-gray-300 font-mono">{roomId}</span>
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (displayName.trim()) {
                setShowLobby(false);
              }
            }}
          >
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/50 border-b border-gray-800">
        <span className="text-sm text-gray-400">
          Room: <span className="text-gray-300 font-mono">{roomId}</span>
        </span>
        <div className="flex items-center gap-4">
          {remotePeers.map((peer) => (
            <ConnectionStatus
              key={peer.peerId}
              displayName={peer.displayName}
              connectionState={peer.connectionState}
            />
          ))}
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4 h-full"
          style={{
            gridTemplateColumns: `repeat(${Math.min(remotePeers.length + 1, 3)}, 1fr)`,
            gridTemplateRows: `repeat(${Math.ceil((remotePeers.length + 1) / 3)}, auto)`,
          }}
        >
          {/* Local video */}
          <VideoPlayer
            stream={localStream}
            muted
            mirrored
            displayName={`${displayName} (You)`}
          />

          {/* Remote peers */}
          {remotePeers.map((peer) => (
            <VideoPlayer
              key={peer.peerId}
              stream={peer.stream || null}
              displayName={peer.displayName}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center pb-6 pt-2">
        <MeetingControls
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onScreenShare={screenShare}
          onEndCall={endCall}
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          isScreenSharing={isScreenSharing}
          roomId={roomId || ''}
        />
      </div>
    </div>
  );
}
