import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMediasoupRoom } from "@/components/video-call/useMediasoupRoom";
import { VideoPlayer } from "@/components/video-call/VideoPlayer";
import { MeetingControls } from "@/components/video-call/MeetingControls";
import { ConnectionStatus } from "@/components/video-call/ConnectionStatus";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VideoRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [displayName, setDisplayName] = useState((location.state as any)?.displayName || "");
  const [showLobby, setShowLobby] = useState(!((location.state as any)?.displayName));

  const roomType = (location.state as any)?.roomType || "OPEN";

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
  } = useMediasoupRoom(roomId || "", displayName, roomType as "P2P" | "GROUP" | "OPEN");

  const handleEndCall = () => {
    endCall();
    navigate("/");
  };

  if (showLobby || !displayName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join Video Room</CardTitle>
            <CardDescription className="break-all">
              Room: <span className="font-mono text-foreground">{roomId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (displayName.trim()) {
                  setShowLobby(false);
                }
              }}
            >
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="mb-4"
                autoFocus
                required
              />
              <Button type="submit" className="w-full">
                Join Room
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50">
        <span className="text-sm text-muted-foreground">
          Room: <span className="text-foreground font-mono">{roomId}</span>
        </span>
        <div className="flex items-center gap-4">
          <ConnectionStatus
            displayName={`${displayName} (You)`}
            connectionState={connectionState}
          />
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
        <div
          className="grid gap-4 h-full"
          style={{
            gridTemplateColumns: `repeat(${Math.min(remotePeers.length + 1, 3)}, 1fr)`,
            gridTemplateRows: `repeat(${Math.ceil((remotePeers.length + 1) / 3)}, auto)`,
          }}
        >
          <VideoPlayer
            stream={localStream}
            muted
            mirrored
            displayName={`${displayName} (You)`}
          />
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
          onEndCall={handleEndCall}
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          isScreenSharing={isScreenSharing}
          roomId={roomId || ""}
        />
      </div>
    </div>
  );
}
