import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { PeerInfo, PeerConnection, ConnectionState, RoomInfo, ClientToServerEvents, ServerToClientEvents } from '../types/index';

const SIGNALING_SERVER = ''; // empty = same origin (Vite proxy)
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remotePeers: PeerConnection[];
  connectionState: ConnectionState;
  toggleMic: () => void;
  toggleCamera: () => void;
  endCall: () => void;
  screenShare: () => void;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
}

export function useWebRTC(roomId: string, displayName: string): UseWebRTCReturn {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pcRefs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<PeerConnection[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('new');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Get local media
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error('Failed to get local media:', err);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Connect to signaling server
  useEffect(() => {
    if (!roomId || !displayName) return;

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SIGNALING_SERVER, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const peer: PeerInfo = { id: socket.id || crypto.randomUUID(), displayName };

    socket.on('connect', () => {
      peer.id = socket.id || peer.id;
      socket.emit('room:join', { roomId, peer }, (ack: { success: boolean; error?: string }) => {
        if (!ack.success) {
          console.error('Failed to join room:', ack.error);
        }
      });
    });

    socket.on('room:joined', (data: RoomInfo) => {
      const remoteList: PeerConnection[] = data.peers
        .filter((p: PeerInfo) => p.id !== peer.id)
        .map((p: PeerInfo) => ({
          peerId: p.id,
          displayName: p.displayName,
          connectionState: 'new' as ConnectionState,
        }));
      setRemotePeers(remoteList);
      setConnectionState('connected');
    });

    socket.on('room:peer-joined', (data: { peer: PeerInfo }) => {
      const newPeer = data.peer;
      setRemotePeers(prev => {
        if (prev.some(p => p.peerId === newPeer.id)) return prev;
        return [...prev, { peerId: newPeer.id, displayName: newPeer.displayName, connectionState: 'connecting' as ConnectionState }];
      });
      createPeerConnection(newPeer.id, true, socket, peer.id, roomId);
    });

    socket.on('room:peer-left', (data: { peerId: string }) => {
      closePeerConnection(data.peerId);
      setRemotePeers(prev => prev.filter(p => p.peerId !== data.peerId));
    });

    socket.on('signal:offer', (data: { from: string; offer: unknown }) => {
      createPeerConnection(data.from, false, socket, peer.id, roomId).then(pc => {
        pc.setRemoteDescription(new RTCSessionDescription(data.offer as RTCSessionDescriptionInit)).then(() => {
          return pc.createAnswer();
        }).then(answer => {
          return pc.setLocalDescription(answer);
        }).then(() => {
          socket.emit('signal:answer', { roomId, to: data.from, answer: pc.localDescription });
          // Flush pending candidates
          const cands = pendingCandidates.current.get(data.from) || [];
          cands.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)));
          pendingCandidates.current.delete(data.from);
        }).catch(err => {
          console.error('Error handling offer:', err);
        });
      });
    });

    socket.on('signal:answer', (data: { from: string; answer: unknown }) => {
      const pc = pcRefs.current.get(data.from);
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer as RTCSessionDescriptionInit)).catch(err => {
          console.error('Error setting remote answer:', err);
        });
      }
    });

    socket.on('signal:ice-candidate', (data: { from: string; candidate: unknown }) => {
      const pc = pcRefs.current.get(data.from);
      if (pc && pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate as RTCIceCandidateInit)).catch(err => {
          console.error('Error adding ICE candidate:', err);
        });
      } else {
        // Queue candidate if remote description not set yet
        const cands = pendingCandidates.current.get(data.from) || [];
        cands.push(data.candidate as RTCIceCandidateInit);
        pendingCandidates.current.set(data.from, cands);
      }
    });

    socket.on('room:error', (data: { message: string }) => {
      console.error('Room error:', data.message);
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, displayName]);

  async function createPeerConnection(
    peerId: string,
    initiator: boolean,
    socket: Socket<ServerToClientEvents, ClientToServerEvents>,
    localPeerId: string,
    roomId: string,
  ): Promise<RTCPeerConnection> {
    const existing = pcRefs.current.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRefs.current.set(peerId, pc);

    // Add local tracks
    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal:ice-candidate', { roomId, to: peerId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState as ConnectionState;
      setRemotePeers(prev =>
        prev.map(p => (p.peerId === peerId ? { ...p, connectionState: state } : p)),
      );
      if (state === 'failed' || state === 'disconnected') {
        closePeerConnection(peerId);
      }
    };

    pc.ontrack = (event) => {
      setRemotePeers(prev =>
        prev.map(p => (p.peerId === peerId ? { ...p, stream: event.streams[0] } : p)),
      );
    };

    if (initiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('signal:offer', { roomId, to: peerId, offer });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    }

    return pc;
  }

  function closePeerConnection(peerId: string) {
    const pc = pcRefs.current.get(peerId);
    if (pc) {
      pc.close();
      pcRefs.current.delete(peerId);
    }
    pendingCandidates.current.delete(peerId);
  }

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
        screenStream.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      // Re-add camera track
      const localStream = localStreamRef.current;
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          pcRefs.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack);
          });
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        pcRefs.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => {
          screenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share failed:', err);
      }
    }
  }, [isScreenSharing]);

  const endCall = useCallback(() => {
    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    // Close all peer connections
    pcRefs.current.forEach(pc => pc.close());
    pcRefs.current.clear();
    // Leave room
    if (socketRef.current) {
      socketRef.current.emit('room:leave', { roomId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setLocalStream(null);
    setRemotePeers([]);
    setConnectionState('closed');
  }, [roomId]);

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
