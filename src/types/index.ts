export interface Index {
  id: string;
  name: string;
  description?: string;
  rules: IndexRule[];
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface IndexRule {
  type: 'top_n' | 'market_cap' | 'momentum' | 'manual';
  config: Record<string, unknown>;
}

export interface Holding {
  id: string;
  indexId: string;
  symbol: string;
  quantity: number;
  targetWeight: number;
  currentWeight: number;
  lastPrice: number;
  marketValue: number;
  updatedAt: string;
}

export interface Rebalancing {
  id: string;
  indexId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  orders: Order[];
  totalValueBefore?: number;
  totalValueAfter?: number;
  createdAt: string;
  executedAt?: string;
}

export interface Order {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
}

export interface Trade {
  id: string;
  indexId: string;
  rebalanceId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  status: 'pending' | 'filled' | 'partial' | 'failed';
  ibkrOrderId?: string;
  createdAt: string;
  executedAt?: string;
}
