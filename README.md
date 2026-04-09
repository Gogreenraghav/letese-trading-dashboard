# LETESE Trading Platform ⚖️

Automated Trading & Legal SaaS Platform for Indian Markets (NSE/BSE)

---

## 🏗️ Platform Overview

LETESE is a **full-stack trading automation platform** built with:
- **NSE/BSE Trading Bot** — Real-time signals, paper trading, backtesting
- **SaaS Platform** — Multi-tenant customer management with KYC
- **Mobile App (Flutter)** — Native Android/iOS app
- **Mobile PWA** — Installable web app (no install needed)

---

## 📁 Project Structure

```
/root/clawd/
│
├── nse-bse-bot/          # 🤖 Trading Bot (Node.js)
│   ├── src/
│   │   ├── core/          # TradingEngine, RiskManager, BacktestEngine, OptionsChain
│   │   ├── ui/dashboard/  # Web Dashboard (HTML/CSS/JS)
│   │   └── modules/        # MarketScanner, TelegramAlert, NewsFetcher
│   └── package.json
│
├── saas/                  # 🏛️ SaaS Platform (Node.js)
│   ├── server.js          # Express server + JWT auth + SQLite
│   ├── public/
│   │   ├── admin.html     # Super Admin Dashboard
│   │   ├── customer.html  # Customer Dashboard
│   │   ├── login.html     # Login Page
│   │   ├── register.html  # Registration + Plan Selection
│   │   ├── broker-setup.html # Broker Connection (Upstox/Zerodha/AliceBlue)
│   │   └── mobile/        # 📱 Mobile PWA
│   └── db.json            # SQLite JSON database
│
├── flutter_app/            # 📱 Flutter Native App
│   ├── lib/
│   │   ├── screens/       # Login, Dashboard, Trades, Profile, KYC, Broker
│   │   ├── services/      # API Service
│   │   └── theme.dart     # Dark Theme
│   └── pubspec.yaml
│
└── letese/               # 📋 LETESE Legal SaaS (Legacy MVP)
    ├── src/
    ├── core/
    └── ...
```

---

## 🚀 Quick Start

### Trading Bot
```bash
cd /root/clawd/nse-bse-bot
npm install
node src/index.js
# Open: http://localhost:3005
```

### SaaS Platform
```bash
cd /root/clawd/saas
npm install
node server.js
# Open: http://localhost:3010
# Admin: admin@letese.com / admin123
```

### Mobile PWA
```bash
# Just open in browser — works immediately
http://139.59.65.82:3010/mobile
```

### Flutter App
```bash
cd /root/clawd/flutter_app
flutter pub get
flutter run
```

---

## 🔗 Live URLs (VPS: 139.59.65.82)

| Service | URL |
|---|---|
| SaaS Platform | http://139.59.65.82:3010 |
| Admin Dashboard | http://139.59.65.82:3010/admin |
| Customer Dashboard | http://139.59.65.82:3010/customer |
| Login | http://139.59.65.82:3010/login |
| Mobile PWA | http://139.59.65.82:3010/mobile |
| Trading Bot | http://139.59.65.82:3005 |
| Flutter Code (ZIP) | http://139.59.65.82:3010/letese_flutter_app.zip |

---

## ✨ Features

### 🤖 Trading Bot (16 Features)
- [x] Candlestick Chart (TradingView lightweight-charts)
- [x] Options Chain (NSE live OI, PCR, Max Pain)
- [x] Monte Carlo Simulation
- [x] Performance Report (Sharpe, Sortino, Calmar, equity curve)
- [x] Backtesting Engine (Yahoo Finance historical data)
- [x] Telegram Rich Alerts (inline buttons)
- [x] Settings Speed Mode (LIGHT/NORMAL/TURBO/HYPER)
- [x] Alert Preferences (8 toggles)
- [x] News Fetcher + AI Summary (Groq)
- [x] Risk Manager (daily loss, position sizing)
- [x] Trailing SL/TP Manager
- [x] Earnings Calendar Filter
- [x] Sector Rotation
- [x] Multi-Timeframe Engine
- [x] Paper Trading Mode (TEST/LIVE switch)
- [x] Broker API scaffolding (Upstox/Zerodha/AliceBlue)

### 🏛️ SaaS Platform (15 Features)
- [x] JWT Authentication (login/register)
- [x] Super Admin Dashboard (customers, KYC, analytics)
- [x] Customer Dashboard (portfolio, trades, P&L)
- [x] Redis Caching (fast performance)
- [x] Complete KYC Form (PAN, Aadhaar, Address, Occupation)
- [x] WhatsApp Notifications (demo ready)
- [x] Customer Notifications Modal
- [x] Admin Notify Tab (send message to customer)
- [x] Plan Management (Basic/Professional/Elite)
- [x] Broker Setup Page
- [x] Broker Adapter (ready for API keys)
- [x] Broker Status Card
- [x] Plan Limits (trade limit, API access)
- [x] Activity Log
- [x] Customer Delete (admin)

### 📱 Mobile
- [x] Mobile PWA (works on Android, iOS, Desktop)
- [x] Flutter Native App (15 screens)
- [x] Bottom Navigation
- [x] Pull to Refresh
- [x] Offline Support (Service Worker)

---

## 🔐 Plans & Pricing

| Plan | Price | Features |
|---|---|---|
| Basic | ₹999/mo | 30 cases/month, Basic dashboard |
| Professional | ₹2,499/mo | 100 cases/month, Full dashboard, Telegram alerts, Backtesting |
| Elite | ₹4,999/mo | Unlimited, AI drafting, All features, Priority support |

---

## 🔌 Broker Support

- **Upstox** — Free APIs, beginner friendly
- **Zerodha** — Kite Connect, most popular
- **AliceBlue** — Low brokerage, advanced APIs

---

## 🛠️ Tech Stack

**Trading Bot:**
- Node.js + Express
- Yahoo Finance API (free market data)
- TradingView lightweight-charts
- Chart.js for analytics
- Groq AI for market summaries

**SaaS Platform:**
- Node.js + Express
- SQLite (JSON file database)
- Redis (caching)
- JWT (authentication)
- Tailwind CSS (dark UI)

**Mobile:**
- Flutter (native app)
- PWA (web app — no install needed)

---

## 📊 Environment Variables

Create `.env` file for SaaS:

```env
JWT_SECRET=your-super-secret-key
REDIS_URL=redis://localhost:6379
WA_API_URL=https://graph.facebook.com/v18.0/YOUR_PHONE_ID/messages
WA_TOKEN=YOUR_WHATSAPP_TOKEN
PORT=3010
```

---

## 🚨 Disclaimer

This platform is for **educational and informational purposes only**.
- Paper trading is for backtesting, not real money.
- For live trading, ensure proper KYC and broker verification.
- Authors are not responsible for financial losses.
- Always consult a SEBI-registered financial advisor before trading.

---

## 📄 License

Proprietary — LETESE Legal Technologies Pvt. Ltd.
