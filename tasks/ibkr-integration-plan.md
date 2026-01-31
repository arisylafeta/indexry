# Indexry - @stoqey/ib Integration Plan

**Goal:** Replace the mock IBKR client with a real @stoqey/ib implementation for live trading with TWS
**Approach:** Install library, refactor client class, update API routes, test connection
**Estimated Total Time:** 45-60 minutes

---

## Checkpoint 1: Library Installation & Setup
*~10 minutes*

- [ ] Task 1: Install @stoqey/ib package
  - **Action:** Run `npm install @stoqey/ib` in projects/indexry
  - **Verify:** Check package.json for @stoqey/ib in dependencies

- [ ] Task 2: Install types (if needed separately)
  - **Action:** Check if types are included, install @types/node if needed
  - **Verify:** No TypeScript errors on import

- [ ] Task 3: Update .gitignore if needed
  - **Action:** Ensure no new files will accidentally commit
  - **Verify:** git status shows only expected changes

---

## Checkpoint 2: Refactor IBKR Client Library
*~20 minutes*

- [ ] Task 1: Rewrite src/lib/ibkr.ts with @stoqey/ib
  - **Action:** Replace mock WebSocket code with real IBApi class
  - **Key components:**
    - Import { IBApi, EventName, Order, OrderAction, OrderType, SecType } from "@stoqey/ib"
    - Implement connection with proper event handlers
    - Add placeOrder with real Order object
    - Add getPortfolio using reqPositions and reqAccountUpdates
    - Add getMarketData for live prices
  - **Verify:** TypeScript compiles without errors

- [ ] Task 2: Add connection configuration
  - **Action:** Create config object for TWS connection settings
  - **Settings:**
    - host: '127.0.0.1'
    - port: 7497 (paper) / 7496 (live)
    - clientId: 0 (or random to avoid conflicts)
  - **Verify:** Config is typed and exported

- [ ] Task 3: Implement event handlers
  - **Action:** Map IB events to our EventEmitter pattern
  - **Events:**
    - EventName.connected → emit('connected')
    - EventName.disconnected → emit('disconnected')
    - EventName.error → emit('error')
    - EventName.orderStatus → emit('orderStatus')
    - EventName.position → emit('position')
    - EventName.accountUpdate → emit('accountUpdate')
  - **Verify:** All events properly typed

---

## Checkpoint 3: Update API Routes
*~15 minutes*

- [ ] Task 1: Update /api/ibkr/connect/route.ts
  - **Action:** Use real connect() method instead of mock
  - **Verify:** Returns actual connection status from TWS

- [ ] Task 2: Update /api/indices/[id]/rebalance/route.ts
  - **Action:** Replace mock trade execution with real IBKR placeOrder
  - **Verify:** Orders are submitted to TWS, not just logged

- [ ] Task 3: Add error handling for IBKR-specific errors
  - **Action:** Catch and map IB error codes to user-friendly messages
  - **Verify:** Common errors (not connected, invalid symbol, etc.) return 400/500 with clear messages

---

## Checkpoint 4: Testing & Verification
*~10 minutes*

- [ ] Task 1: Create test connection script
  - **Action:** Add scripts/test-ibkr.js to verify connection
  - **Script:** Connects, gets server time, disconnects
  - **Verify:** Script runs without errors when TWS is running

- [ ] Task 2: Test with mock mode fallback
  - **Action:** Add environment variable IBKR_MOCK=true for testing without TWS
  - **Verify:** App works in mock mode when TWS unavailable

- [ ] Task 3: Update documentation
  - **Action:** Add TWS setup instructions to README or docs/IBKR_SETUP.md
  - **Include:** Port settings, paper trading setup, clientId explanation
  - **Verify:** New user can follow steps to connect

---

## Checkpoint 5: Final Integration
*~5 minutes*

- [ ] Task 1: Commit and push
  - **Action:** git add, commit, push to GitHub
  - **Verify:** All changes on origin/main

- [ ] Task 2: Update PROGRESS.md
  - **Action:** Mark IBKR integration as complete
  - **Verify:** Progress log reflects real implementation

---

## Verification Criteria

- [ ] @stoqey/ib installed and imported
- [ ] IBKR client connects to real TWS (not mock WebSocket)
- [ ] Can place orders through TWS
- [ ] Can get portfolio/positions data
- [ ] Error handling works for common failures
- [ ] Mock fallback available for development
- [ ] Documentation updated
- [ ] All code committed and pushed

---

## Post-Implementation Requirements

**From User:**
- TWS installed and running locally
- Paper trading account credentials
- API enabled in TWS settings (Edit → Global Configuration → API)
- Port 7497 open (default for paper trading)

**Testing Steps:**
1. Start TWS, login to paper trading
2. Enable API (check "ActiveX and Socket Clients")
3. Run `npm run dev`
4. Visit /api/ibkr/connect to test connection
5. Create index, rebalance, verify orders appear in TWS

---

## Execution Options

**Option 1: Single-Agent (this session)** - I execute all tasks sequentially, report at each checkpoint

**Option 2: Dispatch Multiple Agents (parallel)** - Spawn subagents for:
- Checkpoint 1 (Library install)
- Checkpoint 2 (Client refactor)  
- Checkpoint 3 (API updates)

**Which approach?**
