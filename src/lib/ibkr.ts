import { EventEmitter } from 'events';
import { IBApi, EventName, Order as IBOrder, OrderAction, OrderType, SecType } from '@stoqey/ib';

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

interface IBOrderStatus {
  orderId: number;
  status: string;
  filled: number;
  remaining: number;
  avgFillPrice: number;
  permId: number;
  parentId: number;
  lastFillPrice: number;
  clientId: number;
  whyHeld: string;
  mktCapPrice: number;
}

interface IBPosition {
  account: string;
  contract: {
    conId: number;
    symbol: string;
    secType: string;
    exchange?: string;
    currency?: string;
  };
  pos: number;
  avgCost: number;
}

interface PortfolioPosition {
  symbol: string;
  quantity: number;
  marketPrice: number;
  marketValue: number;
  unrealizedPnL: number;
}

class IBKRClient extends EventEmitter {
  private config: IBKRConfig;
  private connection: IBKRConnection = { status: 'disconnected' };
  private api: IBApi | null = null;
  private positions: Map<string, IBPosition> = new Map();
  private orderStatuses: Map<number, IBOrderStatus> = new Map();
  private nextOrderId: number = 1;
  private accountValues: Map<string, { value: string; currency: string }> = new Map();
  private mockMode: boolean = false;
  private mockOrders: Map<string, any> = new Map();

  constructor(config: IBKRConfig = {
    host: '127.0.0.1',
    port: 7497,
    clientId: Math.floor(Math.random() * 1000) // Random clientId to avoid conflicts
  }) {
    super();
    this.config = config;
    // Check environment variable for mock mode
    this.mockMode = process.env.IBKR_MOCK === 'true' || process.env.IBKR_MOCK === '1';
  }

