# LETESE● Customer Admin Dashboard

Module E-CA of the LETESE Legal SaaS platform.

## Overview

React/Next.js application providing law firm administrators with:
- **Dashboard** — Firm overview with usage stats and alerts
- **Team Management** — RBAC: invite users, assign roles, suspend/remove
- **Billing** — Current plan, usage limits, Razorpay upgrade flow, invoice history
- **Analytics** — AI token usage, WhatsApp delivery, storage, court scraper stats
- **Settings** — Firm profile, notification preferences, webhooks, data export

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS 3 with glassmorphism design system
- **Charts**: Recharts
- **Auth**: JWT Bearer token (stored in `localStorage`)
- **API**: Fetch to `/api/v1/admin/*` endpoints

## Design

Glassmorphism 2.0 dark theme:
- Background: `#080c14` gradient
- Glass cards: `rgba(15,20,40,0.75)` with `blur(20px)`
- Borders: `rgba(255,255,255,0.08)`
- Neon accents: Cyan `#00D4FF`, Purple `#8B5CF6`, Green `#00FF88`
- Fonts: Inter (UI), JetBrains Mono (numbers/code)

## Routes

| Path | Description |
|------|-------------|
| `/admin` | Dashboard home |
| `/admin/team` | Team RBAC management |
| `/admin/billing` | Subscription & invoices |
| `/admin/analytics` | Usage analytics |
| `/admin/settings` | Firm settings |

## API Endpoints Used

```
GET    /api/v1/admin/users         — List team members
POST   /api/v1/admin/users/invite  — Invite user
PATCH  /api/v1/admin/users/{id}    — Update role/status
DELETE /api/v1/admin/users/{id}    — Remove user
GET    /api/v1/admin/subscription/current
POST   /api/v1/admin/subscription/upgrade
GET    /api/v1/admin/analytics
GET    /api/v1/invoices
POST   /api/v1/invoices/{id}/send
PATCH  /api/v1/admin/tenant         — Update firm profile
```

## Installation

```bash
cd frontend/customer-admin
npm install
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=https://api.letese.xyz
```
