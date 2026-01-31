import { getDB } from './db';
import { getMarketPrices } from './marketData';
import { createTrade, updateTradeStatus } from './trades';
import { updateHolding } from './holdings';
import { getIBKRClient } from './ibkr';
import { Index, Holding, Order, Trade } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface RebalancingResult {
  rebalanceId: string;
  orders: Order[];
  trades: Trade[];
  totalValue: number;
  targetAllocations: Map<string, number>;
}

export async function calculateRebalancing(
  index: Index,
  currentHoldings: Holding[],
  targetSymbols: string[],
  equalWeight: boolean = true
): Promise<RebalancingResult> {
  const db = await getDB();
  
  // Get current market prices
  const allSymbols = new Set([
    ...currentHoldings.map(h => h.symbol),
    ...targetSymbols
  ]);
  
  const prices = await getMarketPrices(Array.from(allSymbols));
  
  // Calculate current portfolio value
  let totalValue = 0;
  for (const holding of currentHoldings) {
    const price = prices.get(holding.symbol) || holding.lastPrice;
    totalValue += holding.quantity * price;
  }
  
  // Add cash for new positions (assume $100,000 for testing)
  totalValue = Math.max(totalValue, 100000);
  
  // Calculate target allocations
  const targetAllocations = new Map<string, number>();
  const weight = equalWeight ? 1 / targetSymbols.length : 0;
  
  for (const symbol of targetSymbols) {
    targetAllocations.set(symbol, weight);
  }
  
  // Generate orders
  const orders: Order[] = [];
  
  // Sell positions not in target
  for (const holding of currentHoldings) {
    if (!targetAllocations.has(holding.symbol)) {
      orders.push({
        symbol: holding.symbol,
        side: 'sell',
        quantity: holding.quantity,
        orderType: 'market'
      });
    }
  }
  
  // Buy/adjust target positions
  for (const [symbol, targetWeight] of targetAllocations) {
    const price = prices.get(symbol);
    if (!price) continue;
    
    const targetValue = totalValue * targetWeight;
    const targetQuantity = Math.floor(targetValue / price);
    
    const currentHolding = currentHoldings.find(h => h.symbol === symbol);
    const currentQuantity = currentHolding?.quantity || 0;
    
    if (targetQuantity > currentQuantity) {
      orders.push({
        symbol,
        side: 'buy',
        quantity: targetQuantity - currentQuantity,
        orderType: 'market'
      });
    } else if (targetQuantity < currentQuantity) {
      orders.push({
        symbol,
        side: 'sell',
        quantity: currentQuantity - targetQuantity,
        orderType: 'market'
      });
    }
  }
  
  // Create rebalancing record
  const rebalanceId = uuidv4();
  await db.run(
    `INSERT INTO rebalancing (id, index_id, status, orders, total_value_before, created_at) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [rebalanceId, index.id, 'pending', JSON.stringify(orders), totalValue, new Date().toISOString()]
  );
  
  // Create trade records
  const trades: Trade[] = [];
  for (const order of orders) {
    const trade = await createTrade(index.id, order.symbol, order.side, order.quantity, rebalanceId);
    trades.push(trade);
  }
  
  return {
    rebalanceId,
    orders,
    trades,
    totalValue,
    targetAllocations
  };
}

export async function executeRebalancing(
  rebalanceId: string,
  indexId: string,
  options: { useIBKR?: boolean } = {}
): Promise<void> {
  const db = await getDB();
  const useIBKR = options.useIBKR !== false; // Default to true
  
  // Get rebalancing record
  const rebalancing = await db.get(
    'SELECT * FROM rebalancing WHERE id = ?',
    rebalanceId
  );
  
  if (!rebalancing || rebalancing.status !== 'pending') {
    throw new Error('Rebalancing not found or already executed');
  }
  
  // Get pending trades
  const trades = await db.all(
    'SELECT * FROM trades WHERE rebalance_id = ? AND status = ?',
    [rebalanceId, 'pending']
  );
  
  // Get IBKR client if using real orders
  let ibkrClient = null;
  if (useIBKR) {
    ibkrClient = getIBKRClient();
    const status = ibkrClient.getStatus();
    if (status.status !== 'connected') {
      throw new Error('Not connected to IBKR. Please connect first via /api/ibkr/connect');
    }
  }
  
  // Execute each trade
  for (const trade of trades) {
    const price = await getMarketPrice(trade.symbol);
    if (!price) continue;
    
    let ibkrOrderId: string | undefined;
    let executionStatus = 'filled';
    let executionError: string | undefined;
    
    try {
      if (useIBKR && ibkrClient) {
        // Place real order through IBKR
        const orderResult = await ibkrClient.placeOrder({
          symbol: trade.symbol,
          side: trade.side as 'buy' | 'sell',
          quantity: trade.quantity,
          orderType: 'market'
        });
        ibkrOrderId = orderResult.orderId;
        executionStatus = orderResult.status === 'submitted' ? 'submitted' : 'filled';
      } else {
        // Mock execution
        ibkrOrderId = `mock_${Date.now()}_${trade.id}`;
      }
    } catch (error) {
      executionStatus = 'error';
      executionError = error instanceof Error ? error.message : 'Order placement failed';
      console.error(`Failed to place order for ${trade.symbol}:`, error);
    }
    
    // Update trade status
    await updateTradeStatus(trade.id, executionStatus as 'filled' | 'submitted' | 'error', {
      price,
      ibkrOrderId,
      error: executionError
    });
    
    // Only update holdings if trade succeeded or is in mock mode
    if (executionStatus !== 'error') {
      // Update holdings
      const holding = await db.get(
        'SELECT * FROM holdings WHERE index_id = ? AND symbol = ?',
        [indexId, trade.symbol]
      );
      
      if (trade.side === 'buy') {
        if (holding) {
          await updateHolding(indexId, trade.symbol, {
            quantity: holding.quantity + trade.quantity,
            lastPrice: price,
            marketValue: (holding.quantity + trade.quantity) * price
          });
        } else {
          // Create new holding
          const holdingId = uuidv4();
          await db.run(
            `INSERT INTO holdings (id, index_id, symbol, quantity, last_price, market_value, target_weight) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [holdingId, indexId, trade.symbol, trade.quantity, price, trade.quantity * price, 0]
          );
        }
      } else {
        // Sell
        if (holding && holding.quantity > trade.quantity) {
          await updateHolding(indexId, trade.symbol, {
            quantity: holding.quantity - trade.quantity,
            lastPrice: price,
            marketValue: (holding.quantity - trade.quantity) * price
          });
        } else if (holding) {
          // Remove holding completely
          await db.run('DELETE FROM holdings WHERE id = ?', holding.id);
        }
      }
    }
  }
  
  // Update rebalancing status
  await db.run(
    `UPDATE rebalancing SET status = ?, executed_at = ? WHERE id = ?`,
    ['completed', new Date().toISOString(), rebalanceId]
  );
}

async function getMarketPrice(symbol: string): Promise<number | null> {
  const { getMarketPrice: getPrice } = await import('./marketData');
  return getPrice(symbol);
}
