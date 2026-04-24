/**
 * Financial Service - Bridge for Real-time Data
 * Current Strategy: Patterns for Alpha Vantage / Yahoo Finance
 */

export interface StockQuote {
  ticker?: string;
  name?: string;
  price: number;
  change: string;
  changePercent: string;
  previousClose?: number;
  source: 'ALPHA_VANTAGE' | 'YAHOO_FINANCE' | 'MOCK';
  error?: string;
  rawResponse?: any; 
}

export const financialService = {
  /**
   * Fetches real-time price using our custom server proxy (Yahoo Finance)
   */
  async fetchRealtimeQuote(ticker: string): Promise<StockQuote | null> {
    try {
      const hostname = window.location.hostname;
      const isInternal = hostname.includes('run.app') || hostname === 'localhost' || hostname === '127.0.0.1';
      
      const bases = isInternal ? [''] : [
        'https://ais-pre-jemxfwymhbfqgg3ycwaugd-313767379334.asia-northeast1.run.app',
        'https://ais-dev-jemxfwymhbfqgg3ycwaugd-313767379334.asia-northeast1.run.app'
      ];

      let lastError = null;
      for (const base of bases) {
        try {
          const fetchUrl = `${base}/api/quote/${ticker}?t=${Date.now()}`;
          console.log(`[Deep ALPHA] Fetching: ${fetchUrl}`);
          
          const response = await fetch(fetchUrl, {
            mode: 'cors',
            credentials: isInternal ? 'include' : 'omit',
            headers: { 'Accept': 'application/json' }
          });

          if (response.redirected || response.status === 302) {
            lastError = 'AUTH_WALL_DETECTED';
            continue;
          }
          
          if (!response.ok) {
            lastError = `API_${response.status}`;
            continue;
          }

          const data = await response.json();
          return {
            ticker: ticker.toUpperCase(),
            price: data.price || 0,
            change: (data.change || 0).toString(),
            changePercent: data.changePercent || '0%',
            previousClose: data.previousClose || 0,
            name: data.name || ticker,
            source: data.source || 'YAHOO_FINANCE',
            rawResponse: data.rawResponse
          };
        } catch (e: any) {
          lastError = e.message;
        }
      }
      
      throw new Error(lastError || 'CONNECTION_FAILED');
    } catch (error: any) {
      console.error('[Deep ALPHA] Network Error Exception:', error);
      
      // Attempt to diagnose the specific fetch error
      let errorType = 'CONNECTION_FAILED';
      if (error.message.includes('AUTH_WALL_DETECTED')) {
        errorType = 'AUTH_WALL_DETECTED';
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
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
