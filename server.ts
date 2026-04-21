import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import YahooFinance from 'yahoo-finance2';
import cors from 'cors';

// yahoo-finance2 v3 uses the default export as the instance
const yahooFinance = new YahooFinance();

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
  // Using Yahoo Finance for superior accuracy and split adjustment
  app.get("/api/quote/:ticker", async (req, res) => {
    const { ticker } = req.params;
    try {
      const tickerUpper = (ticker || "").toString().toUpperCase();
      console.log(`[API Request] Ticker: ${tickerUpper}`);
      
      if (!yahooFinance || typeof yahooFinance.quote !== 'function') {
        throw new Error("Yahoo Finance library not properly initialized");
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
