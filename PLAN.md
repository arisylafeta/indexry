# Indexry - Portfolio Manager Robo-Advisor

## Project Overview
Custom index generation with automated rebalancing, integrated with Interactive Brokers (paper trading) and TradingView charts.

## MVP Scope (Phase 1)
- Single custom index creation
- Manual rebalancing triggers
- Paper trading via IBKR
- TradingView chart embedding
- Simple rule-based index construction

## Tech Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** SQLite (local) → PostgreSQL (prod)
- **Broker:** Interactive Brokers TWS API (paper trading)
- **Charts:** TradingView widget
- **Scheduling:** node-cron for rebalancing

## Implementation Plan

### Day 1 - Project Setup & Data Model
- [ ] Database schema (indices, holdings, rebalancing history)
- [ ] Basic UI layout (dashboard, index builder)
- [ ] TradingView chart integration

### Day 2 - Index Engine
- [ ] Rule parser/evaluator
- [ ] Symbol universe management
- [ ] Index composition calculator

### Day 3 - IBKR Integration
- [ ] TWS API connection
- [ ] Paper trading account setup
- [ ] Order placement/management
- [ ] Portfolio sync

### Day 4 - Rebalancing Logic
- [ ] Rebalancing calculator
- [ ] Order generation
- [ ] Execution tracking

### Day 5 - Polish & Testing
- [ ] Error handling
- [ ] UI polish
- [ ] Testing with paper trading

## Database Schema

```sql
-- Indices
CREATE TABLE indices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT, -- JSON rules
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Holdings
CREATE TABLE holdings (
  id TEXT PRIMARY KEY,
  index_id TEXT,
  symbol TEXT,
  quantity REAL,
  target_weight REAL,
  current_weight REAL,
  last_price REAL,
  updated_at DATETIME
);

-- Rebalancing History
CREATE TABLE rebalancing (
  id TEXT PRIMARY KEY,
  index_id TEXT,
  status TEXT, -- pending, executed, failed
  orders TEXT, -- JSON
  executed_at DATETIME
);

-- Trades
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  index_id TEXT,
  symbol TEXT,
  side TEXT, -- buy/sell
  quantity REAL,
  price REAL,
  status TEXT,
  ibkr_order_id TEXT,
  executed_at DATETIME
);
```

## API Structure

```
/api
  /indices
    GET    - List all indices
    POST   - Create new index
    /[id]
      GET    - Get index details
      PUT    - Update index
      DELETE - Delete index
      /rebalance
        POST - Trigger rebalancing
      /holdings
        GET  - Current holdings
  /market
    /prices?symbols=AAPL,MSFT - Get current prices
  /ibkr
    /connect    - Connect to TWS
    /disconnect - Disconnect from TWS
    /portfolio   - Get IBKR portfolio
    /orders      - Place orders
```

## File Structure

```
/src
  /app
    /api
      /indices/route.ts
      /indices/[id]/route.ts
      /indices/[id]/rebalance/route.ts
      /market/prices/route.ts
      /ibkr/connect/route.ts
      /ibkr/orders/route.ts
    /dashboard/page.tsx
    /indices/new/page.tsx
    /indices/[id]/page.tsx
    layout.tsx
  /components
    /IndexBuilder.tsx
    /TradingViewChart.tsx
    /HoldingsTable.tsx
    /RebalanceButton.tsx
  /lib
    /db.ts
    /ibkr.ts
    /indexEngine.ts
    /rebalancer.ts
  /types
    /index.ts
```

## Heartbeat Task
- Check: Project progress, IBKR connection status, pending rebalances
- Frequency: Every 10 minutes
- Action: Continue implementation, report progress
