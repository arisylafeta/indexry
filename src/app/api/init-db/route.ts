import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDB();
    
    // Check if tables exist
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('indices', 'holdings', 'rebalancing', 'trades')"
    );
    
    const existingTables = tables.map((t: { name: string }) => t.name);
    
    // Create indices table
    if (!existingTables.includes('indices')) {
      await db.run(`
        CREATE TABLE indices (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          rules TEXT,
          total_value REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Create holdings table
    if (!existingTables.includes('holdings')) {
      await db.run(`
        CREATE TABLE holdings (
          id TEXT PRIMARY KEY,
          index_id TEXT NOT NULL,
          symbol TEXT NOT NULL,
          quantity REAL DEFAULT 0,
          target_weight REAL DEFAULT 0,
          current_weight REAL DEFAULT 0,
          last_price REAL DEFAULT 0,
          market_value REAL DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (index_id) REFERENCES indices(id)
        )
      `);
    }
    
    // Create rebalancing table
    if (!existingTables.includes('rebalancing')) {
      await db.run(`
        CREATE TABLE rebalancing (
          id TEXT PRIMARY KEY,
          index_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          orders TEXT,
          total_value_before REAL,
          total_value_after REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          executed_at DATETIME,
          FOREIGN KEY (index_id) REFERENCES indices(id)
        )
      `);
    }
    
    // Create trades table
    if (!existingTables.includes('trades')) {
      await db.run(`
        CREATE TABLE trades (
          id TEXT PRIMARY KEY,
          index_id TEXT NOT NULL,
          rebalance_id TEXT,
          symbol TEXT NOT NULL,
          side TEXT NOT NULL,
          quantity REAL NOT NULL,
          price REAL,
          status TEXT DEFAULT 'pending',
          ibkr_order_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          executed_at DATETIME,
          FOREIGN KEY (index_id) REFERENCES indices(id),
          FOREIGN KEY (rebalance_id) REFERENCES rebalancing(id)
        )
      `);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized',
      tables: ['indices', 'holdings', 'rebalancing', 'trades']
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
