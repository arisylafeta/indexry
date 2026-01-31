import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { calculateRebalancing, executeRebalancing } from '@/lib/rebalancer';
import { getIndex } from '@/lib/indices';
import { getHoldings } from '@/lib/holdings';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const index = await getIndex(params.id);
    
    if (!index) {
      return NextResponse.json(
        { error: 'Index not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { action } = body;
    
    if (action === 'calculate') {
      // Calculate rebalancing orders
      const holdings = await getHoldings(params.id);
      
      // Parse rules to get target symbols
      let targetSymbols: string[] = [];
      for (const rule of index.rules) {
        if (rule.type === 'manual' && rule.config.symbols) {
          targetSymbols = rule.config.symbols as string[];
        } else if (rule.type === 'top_n' && rule.config.count) {
          // For now, use mock symbols for top_n
          targetSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'WMT'];
        }
      }
      
      const result = await calculateRebalancing(index, holdings, targetSymbols);
      
      return NextResponse.json({
        rebalanceId: result.rebalanceId,
        orders: result.orders,
        totalValue: result.totalValue,
        targetAllocations: Object.fromEntries(result.targetAllocations)
      });
    } else if (action === 'execute') {
      // Execute rebalancing
      const { rebalanceId } = body;
      
      if (!rebalanceId) {
        return NextResponse.json(
          { error: 'rebalanceId is required' },
          { status: 400 }
        );
      }
      
      await executeRebalancing(rebalanceId, params.id);
      
      return NextResponse.json({
        success: true,
        message: 'Rebalancing executed successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "calculate" or "execute"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Rebalancing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process rebalancing' },
      { status: 500 }
    );
  }
}
