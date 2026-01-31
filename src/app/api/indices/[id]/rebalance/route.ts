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
      const { rebalanceId, useIBKR } = body;
      
      if (!rebalanceId) {
        return NextResponse.json(
          { error: 'rebalanceId is required' },
          { status: 400 }
        );
      }
      
      try {
        await executeRebalancing(rebalanceId, params.id, { useIBKR });
        
        return NextResponse.json({
          success: true,
          message: useIBKR !== false 
            ? 'Rebalancing executed via IBKR' 
            : 'Rebalancing executed (mock mode)'
        });
      } catch (error) {
        // Handle IBKR-specific errors
        const errorMessage = error instanceof Error ? error.message : 'Execution failed';
        
        if (errorMessage.includes('Not connected to IBKR')) {
          return NextResponse.json(
            { 
              error: 'IBKR connection required',
              message: errorMessage,
              suggestion: 'Connect to IBKR first via POST /api/ibkr/connect or set useIBKR: false for mock execution'
            },
            { status: 400 }
          );
        }
        
        throw error;
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "calculate" or "execute"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Rebalancing error:', error);
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Failed to process rebalancing';
    const statusCode = errorMessage.includes('not found') ? 404 : 
                       errorMessage.includes('required') ? 400 : 500;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}
