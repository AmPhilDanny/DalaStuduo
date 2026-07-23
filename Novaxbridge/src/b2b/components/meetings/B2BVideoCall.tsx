import { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useMediasoupCall } from '../../hooks/useMediasoupCall';
import type { RemoteTrackEvent, Participant } from '@/lib/mediasoup-client';

interface B2BVideoCallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  userName: string;
  meetingTitle?: string;
}

export default function B2BVideoCall({ open, onOpenChange, roomName, userName, meetingTitle }: B2BVideoCallProps) {
  const [userId, setUserId] = useState<string>('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Grab current user ID on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || '');
    });
  }, []);

  const callOptions = open && userId
    ? { roomId: roomName, roomType: 'GROUP' as const, userId, displayName: userName }
    : null;

  const {
    connected,
    participants,
    localStream,
    remoteStreams,
    error,
    leaveCall,
    toggleMute,
  } = useMediasoupCall(callOptions);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote streams
  useEffect(() => {
    remoteStreams.forEach((event, consumerId) => {
      const el = remoteVideoRefs.current.get(consumerId);
      if (el) el.srcObject = new MediaStream([event.track]);
    });
  }, [remoteStreams]);

  const handleToggleAudio = useCallback(async () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioMuted(!track.enabled);
    }
  }, [localStream]);

  const handleToggleVideo = useCallback(async () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoMuted(!track.enabled);
    }
  }, [localStream]);

  const handleHangup = useCallback(() => {
    leaveCall();
    onOpenChange(false);
  }, [leaveCall, onOpenChange]);

  const getAvatarLetter = (name: string) => name.charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) {
        leaveCall();
      }
      onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] h-[90vh] max-h-[700px] p-0 gap-0 overflow-hidden">
        <div className="relative w-full h-full flex flex-col bg-black">
          {/* Connection status banner */}
          {!connected && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/60 mx-auto mb-3" />
                <p className="text-white/60 text-sm">Connecting to call...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
              <div className="text-center max-w-sm px-4">
                <p className="text-red-400 text-sm mb-2">Connection failed</p>
                <p className="text-white/50 text-xs mb-4">{error}</p>
                <Button size="sm" variant="outline" onClick={handleHangup} className="text-white border-white/20">
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Video grid */}
          <div className="flex-1 relative min-h-0 p-2">
            <div className="grid gap-2 h-full" style={{
              gridTemplateColumns: `repeat(${Math.min(remoteStreams.size + 1, 3)}, 1fr)`,
            }}>
              {/* Local video */}
              <div className="relative bg-zinc-900 rounded-lg overflow-hidden aspect-video">
                {localStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-zinc-400">{getAvatarLetter(userName)}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                  <span className="text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded truncate max-w-[70%]">
                    {userName} (You)
                  </span>
                  {isAudioMuted && <MicOff className="w-3 h-3 text-red-400" />}
                </div>
              </div>

              {/* Remote videos */}
              {Array.from(remoteStreams.entries()).map(([consumerId, event]) => (
                <div key={consumerId} className="relative bg-zinc-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={(el) => {
                      if (el) remoteVideoRefs.current.set(consumerId, el);
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 right-1">
                    <span className="text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded truncate block max-w-[90%]">
                      {event.userId}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Waiting overlay when alone */}
            {connected && remoteStreams.size === 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="text-white/50 text-xs bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  {meetingTitle ? `${meetingTitle} — ` : ''}Waiting for others to join...
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 p-4 bg-black/80">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleAudio}
              className={`rounded-full w-12 h-12 ${
                isAudioMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleVideo}
              className={`rounded-full w-12 h-12 ${
                isVideoMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHangup}
              className="rounded-full w-12 h-12 bg-red-500 text-white hover:bg-red-600"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
