import { getDB } from './db';
import { Index, Holding } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function createIndex(
  name: string,
  description: string,
  rules: Index['rules']
): Promise<Index> {
  const db = await getDB();
  const id = uuidv4();
  
  await db.run(
    'INSERT INTO indices (id, name, description, rules) VALUES (?, ?, ?, ?)',
    [id, name, description, JSON.stringify(rules)]
  );
  
  return {
    id,
    name,
    description,
    rules,
    totalValue: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function getIndices(): Promise<Index[]> {
  const db = await getDB();
  const rows = await db.all('SELECT * FROM indices ORDER BY created_at DESC');
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    rules: JSON.parse(row.rules || '[]'),
    totalValue: row.total_value || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function getIndex(id: string): Promise<Index | null> {
  const db = await getDB();
  const row = await db.get('SELECT * FROM indices WHERE id = ?', id);
  
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    rules: JSON.parse(row.rules || '[]'),
    totalValue: row.total_value || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function updateIndex(
  id: string,
  updates: Partial<Omit<Index, 'id' | 'createdAt'>>
): Promise<void> {
  const db = await getDB();
  const sets: string[] = [];
  const values: unknown[] = [];
  
  if (updates.name) {
    sets.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    sets.push('description = ?');
    values.push(updates.description);
  }
  if (updates.rules) {
    sets.push('rules = ?');
    values.push(JSON.stringify(updates.rules));
  }
  if (updates.totalValue !== undefined) {
    sets.push('total_value = ?');
    values.push(updates.totalValue);
  }
  
  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);
  
  await db.run(
    `UPDATE indices SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteIndex(id: string): Promise<void> {
  const db = await getDB();
  await db.run('DELETE FROM holdings WHERE index_id = ?', id);
  await db.run('DELETE FROM trades WHERE index_id = ?', id);
  await db.run('DELETE FROM rebalancing WHERE index_id = ?', id);
  await db.run('DELETE FROM indices WHERE id = ?', id);
}
