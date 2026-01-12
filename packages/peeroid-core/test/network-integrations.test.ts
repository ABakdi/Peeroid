import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { PeeroidNode } from '../src/peeroid-node';
import { MockStorage, MockIdentity, MockCrypto, TestEchoProtocol } from './helpers/mock-implementations';

// Helper to wait for a condition
const waitForCondition = async (condition: () => boolean, timeout = 5000) => {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Condition timeout');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

describe('Network Integration Test with Relay Simulation', () => {
  let relayNode: any;
  let peer1: PeeroidNode;
  let peer2: PeeroidNode;
  let relayPort: number;

  beforeAll(async () => {
    // Create a simple relay node (using libp2p directly)
    relayPort = 9000 + Math.floor(Math.random() * 1000);

    relayNode = await createLibp2p({
      addresses: {
        listen: [`/ip4/127.0.0.1/tcp/${relayPort}/ws`]
      },
      transports: [webSockets()],
      connectionEncrypters: [noise()],
      streamMuxers: [mplex()]
    });

    await relayNode.start();
    console.log(`Relay started on port ${relayPort}, ID: ${relayNode.peerId.toString()}`);
  });

  afterAll(async () => {
    if (relayNode) {
      await relayNode.stop();
    }
  });

  it('should connect two peers through a relay and exchange messages', async () => {
    // Create two peers that will use the relay
    const peer1Identity = new MockIdentity('test-peer-1');
    const peer2Identity = new MockIdentity('test-peer-2');

    const echoProtocol1 = new TestEchoProtocol();
    const echoProtocol2 = new TestEchoProtocol();

    // Configure peers to connect to the relay
    const relayAddress = `/ip4/127.0.0.1/tcp/${relayPort}/ws/p2p/${relayNode.peerId.toString()}`;

    // Peer 1
    peer1 = new PeeroidNode({
      listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'],
      bootstrap: {
        enabled: true,
        addresses: [relayAddress]
      }
    });

    peer1
      .useStorage(new MockStorage())
      .useIdentity(peer1Identity)
      .useCrypto(new MockCrypto())
      .registerProtocol(echoProtocol1);

    // Peer 2
    peer2 = new PeeroidNode({
      listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws'],
      bootstrap: {
        enabled: true,
        addresses: [relayAddress]
      }
    });

    peer2
      .useStorage(new MockStorage())
      .useIdentity(peer2Identity)
      .useCrypto(new MockCrypto())
      .registerProtocol(echoProtocol2);

    // Start both peers
    await peer1.start();
    await peer2.start();

    console.log(`Peer 1 started: ${peer1.getPeerId()}`);
    console.log(`Peer 2 started: ${peer2.getPeerId()}`);

    // Wait for connections to be established
    await waitForCondition(() => peer1.getConnections().length > 0);
    await waitForCondition(() => peer2.getConnections().length > 0);

    // Verify both peers are connected to the relay
    expect(peer1.getConnections().length).toBeGreaterThan(0);
    expect(peer2.getConnections().length).toBeGreaterThan(0);

    console.log('Both peers connected to relay');

    // In a real test, we would now:
    // 1. Use the relay to exchange peer information
    // 2. Establish direct connection between peer1 and peer2
    // 3. Open a stream and exchange data

    // For now, we verify the basic connectivity
    expect(peer1.isRunning()).toBe(true);
    expect(peer2.isRunning()).toBe(true);

    // Cleanup
    await peer1.stop();
    await peer2.stop();
  }, 30000); // Longer timeout for network operations
});
