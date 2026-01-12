import type { PeerId } from '@libp2p/interface';

export interface IIdentityProvider {
  getPeerId(): Promise<PeerId>;
  sign(data: Uint8Array): Promise<Uint8Array>;
  verify(data: Uint8Array, signature: Uint8Array): Promise<boolean>;
  getPublicKey(): Uint8Array;
  getType(): string;
  canExport(): boolean;
  export(): Promise<Uint8Array>;
  import(data: Uint8Array): Promise<void>;
}
