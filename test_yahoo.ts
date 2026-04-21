import RawYahooFinance from 'yahoo-finance2';
import fetch from 'node-fetch';

async function fullDiagnosis() {
  console.log("--- START FULL DIAGNOSIS ---");
  
  // 1. Library Test
  try {
    console.log("[1/3] Testing Library Instantiation...");
    const yahoo = new (RawYahooFinance as any)();
    const tickers = ['AAPL', 'ONDS', 'NVDA'];
    
    for (const ticker of tickers) {
       const res = await yahoo.quote(ticker);
       console.log(`   - ${ticker}: Success! Price: ${res.regularMarketPrice}`);
    }
  } catch (e: any) {
    console.error("   - Library Test FAILED:", e.message);
  }

  // 2. Local Server Test (Hitting our own API)
  try {
    console.log("[2/3] Testing Local API Endpoint (Port 3000)...");
    const testTicker = 'ONDS';
    const response = await fetch(`http://0.0.0.0:3000/api/quote/${testTicker}`);
    
    console.log(`   - Status: ${response.status}`);
    if (response.status === 200) {
      const data = await response.json();
      console.log(`   - Response Data:`, JSON.stringify(data, null, 2).substring(0, 200) + "...");
    } else {
      const text = await response.text();
      console.error(`   - API FAILED: ${text}`);
    }
  } catch (e: any) {
    console.error("   - Local API Test FAILED (Is server running?):", e.message);
  }

  // 3. Dependency Check
  console.log("[3/3] Checking environment...");
  console.log("   - NODE_ENV:", process.env.NODE_ENV);
  
  console.log("--- DIAGNOSIS COMPLETE ---");
}

fullDiagnosis();
