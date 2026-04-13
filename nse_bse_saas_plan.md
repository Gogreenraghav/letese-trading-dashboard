# NSE-BSE Bot SaaS Platform — Master Plan

> Last Updated: 2026-04-12
> Vision: Multi-tenant Trading Bot SaaS — Multiple users, one platform

---

## 🎯 VISION

Build a **SaaS platform** where:
- Multiple users can signup and use the trading bot
- **Super Admin** manages ALL users from one dashboard
- Each user gets their OWN Telegram alerts + portfolio view
- Revenue through **subscription plans**
- White-label ready for future clients

---

## 🏗️ ARCHITECTURE

```
                    ┌─────────────────────────────────┐
                    │         SUPER ADMIN              │
                    │  (Manage users, subscriptions,   │
                    │   analytics, all data)           │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
        ┌─────▼─────┐      ┌──────▼──────┐      ┌─────▼─────┐
        │  User A   │      │   User B    │      │  User C   │
        │ (₹999/mo) │      │ (₹1999/mo)  │      │ (Free)    │
        │           │      │             │      │           │
        │ Telegram  │      │ Telegram    │      │ Dashboard │
        │ Alerts    │      │ + Live API  │      │ Only      │
        └───────────┘      └─────────────┘      └───────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      BACKEND (FastAPI)           │
                    │  Multi-tenant + Auth + Payments │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │         TRADING BOT              │
                    │  (Signal Engine + Broker API)    │
                    └─────────────────────────────────┘
```

---

## 📋 WHAT EXISTS vs WHAT NEEDS BUILDING

### ✅ Already Built

| Component | Status |
|---|---|
| Trading Bot Engine | ✅ Running (paper) |
| Signal Generation (5 strategies) | ✅ Working |
| Yahoo Finance Data Feed | ✅ Live |
| News Sentiment | ✅ Working |
| AI Summary (Groq) | ✅ Working |
| Telegram Alert System | ✅ Code ready |
| User Dashboard (basic) | ✅ Bot dashboard at :3005 |

### ❌ Needs Building (SaaS Version)

| Component | Priority | Effort |
|---|---|---|
| Multi-tenant Auth (JWT) | 🔴 HIGH | 2-3 hrs |
| User Signup/Login APIs | 🔴 HIGH | 1 hr |
| Super Admin Dashboard | 🔴 HIGH | 3-4 hrs |
| Subscription Plans | 🟡 MED | 2 hrs |
| Per-user Telegram Bot | 🟡 MED | 2 hrs |
| Payment Integration (Razorpay) | 🟡 MED | 3 hrs |
| User Portfolio View | 🟡 MED | 2 hrs |
| Broker API Integration | 🔴 HIGH | 3 hrs |
| Landing Page | 🟡 MED | 2 hrs |

---

## 💰 SUBSCRIPTION PLANS

| Plan | Price | Features |
|---|---|---|
| **Free** | ₹0 | Dashboard view, paper trading, 5 stocks |
| **Basic** | ₹499/mo | Telegram alerts, 20 stocks, 1 strategy |
| **Pro** | ₹1,999/mo | All strategies, live signals, full NSE, API access |
| **Enterprise** | ₹4,999/mo | White-label, multiple users, custom strategies |

---

## 🛠️ TECH STACK

| Layer | Technology |
|---|---|
| Backend | FastAPI (already running at :8001) |
| Database | PostgreSQL (already running) |
| Auth | JWT tokens (PyJWT) |
| Multi-tenancy | PostgreSQL Row Level Security |
| User Dashboard | Next.js (extend existing :3005) |
| Super Admin | New Next.js app |
| Payments | Razorpay (India) |
| Telegram | One bot per user OR bot with chat threads |
| Hosting | This VPS (139.59.65.82) |

---

## 🗄️ DATABASE SCHEMA (New Tables)

