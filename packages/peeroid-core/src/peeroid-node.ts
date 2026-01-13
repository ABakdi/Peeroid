import type { Libp2p, Connection, Stream } from '@libp2p/interface';
import { EventEmitter } from 'events';
import { multiaddr } from '@multiformats/multiaddr';
import { PeeroidNodeConfig } from './config/types';
import {
  IPeeroidStorage,
  IIdentityProvider,
  ICryptoProvider,
  IProtocolHandler
} from './interfaces';
import {
  PeeroidError,
  ModuleNotReadyError,
  ConnectionError
} from './errors';

export class PeeroidNode extends EventEmitter {
  private libp2p: Libp2p | null = null;
  private isStarted = false;

  // Injected modules
  private storage?: IPeeroidStorage;
  private identity?: IIdentityProvider;
  private crypto?: ICryptoProvider;
  private protocols: Map<string, IProtocolHandler> = new Map();

  constructor(private config: PeeroidNodeConfig) {
    super();
  }

  // Module injection methods
  useStorage(storage: IPeeroidStorage): this {
    this.storage = storage;
    return this;
  }

  useIdentity(identity: IIdentityProvider): this {
    this.identity = identity;
    return this;
  }

  useCrypto(crypto: ICryptoProvider): this {
    this.crypto = crypto;
    return this;
  }

  registerProtocol(handler: IProtocolHandler): this {
    this.protocols.set(handler.protocolId, handler);
    return this;
  }

  private registerProtocols(): void {
    if (!this.libp2p) return;

    for (const handler of this.protocols.values()) {
      // Correct: libp2p.handle() expects two arguments: stream and connection
      this.libp2p.handle(handler.protocolId, (stream, connection) =>
        handler.handleStream(stream, connection)
      );
    }
  }


  // Lifecycle methods

  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    if (!this.identity) {
      throw new ModuleNotReadyError('identity');
    }

    try {
      const { createLibp2p } = await import('libp2p');
      const { webSockets } = await import('@libp2p/websockets');
      const { noise } = await import('@chainsafe/libp2p-noise');
      const { yamux } = await import('@chainsafe/libp2p-yamux');

      const peerId = await this.identity.getPeerId();

      // SIMPLIFIED CONFIGURATION - Remove services for now
      const libp2pConfig = {
        peerId,
        addresses: {
          listen: this.config.listenAddresses || ['/ip4/0.0.0.0/tcp/0/ws']
        },
        transports: this.config.transports || [webSockets()],
        connectionEncryption: this.config.connectionEncryption || [noise()],
        streamMuxers: this.config.streamMuxers || [yamux()],
        // Temporarily remove services to avoid createService error
      };

      this.libp2p = await createLibp2p(libp2pConfig);

      await this.libp2p.start();
      this.isStarted = true;

      // Register protocols after node starts
      this.registerProtocols();

      this.setupEventListeners();
      this.emit('started', this.libp2p.peerId.toString());

    } catch (error) {
      throw new ConnectionError(
        `Failed to start node: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }


  private setupEventListeners(): void {
    if (!this.libp2p) return;

    // Listen for libp2p peer connection events
    this.libp2p.addEventListener('peer:connect', (event) => {
      // event.detail contains the PeerId
      const peerId = event.detail.toString();
      this.emit('peer:connect', peerId);
      console.log('Peer connected:', peerId);
    });

    this.libp2p.addEventListener('peer:disconnect', (event) => {
      // event.detail contains the PeerId
      const peerId = event.detail.toString();
      this.emit('peer:disconnect', peerId);
      console.log('Peer disconnected:', peerId);
    });

    // Listen for connection events
    this.libp2p.addEventListener('connection:open', (event) => {
      this.emit('connection:open', event.detail);
      console.log('Connection opened to peer:', event.detail.remotePeer.toString());
    });

    this.libp2p.addEventListener('connection:close', (event) => {
      this.emit('connection:close', event.detail);
      console.log('Connection closed to peer:', event.detail.remotePeer.toString());
    });
  }

  async stop(): Promise<void> {
    if (!this.libp2p || !this.isStarted) {
      return;
    }

    try {
      await this.libp2p.stop();
      this.isStarted = false;
      this.emit('stopped');
    } catch (error) {
      this.emit('error', error);
    }
  }

  // Network operations
  async connectToPeer(address: string): Promise<Connection> {
    if (!this.libp2p) {
      throw new ModuleNotReadyError('libp2p');
    }

    try {
      // Convert string to Multiaddr
      const addr = multiaddr(address);
      const connection = await this.libp2p.dial(addr);

      // Get the remote peer ID from the connection
      const remotePeerId = connection.remotePeer.toString();
      this.emit('peer:connected', remotePeerId);

      return connection;
    } catch (error) {
      throw new ConnectionError(
        `Failed to connect to ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async disconnectFromPeer(peerId: string): Promise<void> {
    if (!this.libp2p) {
      throw new ModuleNotReadyError('libp2p');
    }

    try {
      const connections = this.libp2p.getConnections();
      const targetConnections = connections.filter(
        conn => conn.remotePeer.toString() === peerId
      );

      for (const connection of targetConnections) {
        await connection.close();
      }

      this.emit('peer:disconnected', peerId);
    } catch (error) {
      this.emit('error', error);
    }
  }

  async openStream(peerId: string, protocolId: string): Promise<Stream> {
    if (!this.libp2p) {
      throw new ModuleNotReadyError('libp2p');
    }

    const handler = this.protocols.get(protocolId);
    if (!handler) {
      throw new PeeroidError(
        `Protocol ${protocolId} not registered`,
        'PROTOCOL_NOT_FOUND'
      );
    }

    try {
      // First, check if we have a connection to this peer
      const connections = this.libp2p.getConnections();
      const existingConnection = connections.find(
        conn => conn.remotePeer.toString() === peerId
      );

      if (!existingConnection) {
        throw new ConnectionError(
          `No connection to peer ${peerId}`,
          peerId
        );
      }

      // Open a stream using the protocol ID
      return await this.libp2p.dialProtocol(existingConnection.remotePeer, protocolId);
    } catch (error) {
      if (error instanceof ConnectionError) {
        throw error;
      }
      throw new ConnectionError(
        `Failed to open stream for ${protocolId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        peerId
      );
    }
  }

  // Getters
  getPeerId(): string | null {
    if (!this.libp2p) return null;
    return this.libp2p.peerId.toString();
  }

  getConnections(): Connection[] {
    if (!this.libp2p) return [];
    return Array.from(this.libp2p.getConnections());
  }

  getProtocols(): string[] {
    return Array.from(this.protocols.keys());
  }

  isRunning(): boolean {
    return this.isStarted;
  }

  // Private methods
  private buildServices(): Record<string, any> {
    const services: Record<string, any> = {};

    // Add protocol handlers as services
    for (const [protocolId, handler] of this.protocols) {
      services[protocolId] = {
        handler: async ({ stream, connection }: { stream: Stream, connection: Connection }) => {
          try {
            await handler.handleStream(stream, connection);
          } catch (error) {
            this.emit('protocol:error', {
              protocolId,
              error,
              peerId: connection.remotePeer.toString()
            });
          }
        }
      };
    }

    return services;
  }
}
