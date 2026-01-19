#!/usr/bin/env node
import { PeeroidNode } from '@peeroid/core';
import readline from 'readline';
// 1. Create a node - that's it
const node = new PeeroidNode({
  listenAddresses: ['/ip4/127.0.0.1/tcp/0/ws']
});

// 2. Create the absolute simplest chat protocol
const chatProtocol = {
  protocolId: '/chat/1.0.0',
  version: '1.0.0',

  async handleStream(stream: any, connection: any) {
    for await (const chunk of stream.source) {
      const message = new TextDecoder().decode(chunk);
      console.log(`\n💬 ${connection.remotePeer.toString()}: ${message}`);
      rl.prompt();
    }
  },

  canHandle(protocol: string) {
    return protocol === '/chat/1.0.0';
  }
};

// 3. Minimal identity and storage (just dummy objects)
const dummyIdentity = {
  async getPeerId() {
    return {
      toString: () => `peer-${Math.random().toString(36).substr(2, 6)}`,
      toBytes: () => new Uint8Array(),
    } as any;
  },
  async sign(data: Uint8Array) {
    return new Uint8Array();
  },
  async verify(data: Uint8Array, signature: Uint8Array) {
    return true;
  },
  getPublicKey() {
    return new Uint8Array();
  },
  getType() {
    return 'dummy';
  },
  canExport() {
    return false;
  },
  async export() {
    return new Uint8Array();
  },
  async import(data: Uint8Array) { }
} as any;

const dummyStorage = {
  get: async () => null,
  set: async () => { },
  delete: async () => false,
  exists: async () => false,
  list: async () => [],
  clear: async () => { }
};

const dummyCrypto = {
  encrypt: async () => ({ ciphertext: new Uint8Array() }),
  decrypt: async () => new Uint8Array(),
  deriveSharedSecret: async () => new Uint8Array(),
  getAlgorithm: () => 'dummy'
};

// 4. Configure the node
node
  .useStorage(dummyStorage)
  .useIdentity(dummyIdentity)
  .useCrypto(dummyCrypto)
  .registerProtocol(chatProtocol);

// 5. Setup readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

// 6. Simple state
let activeStream: any = null;

// 7. Start everything
async function start() {
  await node.start();
  console.log(`🚀 Peer started: ${node.getPeerId()}, ${node}`);
  console.log(`📝 Type '/connect <address>' to connect to another peer`);
  console.log(`📝 Just type a message to send to connected peer\n`);

  rl.prompt();

  rl.on('line', async (input) => {
    const trimmed = input.trim();

    if (trimmed.startsWith('/connect ')) {
      const address = trimmed.substring(9);
      console.log(`🔗 Connecting to ${address}...`);

      try {
        const connection = await node.connectToPeer(address);
        const stream = await node.openStream(connection.remotePeer.toString(), '/chat/1.0.0');
        activeStream = stream;
        console.log(`✅ Connected! Type messages to chat.`);
      } catch (error: any) {
        console.log(`❌ Failed: ${error.message}`);
      }
    } else if (trimmed === '/exit') {
      await node.stop();
      process.exit(0);
    } else if (activeStream) {
      // Send message
      await activeStream.sink([new TextEncoder().encode(trimmed)]);
      console.log(`📤 You: ${trimmed}`);
    } else {
      console.log('❌ No active connection. Use /connect first.');
    }

    rl.prompt();
  });
}

// 8. Start the app
start().catch(console.error);
