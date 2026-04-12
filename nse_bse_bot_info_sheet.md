# NSE-BSE Trading Bot — Complete Technical Information Sheet

> Last Updated: 2026-04-12
> Compiled by: Tiwari (AI Agent)

---

## 1. OVERVIEW

**Purpose:** AI-powered trading bot specifically for **Indian Stock Markets** — NSE (National Stock Exchange) and BSE (Bombay Stock Exchange)

**Location:** `/root/clawd/nse-bse-bot/`

**Last Run:** April 11, 2026 (stopped at 6:16 AM IST)

**Current Status:** ❌ NOT running (bot stopped, no active process)

---

## 2. TECH STACK

| Component | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Data Source | Yahoo Finance (yfinance), Web Scraping |
| Exchange Library | ccxt (for future broker integration) |
| Dashboard | Express.js + WebSocket + Lightweight Charts |
| AI | Groq API (for AI-powered analysis) |
| Notifications | Telegram (optional) |
| Logging | Winston + file logs |

---

## 3. FEATURES

### Core Trading
- 📊 Real-time price data for NSE/BSE stocks
- 🤖 AI-powered buy/sell signal generation via Groq
- 📰 News sentiment analysis (fetches financial news RSS)
- 📈 Technical analysis (multi-timeframe)
- 🔄 Sector rotation strategy
- 📅 Earnings calendar tracking
- 🎯 Trailing stop management

### Dashboard
- 🌐 Web dashboard (real-time charts)
- 📊 Portfolio tracking
- 📉 P&L monitoring
- 📨 Telegram alerts (optional)

### Data Sources
- Yahoo Finance (yfinance) — stock prices
- News RSS feeds — market sentiment
- Groq AI — market analysis and signals

---

## 4. STOCKS BEING TRACKED (from logs)

Based on error logs, these stocks are being monitored:
- HDFCLIFE.NS (HDFC Life Insurance)
- BAJAJFINSV.NS (Bajaj Finserv)
- SBILIFE.NS (SBI Life Insurance)
- ICICIPRULI.NS (ICICI Prudential Life)
- SHRIRAMFIN.NS (Shriram Finance)
- TCS.NS (Tata Consultancy Services)
- INFY.NS (Infosys)

> Note: Mix of financial sector + IT large-caps — appears to be a diversified watchlist

---

## 5. COMMANDS

```bash
cd /root/clawd/nse-bse-bot/

# Start bot
npm start

# Dev mode (with auto-reload)
npm run dev

# Test system
npm test

# Start dashboard only
npm run dashboard
```

### Bot Cycle
- Runs in cycles (seen in logs: cycle started at 12:43 AM)
- Fetches news → AI analysis → generates signals
- Skips weekends (market closed)

---

## 6. DEPENDENCIES (npm packages)

```
axios          — HTTP requests
ccxt           — Unified exchange API
cheerio        — Web scraping
cors           — CORS middleware
dotenv         — Environment config
express        — Web server
fs-extra       — File operations
lightweight-charts — TradingView-style charts
node-fetch     — Fetch API
rss-parser     — RSS news feed parsing
winston        — Logging
ws             — WebSocket (real-time updates)
yfinance       — Yahoo Finance data
```

---

## 7. CONFIGURATION FILES

```
/root/clawd/nse-bse-bot/
├── .env                 ← API keys + config (needs to be created)
├── config/
│   ├── strategies.js     ← Trading strategies
│   ├── watchlist.js      ← Stock watchlist
│   └── ...               ← Other config files
```

### Required .env Variables
```env
# Groq AI API (for market analysis)
GROQ_API_KEY=your_groq_api_key

# Telegram Bot (optional - for alerts)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Broker API (for live trading - future)
BROKER_API_KEY=
BROKER_SECRET=
```

### Watchlist Config
Edit `config/watchlist.js` to add/remove stocks:
```javascript
// NSE stocks: SYMBOL.NS (e.g., TCS.NS, INFY.NS)
// BSE stocks: SYMBOL.BO (e.g., RELIANCE.BO)
```

---

## 8. LOGS

```
/root/clawd/nse-bse-bot/logs/
├── 2026-04-08.log
├── 2026-04-09.log
├── 2026-04-10.log
└── 2026-04-11.log   ← Last run
```

Recent log entries show:
- News fetched successfully
- AI summary generated via Groq (1479ms)
- Weekend skip working correctly
- Some DNS errors with Yahoo Finance (EAI_AGAIN) — network issue

---

## 9. ARCHITECTURE

```
src/
├── index.js              ← Main entry point
├── core/
│   ├── NSEBSETradingEngine.js
│   ├── TrailingManager.js
│   ├── SectorRotation.js
│   ├── EarningsCalendar.js
│   └── MultiTimeframeEngine.js
├── platforms/stocks/
│   └── NSEBSEAdapter.js   ← NSE/BSE data adapter
├── shared/knowledge/
│   └── StockKnowledgeBase.js
├── ui/dashboard/
│   └── server.js         ← Web dashboard
├── utils/
│   ├── aiClient.js       ← Groq AI integration
│   ├── telegramAlert.js  ← Telegram notifications
│   └── newsFetcher.js    ← RSS news fetching
└── integration/
    └── ...               ← Broker/exchange integrations
```

---

## 10. KNOWN ISSUES (from logs)

| Issue | Cause | Fix |
|---|---|---|
| `EAI_AGAIN` DNS errors | Yahoo Finance DNS resolution failed | Network/firewall issue on VPS |
| Bot stopped (SIGTERM) | Process killed or system restart | Restart with `npm start` |
| Telegram not configured | No bot token/chat ID in .env | Add credentials to .env |

---

## 11. QUICK START

```bash
cd /root/clawd/nse-bse-bot/

# 1. Create .env
cp .env.example .env 2>/dev/null || touch .env
nano .env

# 2. Add Groq API key (get from console.groq.com)
echo "GROQ_API_KEY=your_key_here" >> .env

# 3. Add Telegram (optional)
echo "TELEGRAM_BOT_TOKEN=your_bot_token" >> .env
echo "TELEGRAM_CHAT_ID=your_chat_id" >> .env

# 4. Start
npm start

# 5. Dashboard at http://localhost:3000 (or configured port)
```

---

## 12. QUICK REFERENCE

```
Bot:              /root/clawd/nse-bse-bot/
Command:          npm start
Dashboard Port:   3000 (default)
Logs:             /root/clawd/nse-bse-bot/logs/
Last Run:         April 11, 2026
Status:           ❌ Stopped
AI Provider:      Groq
Data Source:      Yahoo Finance (yfinance)
Language:         Hindi-English config ready
```

---

## 13. HOW IT COMPARES TO OTHER BOTS ON VPS

| Bot | Market | Exchange | Status |
|---|---|---|---|
| **nse-bse-bot** | Indian Stocks (NSE/BSE) | Yahoo Finance | ❌ Stopped |
| universal-trading-bot | Crypto/Forex/Stocks | Binance, OANDA, Zerodha | ❌ Stopped |
| trading-bot | Crypto | Binance | ❌ Stopped |

> ⚠️ All 3 bots are currently **NOT running** — need to be started manually or via PM2/systemd
