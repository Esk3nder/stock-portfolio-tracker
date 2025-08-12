#!/usr/bin/env node

async function testManualRebalance() {
  console.log('Testing Manual Rebalance Feature...\n');

  // Test 1: Manual ticker entry with small list
  console.log('1. Testing manual ticker entry with 5 stocks...');
  const manualResponse = await fetch('http://localhost:8000/api/rebalance-8x8', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      universe: 'manual',
      tickers: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'V']
    })
  });
  
  const manualResult = await manualResponse.json();
  console.log('Manual Rebalance Results:');
  console.log(`- Total Scored: ${manualResult.total_scored}`);
  console.log(`- Qualified: ${manualResult.qualified_count}`);
  console.log(`- Eliminated: ${manualResult.eliminated_count}`);
  if (manualResult.portfolio && manualResult.portfolio.length > 0) {
    console.log('- Portfolio:');
    manualResult.portfolio.forEach(stock => {
      console.log(`  ${stock.ticker}: ${stock.total_score}/64 (${(stock.weight * 100).toFixed(1)}%)`);
    });
  }
  console.log();

  // Test 2: Check cached stocks
  console.log('2. Checking cached stocks...');
  const cachedResponse = await fetch('http://localhost:8000/api/cached-stocks');
  const cachedResult = await cachedResponse.json();
  console.log(`Cached stocks: ${cachedResult.count} stocks found`);
  if (cachedResult.cached_stocks && cachedResult.cached_stocks.length > 0) {
    console.log('First 5 cached stocks:');
    cachedResult.cached_stocks.slice(0, 5).forEach(stock => {
      console.log(`  ${stock.ticker}: Score ${stock.total_score}`);
    });
  }
  console.log();

  // Test 3: Rebalance with cached stocks
  if (cachedResult.count > 0) {
    console.log('3. Testing rebalance with cached stocks...');
    const cachedRebalanceResponse = await fetch('http://localhost:8000/api/rebalance-8x8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ universe: 'cached' })
    });
    
    const cachedRebalanceResult = await cachedRebalanceResponse.json();
    console.log('Cached Rebalance Results:');
    console.log(`- Total Scored: ${cachedRebalanceResult.total_scored}`);
    console.log(`- Qualified: ${cachedRebalanceResult.qualified_count}`);
    console.log(`- Eliminated: ${cachedRebalanceResult.eliminated_count}`);
  }

  console.log('\n✅ All tests completed!');
}

testManualRebalance().catch(console.error);