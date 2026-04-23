import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import RawYahooFinance from 'yahoo-finance2';
import cors from 'cors';

// Robust initialization for yahoo-finance2 v3 across different module envs
const getYahooInstance = () => {
  try {
    // Definitive Fix: If it's a function, it MUST be instantiated in v3
    if (typeof RawYahooFinance === 'function') {
      console.log("[YahooFinance] Detected as function/class, creating new instance...");
      return new (RawYahooFinance as any)();
    }
    
    // Fallback for cases where it's already an instance or has a default constructor
    const Constructor = (RawYahooFinance as any).default || RawYahooFinance;
    if (typeof Constructor === 'function') {
      return new Constructor();
    }
    
    return RawYahooFinance;
  } catch (e) {
    console.error("[YahooFinance] Init failed:", e);
    return RawYahooFinance;
  }
};

const yahooFinance = getYahooInstance();
console.log("[YahooFinance] Final Init Type:", typeof yahooFinance, "Has Quote:", !!(yahooFinance as any).quote);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- ULTRA COMPATIBLE CORS MIDDLEWARE ---
  app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle Preflight
    if (req.method === 'OPTIONS') {
      console.log(`[CORS PREFLIGHT] Target: ${req.url} | Origin: ${origin}`);
      return res.sendStatus(200);
    }
    next();
  });
  
  // Custom headers to prevent aggressive caching
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // API Route: Health Check
  app.get("/api/health/", (req, res) => {
    console.log(`[HEALTH CHECK] Request from ${req.headers.origin || 'unknown'}`);
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      libInitialized: !!yahooFinance,
      build: "1.7.5-V16-LOCK-FIX"
    });
  });

  // API Route: Real-time Quote Proxy
  app.get("/api/quote/:ticker/", async (req, res) => {
    const { ticker } = req.params;
    try {
      const tickerUpper = (ticker || "").toString().toUpperCase();
      console.log(`[API Request] Ticker: ${tickerUpper} | Init: ${typeof yahooFinance} (HasQuote: ${!!yahooFinance?.quote})`);
      
      if (!yahooFinance || typeof yahooFinance.quote !== 'function') {
        throw new Error(`Yahoo Finance library initialization failure. State: ${typeof yahooFinance}`);
      }

      const result = await yahooFinance.quote(tickerUpper) as any;
      
      if (!result) {
        return res.status(404).json({ error: "Ticker not found" });
      }

      // Robust price selection (Current Market -> Post Market -> Previous Close)
      const price = result.regularMarketPrice ?? 
                   result.postMarketPrice ?? 
                   result.preMarketPrice ?? 
                   result.regularMarketPreviousClose;

      const change = result.regularMarketChange ?? result.postMarketChange ?? 0;
      const changePercent = result.regularMarketChangePercent ?? result.postMarketChangePercent ?? 0;

      res.json({
        price: price,
        change: change,
        changePercent: `${changePercent.toFixed(2)}%`,
        previousClose: result.regularMarketPreviousClose,
        name: result.longName || result.shortName || tickerUpper,
        source: 'YAHOO_FINANCE',
        version: '1.7.5-V16-LOCK-FIX',
        timestamp: new Date().toISOString(),
        marketState: result.marketState,
        rawResponse: {
           price: result.regularMarketPrice,
           post: result.postMarketPrice,
           state: result.marketState
        }
      });
    } catch (error: any) {
      console.error(`[API Error] Failed to fetch ${ticker}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
