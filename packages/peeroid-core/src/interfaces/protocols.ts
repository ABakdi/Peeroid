import type { Stream, Connection } from '@libp2p/interface';

export interface IProtocolHandler {
  protocolId: string;
  version: string;
  handleStream(stream: Stream, connection: Connection): Promise<void>;
  canHandle(protocol: string): boolean;
}

export interface IProtocolRegistry {
  register(handler: IProtocolHandler): void;
  unregister(protocolId: string): void;
  getHandler(protocolId: string): IProtocolHandler | undefined;
  listProtocols(): string[];
}
