import { getDB } from './db';

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

// Simple mock market data service
// In production, this would connect to IBKR market data or a provider like Polygon.io
export async function getMarketPrice(symbol: string): Promise<number | null> {
  try {
    // Check cache first
    const db = await getDB();
    const cached = await db.get(
      'SELECT price, updated_at FROM market_prices WHERE symbol = ?',
      symbol.toUpperCase()
    );
    
    // If cache is less than 5 minutes old, use it
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      if (cacheAge < 5 * 60 * 1000) {
        return cached.price;
      }
    }
    
    // For now, return mock prices based on symbol hash
    // This ensures consistent prices for testing
    const mockPrice = generateMockPrice(symbol);
    
    // Update cache
    await db.run(
      `INSERT INTO market_prices (symbol, price, updated_at) 
       VALUES (?, ?, ?) 
       ON CONFLICT(symbol) DO UPDATE SET 
       price = excluded.price, updated_at = excluded.updated_at`,
      [symbol.toUpperCase(), mockPrice, new Date().toISOString()]
    );
    
    return mockPrice;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

export async function getMarketPrices(symbols: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  await Promise.all(
    symbols.map(async (symbol) => {
      const price = await getMarketPrice(symbol);
      if (price !== null) {
        prices.set(symbol.toUpperCase(), price);
      }
    })
  );
  
  return prices;
}

// Generate a consistent mock price based on symbol
function generateMockPrice(symbol: string): number {
  const hash = symbol.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Generate price between $10 and $500
  return Math.round((10 + (hash % 490) + Math.random() * 5) * 100) / 100;
}

// Initialize market prices table
export async function initMarketPricesTable(): Promise<void> {
  const db = await getDB();
  await db.run(`
    CREATE TABLE IF NOT EXISTS market_prices (
      symbol TEXT PRIMARY KEY,
      price REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