  /**
   * Enable or disable mock mode
   * In mock mode, all operations succeed without connecting to TWS
   */
  setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  async connect(): Promise<void> {
    if (this.connection.status === 'connected') {
      return;
    }

    // Mock mode - simulate connection
    if (this.mockMode) {
      this.connection.status = 'connected';
      this.connection.accountId = 'MOCK_ACCOUNT';
      this.emit('status', this.connection);
      this.emit('connected');
      console.log('[IBKR] Mock mode: Simulated connection established');
      return;
    }

    this.connection.status = 'connecting';
    this.emit('status', this.connection);

    return new Promise((resolve, reject) => {
      try {
        this.api = new IBApi({
          host: this.config.host,
          port: this.config.port,
          clientId: this.config.clientId
        });

        // Connection event handlers
        this.api.on(EventName.connected, () => {
          this.connection.status = 'connected';
          this.emit('status', this.connection);
          this.emit('connected');
          resolve();
        });

        this.api.on(EventName.disconnected, () => {
          this.connection.status = 'disconnected';
          this.emit('status', this.connection);
          this.emit('disconnected');
        });

        this.api.on(EventName.error, (err: Error, code: number, reqId: number) => {
          console.error('IBKR Error:', err.message, 'Code:', code, 'ReqId:', reqId);
          this.emit('error', { message: err.message, code, reqId });
          
          // Reject connect promise if not yet connected
          if (this.connection.status === 'connecting') {
            this.connection.status = 'disconnected';
            this.connection.error = err.message;
            reject(err);
          }
        });

        // Order status handler
        (this.api as any).on(EventName.orderStatus, (orderId: number, status: string, filled: number, remaining: number, avgFillPrice: number, permId: number, parentId: number, lastFillPrice: number, clientId: number, whyHeld: string, mktCapPrice: number) => {
          this.orderStatuses.set(orderId, {
            orderId, status, filled, remaining, avgFillPrice, permId, parentId, lastFillPrice, clientId, whyHeld, mktCapPrice
          });
          this.emit('orderStatus', { orderId, status, filled, remaining, avgFillPrice });
        });

        // Position handler
        (this.api as any).on(EventName.position, (account: string, contract: any, pos: number, avgCost: number) => {
          const position: IBPosition = { account, contract, pos, avgCost };
          this.positions.set(contract.symbol, position);
          this.emit('position', { symbol: contract.symbol, quantity: pos, averageCost: avgCost });
        });

        // Account updates
        this.api.on(EventName.updateAccountValue, (key: string, value: string, currency: string, accountName: string) => {
          this.accountValues.set(key, { value, currency });
          this.emit('accountUpdate', { account: accountName, key, value, currency });
        });

        // Next valid order ID
        this.api.on(EventName.nextValidId, (orderId: number) => {
          this.nextOrderId = orderId;
        });

        // Connect to TWS
        this.api.connect();

        // Set connection timeout
        setTimeout(() => {
          if (this.connection.status === 'connecting') {
            this.connection.status = 'disconnected';
            this.connection.error = 'Connection timeout';
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.connection.status = 'disconnected';
        this.connection.error = error instanceof Error ? error.message : 'Connection failed';
        this.emit('status', this.connection);
        this.emit('error', this.connection.error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.mockMode) {
      this.connection.status = 'disconnected';
      this.emit('status', this.connection);
      this.emit('disconnected');
      console.log('[IBKR] Mock mode: Simulated disconnection');
      return;
    }

    if (this.api) {
      this.api.disconnect();
      this.api = null;
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

    // Mock mode - simulate order placement
    if (this.mockMode) {
      const orderId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockOrder = {
        orderId,
        ...order,
        status: 'filled',
        timestamp: new Date().toISOString()
      };
      this.mockOrders.set(orderId, mockOrder);
      console.log(`[IBKR] Mock order placed: ${order.side.toUpperCase()} ${order.quantity} ${order.symbol}`);
      
      // Emit mock events
      setTimeout(() => {
        this.emit('orderStatus', { 
          orderId, 
          status: 'Filled', 
          filled: order.quantity, 
          remaining: 0, 
          avgFillPrice: 150.00 // Mock price
        });
      }, 100);
      
      return {
        orderId,
        status: 'filled'
      };
    }

    if (!this.api) {
      throw new Error('IBApi not initialized');
    }

    const orderId = this.nextOrderId++;

    // Create contract for US stock
    const contract = {
      symbol: order.symbol,
      secType: SecType.STK,
      exchange: 'SMART',
      currency: 'USD'
    };

    // Create IB Order
    const ibOrder: IBOrder = {
      orderId,
      action: order.side === 'buy' ? OrderAction.BUY : OrderAction.SELL,
      totalQuantity: order.quantity,
      orderType: order.orderType === 'market' ? OrderType.MKT : OrderType.LMT,
      lmtPrice: order.orderType === 'limit' ? order.limitPrice : undefined,
      transmit: true
    };

    // Place the order
    this.api.placeOrder(orderId, contract as any, ibOrder);

    return {
      orderId: orderId.toString(),
      status: 'submitted'
    };
  }

  async getPortfolio(): Promise<PortfolioPosition[]> {
    if (this.connection.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    // Mock mode - return mock portfolio
    if (this.mockMode) {
      return [
        { symbol: 'AAPL', quantity: 100, marketPrice: 175.50, marketValue: 17550, unrealizedPnL: 550 },
        { symbol: 'MSFT', quantity: 50, marketPrice: 380.25, marketValue: 19012.50, unrealizedPnL: 312.50 },
        { symbol: 'GOOGL', quantity: 25, marketPrice: 142.80, marketValue: 3570, unrealizedPnL: -120 }
      ];
    }

    if (!this.api) {
      throw new Error('IBApi not initialized');
    }

    // Request positions
    this.api.reqPositions();

    // Wait briefly for positions to arrive
    await new Promise(resolve => setTimeout(resolve, 500));

    const portfolio: PortfolioPosition[] = [];
    
    Array.from(this.positions.entries()).forEach(([symbol, position]) => {
      portfolio.push({
        symbol,
        quantity: position.pos,
        marketPrice: 0, // Would need to request market data
        marketValue: position.pos * position.avgCost, // Simplified
        unrealizedPnL: 0 // Would need market data
      });
    });

    return portfolio;
  }

  async getPositions(): Promise<Array<{
    symbol: string;
    quantity: number;
    averageCost: number;
  }>> {
    if (this.connection.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    // Mock mode - return mock positions
    if (this.mockMode) {
      return [
        { symbol: 'AAPL', quantity: 100, averageCost: 170.00 },
        { symbol: 'MSFT', quantity: 50, averageCost: 374.00 },
        { symbol: 'GOOGL', quantity: 25, averageCost: 147.60 }
      ];
    }

    if (!this.api) {
      throw new Error('IBApi not initialized');
    }

    // Request positions
    this.api.reqPositions();

    // Wait briefly for positions to arrive
    await new Promise(resolve => setTimeout(resolve, 500));

    return Array.from(this.positions.values()).map(pos => ({
      symbol: pos.contract.symbol,
      quantity: pos.pos,
      averageCost: pos.avgCost
    }));
  }

  async cancelOrder(orderId: string): Promise<void> {
    if (this.connection.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    if (!this.api) {
      throw new Error('IBApi not initialized');
    }

    this.api.cancelOrder(parseInt(orderId));
  }

  getOrderStatus(orderId: string): IBOrderStatus | undefined {
    return this.orderStatuses.get(parseInt(orderId));
  }
}

let ibkrClient: IBKRClient | null = null;

export function getIBKRClient(config?: IBKRConfig): IBKRClient {
  if (!ibkrClient) {
    ibkrClient = new IBKRClient(config);
  }
  return ibkrClient;
}

export function resetIBKRClient(): void {
  ibkrClient = null;
}

export type { IBKRConfig, IBKRConnection, IBOrderStatus };
export { IBKRClient };
