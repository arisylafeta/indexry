import { getDB } from '@/lib/db';
import { Holding } from '@/types';

export async function getHoldings(indexId: string): Promise<Holding[]> {
  const db = await getDB();
  const rows = await db.all(
    'SELECT * FROM holdings WHERE index_id = ? ORDER BY symbol',
    indexId
  );
  
  return rows.map(row => ({
    id: row.id,
    indexId: row.index_id,
    symbol: row.symbol,
    quantity: row.quantity || 0,
    targetWeight: row.target_weight || 0,
    currentWeight: row.current_weight || 0,
    lastPrice: row.last_price || 0,
    marketValue: row.market_value || 0,
    updatedAt: row.updated_at
  }));
}

export async function updateHolding(
  indexId: string,
  symbol: string,
  updates: Partial<Omit<Holding, 'id' | 'indexId' | 'symbol'>>
): Promise<void> {
  const db = await getDB();
  
  const existing = await db.get(
    'SELECT id FROM holdings WHERE index_id = ? AND symbol = ?',
    indexId,
    symbol
  );
  
  if (existing) {
    const sets: string[] = [];
    const values: unknown[] = [];
    
    if (updates.quantity !== undefined) {
      sets.push('quantity = ?');
      values.push(updates.quantity);
    }
    if (updates.targetWeight !== undefined) {
      sets.push('target_weight = ?');
      values.push(updates.targetWeight);
    }
    if (updates.currentWeight !== undefined) {
      sets.push('current_weight = ?');
      values.push(updates.currentWeight);
    }
    if (updates.lastPrice !== undefined) {
      sets.push('last_price = ?');
      values.push(updates.lastPrice);
    }
    if (updates.marketValue !== undefined) {
      sets.push('market_value = ?');
      values.push(updates.marketValue);
    }
    
    sets.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(existing.id);
    
    await db.run(
      `UPDATE holdings SET ${sets.join(', ')} WHERE id = ?`,
      values
    );
  }
}
