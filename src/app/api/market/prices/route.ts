import { NextResponse } from 'next/server';
import { getMarketPrices, initMarketPricesTable } from '@/lib/marketData';

export async function GET(request: Request) {
  try {
    await initMarketPricesTable();
    
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'symbols parameter is required' },
        { status: 400 }
      );
    }
    
    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const prices = await getMarketPrices(symbols);
    
    const priceData = Array.from(prices.entries()).map(([symbol, price]) => ({
      symbol,
      price,
      change: 0,
      changePercent: 0,
      timestamp: new Date().toISOString()
    }));
    
    return NextResponse.json({ prices: priceData });
  } catch (error) {
    console.error('Market data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