```sql
-- Users table (new)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  plan VARCHAR DEFAULT 'free',  -- free | basic | pro | enterprise
  razorpay_customer_id VARCHAR,
  subscription_id VARCHAR,
  subscription_status VARCHAR,  -- active | cancelled | trial
  subscription_end DATE,
  telegram_chat_id BIGINT,
  telegram_bot_token VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User portfolios (each user has their own)
CREATE TABLE user_portfolios (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  symbol VARCHAR NOT NULL,
  quantity INT,
  entry_price DECIMAL(10,2),
  entry_time TIMESTAMP,
  strategy VARCHAR,
  status VARCHAR DEFAULT 'open'  -- open | closed
);

-- User trades
CREATE TABLE user_trades (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  symbol VARCHAR NOT NULL,
  action VARCHAR NOT NULL,  -- BUY | SELL
  quantity INT,
  price DECIMAL(10,2),
  pnl DECIMAL(10,2),
  strategy VARCHAR,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Admin actions log
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY,
  admin_action VARCHAR NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (This Week)
1. **Auth System** — Signup/Login/JWT (2 hrs)
2. **Database Schema** — Add users table + multi-tenancy (1 hr)
3. **Super Admin Backend APIs** — User management endpoints (2 hrs)
4. **Super Admin Frontend** — Manage users, view all data (3 hrs)

### Phase 2: User Experience (Next Week)
5. **User Dashboard** — Individual user portfolio view (2 hrs)
6. **Telegram Bot per User** — Each user gets their own bot (2 hrs)
7. **Landing Page** — `/` → Marketing page with pricing (2 hrs)

### Phase 3: Payments + Live Trading
8. **Razorpay Integration** — Subscription payments (3 hrs)
9. **Samco/Zerodha API** — Live trading per user (3 hrs)
10. **Webhook Handlers** — Payment confirmation (1 hr)

---

## 📁 FILE STRUCTURE

```
/root/clawd/trading-saas/
├── backend/
│   ├── app/
│   │   ├── main.py              ← Extend existing
│   │   ├── auth/                ← JWT auth
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── utils.py
│   │   ├── users/               ← User management
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── crud.py
│   │   ├── subscriptions/       ← Plans + payments
│   │   │   ├── router.py
│   │   │   ├── razorpay.py
│   │   │   └── webhooks.py
│   │   ├── signals/             ← Per-user signals
│   │   │   └── router.py
│   │   └── admin/              ← Super admin APIs
│   │       ├── router.py
│   │       └── analytics.py
│   └── requirements.txt
│
├── frontend/
│   ├── super-admin/             ← New Super Admin panel
│   │   └── (Next.js app)
│   ├── user-dashboard/          ← User's own dashboard
│   │   └── (Next.js app — extend existing :3005)
│   └── landing/                 ← Marketing page
│       └── (Next.js app)
│
└── telegram-bot/
    └── bot.py                   ← Multi-user Telegram bot
```

---

## 🔑 KEY DECISIONS TO MAKE

### 1. Telegram Bot Strategy
**Option A:** One bot per user
- User creates their own bot via @BotFather
- Gives bot token to us
- Pros: User controls their bot
- Cons: Complex onboarding

**Option B:** Single master bot (RECOMMENDED)
- One bot: `@NSEBSETraderBot`
- Users signup → get assigned chat_id
- All alerts sent via single bot to each user's chat_id
- Pros: Simple, fast onboarding
- Cons: Dependent on our bot staying online

### 2. Multi-tenancy Approach
**Option:** Shared database, user_id filter everywhere
- All tables have `user_id` column
- Every query filters by `user_id`
- Simple, works well for <10,000 users
- Can upgrade to PostgreSQL RLS later

### 3. Broker Connection
**Per-user broker or pooled?**
- Option A: Each user connects their own Samco/Zerodha account
- Option B: Master account → sub-accounts per user
- Best: Option A (user controls their own money)

---

## ⏱️ TIME ESTIMATE

| Phase | Hours | Deliverable |
|---|---|---|
| Phase 1 (Foundation) | 8-10 hrs | Auth + Super Admin live |
| Phase 2 (UX) | 6-8 hrs | User dashboard + Telegram |
| Phase 3 (Payments) | 7-8 hrs | Razorpay + live trading |

**Total: ~20-25 hours of development**

---

## 🚀 QUICK START — What to do NOW

1. **Samco account** → Activate API → Get App Key + Secret
2. **Razorpay account** → Get API keys (test mode first)
3. **Start Phase 1** → I begin coding auth + Super Admin

---

*This document is the master plan. Update as we go.*
