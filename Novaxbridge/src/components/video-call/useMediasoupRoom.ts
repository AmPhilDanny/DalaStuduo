import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createMediasoupCall, MediasoupCall, RemoteTrackEvent, Participant } from '@/lib/mediasoup-client';

type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

interface PeerConnection {
  peerId: string;
  displayName: string;
  connectionState: ConnectionState;
  stream?: MediaStream;
}

interface UseMediasoupRoomReturn {
  localStream: MediaStream | null;
  remotePeers: PeerConnection[];
  connectionState: ConnectionState;
  toggleMic: () => void;
  toggleCamera: () => void;
  endCall: () => void;
  screenShare: () => Promise<void>;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
}

export function useMediasoupRoom(roomId: string, displayName: string, roomType: 'P2P' | 'GROUP' | 'OPEN' = 'OPEN'): UseMediasoupRoomReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<PeerConnection[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('new');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const callRef = useRef<MediasoupCall | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoProducerRef = useRef<any>(null);
  const audioProducerRef = useRef<any>(null);

  // Get local media
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch {
        // Permission denied or no camera — proceed without local video
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Join mediasoup room
  useEffect(() => {
    if (!roomId || !displayName) return;
    let cancelled = false;

    async function join() {
      try {
        setConnectionState('connecting');

        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || crypto.randomUUID();

        const call = await createMediasoupCall({
          roomId,
          roomType,
          userId,
          displayName,
          getToken: async () => session?.access_token || null,
        });

        if (cancelled) {
          call.leave();
          return;
        }

        callRef.current = call;

        // Create transports
        await call.createSendTransport();
        await call.createRecvTransport();

        // Produce local tracks if available
        const stream = localStreamRef.current;
        if (stream) {
          const audioTrack = stream.getAudioTracks()[0];
          const videoTrack = stream.getVideoTracks()[0];
          if (audioTrack) audioProducerRef.current = await call.produceTrack(audioTrack);
          if (videoTrack) videoProducerRef.current = await call.produceTrack(videoTrack);
        }

        setConnectionState('connected');

        // Build initial peer list — treat every participant (except self) as remote
        const others = call.participants
          .filter((p) => p.userId !== userId)
          .map((p) => ({
            peerId: p.userId,
            displayName: p.displayName,
            connectionState: 'connected' as ConnectionState,
          }));
        setRemotePeers(others);

        // Watch for new remote tracks → convert into peer streams
        call.onRemoteTrack((event: RemoteTrackEvent) => {
          setRemotePeers((prev) => {
            const existing = prev.find((p) => p.peerId === event.userId);
            if (existing) {
              // Append track to existing peer stream
              const stream = existing.stream || new MediaStream();
              if (!existing.stream) {
                stream.addTrack(event.track);
                return prev.map((p) =>
                  p.peerId === event.userId ? { ...p, stream } : p
                );
              }
              // Avoid duplicate tracks of same kind
              const trackKind = event.track.kind;
              const hasKind = stream.getTracks().some((t) => t.kind === trackKind);
              if (!hasKind) stream.addTrack(event.track);
              return prev.map((p) =>
                p.peerId === event.userId ? { ...p, stream } : p
              );
            }
            // New peer from remote track
            const stream = new MediaStream([event.track]);
            return [
              ...prev,
              {
                peerId: event.userId,
                displayName: event.userId,
                connectionState: 'connected' as ConnectionState,
                stream,
              },
            ];
          });
        });

        // Track participant changes
        call.onParticipantsChange((participants: Participant[]) => {
          setRemotePeers(
            participants
              .filter((p) => p.userId !== userId)
              .map((p) => {
                const existing = remotePeers.find((r) => r.peerId === p.userId);
                return {
                  peerId: p.userId,
                  displayName: p.displayName,
                  connectionState: (existing?.connectionState || 'connected') as ConnectionState,
                  stream: existing?.stream,
                };
              })
          );
        });

      } catch (err) {
        console.error('Failed to join mediasoup room:', err);
        if (!cancelled) setConnectionState('failed');
      }
    }

    join();

    return () => {
      cancelled = true;
    };
  }, [roomId, displayName, roomType]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }, []);

  const screenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share - restore camera
      const screenStream = screenStreamRef.current;
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      // Replace video track with camera
      const localStream = localStreamRef.current;
      const call = callRef.current;
      if (localStream && call && videoProducerRef.current) {
        const cameraTrack = localStream.getVideoTracks()[0];
        if (cameraTrack) {
          await call.closeProducer(videoProducerRef.current);
          videoProducerRef.current = await call.produceTrack(cameraTrack);
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        const call = callRef.current;
        if (call && videoProducerRef.current) {
          await call.closeProducer(videoProducerRef.current);
          videoProducerRef.current = await call.produceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          screenShare();
        };
        setIsScreenSharing(true);
      } catch {
        // User cancelled screen share
      }
    }
  }, [isScreenSharing]);

  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    callRef.current?.leave();
    callRef.current = null;
    setLocalStream(null);
    setRemotePeers([]);
    setConnectionState('closed');
    setIsMicOn(true);
    setIsCameraOn(true);
  }, []);

  return {
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
  };
}
