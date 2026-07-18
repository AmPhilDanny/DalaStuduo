import { Router, Request, Response } from 'express';
import type { Server, Socket } from 'socket.io';
import { adminClient } from '../../lib/supabase-admin.js';
import { requireAdmin } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';

// ── Types ──

interface PeerInfo {
  id: string;
  displayName: string;
}

interface RoomMeta {
  id: string;
  createdAt: string;
  peerCount: number;
  peers: { id: string; displayName: string }[];
}

interface Room {
  id: string;
  createdAt: string;
  peers: Map<string, PeerInfo>;
}

interface ClientToServerEvents {
  'room:join': (data: { roomId: string; peer: PeerInfo }, callback: (ack: { success: boolean; error?: string }) => void) => void;
  'room:leave': (data: { roomId: string }) => void;
  'signal:offer': (data: { roomId: string; to: string; offer: unknown }) => void;
  'signal:answer': (data: { roomId: string; to: string; answer: unknown }) => void;
  'signal:ice-candidate': (data: { roomId: string; to: string; candidate: unknown }) => void;
}

interface ServerToClientEvents {
  'room:joined': (data: { roomId: string; peers: PeerInfo[] }) => void;
  'room:peer-joined': (data: { peer: PeerInfo }) => void;
  'room:peer-left': (data: { peerId: string }) => void;
  'signal:offer': (data: { from: string; offer: unknown }) => void;
  'signal:answer': (data: { from: string; answer: unknown }) => void;
  'signal:ice-candidate': (data: { from: string; candidate: unknown }) => void;
  'room:error': (data: { message: string }) => void;
  'room:force-ended': (data: { reason: string }) => void;
}

// ── In-memory room store ──

const rooms = new Map<string, Room>();

function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

function createRoom(roomId: string): Room {
  const room: Room = { id: roomId, createdAt: new Date().toISOString(), peers: new Map() };
  rooms.set(roomId, room);
  return room;
}

function removePeerFromAllRooms(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
  const peerInfo = socket.data.peer as PeerInfo | undefined;
  if (!peerInfo) return;

  for (const [roomId, room] of rooms) {
    if (room.peers.has(peerInfo.id)) {
      room.peers.delete(peerInfo.id);
      socket.leave(roomId);
      socket.to(roomId).emit('room:peer-left', { peerId: peerInfo.id });
      if (room.peers.size === 0) {
        rooms.delete(roomId);
      }
    }
  }
}

function forceEndRoom(roomId: string, io: Server, reason: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  // Emit force-ended to all sockets in the room
  io.to(roomId).emit('room:force-ended', { reason });
  // Disconnect each socket from the room
  const sockets = io.sockets.adapter.rooms.get(roomId);
  if (sockets) {
    for (const socketId of sockets) {
      const sock = io.sockets.sockets.get(socketId);
      if (sock) {
        sock.leave(roomId);
      }
    }
  }
  rooms.delete(roomId);
}

// ── Express Router (admin endpoints) ──

export const videoCallRouter: Router = Router();

videoCallRouter.use(requireAdmin);

/** GET /video-call/admin/rooms — list active rooms with peer info */
videoCallRouter.get('/admin/rooms', (_req: Request, res: Response) => {
  const roomList: RoomMeta[] = [];
  for (const [, room] of rooms) {
    roomList.push({
      id: room.id,
      createdAt: room.createdAt,
      peerCount: room.peers.size,
      peers: Array.from(room.peers.values()),
    });
  }
  res.json({ data: roomList });
});

/** GET /video-call/admin/rooms/:roomId — single room detail */
videoCallRouter.get('/admin/rooms/:roomId', (req: Request, res: Response) => {
  const room = rooms.get(req.params.roomId);
  if (!room) throw new AppError(404, 'Room not found');
  res.json({
    data: {
      id: room.id,
      createdAt: room.createdAt,
      peerCount: room.peers.size,
      peers: Array.from(room.peers.values()),
    },
  });
});

/**
 * POST /video-call/admin/rooms/:roomId/end — force-end a room.
 * The actual force-end logic runs after response is sent via a stored io reference.
 */
videoCallRouter.post('/admin/rooms/:roomId/end', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) throw new AppError(404, 'Room not found');
  const reason = (req.body?.reason as string) || 'Ended by admin';
  // io reference is set by setupVideoCallSignaling
  if ((videoCallRouter as any).__io) {
    forceEndRoom(roomId, (videoCallRouter as any).__io, reason);
  }
  res.json({ data: { id: roomId, status: 'ended', reason } });
});

// ── Socket.IO Signaling Setup ──

export function setupVideoCallSignaling(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void {
  // Store io reference on the router for admin endpoints
  (videoCallRouter as any).__io = io;

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    socket.on('room:join', ({ roomId, peer }, callback) => {
      try {
        // Check if room is force-ended
        const roomExists = rooms.has(roomId);

        let room = getRoom(roomId);
        if (!room) {
          room = createRoom(roomId);
        }

        if (room.peers.size >= 4) {
          callback({ success: false, error: 'Room is full (max 4 participants)' });
          return;
        }

        socket.data.peer = peer;
        socket.join(roomId);
        room.peers.set(peer.id, peer);

        const peers = Array.from(room.peers.values());
        callback({ success: true });
        socket.emit('room:joined', { roomId, peers });
        socket.to(roomId).emit('room:peer-joined', { peer });
      } catch {
        callback({ success: false, error: 'Internal server error' });
      }
    });

    socket.on('room:leave', ({ roomId }) => {
      const peerInfo = socket.data.peer as PeerInfo | undefined;
      if (!peerInfo) return;

      const room = getRoom(roomId);
      if (!room) return;

      room.peers.delete(peerInfo.id);
      socket.leave(roomId);
      socket.to(roomId).emit('room:peer-left', { peerId: peerInfo.id });

      if (room.peers.size === 0) {
        rooms.delete(roomId);
      }
    });

    socket.on('signal:offer', ({ roomId: _roomId, to, offer }) => {
      socket.to(to).emit('signal:offer', { from: socket.id, offer });
    });

    socket.on('signal:answer', ({ roomId: _roomId, to, answer }) => {
      socket.to(to).emit('signal:answer', { from: socket.id, answer });
    });

    socket.on('signal:ice-candidate', ({ roomId: _roomId, to, candidate }) => {
      socket.to(to).emit('signal:ice-candidate', { from: socket.id, candidate });
    });

    socket.on('disconnect', () => {
      removePeerFromAllRooms(socket);
    });
  });
}
