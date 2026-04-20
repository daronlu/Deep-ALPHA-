/**
 * Financial Service - Bridge for Real-time Data
 * Current Strategy: Patterns for Alpha Vantage / Yahoo Finance
 */

export interface StockQuote {
  price: number;
  change: string;
  changePercent: string;
  source: 'ALPHA_VANTAGE' | 'MOCK';
  error?: string;
  rawResponse?: any; // Added for debugging/trust
}

export const financialService = {
  /**
   * Fetches real-time price using our custom server proxy (Yahoo Finance)
   * Enhanced for GitHub Pages compatibility: Detects environment and uses the cloud bridge if needed.
   */
  async fetchRealtimeQuote(ticker: string): Promise<StockQuote | null> {
    try {
      // Logic for GitHub Pages & Static Hosting:
      // If we are on static host, we must point to the persistent Cloud Run server.
      const isStaticHost = window.location.hostname.includes('github.io');
      const apiBase = isStaticHost 
        ? 'https://ais-pre-jemxfwymhbfqgg3ycwaugd-313767379334.asia-northeast1.run.app' // Persistent Cloud Bridge
        : ''; // Relative for local/dev
        
      const response = await fetch(`${apiBase}/api/quote/${ticker}`);
      if (!response.ok) {
        const errorData = await response.json();
        return {
          price: 0,
          change: '0',
          changePercent: '0%',
          source: 'MOCK',
          error: errorData.error || 'SERVER_ERROR'
        };
      }
      
      const data = await response.json();
      
      return {
        price: data.price,
        change: data.change?.toString() || '0',
        changePercent: data.changePercent || '0%',
        source: 'ALPHA_VANTAGE', // Keeping for UI compatibility
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
