import type { Server, Socket } from 'socket.io';
import type { Room, PeerInfo, ClientToServerEvents, ServerToClientEvents } from './types.js';

const rooms = new Map<string, Room>();

function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

function createRoom(roomId: string): Room {
  const room: Room = { id: roomId, peers: new Map() };
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

export function registerSignalingHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    socket.on('room:join', ({ roomId, peer }, callback) => {
      try {
        let room = getRoom(roomId);
        if (!room) {
          room = createRoom(roomId);
        }

        if (room.peers.size >= 4) {
          callback({ success: false, error: 'Room is full (max 4 participants)' });
          return;
        }

        if (room.peers.has(peer.id)) {
          callback({ success: false, error: 'You are already in this room' });
          return;
        }

        socket.data.peer = peer;
        socket.join(roomId);
        room.peers.set(peer.id, peer);

        // Send current peer list to the joining peer
        const peers = Array.from(room.peers.values());
        callback({ success: true });
        socket.emit('room:joined', { roomId, peers });

        // Notify others in the room
        socket.to(roomId).emit('room:peer-joined', { peer });
      } catch (err) {
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

    socket.on('signal:offer', ({ roomId, to, offer }) => {
      socket.to(to).emit('signal:offer', { from: socket.id, offer });
    });

    socket.on('signal:answer', ({ roomId, to, answer }) => {
      socket.to(to).emit('signal:answer', { from: socket.id, answer });
    });

    socket.on('signal:ice-candidate', ({ roomId, to, candidate }) => {
      socket.to(to).emit('signal:ice-candidate', { from: socket.id, candidate });
    });

    socket.on('disconnect', () => {
      removePeerFromAllRooms(socket);
    });
  });
}
