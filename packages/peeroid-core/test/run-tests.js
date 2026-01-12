#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTests() {
  console.log('🚀 Running Peeroid Core Tests...\n');

  try {
    // Run the basic tests
    console.log('📦 Running basic unit tests...');
    const { stdout: basicOutput } = await execAsync('npx vitest run peer-discovery.test.ts');
    console.log(basicOutput);

    console.log('🌐 Running network integration tests...');
    const { stdout: networkOutput } = await execAsync('npx vitest run network-integration.test.ts');
    console.log(networkOutput);

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.log(error.stderr);
    process.exit(1);
  }
}

runTests();
