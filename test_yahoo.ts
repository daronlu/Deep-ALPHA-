import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    console.log("Raw Module Type:", typeof yahooFinance);
    console.log("Keys:", Object.keys(yahooFinance || {}));
    
    // Attempt instantiation if it's a function
    let instance;
    if (typeof yahooFinance === 'function') {
       console.log("It is a function. Trying new...");
       // @ts-ignore
       instance = new yahooFinance();
    } else {
       instance = yahooFinance;
    }
    
    console.log("Instance type:", typeof instance);
    const res = await instance.quote('AAPL');
    console.log("AAPL Quote (Working!):", res.regularMarketPrice);
  } catch (e: any) {
    console.error("Test Failed:", e.message);
  }
}

test();
