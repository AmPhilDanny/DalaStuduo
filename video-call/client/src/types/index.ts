export interface PeerInfo {
  id: string;
  displayName: string;
}

export interface RoomInfo {
  roomId: string;
  peers: PeerInfo[];
}

// ── Connection state ──

export type ConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export type MediaState = 'on' | 'off' | 'muted';

export interface PeerConnection {
  peerId: string;
  displayName: string;
  connectionState: ConnectionState;
  stream?: MediaStream;
}

// ── Socket event payloads (client-side) ──

export interface ServerToClientEvents {
  'room:joined': (data: RoomInfo) => void;
  'room:peer-joined': (data: { peer: PeerInfo }) => void;
  'room:peer-left': (data: { peerId: string }) => void;
  'signal:offer': (data: { from: string; offer: unknown }) => void;
  'signal:answer': (data: { from: string; answer: unknown }) => void;
  'signal:ice-candidate': (data: { from: string; candidate: unknown }) => void;
  'room:error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'room:join': (
    data: { roomId: string; peer: PeerInfo },
    callback: (ack: { success: boolean; error?: string }) => void,
  ) => void;
  'room:leave': (data: { roomId: string }) => void;
  'signal:offer': (data: { roomId: string; to: string; offer: unknown }) => void;
  'signal:answer': (data: { roomId: string; to: string; answer: unknown }) => void;
  'signal:ice-candidate': (data: { roomId: string; to: string; candidate: unknown }) => void;
}
