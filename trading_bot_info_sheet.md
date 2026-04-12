# Trading Bot — Complete Technical Information Sheet

> Last Updated: 2026-04-12
> Compiled by: Tiwari (AI Agent)

---

## 1. WHAT IS THIS?

Two related projects on the VPS:

| Project | Location | Purpose |
|---|---|---|
| Universal Trading Bot | `/root/clawd/universal-trading-bot/` | Core trading engine (Node.js + ccxt) |
| Trading Dashboard | `/root/clawd/trading-dashboard/` | Web UI (React frontend + Express backend) |

**Website URL:** `https://zummp.com/trading/` → Proxies to port **3005**

> ⚠️ **Current Status:** Trading bot and dashboard are NOT currently running (port 3005 not listening)

---

## 2. UNIVERSAL TRADING BOT

**Path:** `/root/clawd/universal-trading-bot/`

### Tech Stack
| Component | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Exchange Library | ccxt (unified API for crypto/forex/stocks) |
| Exchanges Supported | Binance, OANDA (Forex), Zerodha (Stocks) |
| Modes | Demo/Paper, Testnet, Live |

### Supported Platforms
- **Crypto** — Binance (live + testnet)
- **Forex** — OANDA
- **Stocks** — Zerodha

### Trading Strategies Available
- Trend Following
- Mean Reversion
- Breakout
- Scalping

### Key Features
- AI-powered decision making with knowledge base
- News sentiment analysis
- Advanced risk management (VaR, CVaR, Sharpe Ratio, Sortino, drawdown limits)
- Paper + Live trading mode switch
- REST API
- Demo mode with $100–$1M virtual balance (no API keys needed)

### Commands
```bash
cd /root/clawd/universal-trading-bot/

npm start              # Start bot (auto-selects crypto)
PLATFORM=crypto npm start
PLATFORM=forex npm start
PLATFORM=stocks npm start

TRADING_MODE=testnet npm start  # Testnet mode
TRADING_MODE=live npm start    # Live trading

npm run analyze:market  # Market analysis
npm run backtest:crypto # Backtest crypto strategies
```

### Dashboard URL (when running)
- Dashboard: **http://localhost:3020**

### ⚠️ Issues / TODO (Before Running)
1. **Missing Binance API keys** — Bot needs `BINANCE_API_KEY` + `BINANCE_SECRET_KEY` in `.env`
2. **Missing crypto adapter** — `src/platforms/crypto/CryptoPlatformAdapter.js` path issue
3. **No `.env` file** — Need to create from `.env.example`

---

## 3. TRADING DASHBOARD

**Path:** `/root/clawd/trading-dashboard/`

### Structure
```
trading-dashboard/
├── backend/          # Express.js API server
├── frontend/         # React frontend
├── docker-compose.yml
├── deploy.sh
└── simple-dashboard.html
```

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Express.js |
| Database | (to be confirmed) |
| Real-time | WebSocket/Socket.io |

### Commands
```bash
cd /root/clawd/trading-dashboard/

# Full dev (frontend + backend)
npm run dev

# Backend only
npm run server

# Frontend only
npm run client

# Build frontend
npm run build

# Docker
docker-compose up -d
docker-compose logs -f
```

---

## 4. ENVIRONMENT CONFIGURATION

### Required `.env` for Universal Trading Bot
Create `/root/clawd/universal-trading-bot/.env` from `.env.example`:

```env
# BINANCE API KEYS
# Get from: https://www.binance.com/en/my/settings/api-management
BINANCE_API_KEY=your_api_key_here
BINANCE_SECRET_KEY=your_secret_key_here

# TRADING MODE
# Options: testnet | live
TRADING_MODE=testnet

# PLATFORM
# Options: crypto | forex | stocks
PLATFORM=crypto

# INITIAL CAPITAL (USDT)
INITIAL_CAPITAL=1000

# PORT (Dashboard)
PORT=3020

# LOG LEVEL
LOG_LEVEL=info
```

### For Demo Mode (No API Keys)
```bash
# Leave API keys blank → runs in DEMO mode with virtual balance
BINANCE_API_KEY=
BINANCE_SECRET_KEY=
TRADING_MODE=testnet
```

---

## 5. HOW TO START (Step by Step)

### Step 1: Setup
```bash
cd /root/clawd/universal-trading-bot/
cp .env.example .env
nano .env  # Add API keys if live/testnet
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Bot + Dashboard
```bash
npm start
# Dashboard at http://localhost:3020
```

### Step 4: Make Available via Nginx
- Currently: `https://zummp.com/trading/` → `http://127.0.0.1:3005`
- But bot runs on port **3020**, not 3005
- Need to either:
  - Change bot port to 3005, OR
  - Update nginx config to proxy to 3020

### Step 5: Update Nginx (if needed)
```bash
# Add to /etc/nginx/sites-enabled/zummp-ssl
location /trading/ {
    proxy_pass http://127.0.0.1:3020/;
    proxy_set_header Host $host;
    proxy_http_version 1.1;
}
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. CURRENT ISSUES

| # | Issue | Fix Needed |
|---|---|---|
| 1 | Port 3005 not listening | Start the trading bot service |
| 2 | Bot port is 3020, nginx proxies to 3005 | Fix port mismatch |
| 3 | Missing `.env` config | Create `.env` file |
| 4 | Missing API keys | Get from Binance account |
| 5 | CryptoPlatformAdapter path error | Fix require path in `src/index.js` |
| 6 | Dashboard not running | Need PM2 or systemd service setup |

### Quick Fix for Port 3005 Issue
```bash
# Option A: Change bot to use port 3005
PORT=3005 npm start

# Option B: Use PM2 to manage both services
cd /root/clawd/trading-dashboard/
PORT=3005 npm start &
cd /root/clawd/universal-trading-bot/
PORT=3020 npm start &
pm2 start ecosystem.config.js
```

---

## 7. IMPORTANT NOTES

- **Never share API keys** — Use environment variables, never hardcode
- **Testnet first** — Always test with testnet before going live
- **Risk management** — Bot has VaR/CVaR but always monitor manually
- **No live trading** without proper API keys and testing

---

## 8. QUICK REFERENCE

```
Trading Bot:    /root/clawd/universal-trading-bot/
Dashboard:      /root/clawd/trading-dashboard/
Bot Port:       3020 (default)
Dashboard Port: 3005 (nginx proxied)
Website URL:    https://zummp.com/trading/
Exchanges:      Binance, OANDA, Zerodha
Demo Balance:   $100–$1M virtual
Trading Modes:  Demo / Testnet / Live
```

---

## 9. TO DO — BEFORE LIVE TRADING

- [ ] Get Binance API keys (with trading permission)
- [ ] Create `.env` file with API keys
- [ ] Fix `CryptoPlatformAdapter` import path
- [ ] Start bot on correct port (3005 or update nginx)
- [ ] Test with `TRADING_MODE=testnet` first
- [ ] Verify nginx proxy to `/trading/` works
- [ ] Set up PM2 to keep bot running after reboot
- [ ] Add Zerodha/OANDA credentials for forex/stocks
