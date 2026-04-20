/**
 * Financial Service - Bridge for Real-time Data
 * Current Strategy: Patterns for Alpha Vantage / Yahoo Finance
 */

interface StockQuote {
  price: number;
  change: string;
  changePercent: string;
}

export const financialService = {
  /**
   * Fetches real-time price using Alpha Vantage
   * Requires VITE_ALPHA_VANTAGE_KEY in .env
   */
  async fetchRealtimeQuote(ticker: string): Promise<StockQuote | null> {
    const apiKey = (import.meta as any).env.VITE_ALPHA_VANTAGE_KEY;
    if (!apiKey) {
      console.warn('API Key missing: please add VITE_ALPHA_VANTAGE_KEY to environment.');
      return null;
    }

    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`
      );
      const data = await response.json();
      
      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) return null;

      return {
        price: parseFloat(quote['05. price']),
        change: quote['09. change'],
        changePercent: quote['10. change percent']
      };
    } catch (error) {
      console.error('Error fetching Alpha Vantage data:', error);
      return null;
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
