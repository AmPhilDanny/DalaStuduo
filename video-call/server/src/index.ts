import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './types.js';
import { registerSignalingHandlers } from './signaling.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: true, credentials: true },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

registerSignalingHandlers(io);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

httpServer.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
