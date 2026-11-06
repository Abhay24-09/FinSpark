import app from './server/index.js';

async function runTests() {
  console.log('--- Starting Finspark End-to-End Test Suite ---');
  const server = app.listen(5000, async () => {
    try {
      console.log('✅ Server started on port 5000\n');

      // 1. Health check
      console.log('1. Testing GET /api/health...');
      const healthRes = await fetch('http://localhost:5000/api/health');
      const healthData = await healthRes.json();
      console.log(`   Status: ${healthRes.status}, Service: ${healthData.service}`);
      if (healthRes.status !== 200) throw new Error('Health check failed');

      // 2. Market Overview Summary
      console.log('\n2. Testing GET /api/market/bhavcopy/summary...');
      const sumRes = await fetch('http://localhost:5000/api/market/bhavcopy/summary');
      const sumData = await sumRes.json();
      console.log(`   Trading Date: ${sumData.summary.tradingDate}`);
      console.log(`   Total Stocks: ${sumData.summary.totalStocks}`);
      console.log(`   Advancers: ${sumData.summary.advancers}, Decliners: ${sumData.summary.decliners}, Unchanged: ${sumData.summary.unchanged}`);
      console.log(`   Top 1 Gainer: ${sumData.summary.top10Gainers[0].symbol} (+${sumData.summary.top10Gainers[0].changePercent}%)`);
      console.log(`   Top 1 Loser:  ${sumData.summary.top10Losers[0].symbol} (${sumData.summary.top10Losers[0].changePercent}%)`);
      console.log(`   Top 1 Volume: ${sumData.summary.highestVolume[0].symbol} (${sumData.summary.highestVolume[0].volume.toLocaleString()} shares)`);
      if (sumData.summary.totalStocks < 1000) throw new Error('Too few stocks parsed');

      // 3. Paginated Stock Data Table (EQ Series)
      console.log('\n3. Testing GET /api/market/bhavcopy?page=1&limit=5&sort=volume&order=desc...');
      const listRes = await fetch('http://localhost:5000/api/market/bhavcopy?page=1&limit=5&sort=volume&order=desc');
      const listData = await listRes.json();
      console.log(`   Total EQ: ${listData.total}, Page: ${listData.page}/${listData.totalPages}`);
      console.log(`   Top Volume Stock: ${listData.data[0].symbol} | Close: ₹${listData.data[0].close} | Vol: ${listData.data[0].volume}`);
      if (listData.data.length !== 5) throw new Error('Pagination limit mismatch');

      // Check required fields on stock record
      const sample = listData.data[0];
      const requiredFields = [
        'symbol', 'name', 'isin', 'series', 'tradingDate',
        'open', 'high', 'low', 'close', 'previousClose',
        'change', 'changePercent', 'volume', 'tradedValue', 'vwap'
      ];
      for (const field of requiredFields) {
        if (sample[field] === undefined) throw new Error(`Missing field ${field} in stock record`);
      }
      console.log('   All required fields verified on stock record: ' + requiredFields.join(', '));

      // 4. Search Filter
      console.log('\n4. Testing GET /api/market/bhavcopy?search=RELIANCE...');
      const searchRes = await fetch('http://localhost:5000/api/market/bhavcopy?search=RELIANCE');
      const searchData = await searchRes.json();
      console.log(`   Found ${searchData.data.length} securities matching RELIANCE`);
      const rel = searchData.data.find(s => s.symbol === 'RELIANCE');
      if (rel) {
        console.log(`   RELIANCE Details -> Close: ₹${rel.close}, Change: ${rel.changePercent}%, ISIN: ${rel.isin}, VWAP: ₹${rel.vwap}`);
      } else {
        throw new Error('RELIANCE not found');
      }

      // 5. Lookup Single Stock by Symbol
      console.log('\n5. Testing GET /api/market/bhavcopy/TCS...');
      const symRes = await fetch('http://localhost:5000/api/market/bhavcopy/TCS');
      const symData = await symRes.json();
      console.log(`   TCS Symbol -> Close: ₹${symData.data.close}, Volume: ${symData.data.volume}, ISIN: ${symData.data.isin}`);

      // 6. Test Series Filter (BE Series)
      console.log('\n6. Testing GET /api/market/bhavcopy?series=BE&limit=5...');
      const beRes = await fetch('http://localhost:5000/api/market/bhavcopy?series=BE&limit=5');
      const beData = await beRes.json();
      console.log(`   BE Series Count: ${beData.total}, Sample: ${beData.data[0]?.symbol || 'N/A'}`);

      // 7. Weekend / Holiday Test
      console.log('\n7. Testing GET /api/market/bhavcopy?date=2026-10-25 (Sunday)...');
      const holRes = await fetch('http://localhost:5000/api/market/bhavcopy?date=2026-10-25');
      const holData = await holRes.json();
      console.log(`   Expected 404 received -> Status: ${holRes.status}, Error: ${holData.error}`);
      if (holRes.status !== 404) throw new Error('Expected 404 for Sunday');

      // 8. Refresh Endpoint
      console.log('\n8. Testing POST /api/market/bhavcopy/refresh...');
      const refRes = await fetch('http://localhost:5000/api/market/bhavcopy/refresh', { method: 'POST' });
      const refData = await refRes.json();
      console.log(`   Refresh Status: ${refRes.status}, Message: ${refData.message}`);

      // 9. Symphony Fintech XTS Market Depth (Book Type 1) API
      console.log('\n9. Testing GET /api/market/depth (Symphony Fintech XTS Touchline)...');
      const depthRes = await fetch('http://localhost:5000/api/market/depth');
      const depthData = await depthRes.json();
      console.log(`   Status: ${depthRes.status}, Instruments: ${depthData.count}, Standard: ${depthData.standard}`);
      if (depthData.count < 20) throw new Error('Expected at least 20 XTS instruments in depth data');

      const relDepth = depthData.data.find(d => d.tradingSymbol === 'RELIANCE-EQ');
      if (!relDepth || relDepth.bids.length !== 5 || relDepth.asks.length !== 5) {
        throw new Error('RELIANCE-EQ 5-level depth structure invalid');
      }
      console.log(`   RELIANCE-EQ Depth -> LTP: ₹${relDepth.lastTradedPrice}, Bids: ${relDepth.bids.length} levels, Asks: ${relDepth.asks.length} levels`);
      console.log(`   Best Bid: ₹${relDepth.bids[0].price} (x${relDepth.bids[0].quantity}), Best Ask: ₹${relDepth.asks[0].price} (x${relDepth.asks[0].quantity})`);

      console.log('\n======================================================');
      console.log('🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY! 🎉');
      console.log('======================================================\n');
    } catch (err) {
      console.error('❌ Test Failure:', err);
      process.exitCode = 1;
    } finally {
      server.close();
      process.exit();
    }
  });
}

runTests();

