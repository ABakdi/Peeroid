import type { Libp2p } from 'libp2p';
import type { IIdentityProvider, ICryptoProvider, IPeeroidStorage } from '../interfaces';

export interface PeeroidNodeConfig {
  // Network configuration
  listenAddresses?: string[];
  transports?: any[];
  connectionEncryption?: any[];
  streamMuxers?: any[];

  // Libp2p services
  services?: Record<string, any>;

  // Module references (will be injected)
  modules?: {
    storage?: IPeeroidStorage;
    identity?: IIdentityProvider;
    crypto?: ICryptoProvider;
  };

  // Bootstrap configuration
  bootstrap?: {
    enabled?: boolean;
    addresses?: string[];
    minPeers?: number;
    timeout?: number;
  };

  // Connection limits
  connectionManager?: {
    maxConnections?: number;
    minConnections?: number;
    autoDialInterval?: number;
  };
}

export interface PeeroidNodeOptions {
  config: PeeroidNodeConfig;
  libp2pFactory?: (config: any) => Promise<Libp2p>;
}
