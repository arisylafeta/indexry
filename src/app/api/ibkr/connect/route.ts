import { NextResponse } from 'next/server';
import { getIBKRClient, resetIBKRClient } from '@/lib/ibkr';

// IBKR Error code mapping to user-friendly messages
const IBKR_ERROR_MESSAGES: Record<number, string> = {
  502: 'Cannot connect to TWS. Make sure TWS is running and API is enabled.',
  503: 'TWS is not responding. Check TWS API settings (Edit > Global Configuration > API).',
  504: 'Not connected to TWS.',
  505: 'Fatal error: TWS connection lost.',
  200: 'Order rejected - No security definition found for symbol.',
  201: 'Order rejected - Order expired.',
  321: 'Server error when validating order.',
  399: 'Warning: Order size exceeds IB preset size.',
  100: 'Max rate of messages per second has been exceeded.',
};

function getErrorMessage(error: Error): { message: string; code?: number } {
  const errorStr = error.message;
  
  // Try to extract error code from message (format often includes code number)
  const codeMatch = errorStr.match(/(\d{3})/);
  const code = codeMatch ? parseInt(codeMatch[1]) : undefined;
  
  if (code && IBKR_ERROR_MESSAGES[code]) {
    return { message: IBKR_ERROR_MESSAGES[code], code };
  }
  
  // Default messages for common errors
  if (errorStr.includes('ECONNREFUSED')) {
    return { message: 'Cannot connect to TWS. Make sure TWS is running on port 7497 (paper) or 7496 (live).' };
  }
  if (errorStr.includes('ETIMEDOUT') || errorStr.includes('timeout')) {
    return { message: 'Connection timed out. Check TWS API settings and firewall.' };
  }
  
  return { message: errorStr };
}

export async function POST() {
  try {
    const client = getIBKRClient();
    
    // Reset client if previously disconnected to ensure clean state
    if (client.getStatus().status === 'disconnected' && client.getStatus().error) {
      resetIBKRClient();
    }
    
    const freshClient = getIBKRClient();
    await freshClient.connect();
    
    return NextResponse.json({ 
      success: true, 
      status: 'connected',
      message: 'Connected to IBKR TWS',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('IBKR connection error:', error);
    const { message, code } = error instanceof Error ? getErrorMessage(error) : { message: 'Unknown error' };
    
    return NextResponse.json(
      { 
        error: 'Failed to connect to IBKR',
        message,
        code,
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
