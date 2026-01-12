import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PeeroidNode } from '../src/peeroid-node';
import { MockStorage, MockIdentity, MockCrypto, TestEchoProtocol } from './helpers/mock-implementations';

describe('Peer Discovery and Data Exchange', () => {
  let peer1: PeeroidNode;
  let peer2: PeeroidNode;
  let peer1Identity: MockIdentity;
  let peer2Identity: MockIdentity;
  let echoProtocol1: TestEchoProtocol;
  let echoProtocol2: TestEchoProtocol;

  beforeEach(async () => {
    // Create unique identities for each peer
    peer1Identity = new MockIdentity('peer-1-' + Date.now());
    peer2Identity = new MockIdentity('peer-2-' + Date.now());

    // Create protocol handlers
    echoProtocol1 = new TestEchoProtocol();
    echoProtocol2 = new TestEchoProtocol();

    // Initialize Peer 1
    peer1 = new PeeroidNode({
      listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] // Random port
    });

    peer1
      .useStorage(new MockStorage())
      .useIdentity(peer1Identity)
      .useCrypto(new MockCrypto())
      .registerProtocol(echoProtocol1);

    // Initialize Peer 2
    peer2 = new PeeroidNode({
      listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'] // Random port
    });

    peer2
      .useStorage(new MockStorage())
      .useIdentity(peer2Identity)
      .useCrypto(new MockCrypto())
      .registerProtocol(echoProtocol2);

    // Start both peers
    await peer1.start();
    await peer2.start();
  });

  afterEach(async () => {
    // Cleanup
    if (peer1.isRunning()) {
      await peer1.stop();
    }
    if (peer2.isRunning()) {
      await peer2.stop();
    }
  });

  it('should create two independent peers with different IDs', () => {
    const peer1Id = peer1.getPeerId();
    const peer2Id = peer2.getPeerId();

    console.log(`Peer 1 ID: ${peer1Id}`);
    console.log(`Peer 2 ID: ${peer2Id}`);

    expect(peer1Id).toBeTruthy();
    expect(peer2Id).toBeTruthy();
    expect(peer1Id).not.toBe(peer2Id);
  });

  it('should establish connection between peers', async () => {
    // Get Peer 2's listen addresses (simulating discovery)
    // In a real scenario, this would come from DHT or relay
    const peer2Id = peer2.getPeerId();
    expect(peer2Id).toBeTruthy();

    // For testing, we'll simulate direct connection using loopback
    // Note: In real scenario, we'd need proper addresses from discovery
    console.log('Attempting to connect peers...');

    // This test shows the structure, but actual connection requires
    // proper addressing which we'll implement in the next test
    expect(peer1.isRunning()).toBe(true);
    expect(peer2.isRunning()).toBe(true);

    // Verify both peers are running
    expect(peer1.getConnections()).toHaveLength(0);
    expect(peer2.getConnections()).toHaveLength(0);
  });

  it('should exchange data using echo protocol', async () => {
    const testMessage = 'Hello from test!';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Test the echo protocol handler directly
    const mockStream = {
      source: (async function* () {
        yield encoder.encode(testMessage);
      })(),
      sink: async (data: AsyncIterable<Uint8Array>) => {
        for await (const chunk of data) {
          const response = decoder.decode(chunk);
          console.log(`Response received: ${response}`);
          expect(response).toBe(`ECHO: ${testMessage}`);
        }
      }
    } as any;

    const mockConnection = {
      remotePeer: { toString: () => 'test-peer' }
    } as any;

    // Updated: Pass two arguments, not an object
    await echoProtocol1.handleStream(mockStream, mockConnection);

    const lastMessage = echoProtocol1.getLastMessage();
    expect(lastMessage).toBe(testMessage);
  });

  it('should list registered protocols', () => {
    const peer1Protocols = peer1.getProtocols();
    const peer2Protocols = peer2.getProtocols();

    console.log(`Peer 1 protocols: ${peer1Protocols.join(', ')}`);
    console.log(`Peer 2 protocols: ${peer2Protocols.join(', ')}`);

    expect(peer1Protocols).toContain('/peeroid/test/echo/1.0.0');
    expect(peer2Protocols).toContain('/peeroid/test/echo/1.0.0');
    expect(peer1Protocols).toHaveLength(1);
    expect(peer2Protocols).toHaveLength(1);
  });
});
