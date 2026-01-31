import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    const { orders } = await request.json();
    
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: 'Orders array is required' },
        { status: 400 }
      );
    }
    
    // Create rebalancing record
    const rebalanceId = uuidv4();
    await db.run(
      'INSERT INTO rebalancing (id, index_id, status, orders) VALUES (?, ?, ?, ?)',
      [rebalanceId, params.id, 'pending', JSON.stringify(orders)]
    );
    
    // Create trade records
    for (const order of orders) {
      const tradeId = uuidv4();
      await db.run(
        'INSERT INTO trades (id, index_id, rebalance_id, symbol, side, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [tradeId, params.id, rebalanceId, order.symbol, order.side, order.quantity, 'pending']
      );
    }
    
    return NextResponse.json({ 
      rebalanceId,
      status: 'pending',
      message: 'Rebalancing created. Connect to IBKR to execute.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating rebalancing:', error);
    return NextResponse.json(
      { error: 'Failed to create rebalancing' },
      { status: 500 }
    );
  }
}
