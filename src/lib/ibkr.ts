import { EventEmitter } from 'events';
import WebSocket from 'ws';

interface IBKRConfig {
  host: string;
  port: number;
  clientId: number;
}

interface IBKRConnection {
  status: 'disconnected' | 'connecting' | 'connected';
  accountId?: string;
  error?: string;
}

class IBKRClient extends EventEmitter {
  private config: IBKRConfig;
  private connection: IBKRConnection = { status: 'disconnected' };
  private ws: WebSocket | null = null;

  constructor(config: IBKRConfig = {
    host: '127.0.0.1',
    port: 7497,
    clientId: 1
  }) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connection.status === 'connected') {
      return;
    }

    this.connection.status = 'connecting';
    this.emit('status', this.connection);

    try {
      // TWS API WebSocket connection
      const wsUrl = `ws://${this.config.host}:${this.config.port}/ws`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        this.connection.status = 'connected';
        this.emit('status', this.connection);
        this.emit('connected');
      });
      
      this.ws.on('error', (error) => {
        this.connection.status = 'disconnected';
        this.connection.error = error.message;
        this.emit('status', this.connection);
        this.emit('error', error.message);
      });
      
      this.ws.on('close', () => {
        this.connection.status = 'disconnected';
        this.emit('status', this.connection);
        this.emit('disconnected');
      });
      
      this.ws.on('message', (data) => {
        this.emit('message', JSON.parse(data.toString()));
      });
      
    } catch (error) {
      this.connection.status = 'disconnected';
      this.connection.error = error instanceof Error ? error.message : 'Connection failed';
      this.emit('status', this.connection);
      this.emit('error', this.connection.error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connection.status = 'disconnected';
    this.emit('status', this.connection);
    this.emit('disconnected');
  }

  getStatus(): IBKRConnection {
    return { ...this.connection };
  }

  async placeOrder(order: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    orderType: 'market' | 'limit';
    limitPrice?: number;
  }): Promise<{ orderId: string; status: string }> {
    if (this.connection.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    const orderId = `ibkr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      orderId,
      status: 'submitted'
    };
  }

  async getPortfolio(): Promise<Array<{
    symbol: string;
    quantity: number;
    marketPrice: number;
    marketValue: number;
    unrealizedPnL: number;
  }>> {
    if (this.connection.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    return [];
  }

  async getPositions(): Promise<Array<{
    symbol: string;
    quantity: number;
    averageCost: number;
  }>> {
    if (this.connection.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    return [];
  }
}

let ibkrClient: IBKRClient | null = null;

export function getIBKRClient(config?: IBKRConfig): IBKRClient {
  if (!ibkrClient) {
    ibkrClient = new IBKRClient(config);
  }
  return ibkrClient;
}

export type { IBKRConfig, IBKRConnection };
export { IBKRClient };
