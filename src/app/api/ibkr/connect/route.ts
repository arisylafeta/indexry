import { NextResponse } from 'next/server';
import { getIBKRClient } from '@/lib/ibkr';

export async function POST() {
  try {
    const client = getIBKRClient();
    await client.connect();
    
    return NextResponse.json({ 
      success: true, 
      status: 'connected',
      message: 'Connected to IBKR TWS'
    });
  } catch (error) {
    console.error('IBKR connection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to IBKR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const client = getIBKRClient();
    client.disconnect();
    
    return NextResponse.json({ 
      success: true, 
      status: 'disconnected',
      message: 'Disconnected from IBKR TWS'
    });
  } catch (error) {
    console.error('IBKR disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = getIBKRClient();
    const status = client.getStatus();
    
    return NextResponse.json({ status });
  } catch (error) {
    console.error('IBKR status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
