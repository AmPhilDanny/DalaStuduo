import { Device } from 'mediasoup-client';
import type { Transport, Producer, Consumer } from 'mediasoup-client/lib/types';
import type { DtlsParameters } from 'mediasoup-client/lib/types';
import { io, Socket } from 'socket.io-client';

const CALL_SERVER = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://dalastudioshowcase.onrender.com';

export type RoomType = 'P2P' | 'GROUP' | 'OPEN';

export interface Participant {
  userId: string;
  displayName: string;
}

export interface RemoteTrackEvent {
  userId: string;
  kind: 'audio' | 'video';
  track: MediaStreamTrack;
  consumerId: string;
}

export interface MediasoupCall {
  participants: Participant[];
  createSendTransport: () => Promise<Transport>;
  createRecvTransport: () => Promise<Transport>;
  produceTrack: (track: MediaStreamTrack) => Promise<Producer>;
  closeProducer: (producerId: string) => Promise<void>;
  leave: () => Promise<void>;
  getRemoteStreams: () => RemoteTrackEvent[];
  getSocket: () => Socket;
  onRemoteTrack: (fn: (event: RemoteTrackEvent) => void) => void;
  onRemoteTrackRemoved: (fn: (consumerId: string) => void) => void;
  onParticipantsChange: (fn: (participants: Participant[]) => void) => void;
}

export async function createMediasoupCall(options: {
  roomId: string;
  roomType: RoomType;
  userId: string;
  displayName: string;
  callerId?: string;
  calleeId?: string;
  token?: string;
  memberIds?: string[];
  getToken: () => Promise<string | null>;
}): Promise<MediasoupCall> {
  const {
    roomId, roomType, userId, displayName,
    callerId, calleeId, token, memberIds,
    getToken,
  } = options;

  const tokenVal = await getToken();
  const socket = io(`${CALL_SERVER}/call`, {
    transports: ['websocket'],
    auth: { token: tokenVal },
  });

  const device = new Device();
  let sendTransport: Transport | null = null;
  let recvTransport: Transport | null = null;

  const producers = new Map<string, Producer>();
  const consumers = new Map<string, Consumer>();
  const remoteStreams = new Map<string, RemoteTrackEvent>();

  let onRemoteTrackCb: ((event: RemoteTrackEvent) => void) | null = null;
  let onRemoteTrackRemovedCb: ((consumerId: string) => void) | null = null;
  let onParticipantsChangeCb: ((participants: Participant[]) => void) | null = null;

  function req(event: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      socket.emit(event, data, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
  }

  // Wait for socket connection
  await new Promise<void>((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', (err: Error) => reject(err));
    setTimeout(() => reject(new Error('Socket connection timeout')), 15000);
  });

  // Join the mediasoup room
  const joinResp = await req('join-room', {
    roomId, roomType, userId, displayName,
    rtpCapabilities: device.rtpCapabilities,
    callerId, calleeId, token, memberIds,
  });

  // Load device with router RTP capabilities from server
  await device.load({ routerRtpCapabilities: joinResp.routerRtpCapabilities });

  // ── Socket listeners for remote media ──
  socket.on('new-producer', async (data: { producerId: string; kind: string; userId: string }) => {
    if (!recvTransport) return;

    try {
      const consumerData = await req('consume', {
        roomId, userId, transportId: recvTransport!.id,
        producerId: data.producerId,
        rtpCapabilities: device.rtpCapabilities,
      });

      const consumer = await recvTransport.consume({
        id: consumerData.id,
        producerId: consumerData.producerId,
        kind: consumerData.kind,
        rtpParameters: consumerData.rtpParameters,
      });

      consumers.set(consumer.id, consumer);

      const entry: RemoteTrackEvent = {
        userId: data.userId,
        kind: consumerData.kind,
        track: consumer.track,
        consumerId: consumer.id,
      };
      remoteStreams.set(consumer.id, entry);

      // Resume the consumer (server created it paused)
      await req('resume-consumer', { roomId, userId, consumerId: consumer.id });
      onRemoteTrackCb?.(entry);
    } catch (err) {
      console.error('consume error:', err);
    }
  });

  socket.on('producer-closed', (data: { producerId: string }) => {
    consumers.forEach((consumer, id) => {
      if (consumer.producerId === data.producerId) {
        consumer.close();
        consumers.delete(id);
        remoteStreams.delete(id);
        onRemoteTrackRemovedCb?.(id);
      }
    });
  });

  socket.on('user-joined', (data: { participants: Participant[] }) => {
    onParticipantsChangeCb?.(data.participants);
  });

  socket.on('user-left', (data: { participants: Participant[] }) => {
    onParticipantsChangeCb?.(data.participants);
  });

  // ── API ──
  const api: MediasoupCall = {
    participants: joinResp.participants || [],

    onRemoteTrack(fn) { onRemoteTrackCb = fn; },
    onRemoteTrackRemoved(fn) { onRemoteTrackRemovedCb = fn; },
    onParticipantsChange(fn) { onParticipantsChangeCb = fn; },

    async createSendTransport() {
      const data = await req('create-transport', { roomId, userId, direction: 'send' });

      sendTransport = device.createSendTransport({
        id: data.id,
        iceParameters: data.iceParameters,
        iceCandidates: data.iceCandidates,
        dtlsParameters: data.dtlsParameters,
        sctpParameters: data.sctpParameters,
      });

      sendTransport.on('connect', ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, callback: Function) => {
        req('connect-transport', { roomId, userId, transportId: sendTransport!.id, dtlsParameters })
          .then(() => callback())
          .catch((err) => console.error('connect error:', err));
      });

      sendTransport.on('produce', (parameters: any, callback: Function) => {
        req('produce', {
          roomId, userId, transportId: sendTransport!.id,
          kind: parameters.kind,
          rtpParameters: parameters.rtpParameters,
          appData: parameters.appData,
        })
          .then((resp) => callback({ id: resp.id }))
          .catch((err) => console.error('produce error:', err));
      });

      return sendTransport;
    },

    async createRecvTransport() {
      const data = await req('create-transport', { roomId, userId, direction: 'recv' });

      recvTransport = device.createRecvTransport({
        id: data.id,
        iceParameters: data.iceParameters,
        iceCandidates: data.iceCandidates,
        dtlsParameters: data.dtlsParameters,
        sctpParameters: data.sctpParameters,
      });

      recvTransport.on('connect', ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, callback: Function) => {
        req('connect-transport', { roomId, userId, transportId: recvTransport!.id, dtlsParameters })
          .then(() => callback())
          .catch((err) => console.error('connect error:', err));
      });

      return recvTransport;
    },

    async produceTrack(track: MediaStreamTrack) {
      if (!sendTransport) throw new Error('Send transport not created');
      const producer = await sendTransport.produce({ track });
      producers.set(producer.id, producer);
      return producer;
    },

    async closeProducer(producerId: string) {
      producers.get(producerId)?.close();
      producers.delete(producerId);
      await req('close-producer', { roomId, userId, producerId }).catch(() => {});
    },

    async leave() {
      await req('leave-room', { roomId, userId }).catch(() => {});
      producers.forEach((p) => p.close());
      consumers.forEach((c) => c.close());
      sendTransport?.close();
      recvTransport?.close();
      socket.disconnect();
    },

    getRemoteStreams() { return Array.from(remoteStreams.values()); },
    getSocket() { return socket; },
  };

  return api;
}
