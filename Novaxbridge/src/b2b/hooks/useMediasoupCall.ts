import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createMediasoupCall, MediasoupCall, RemoteTrackEvent, Participant } from '@/lib/mediasoup-client';

interface UseMediasoupCallOptions {
  roomId: string;
  roomType: 'P2P' | 'GROUP' | 'OPEN';
  userId: string;
  displayName: string;
  callerId?: string;
  calleeId?: string;
  token?: string;
  memberIds?: string[];
}

interface UseMediasoupCallState {
  connected: boolean;
  participants: Participant[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, RemoteTrackEvent>;
  error: string | null;
}

export function useMediasoupCall(options: UseMediasoupCallOptions | null) {
  const [state, setState] = useState<UseMediasoupCallState>({
    connected: false,
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    error: null,
  });

  const callRef = useRef<MediasoupCall | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const retryCount = useRef(0);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }, []);

  const joinCall = useCallback(async () => {
    if (!options) return;

    try {
      const call = await createMediasoupCall({
        ...options,
        getToken,
      });

      callRef.current = call;

      // Create send and recv transports
      await call.createSendTransport();
      await call.createRecvTransport();

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
      });

      localStreamRef.current = stream;

      // Produce audio and video tracks
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      if (audioTrack) await call.produceTrack(audioTrack);
      if (videoTrack) await call.produceTrack(videoTrack);

      setState((prev) => ({
        ...prev,
        connected: true,
        participants: call.participants,
        localStream: stream,
        error: null,
      }));

      // Listen for remote tracks
      call.onRemoteTrack((event: RemoteTrackEvent) => {
        setState((prev) => {
          const newRemote = new Map(prev.remoteStreams);
          newRemote.set(event.consumerId, event);
          return { ...prev, remoteStreams: newRemote };
        });
      });

      call.onRemoteTrackRemoved((consumerId: string) => {
        setState((prev) => {
          const newRemote = new Map(prev.remoteStreams);
          newRemote.delete(consumerId);
          return { ...prev, remoteStreams: newRemote };
        });
      });

      call.onParticipantsChange((participants: Participant[]) => {
        setState((prev) => ({ ...prev, participants }));
      });

      retryCount.current = 0;
    } catch (err: any) {
      console.error('Failed to join call:', err);
      retryCount.current++;

      if (retryCount.current <= 3) {
        setTimeout(() => joinCall(), 2000 * retryCount.current);
      } else {
        setState((prev) => ({ ...prev, error: err.message || 'Failed to join call' }));
      }
    }
  }, [options, getToken]);

  const leaveCall = useCallback(async () => {
    if (callRef.current) {
      await callRef.current.leave();
      callRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    setState({
      connected: false,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      error: null,
    });
  }, []);

  const toggleMute = useCallback(async (kind: 'audio' | 'video') => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current
      .getTracks()
      .find((t) => t.kind === kind);
    if (track) track.enabled = !track.enabled;
  }, []);

  // Auto-join when options change
  useEffect(() => {
    if (options) {
      joinCall();
    }
    return () => {
      leaveCall();
    };
  }, [options?.roomId]);

  return {
    ...state,
    leaveCall,
    toggleMute,
  };
}
