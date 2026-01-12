import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PeeroidNode } from '../src/peeroid-node';
import { IPeeroidStorage, IIdentityProvider } from '../src/interfaces';

// Mock implementations for testing
class MockStorage implements IPeeroidStorage {
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

class MockIdentity implements IIdentityProvider {
  async getPeerId(): Promise<any> {
    return { toString: () => 'mock-peer-id' };
  }

  async sign(data: Uint8Array): Promise<Uint8Array> {
    return new Uint8Array();
  }

  async verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
    return true;
  }

  getPublicKey(): Uint8Array {
    return new Uint8Array();
  }

  getType(): string {
    return 'mock';
  }

  canExport(): boolean {
    return false;
  }

  async export(): Promise<Uint8Array> {
    return new Uint8Array();
  }

  async import(data: Uint8Array): Promise<void> { }
}

describe('PeeroidNode', () => {
  let node: PeeroidNode;

  beforeEach(() => {
    node = new PeeroidNode({
      listenAddresses: []
    });
  });

  it('should create instance without modules', () => {
    expect(node).toBeInstanceOf(PeeroidNode);
  });

  it('should accept module injection', () => {
    const storage = new MockStorage();
    const identity = new MockIdentity();

    node.useStorage(storage).useIdentity(identity);

    // Can't directly test private properties, but this ensures no errors
    expect(() => node.getProtocols()).not.toThrow();
  });

  it('should fail to start without identity', async () => {
    await expect(node.start()).rejects.toThrow();
  });
});
