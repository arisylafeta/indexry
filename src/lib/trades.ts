import { getDB } from './db';
import { Trade } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function createTrade(
  indexId: string,
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  rebalanceId?: string
): Promise<Trade> {
  const db = await getDB();
  const id = uuidv4();
  
  await db.run(
    'INSERT INTO trades (id, index_id, rebalance_id, symbol, side, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, indexId, rebalanceId || null, symbol, side, quantity, 'pending']
  );
  
  return {
    id,
    indexId,
    rebalanceId,
    symbol,
    side,
    quantity,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}

export async function updateTradeStatus(
  id: string,
  status: Trade['status'],
  updates: Partial<Pick<Trade, 'price' | 'ibkrOrderId'>>
): Promise<void> {
  const db = await getDB();
  
  const sets: string[] = ['status = ?'];
  const values: unknown[] = [status];
  
  if (updates.price !== undefined) {
    sets.push('price = ?');
    values.push(updates.price);
  }
  
  if (updates.ibkrOrderId) {
    sets.push('ibkr_order_id = ?');
    values.push(updates.ibkrOrderId);
  }
  
  if (status === 'filled') {
    sets.push('executed_at = ?');
    values.push(new Date().toISOString());
  }
  
  values.push(id);
  
  await db.run(
    `UPDATE trades SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
}

export async function getTrades(indexId: string): Promise<Trade[]> {
  const db = await getDB();
  const rows = await db.all(
    'SELECT * FROM trades WHERE index_id = ? ORDER BY created_at DESC',
    indexId
  );
  
  return rows.map(row => ({
    id: row.id,
    indexId: row.index_id,
    rebalanceId: row.rebalance_id,
    symbol: row.symbol,
    side: row.side,
    quantity: row.quantity,
    price: row.price,
    status: row.status,
    ibkrOrderId: row.ibkr_order_id,
    createdAt: row.created_at,
    executedAt: row.executed_at
  }));
}
