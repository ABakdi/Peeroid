import type { PeerId } from '@libp2p/interface';
import {
  IPeeroidStorage,
  IIdentityProvider,
  ICryptoProvider,
  IProtocolHandler
} from '../../src/interfaces';

// Mock Storage
export class MockStorage implements IPeeroidStorage {
  private data = new Map<string, Uint8Array>();

  async get(key: string): Promise<Uint8Array | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: Uint8Array): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.data.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.data.keys());
    return prefix
      ? keys.filter(key => key.startsWith(prefix))
      : keys;
  }

  async clear(): Promise<void> {
    this.data.clear();
  }
}

// Mock Identity Provider
export class MockIdentity implements IIdentityProvider {
  private peerId: string;
  private publicKey: Uint8Array;

  constructor(peerId: string = `mock-peer-${Math.random().toString(36).substr(2, 9)}`) {
    this.peerId = peerId;
    this.publicKey = new TextEncoder().encode(`public-key-${peerId}`);
  }

  async getPeerId(): Promise<any> {
    return {
      toString: () => this.peerId,
      toBytes: () => new TextEncoder().encode(this.peerId)
    };
  }

  async sign(data: Uint8Array): Promise<Uint8Array> {
    // Simple mock signature
    const signature = new Uint8Array(data.length + this.peerId.length);
    signature.set(data);
    signature.set(new TextEncoder().encode(this.peerId), data.length);
    return signature;
  }

  async verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
    // Simple mock verification
    return signature.length > data.length;
  }

  getPublicKey(): Uint8Array {
    return this.publicKey;
  }

  getType(): string {
    return 'mock-ed25519';
  }

  canExport(): boolean {
    return false;
  }

  async export(): Promise<Uint8Array> {
    return new TextEncoder().encode(JSON.stringify({
      peerId: this.peerId,
      type: this.getType()
    }));
  }

  async import(data: Uint8Array): Promise<void> {
    const imported = JSON.parse(new TextDecoder().decode(data));
    this.peerId = imported.peerId;
  }
}

// Mock Crypto Provider
export class MockCrypto implements ICryptoProvider {
  async encrypt(plaintext: Uint8Array, recipientPeerId: any): Promise<{ ciphertext: Uint8Array; nonce?: Uint8Array }> {
    // Simple XOR "encryption" for testing
    const key = new TextEncoder().encode('test-key');
    const ciphertext = new Uint8Array(plaintext.length);

    for (let i = 0; i < plaintext.length; i++) {
      ciphertext[i] = plaintext[i] ^ key[i % key.length];
    }

    return {
      ciphertext,
      nonce: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
    };
  }

  async decrypt(ciphertext: Uint8Array, senderPeerId: any, nonce?: Uint8Array): Promise<Uint8Array> {
    // Simple XOR "decryption" for testing
    const key = new TextEncoder().encode('test-key');
    const plaintext = new Uint8Array(ciphertext.length);

    for (let i = 0; i < ciphertext.length; i++) {
      plaintext[i] = ciphertext[i] ^ key[i % key.length];
    }

    return plaintext;
  }

  async deriveSharedSecret(peerId: any): Promise<Uint8Array> {
    return new TextEncoder().encode(`shared-secret-with-${peerId.toString()}`);
  }

  getAlgorithm(): string {
    return 'mock-xor';
  }
}

// Simple Echo Protocol Handler for testing
// Update the TestEchoProtocol class
export class TestEchoProtocol implements IProtocolHandler {
  protocolId: string = '/peeroid/test/echo/1.0.0';
  version: string = '1.0.0';
  receivedMessages: Uint8Array[] = [];

  async handleStream(stream: any, connection: any): Promise<void> {
    console.log(`[EchoProtocol] Handling stream from ${connection.remotePeer.toString()}`);

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    for await (const chunk of stream.source) {
      const message = decoder.decode(chunk);
      console.log(`[EchoProtocol] Received: ${message}`);

      this.receivedMessages.push(chunk);
      const response = `ECHO: ${message}`;
      await stream.sink([encoder.encode(response)]);
    }
  }

  canHandle(protocol: string): boolean {
    return protocol === this.protocolId;
  }

  getLastMessage(): string | null {
    if (this.receivedMessages.length === 0) return null;
    return new TextDecoder().decode(this.receivedMessages[this.receivedMessages.length - 1]);
  }
}
