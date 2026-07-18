declare module 'socket.io-client' {
  import type { ManagerOptions, SocketOptions } from 'socket.io-client';

  export interface Socket<ListenEvents = any, EmitEvents = any> {
    id: string;
    connected: boolean;
    disconnected: boolean;
    on(event: 'connect' | 'disconnect' | string, listener: (...args: any[]) => void): this;
    off<Ev extends keyof ListenEvents>(event: Ev, listener?: ListenEvents[Ev]): this;
    emit<Ev extends keyof EmitEvents>(event: Ev, ...args: Parameters<EmitEvents[Ev]>): this;
    emit(event: string, ...args: any[]): this;
    disconnect(): this;
    connect(): this;
  }

  export function io(url?: string, opts?: Partial<ManagerOptions & SocketOptions>): Socket;
}
