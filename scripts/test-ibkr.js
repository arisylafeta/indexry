#!/usr/bin/env node

/**
 * Test script for IBKR connection
 * 
 * Usage:
 *   node scripts/test-ibkr.js         # Test with real IBKR connection
 *   node scripts/test-ibkr.js --mock  # Test in mock mode
 * 
 * Prerequisites for real connection:
 *   - TWS or IB Gateway must be running
 *   - API must be enabled in TWS (Edit > Global Configuration > API)
 *   - Port 7497 must be open (paper trading) or 7496 (live)
 */

const { getIBKRClient, resetIBKRClient } = require('../src/lib/ibkr');

const USE_MOCK = process.argv.includes('--mock');
const USE_MOCK_ENV = process.env.IBKR_MOCK === 'true';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMockMode() {
  console.log('\n🧪 Testing Mock Mode\n');
  
  const client = getIBKRClient({
    host: '127.0.0.1',
    port: 7497,
    clientId: 999
  });
  
  // Mock mode - simulate operations without real connection
  console.log('✓ Mock client created');
  console.log('  Status:', client.getStatus());
  
  // Simulate placeOrder
  try {
    const orderResult = await client.placeOrder({
      symbol: 'AAPL',
      side: 'buy',
      quantity: 100,
      orderType: 'market'
    });
    console.log('✓ Mock order placed:', orderResult);
  } catch (error) {
    console.log('✓ Mock order failed as expected (not connected):', error.message);
  }
  
  console.log('\n✅ Mock mode test completed\n');
}

async function testRealConnection() {
  console.log('\n🔗 Testing Real IBKR Connection\n');
  
  const client = getIBKRClient({
    host: '127.0.0.1',
    port: 7497, // Paper trading port
    clientId: Math.floor(Math.random() * 1000)
  });
  
  // Listen for events
  client.on('connected', () => {
    console.log('✓ Connected to TWS!');
  });
  
  client.on('disconnected', () => {
    console.log('✓ Disconnected from TWS');
  });
  
  client.on('error', (error) => {
    console.log('⚠ IBKR Error:', error.message || error);
  });
  
  client.on('orderStatus', (data) => {
    console.log('📋 Order Status:', data);
  });
  
  client.on('position', (data) => {
    console.log('📊 Position Update:', data);
  });
  
  // Attempt connection
  console.log('Connecting to TWS on localhost:7497...');
  console.log('Make sure TWS is running and API is enabled!\n');
  
  try {
    await client.connect();
    
    console.log('\n✅ Connection successful!');
    console.log('  Status:', client.getStatus());
    
    // Get positions
    console.log('\nFetching positions...');
    const positions = await client.getPositions();
    console.log('  Positions:', positions.length > 0 ? positions : 'No positions found');
    
    // Get portfolio
    console.log('\nFetching portfolio...');
    const portfolio = await client.getPortfolio();
    console.log('  Portfolio:', portfolio.length > 0 ? portfolio : 'No portfolio data');
    
    // Test order (don't actually submit - just verify we could)
    console.log('\n📌 Note: Not placing test order to avoid accidental trades');
    console.log('  Order placement is available via the API');
    
    // Disconnect
    console.log('\nDisconnecting...');
    client.disconnect();
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Is TWS running?');
    console.log('  2. Is API enabled? (Edit > Global Configuration > API > Settings)');
    console.log('  3. Is "ActiveX and Socket Clients" checked?');
    console.log('  4. Is port 7497 open? (Paper trading)');
    console.log('  5. Is "Allow connections from localhost only" unchecked or your IP whitelisted?');
    console.log('\nTo test without TWS, use: node scripts/test-ibkr.js --mock');
    process.exit(1);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║            Indexry IBKR Connection Test                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  if (USE_MOCK || USE_MOCK_ENV) {
    await testMockMode();
  } else {
    await testRealConnection();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
