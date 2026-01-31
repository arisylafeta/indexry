# TWS/IB Gateway Setup Guide

This guide explains how to set up Interactive Brokers TWS (Trader Workstation) or IB Gateway for use with Indexry.

## Prerequisites

- Interactive Brokers account (paper trading recommended for testing)
- TWS or IB Gateway installed
- Node.js and the Indexry application running

## Installation

### Option 1: TWS (Trader Workstation)

1. Download TWS from: https://www.interactivebrokers.com/en/index.php?f=16457
2. Install and launch TWS
3. Log in with your paper trading or live account credentials

### Option 2: IB Gateway (Lightweight)

1. Download IB Gateway from: https://www.interactivebrokers.com/en/index.php?f=16457
2. Install and launch IB Gateway
3. Log in with your credentials

## API Configuration

### Enable API in TWS

1. In TWS, go to **Edit** → **Global Configuration** (or press Ctrl+Alt+G)
2. Navigate to **API** → **Settings**
3. Check the following:
   - ✅ **Enable ActiveX and Socket Clients**
   - **Socket port**: `7497` (paper trading) or `7496` (live trading)
   - ✅ **Allow connections from localhost only** (recommended for security)
   - **Master API Client ID**: `0` (or leave empty)
   - **Create API message log**: Optional

4. Click **Apply** and **OK**

### API Configuration Screenshot Reference

```
┌─────────────────────────────────────────────────────────────┐
│  API Settings                                               │
├─────────────────────────────────────────────────────────────┤
│  ☑ Enable ActiveX and Socket Clients                       │
│                                                             │
│  Socket port: [7497]                                        │
│                                                             │
│  ☑ Allow connections from localhost only                   │
│                                                             │
│  Master API Client ID: [0]                                  │
└─────────────────────────────────────────────────────────────┘
```

## Connection Ports

| Environment | Port | Use Case |
|-------------|------|----------|
| Paper Trading | `7497` | Testing and development |
| Live Trading | `7496` | Production trading (use with caution) |
| IB Gateway Paper | `4002` | Lightweight paper trading |
| IB Gateway Live | `4001` | Lightweight live trading |

## Testing the Connection

### 1. Start TWS/IB Gateway

- Launch TWS and log in
- Wait for the application to fully load (green "Ready" indicator)

### 2. Run the Test Script

```bash
# Test real connection
node scripts/test-ibkr.js

# Test in mock mode (no TWS required)
node scripts/test-ibkr.js --mock
```

### 3. Test via API Endpoint

```bash
# Connect to IBKR
curl -X POST http://localhost:3000/api/ibkr/connect

# Check connection status
curl http://localhost:3000/api/ibkr/connect

# Disconnect
curl -X DELETE http://localhost:3000/api/ibkr/connect
```

## Mock Mode

For development without TWS running, use mock mode:

### Environment Variable

```bash
# Linux/Mac
export IBKR_MOCK=true
npm run dev

# Windows PowerShell
$env:IBKR_MOCK="true"
npm run dev

# Windows CMD
set IBKR_MOCK=true
npm run dev
```

### Programmatic Usage

```typescript
import { getIBKRClient } from '@/lib/ibkr';

const client = getIBKRClient();
client.setMockMode(true);
await client.connect(); // Simulates connection

// Orders will be simulated
const result = await client.placeOrder({
  symbol: 'AAPL',
  side: 'buy',
  quantity: 100,
  orderType: 'market'
});
```

## Troubleshooting

### Connection Refused Error

```
Error: connect ECONNREFUSED 127.0.0.1:7497
```

**Solutions:**
1. Ensure TWS is running
2. Check API is enabled in TWS settings
3. Verify port number matches (7497 for paper, 7496 for live)
4. Check firewall settings

### Client ID Conflict

```
Error: Duplicate client ID
```

**Solution:**
The client automatically uses a random client ID. If conflicts persist, restart TWS.

### "Not Connected" Error

**Solutions:**
1. Verify TWS is logged in
2. Check API settings are saved
3. Ensure "ActiveX and Socket Clients" is checked
4. Try restarting TWS

### Firewall Issues

If running on a remote server or VM:
1. Uncheck "Allow connections from localhost only" in TWS
2. Add your server's IP to the whitelist (if available)
3. Or use SSH port forwarding:
   ```bash
   ssh -L 7497:localhost:7497 your-server
   ```

## Security Best Practices

1. **Use Paper Trading** for all development and testing
2. **Restrict to Localhost** when possible
3. **Never commit credentials** to version control
4. **Use environment variables** for sensitive configuration
5. **Enable 2FA** on your IB account

## Next Steps

After successful connection:
1. Create an index in Indexry
2. Connect to IBKR: `POST /api/ibkr/connect`
3. Calculate rebalancing: `POST /api/indices/[id]/rebalance` with `{ action: 'calculate' }`
4. Execute trades: `POST /api/indices/[id]/rebalance` with `{ action: 'execute', rebalanceId: '...' }`

For detailed API documentation, see the API routes in `src/app/api/`.
