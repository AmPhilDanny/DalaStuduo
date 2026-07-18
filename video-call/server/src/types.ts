export interface PeerInfo {
  id: string;
  displayName: string;
}

export interface Room {
  id: string;
  peers: Map<string, PeerInfo>;
}

// ── Client→Server events ──

export interface ClientToServerEvents {
  'room:join': (data: { roomId: string; peer: PeerInfo }, callback: (ack: { success: boolean; error?: string }) => void) => void;
  'room:leave': (data: { roomId: string }) => void;
  'signal:offer': (data: { roomId: string; to: string; offer: unknown }) => void;
  'signal:answer': (data: { roomId: string; to: string; answer: unknown }) => void;
  'signal:ice-candidate': (data: { roomId: string; to: string; candidate: unknown }) => void;
}

// ── Server→Client events ──

export interface ServerToClientEvents {
  'room:joined': (data: { roomId: string; peers: PeerInfo[] }) => void;
  'room:peer-joined': (data: { peer: PeerInfo }) => void;
  'room:peer-left': (data: { peerId: string }) => void;
  'signal:offer': (data: { from: string; offer: unknown }) => void;
  'signal:answer': (data: { from: string; answer: unknown }) => void;
  'signal:ice-candidate': (data: { from: string; candidate: unknown }) => void;
  'room:error': (data: { message: string }) => void;
}
