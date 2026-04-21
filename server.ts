import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import RawYahooFinance from 'yahoo-finance2';
import cors from 'cors';

// Robust initialization for yahoo-finance2 v3 across different module envs
const getYahooInstance = () => {
  try {
    // 1. Try if it's already an instance
    if ((RawYahooFinance as any).quote && typeof (RawYahooFinance as any).quote === 'function') {
      return RawYahooFinance;
    }
    // 2. Try to instantiate if it's a class (default or named)
    const Constructor = (RawYahooFinance as any).default || RawYahooFinance;
    if (typeof Constructor === 'function') {
      return new Constructor();
    }
    // 3. Last fallback
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

  // Enable CORS for frontend flexibility
  app.use(cors());
  
  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      libInitialized: !!yahooFinance
    });
  });

  // API Route: Real-time Quote Proxy
  app.get("/api/quote/:ticker", async (req, res) => {
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

      res.json({
        price: result.regularMarketPrice,
        change: result.regularMarketChange,
        changePercent: `${result.regularMarketChangePercent?.toFixed(2)}%`,
        previousClose: result.regularMarketPreviousClose,
        name: result.longName || result.shortName,
        source: 'YAHOO_FINANCE',
        rawResponse: result
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
