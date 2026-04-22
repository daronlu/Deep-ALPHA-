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
      const hostname = window.location.hostname;
      // In development or preview on AIS, use relative paths. 
      // For GitHub Pages or custom domains, use the explicit bridge URL.
      const isInternal = hostname.includes('run.app') || hostname === 'localhost' || hostname === '127.0.0.1';
      
      const apiBase = !isInternal 
        ? 'https://ais-pre-jemxfwymhbfqgg3ycwaugd-313767379334.asia-northeast1.run.app'
        : '';
        
      // Use trailing slash to avoid 301/302 redirects from cloud proxies
      const fetchUrl = `${apiBase}/api/quote/${ticker}/?t=${Date.now()}`;
      console.log(`[Deep ALPHA DEBUG] Host: ${hostname} | Fetching: ${fetchUrl}`);
      
      const response = await fetch(fetchUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.redirected) {
        throw new Error('AUTH_WALL_DETECTED: Server redirected to Google Login.');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Deep ALPHA] API Error (${response.status}):`, errorText);
        return {
          price: 0,
          change: '0',
          changePercent: '0%',
          source: 'MOCK',
          error: `API_ERROR_${response.status}`
        };
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          price: 0,
          change: '0',
          changePercent: '0%',
          source: 'MOCK',
          error: 'INVALID_RESPONSE_TYPE'
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
    } catch (error: any) {
      console.error('[Deep ALPHA] Network Error Exception:', error);
      
      // Attempt to diagnose the specific fetch error
      let errorType = 'CONNECTION_FAILED';
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorType = 'CORS_OR_NETWORK_ERROR';
      } else if (error.name === 'AbortError') {
        errorType = 'TIMEOUT';
      }

      return {
        price: 0,
        change: '0',
        changePercent: '0%',
        source: 'MOCK',
        error: `${errorType}: ${error.message || 'Unknown'}`
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
