/**
 * Financial Service - Bridge for Real-time Data
 * Current Strategy: Patterns for Alpha Vantage / Yahoo Finance
 */

export interface StockQuote {
  price: number;
  change: string;
  changePercent: string;
  previousClose?: number;
  source: 'ALPHA_VANTAGE' | 'YAHOO_FINANCE' | 'MOCK';
  error?: string;
  rawResponse?: any; // Added for debugging/trust
}

export const financialService = {
  /**
   * Fetches real-time price using our custom server proxy (Yahoo Finance)
   */
  async fetchRealtimeQuote(ticker: string): Promise<StockQuote | null> {
    try {
      const isStaticHost = window.location.hostname.includes('github.io') || window.location.hostname.includes('vercel.app');
      
      // CRITICAL: Point to the persistent Cloud Bridge for static exports
      const apiBase = isStaticHost 
        ? 'https://ais-pre-jemxfwymhbfqgg3ycwaugd-313767379334.asia-northeast1.run.app'
        : '';
        
      console.log(`[Deep ALPHA] Fetching ${ticker} from ${apiBase || 'local-server'}`);
      
      const response = await fetch(`${apiBase}/api/quote/${ticker}?t=${Date.now()}`); // Added cache-buster
      const contentType = response.headers.get('content-type');
      
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        return {
          price: 0,
          change: '0',
          changePercent: '0%',
          source: 'MOCK',
          error: 'API_UNAVAILABLE'
        };
      }
      
      const data = await response.json();
      
      return {
        price: data.price,
        change: data.change?.toString() || '0',
        changePercent: data.changePercent || '0%',
        previousClose: data.previousClose,
        source: data.source || 'YAHOO_FINANCE',
        rawResponse: data.rawResponse
      };
    } catch (error) {
      console.error('Error fetching data source:', error);
      return {
        price: 0,
        change: '0',
        changePercent: '0%',
        source: 'MOCK',
        error: 'CONNECTION_FAILED'
      };
    }
  },

  /**
   * Mock pattern for rapid local development
   */
  getMockUpdate(basePrice: number) {
    const jitter = (Math.random() - 0.5) * 0.1;
    return basePrice + jitter;
  }
};
