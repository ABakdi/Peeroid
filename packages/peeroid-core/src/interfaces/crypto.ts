import type { PeerId } from '@libp2p/interface';

export interface ICryptoProvider {
  encrypt(
    plaintext: Uint8Array,
    recipientPeerId: PeerId
  ): Promise<{ ciphertext: Uint8Array; nonce?: Uint8Array }>;

  decrypt(
    ciphertext: Uint8Array,
    senderPeerId: PeerId,
    nonce?: Uint8Array
  ): Promise<Uint8Array>;

  deriveSharedSecret(peerId: PeerId): Promise<Uint8Array>;
  getAlgorithm(): string;
}
