# SYSTEM_MASTER_BLUEPRINT.md
# LETESE● — Legal Practice Management SaaS
## Primary Instruction Manual for Autonomous AI Agent Teams
### Version: 1.0 | Classification: INTERNAL — AGENT EXECUTION ONLY

> **ZERO-INFERENCE DIRECTIVE:** Every agent reading this file must execute tasks exactly as specified. No assumptions. No simplifications. If a specification is ambiguous, halt and log a clarification request to the `#blueprint-clarifications` channel before proceeding. This file is the single source of truth.

---

## TABLE OF CONTENTS

1. [Universal Multi-Agent Execution Strategy](#1-universal-multi-agent-execution-strategy)
2. [Brand Identity & Logo Specification](#2-brand-identity--logo-specification)
3. [3-Tier Dashboard Architecture](#3-3-tier-dashboard-architecture)
4. [Vibrant & Modern UI/UX Specifications](#4-vibrant--modern-uiux-specifications)
5. [Omni-Channel API Infrastructure](#5-omni-channel-api-infrastructure)
6. [Technical Stack & Environment](#6-technical-stack--environment)
7. [Database Schema — Multi-Tenant PostgreSQL](#7-database-schema--multi-tenant-postgresql)
8. [AIPOT Multi-Agent System Architecture](#8-aipot-multi-agent-system-architecture)
9. [Complete Functional Extraction](#9-complete-functional-extraction)
10. [API Endpoint Reference](#10-api-endpoint-reference)
11. [Security & Compliance Layer](#11-security--compliance-layer)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Testing & Quality Gates](#13-testing--quality-gates)

---

## 1. UNIVERSAL MULTI-AGENT EXECUTION STRATEGY

### 1.1 Modular Architecture Blocks

The entire LETESE● platform is decomposed into **8 independent build modules**. Each module is assigned to a separate AI agent and built in parallel. Modules communicate only through defined contracts (API schemas + Kafka event schemas). No module may reach into another module's internal logic.

```
MODULE A  — Database Schema & Migrations
MODULE B  — Auth & RBAC Service
MODULE C  — API Gateway (FastAPI REST + WebSocket)
MODULE D  — AIPOT Agent Orchestrator (Kafka + FastAPI lifecycle)
MODULE E  — Flutter Frontend (All 3 Dashboards)
MODULE F  — Live-Sync Editor (Tiptap v2 + Y.js)
MODULE G  — Omni-Channel Comms Hub (WA/SMS/Email/IVR)
MODULE H  — Digital Police Audit Engine (AIPOT-POLICE)
```

### 1.2 Parallel Task Roadmap — Days Not Weeks

**Sprint Duration: 6 days to functional MVP**

#### DAY 1 — FOUNDATION (All agents simultaneously)

| Agent | Module | Tasks | Output Signal |
|-------|--------|-------|---------------|
| AGENT-DB | A | PostgreSQL migrations, pgvector, pgbouncer, seed data | `db_ready: true` on `letese.infra.ready` |
| AGENT-AUTH | B | JWT RS256, OTP, Google OAuth, RBAC middleware | Auth service on port 8001 |
| AGENT-INFRA | D | Kafka topics, Redis cluster, pod lifecycle templates | All 8 topics created |
| AGENT-DEVOPS | H | Prometheus + Grafana, PagerDuty, POLICE skeleton | Grafana live, heartbeats emitting |

#### DAY 2 — CORE BACKEND

| Agent | Module | Tasks | Gate |
|-------|--------|-------|------|
| AGENT-API | C | Case/User/Tenant CRUD, WebSocket diary, S3 upload | All P0 endpoints → 200 on test |
| AGENT-SCRAPER | D | Playwright court scrapers × 8, proxy rotation, dedup | Case → P&H HC listing in < 5s |
| AGENT-COMMS | G | 360dialog WhatsApp, MSG91 SMS, SendGrid email | POST trigger → WA message delivered |

#### DAY 3 — FRONTEND FOUNDATION

| Agent | Module | Tasks | Gate |
|-------|--------|-------|------|
| AGENT-FLUTTER | E | Auth screens, Case Diary, document upload, glassmorphism UI | Flutter builds on Android + iOS + Web |
| AGENT-EDITOR | F | Tiptap bundle, Y.js WS, Gurmukhi/Devanagari, WebView | 3 concurrent users edit, Punjabi renders |

#### DAY 4 — DASHBOARDS

| Agent | Module | Tasks |
|-------|--------|-------|
| AGENT-SUPERADMIN | E-SA | System health panel, tenant CRUD, API Vendor Hub, audit viewer |
| AGENT-CUSTOMERADMIN | E-CA | Team RBAC, case portfolio, billing, usage analytics |
| AGENT-USERTERMINAL | E-UT | Unified Inbox (AI-sorted), Task Hub, Case Diary workstation |

#### DAY 5 — INTEGRATION & COMPLIANCE

| Agent | Module | Tasks |
|-------|--------|-------|
| AGENT-COMPLIANCE | D | AIPOT-COMPLIANCE: spaCy NLP, checklist validation, editor integration |
| AGENT-BILLING | C | Razorpay, invoice PDF (WeasyPrint), installment tracker |
| AGENT-POLICE-FULL | H | Small Audit (10 min), Major Audit (60 min), auto-remediation |

#### DAY 6 — TESTING, HARDENING & DEPLOYMENT

| Agent | Module | Tasks |
|-------|--------|-------|
| AGENT-QA | ALL | Load tests 500 concurrent, OWASP ZAP, tenant isolation test |
| AGENT-DEPLOY | ALL | ArgoCD prod deploy, letese.xyz Next.js landing, SSL, CDN |

### 1.3 Inter-Agent Communication Protocol

```
RULE 1: No agent imports code from another module.
RULE 2: All cross-module calls are HTTP (internal) or Kafka events.
RULE 3: Every agent publishes build status to Kafka: letese.build.status
RULE 4: Status message schema:
  {
    "agent_id": "AGENT-SCRAPER",
    "module": "D-AIPOT-SCRAPER",
    "day": 2,
    "status": "COMPLETE|IN_PROGRESS|BLOCKED",
    "blocker": null | "Waiting for AGENT-DB db_ready signal",
    "output_url": "http://scraper-service:8010/health"
  }
RULE 5: BLOCKED agents must NOT proceed. Log and wait.
```

### 1.4 Contract-First Development

Every module commits its interface contract to `/contracts/` **before** writing implementation:

```
/contracts/
  auth.schema.json           — JWT payload, RBAC role enum
  cases.schema.json          — Case object schema
  kafka.events.schema.json   — All Kafka event schemas
  api.openapi.yaml           — Full OpenAPI 3.1 spec
  db.prisma                  — Prisma schema as ground truth
  aipot.protocols.json       — AIPOT message formats
```

---

## 2. BRAND IDENTITY & LOGO SPECIFICATION

### 2.1 Logo Rule — ZERO DEVIATION

The LETESE● brand mark is two elements, exact order, no space:

```
Element 1: "LETESE"
  Font:   Inter or Arial, weight 700 (Bold)
  Color:  #1A4FBF (Brand Blue)

Element 2: "●" (Unicode U+25CF BLACK CIRCLE)
  Color:  #22C55E (Brand Green)
  Size:   44% of LETESE font size
  Position: subscript (translateY +30% OR CSS vertical-align: sub)
  NO SPACE between "E" and "●"
```

**Flutter implementation:**
```dart
RichText(text: TextSpan(children: [
  TextSpan(
    text: 'LETESE',
    style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w700,
      fontSize: 28, color: Color(0xFF1A4FBF)),
  ),
  WidgetSpan(
    alignment: PlaceholderAlignment.belowBaseline,
    baseline: TextBaseline.alphabetic,
    child: Transform.translate(
      offset: Offset(0, 6),
      child: Text('●', style: TextStyle(fontSize: 14,
        color: Color(0xFF22C55E), fontWeight: FontWeight.w700)),
    ),
  ),
]))
```

**HTML/CSS implementation:**
```html
<span class="letese-brand">
  <span class="letese-name">LETESE</span><sub class="letese-dot">●</sub>
</span>
```
```css
.letese-brand { display: inline-flex; align-items: baseline; }
.letese-name  { font-family: 'Inter', Arial, sans-serif; font-weight: 700; color: #1A4FBF; }
.letese-dot   { font-size: 0.44em; color: #22C55E; font-weight: 700;
                vertical-align: sub; line-height: 0; }
```

### 2.2 Header Specification — ALL PAGES/SCREENS

```
Background:   Solid #1A4FBF — NO GRADIENT in header
Logo:         LETESE text = #FFFFFF (white), dot = #22C55E (green)
Tagline:      "Legal Practice Management" — Color: #BFDBFE
Right side:   "letese.xyz  |  info@letese.xyz" — Color: #BFDBFE
Height:       56px desktop, 48px mobile
Position:     Sticky, z-index: 1000
Shadow:       0 2px 8px rgba(0,0,0,0.3)
```

---

## 3. 3-TIER DASHBOARD ARCHITECTURE

### 3.1 TIER 1 — Super Admin Dashboard

**Access:** LETESE● core team only  
**Route prefix:** `/super-admin/`  
**JWT role claim:** `"role": "super_admin"`

#### 3.1.1 Global System Health Panel

```
Component:  SystemHealthMatrix
Route:      /super-admin/health
Data:       WebSocket ws://api/ws/health/{admin_token} — real-time

Displays live grid:
  AIPOT STATUS MATRIX
  ┌────────────┬────────────┬────────────┬────────────┐
  │ SCRAPER    │ COMPLIANCE │ COMMUNICTR │ POLICE     │
  │ 🟢 ACTIVE  │ 🟢 WARM    │ 🟢 ACTIVE  │ 🟢 2/2     │
  │ Pods: 3    │ Pods: 1    │ Pods: 2    │ Replicas   │
  └────────────┴────────────┴────────────┴────────────┘

  INFRASTRUCTURE METRICS
  PostgreSQL Primary:  ● HEALTHY   Replication Lag: 0.2s
  PostgreSQL Replica:  ● HEALTHY   Replication Lag: 0.4s
  Redis:               ● HEALTHY   Memory: 42%
  Kafka:               ● HEALTHY   Consumer Lag: 0 msgs
  S3 Bucket:           ● HEALTHY   Used: 1.2TB
  API P95 Latency:     187ms       Target: < 500ms

Data source: GET /api/v1/super-admin/health (poll 10s)
             + WebSocket events from AIPOT-POLICE
```

#### 3.1.2 Tenant (Client) Management

```
Component:  TenantManagementPanel
Route:      /super-admin/tenants

Actions:
  List all tenants (paginated, 50/page, searchable)
  Create:   POST /api/v1/super-admin/tenants
  Suspend:  PATCH /api/v1/super-admin/tenants/{id} { "status": "suspended" }
  Plan:     PATCH /api/v1/super-admin/tenants/{id} { "plan": "elite" }
  Impersonate (read-only):
            GET /api/v1/super-admin/tenants/{id}/impersonate
            → Returns scoped read-only JWT for that tenant

Table columns:
  tenant_id | name | plan | cases_active | storage_gb | mrr_inr | status | last_active
```

#### 3.1.3 Centralized API Vendor Hub

```
Component:  APIVendorHub
Route:      /super-admin/api-vendors
Purpose:    Single configuration panel for ALL third-party API credentials.
            No hardcoded credentials anywhere.
            All values encrypted at rest in AWS Secrets Manager.

COMMUNICATION VENDORS
────────────────────────────────────────────────────────
WhatsApp (360dialog BSP)
  api_key:          [encrypted input]
  instance_id:      [text]
  webhook_url:      https://api.letese.xyz/webhooks/whatsapp
  approved_templates: [list manager — add/remove/view approval status]
  status:           [LIVE | SANDBOX | SUSPENDED]
  test_button:      → Sends test message to admin phone

SMS (MSG91)
  auth_key:         [encrypted]
  sender_id:        LETESE
  route:            [TRANSACTIONAL | PROMOTIONAL]
  template_ids:     [list manager]
  test_button:      → Sends test SMS to admin phone

Voice/IVR (Exotel)
  api_key:          [encrypted]
  api_token:        [encrypted]
  app_id:           [text]
  caller_id:        [phone number]
  call_flow_xml:    [code editor]
  test_button:      → Places test call to admin phone

AI Voice TTS (ElevenLabs)
  api_key:          [encrypted]
  voice_id:         [dropdown — Indian English voices]
  test_button:      → Plays sample audio in browser

LLM VENDORS
────────────────────────────────────────────────────────
OpenAI
  api_key:              [encrypted]
  default_model:        gpt-4o | gpt-4o-mini | gpt-3.5-turbo
  max_tokens_per_call:  [integer, default 4000]
  monthly_budget_usd:   [integer]
  current_spend:        [read-only from OpenAI usage API]

Anthropic (Claude)
  api_key:          [encrypted]
  default_model:    claude-3-5-sonnet | claude-3-opus

Google (Gemini)
  api_key:          [encrypted]
  default_model:    gemini-1.5-pro | gemini-1.5-flash

Local LLM (Ollama — Mac Mini M4)
  base_url:         http://mac-mini-m4:11434
  model:            llama3:8b | mistral:7b | codellama:13b
  enabled:          [toggle]

Active Provider:         [dropdown — routes all AI calls]
Fallback Provider:       [dropdown]
Cost Optimization Mode:  QUALITY | BALANCED | ECONOMY
  QUALITY:   Always use primary premium model
  BALANCED:  gpt-4o for drafting, cheapest for summaries
  ECONOMY:   Route to Ollama where quality permits; fallback to cheapest cloud

PAYMENT VENDORS
────────────────────────────────────────────────────────
Razorpay (Primary)
  key_id:           [encrypted]
  key_secret:       [encrypted]
  webhook_secret:   [encrypted]
  mode:             [LIVE | TEST]

PayU (Fallback)
  merchant_key:     [encrypted]
  merchant_salt:    [encrypted]
  mode:             [PRODUCTION | TEST]

API: PATCH /api/v1/super-admin/vendors/{vendor_name} { config_object }
     After save: test ping to vendor API.
     Returns: { "status": "VERIFIED" | "FAILED", "latency_ms": 142 }
```

#### 3.1.4 Digital Police Console

```
Component:  DigitalPoliceConsole
Route:      /super-admin/police

Panels:
  1. Live Audit Feed (WebSocket) — last 50 audit events real-time
  2. Alert Queue — open P1/P2/P3 incidents
  3. Audit History — searchable by date range, type, outcome
  4. Manual Trigger — [Run Small Audit Now] [Run Major Audit Now]
  5. Auto-Remediation Log — all automated fixes taken
  6. DLQ Monitor — Dead Letter Queue depths per Kafka topic

Small Audit Result Format:
  ✅ AIPOT-SCRAPER heartbeat: last seen 47s ago [OK]
  ✅ Kafka consumer lag letese.scraper.jobs: 0 [OK]
  ⚠️  PostgreSQL pool: 78% utilized [WARNING]
  ✅ Redis memory: 41% [OK]
  ✅ API P95 latency: 187ms [OK]
  ✅ Scraper success rate (10min): 98.3% [OK]
  ✅ Active pod count: all at minimum replicas [OK]
```

---

### 3.2 TIER 2 — Customer Admin Dashboard

**Access:** Law firm owner / senior advocate  
**Route prefix:** `/admin/`  
**JWT role claim:** `"role": "admin", "tenant_id": "{uuid}"`

#### 3.2.1 Team Management & RBAC

```
Roles (immutable enum):
  ADMIN      — Full access to all tenant data and settings
  ADVOCATE   — Full access own cases; read-only other cases
  CLERK      — Create/view cases; upload docs; NO draft editing
  PARALEGAL  — CLERK + can trigger communications
  INTERN     — View-only on assigned cases

Role Permission Matrix:
  Action              │ ADMIN │ ADVOCATE │ CLERK │ PARALEGAL │ INTERN
  ────────────────────┼───────┼──────────┼───────┼───────────┼───────
  Create Case         │  ✓    │    ✓     │   ✓   │     ✓     │   ✗
  Edit Case           │  ✓    │    ✓     │   ✗   │     ✗     │   ✗
  Draft Documents     │  ✓    │    ✓     │   ✗   │     ✗     │   ✗
  Trigger AI Draft    │  ✓    │    ✓     │   ✗   │     ✗     │   ✗
  Send Client Message │  ✓    │    ✓     │   ✗   │     ✓     │   ✗
  View Billing        │  ✓    │    ✗     │   ✗   │     ✗     │   ✗
  Manage Team         │  ✓    │    ✗     │   ✗   │     ✗     │   ✗
  View Audit Logs     │  ✓    │    ✗     │   ✗   │     ✗     │   ✗
  Export Data         │  ✓    │    ✓     │   ✗   │     ✗     │   ✗

User Management APIs:
  Invite:  POST /api/v1/admin/users/invite { email, role }
           → Sends onboarding email with 24h magic link
  Role:    PATCH /api/v1/admin/users/{id} { "role": "advocate" }
  Suspend: PATCH /api/v1/admin/users/{id} { "active": false }
  Remove:  DELETE /api/v1/admin/users/{id}
           → Soft delete; open cases reassigned to admin
```

#### 3.2.2 API Usage Analytics

```
Component:  UsageAnalyticsDashboard
Route:      /admin/analytics

Metrics:
  1. AI Calls This Month
     - Total tokens (input + output)
     - Breakdown by AIPOT agent
     - Cost in INR
     - Progress vs. plan limit

  2. WhatsApp Messages
     - Sent / Delivered / Read / Failed counts
     - Failed deliveries with error codes

  3. SMS Sent — count, delivery rate %, cost INR

  4. Document Storage — GB by file type, 30-day growth trend

  5. Scraper Activity — scrapes/court, orders detected, failures

Time filters: Today | 7d | 30d | Custom
Export: CSV download for all metric sets
```

#### 3.2.3 Subscription & Billing Management

```
Component:  BillingPanel
Route:      /admin/billing

Displays:
  - Current plan, monthly price, next billing date
  - Feature usage vs. limits (cases, storage, users)
  - Invoice history (PDF download per invoice)
  - Payment method management (Razorpay secure card vault)

Upgrade Flow:
  1. Click "Upgrade to Elite"
  2. Modal: plan diff, new price, next billing date
  3. Razorpay checkout (saved card = one-click, else full form)
  4. On payment_captured webhook:
     PATCH tenant.plan = 'elite'
     Refresh JWT claims on next login
     Send welcome email with new feature list
```

---

### 3.3 TIER 3 — User / Employee Terminal (The Workstation)

**Route prefix:** `/app/`  
**Access:** All authenticated roles

#### 3.3.1 Unified Inbox (AI-Sorted Multi-Channel)

```
Component:  UnifiedInbox
Route:      /app/inbox

Data sources combined into one feed:
  - WhatsApp incoming client messages
  - Email client replies
  - In-app notifications (new order, new hearing, compliance failure)
  - System alerts (AIPOT-POLICE warnings)
  - Payment confirmations/failures
  - Document submission confirmations

AI Sorting Logic (AIPOT-COMMUNICATOR scores every item):
  urgency_score:   0–10 (hearing proximity, order type, keywords)
  action_required: bool
  action_type:     REPLY_CLIENT | REVIEW_DOCUMENT | COURT_DATE_CHANGE |
                   PAYMENT_RECEIVED | FILE_URGENTLY | NO_ACTION

Tabs:
  🔴 URGENT (needs attention now)
  📋 ACTION NEEDED (requires advocate to do something)
  📨 UNREAD
  📁 ALL

Per-item display:
  - Channel icon (WhatsApp/Email/System/Court)
  - Case name + court
  - Message preview (50 chars)
  - Urgency badge: 🔴 URGENT | 🟡 MEDIUM | 🟢 LOW
  - Action chip: "Reply Required" | "Review Draft"
  - Timestamp

Quick actions: View full | Open case | Reply | Mark resolved | Snooze

API: GET /api/v1/inbox?limit=50&offset=0&tab=urgent
     WebSocket: ws://api/ws/inbox/{tenant_id}
```

#### 3.3.2 Task Execution Hub

```
Component:  TaskHub
Route:      /app/tasks

Task Sources:
  1. Court Order AI Extraction
     Order text: "Petitioner to file rejoinder within 4 weeks"
     → Task: "File Rejoinder in [Case]"
               Due: order_date + 28 days
               Linked: case_id
               Status: PENDING

  2. Manual tasks — advocate creates, links to case, sets due date

  3. Communication tasks
     Client: "I'll send documents by Friday"
     → Task: "Chase documents from [Client]"
               Due: Friday
               Auto-reminder: SMS to advocate if still PENDING on due date

View Layout:
  TODAY (N due)  |  UPCOMING (N)  |  OVERDUE (N)

Per task:
  □ Task title — Case name           Due: Today
    Court | Case Number
    [Open Case] [Mark Done] [Postpone]

API:
  GET  /api/v1/tasks?status=pending&due=today
  POST /api/v1/tasks { case_id, title, due_date, priority }
  PATCH /api/v1/tasks/{id} { "status": "completed" }
```

#### 3.3.3 Case Diary Workstation

```
Component:  CaseDiaryWorkstation
Route:      /app/cases

Layout:
  LEFT (320px)          │ MAIN PANEL
  Case List             │ Case Detail
  ─────────────────     │ ──────────────────────────────
  🔍 Search cases       │ Sharma v. Union of India
  Filter [All ▼]        │ Punjab & Haryana HC | CWP-1234
  ─────────────────     │ ──────────────────────────────
  🔴 Sharma v Union     │ NEXT HEARING: 15 Mar 2025
  P&H HC | 3 days       │ Division Bench | Court No. 5
  ─────────────────     │ [🔄 Scrape Now] [+ Add Date]
  🟡 Gupta v State      │ ──────────────────────────────
  Delhi HC | 2 weeks    │ ORDER HISTORY (Latest First)
  ─────────────────     │ 📄 12 Feb 2025
  🟢 Consumer Forum     │ "Petitioner to file rejoinder
  NCDRC | 1 month       │ within four weeks..."
  [+ New Case]          │ [📋 Task Created]

RIGHT PANEL (280px) — Quick Actions
  [✏️ Open Editor]
  [📤 Send Reminder]
  [💰 View Invoice]
  [📞 AI Call Client]

Real-time updates:
  WebSocket: ws://api/ws/diary/{tenant_id}
  Event: { "event": "ORDER_DETECTED", "case_id": "...", "order_text": "..." }
  → Case card highlights + order slides in at top of history
  → Toast: "New order detected in Sharma v. Union"
```

---

## 4. VIBRANT & MODERN UI/UX SPECIFICATIONS

### 4.1 Design Aesthetic — Glassmorphism 2.0

```
Philosophy:
  - Depth through translucency: Cards float above deep space background
  - Neon accents on interaction: Elements glow on hover/focus
  - Ultra-modern borders: 1px gradient stroke borders
  - Motion: 200ms ease-in-out transitions everywhere

Page Background:
  background: radial-gradient(ellipse at 20% 50%, rgba(26,79,191,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(109,40,217,0.1) 0%, transparent 50%),
              #0A0E1A;

Glass Card Component (all panels):
  background:          rgba(255, 255, 255, 0.05)
  backdrop-filter:     blur(20px) saturate(180%)
  -webkit-backdrop-filter: blur(20px) saturate(180%)
  border:              1px solid rgba(255, 255, 255, 0.12)
  border-radius:       16px
  box-shadow:          0 8px 32px rgba(0, 0, 0, 0.4),
                       inset 0 1px 0 rgba(255, 255, 255, 0.08)
```

### 4.2 Complete Color System

```css
/* CORE PALETTE */
--color-bg-obsidian:       #0A0E1A;   /* Page background */
--color-bg-surface:        #0F1629;   /* Card base */
--color-bg-elevated:       #151E38;   /* Elevated card / modal */
--color-bg-border:         #1E2D4A;   /* Default border */

/* BRAND */
--color-brand-blue:        #1A4FBF;   /* LETESE text, primary */
--color-brand-blue-light:  #3B6FDF;   /* Hover */
--color-brand-blue-glow:   rgba(26,79,191,0.3);
--color-brand-green:       #22C55E;   /* Logo dot, success, CTA */
--color-brand-green-glow:  rgba(34,197,94,0.25);

/* NEON ACCENTS */
--color-neon-cyan:         #00D4FF;   /* Interactive highlights */
--color-neon-cyan-dim:     rgba(0,212,255,0.15);
--color-neon-cyan-glow:    rgba(0,212,255,0.3);
--color-electric-purple:   #8B5CF6;   /* AI elements, premium */
--color-purple-dim:        rgba(139,92,246,0.15);
--color-purple-glow:       rgba(139,92,246,0.3);

/* SEMANTIC */
--color-success:           #22C55E;
--color-success-bg:        rgba(34,197,94,0.1);
--color-warning:           #F59E0B;
--color-warning-bg:        rgba(245,158,11,0.1);
--color-error:             #EF4444;
--color-error-bg:          rgba(239,68,68,0.1);
--color-info:              #00D4FF;
--color-info-bg:           rgba(0,212,255,0.1);

/* TEXT */
--color-text-primary:      #F0F4FF;
--color-text-secondary:    #8899BB;
--color-text-tertiary:     #4A5A7A;

/* URGENCY */
--color-urgent:            #FF4545;   /* Hearing < 48h */
--color-medium:            #F59E0B;   /* Hearing < 7d */
--color-low:               #22C55E;   /* Hearing > 7d */
```

### 4.3 Typography System

```css
/* Imports */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi:wght@400;600&family=Noto+Sans+Devanagari:wght@400;600&display=swap');

--font-body:           'Inter', -apple-system, sans-serif;
--font-code:           'JetBrains Mono', 'Courier New', monospace;
--font-gurmukhi:       'Noto Sans Gurmukhi', sans-serif;
--font-devanagari:     'Noto Sans Devanagari', sans-serif;

/* Scale */
--text-xs:     11px;   --text-sm:   13px;   --text-base: 15px;
--text-md:     17px;   --text-lg:   20px;   --text-xl:   24px;
--text-2xl:    30px;   --text-3xl:  36px;   --text-hero: 56px;
```

### 4.4 Interactive Element CSS

```css
/* PRIMARY BUTTON */
.btn-primary {
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  color: #FFFFFF; font-weight: 600; padding: 10px 24px;
  border-radius: 10px; border: none; cursor: pointer;
  box-shadow: 0 0 20px rgba(34,197,94,0.3);
  transition: all 200ms ease-in-out;
}
.btn-primary:hover {
  box-shadow: 0 0 32px rgba(34,197,94,0.5);
  transform: translateY(-1px);
}

/* SECONDARY BUTTON */
.btn-secondary {
  background: rgba(26,79,191,0.15); color: #3B6FDF;
  font-weight: 500; padding: 10px 24px; border-radius: 10px;
  border: 1px solid rgba(26,79,191,0.4); cursor: pointer;
  transition: all 200ms ease-in-out;
}
.btn-secondary:hover {
  background: rgba(26,79,191,0.25); border-color: rgba(26,79,191,0.7);
  box-shadow: 0 0 20px rgba(26,79,191,0.2);
}

/* INPUT FIELD */
.input-field {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  color: #F0F4FF; padding: 10px 14px; font-size: 15px;
  transition: all 200ms ease; width: 100%;
}
.input-field:focus {
  outline: none; border-color: #00D4FF;
  box-shadow: 0 0 0 3px rgba(0,212,255,0.15), 0 0 20px rgba(0,212,255,0.1);
}

/* STATUS BADGES */
.badge { border-radius: 20px; padding: 3px 10px; font-size: 12px; font-weight: 600; }
.badge-active  { background: rgba(34,197,94,0.15); color: #22C55E; border: 1px solid rgba(34,197,94,0.3); }
.badge-warning { background: rgba(245,158,11,0.15); color: #F59E0B; border: 1px solid rgba(245,158,11,0.3); }
.badge-error   { background: rgba(239,68,68,0.15); color: #EF4444; border: 1px solid rgba(239,68,68,0.3); }
.badge-ai      { background: rgba(139,92,246,0.15); color: #8B5CF6; border: 1px solid rgba(139,92,246,0.3); }
.badge-court   { background: rgba(0,212,255,0.1); color: #00D4FF; border: 1px solid rgba(0,212,255,0.25); }

/* NEON ICON GLOWS */
.icon-cyan   { color: #00D4FF; filter: drop-shadow(0 0 6px rgba(0,212,255,0.6)); }
.icon-purple { color: #8B5CF6; filter: drop-shadow(0 0 6px rgba(139,92,246,0.6)); }
.icon-green  { color: #22C55E; filter: drop-shadow(0 0 6px rgba(34,197,94,0.6)); }

/* SIDEBAR NAVIGATION */
.sidebar {
  width: 240px;
  background: rgba(255,255,255,0.03);
  border-right: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(12px);
}
.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; border-radius: 10px; color: #8899BB; cursor: pointer;
  transition: all 150ms ease;
}
.nav-item:hover, .nav-item.active {
  background: rgba(0,212,255,0.08); color: #00D4FF;
  box-shadow: inset 3px 0 0 #00D4FF;
}
```

### 4.5 Flutter Dark Theme

```dart
// lib/theme/app_theme.dart
import 'package:flutter/material.dart';

class AppTheme {
  static const Color bgObsidian     = Color(0xFF0A0E1A);
  static const Color bgSurface      = Color(0xFF0F1629);
  static const Color bgElevated     = Color(0xFF151E38);
  static const Color bgBorder       = Color(0xFF1E2D4A);
  static const Color brandBlue      = Color(0xFF1A4FBF);
  static const Color brandGreen     = Color(0xFF22C55E);
  static const Color neonCyan       = Color(0xFF00D4FF);
  static const Color electricPurple = Color(0xFF8B5CF6);
  static const Color textPrimary    = Color(0xFFF0F4FF);
  static const Color textSecondary  = Color(0xFF8899BB);

  static ThemeData get darkTheme => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bgObsidian,
    colorScheme: ColorScheme.dark(
      primary: brandBlue, secondary: neonCyan,
      tertiary: electricPurple, surface: bgSurface, onSurface: textPrimary,
    ),
    cardTheme: CardTheme(
      color: bgSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: bgBorder, width: 1),
      ),
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: brandGreen, foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0x0DFFFFFF),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0x1AFFFFFF)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: neonCyan, width: 1.5),
      ),
      hintStyle: const TextStyle(color: Color(0xFF4A5A7A)),
    ),
    fontFamily: 'Inter',
    textTheme: const TextTheme(
      bodyLarge:      TextStyle(fontSize: 15, color: textPrimary,   height: 1.7),
      bodyMedium:     TextStyle(fontSize: 13, color: textSecondary, height: 1.6),
      titleLarge:     TextStyle(fontSize: 20, color: textPrimary,   fontWeight: FontWeight.w600),
      titleMedium:    TextStyle(fontSize: 17, color: textPrimary,   fontWeight: FontWeight.w500),
      headlineMedium: TextStyle(fontSize: 30, color: textPrimary,   fontWeight: FontWeight.w700),
    ),
  );
}
```

---

## 5. OMNI-CHANNEL API INFRASTRUCTURE

### 5.1 LLM Gateway — Modular Provider Switching

```python
# backend/services/llm_gateway.py
from enum import Enum
from abc import ABC, abstractmethod
from typing import Optional
import openai, anthropic, httpx

class LLMResponse:
    def __init__(self, text: str, tokens_input: int, tokens_output: int,
                 model: str, provider: str):
        self.text = text
        self.tokens_input = tokens_input
        self.tokens_output = tokens_output
        self.model = model
        self.provider = provider

class OpenAIProvider:
    def __init__(self, config: dict):
        self.client = openai.AsyncOpenAI(api_key=config["api_key"])
        self.model  = config.get("default_model", "gpt-4o-mini")

    async def complete(self, prompt: str, system: str = "",
                       max_tokens: int = 2000) -> LLMResponse:
        messages = []
        if system: messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = await self.client.chat.completions.create(
            model=self.model, messages=messages, max_tokens=max_tokens)
        return LLMResponse(
            text=resp.choices[0].message.content,
            tokens_input=resp.usage.prompt_tokens,
            tokens_output=resp.usage.completion_tokens,
            model=self.model, provider="openai")

class AnthropicProvider:
    def __init__(self, config: dict):
        self.client = anthropic.AsyncAnthropic(api_key=config["api_key"])
        self.model  = config.get("default_model", "claude-3-5-sonnet-20241022")

    async def complete(self, prompt: str, system: str = "",
                       max_tokens: int = 2000) -> LLMResponse:
        resp = await self.client.messages.create(
            model=self.model, max_tokens=max_tokens,
            system=system or "You are a helpful legal assistant.",
            messages=[{"role": "user", "content": prompt}])
        return LLMResponse(
            text=resp.content[0].text,
            tokens_input=resp.usage.input_tokens,
            tokens_output=resp.usage.output_tokens,
            model=self.model, provider="anthropic")

class OllamaProvider:
    """Local LLM — Mac Mini M4 or Ubuntu SSD"""
    def __init__(self, config: dict):
        self.base_url = config.get("base_url", "http://mac-mini-m4:11434")
        self.model    = config.get("model", "llama3:8b")

    async def complete(self, prompt: str, system: str = "",
                       max_tokens: int = 2000) -> LLMResponse:
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": full_prompt, "stream": False})
        data = resp.json()
        text = data["response"]
        return LLMResponse(text=text,
            tokens_input=len(full_prompt.split()), tokens_output=len(text.split()),
            model=self.model, provider="ollama")


class LLMGateway:
    """
    Central gateway. Reads active provider from vendor_configs table.
    Supports runtime switching without restart.
    Cost Optimization Routing:
      QUALITY  → Always primary premium model
      BALANCED → Primary for drafting; cheapest for summaries
      ECONOMY  → Ollama where available; fallback to cheapest cloud
    """
    _providers: dict = {}
    _config: dict = {}

    @classmethod
    async def initialize(cls):
        from database.vendor_configs import get_vendor_config
        cls._config = await get_vendor_config("llm")
        cls._providers = {
            "openai":    OpenAIProvider(cls._config.get("openai", {})),
            "anthropic": AnthropicProvider(cls._config.get("anthropic", {})),
            "ollama":    OllamaProvider(cls._config.get("ollama", {})),
        }

    @classmethod
    async def complete(cls, prompt: str, system: str = "",
                       task_type: str = "general", max_tokens: int = 2000,
                       force_provider: Optional[str] = None) -> LLMResponse:
        mode     = cls._config.get("cost_optimization_mode", "BALANCED")
        active   = cls._config.get("active_provider", "openai")
        fallback = cls._config.get("fallback_provider", "ollama")
        ollama_on = cls._config.get("ollama", {}).get("enabled", False)

        if force_provider:
            provider_key = force_provider
        elif mode == "QUALITY":
            provider_key = active
        elif mode == "ECONOMY":
            provider_key = "ollama" if ollama_on else active
        else:  # BALANCED
            provider_key = active if task_type in ("draft", "compliance") else \
                           ("ollama" if ollama_on else "openai")

        try:
            result = await cls._providers[provider_key].complete(prompt, system, max_tokens)
            await cls._log_usage(result, task_type)
            return result
        except Exception:
            return await cls._providers.get(fallback, cls._providers[active]).complete(
                prompt, system, max_tokens)

    @classmethod
    async def _log_usage(cls, result: LLMResponse, task_type: str):
        pass  # INSERT INTO llm_usage_log
```

### 5.2 WhatsApp Business API (360dialog)

```python
# backend/services/whatsapp_service.py
import httpx
from database.vendor_configs import get_vendor_config
from database.communication_log import log_communication

WHATSAPP_TEMPLATES = {
    "hearing_reminder_15d": {
        "name":   "letese_hearing_reminder_15d",
        "params": ["client_name","advocate_name","case_title","hearing_date",
                   "hearing_time","court_name","last_order_summary","action_required"]
    },
    "order_alert": {
        "name":   "letese_order_alert",
        "params": ["case_title","court_name","order_date","order_summary",
                   "client_action","advocate_name"]
    },
    "payment_reminder": {
        "name":   "letese_payment_reminder",
        "params": ["firm_name","amount","due_date","case_title","payment_link","advocate_name"]
    }
}

class WhatsAppService:
    async def send_template_message(self, to_phone: str, template_name: str,
                                    template_params: list, case_id: str,
                                    tenant_id: str, message_type: str) -> dict:
        config = await get_vendor_config("whatsapp_360dialog")
        headers = {"D360-API-KEY": config["api_key"], "Content-Type": "application/json"}
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone.replace("+", "").replace(" ", ""),
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en_IN"},
                "components": [{"type": "body",
                    "parameters": [{"type": "text", "text": p} for p in template_params]}]
            }
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://waba.360dialog.io/v1/messages",
                                     json=payload, headers=headers, timeout=10)
        result    = resp.json()
        msg_id    = result.get("messages", [{}])[0].get("id")
        status    = "sent" if resp.status_code == 200 else "failed"
        await log_communication(case_id=case_id, tenant_id=tenant_id,
            channel="whatsapp", message_type=message_type,
            recipient_phone=to_phone,
            message_body=f"[Template: {template_name}] {template_params}",
            delivery_status=status, provider_message_id=msg_id)
        return {"status": status, "message_id": msg_id}


async def handle_whatsapp_webhook(payload: dict):
    """
    Process incoming WhatsApp events:
      1. Delivery status updates (sent → delivered → read → failed)
      2. Incoming client messages (replies, confirmations)
    """
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for status in value.get("statuses", []):
                await update_delivery_status(
                    provider_message_id=status["id"],
                    new_status=status["status"])
            for message in value.get("messages", []):
                phone = message.get("from")
                text  = message.get("text", {}).get("body", "").lower().strip()
                await open_service_window(phone)
                CONFIRMATION_KEYWORDS = [
                    "confirmed","done","sent","submitted","uploaded",
                    "भेज दिया","हो गया","ਭੇਜ ਦਿੱਤਾ","ਕਰ ਦਿੱਤਾ"
                ]
                if any(kw in text for kw in CONFIRMATION_KEYWORDS):
                    await handle_document_confirmation(phone, text)
                await store_inbox_message(phone=phone, channel="whatsapp",
                                          content=text,
                                          provider_message_id=message.get("id"))
```

### 5.3 SMS Integration (MSG91)

```python
# backend/services/sms_service.py
import httpx
from database.vendor_configs import get_vendor_config
from database.communication_log import log_communication

class SMSService:
    async def send(self, to_phone: str, message: str,
                   case_id: str, tenant_id: str, message_type: str) -> dict:
        config = await get_vendor_config("sms_msg91")
        params = {
            "authkey":  config["auth_key"],
            "mobiles":  to_phone.replace("+91", "91").replace("+", ""),
            "message":  message[:160],
            "sender":   config.get("sender_id", "LETESE"),
            "route":    "4",   # Transactional
            "country":  "91",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://api.msg91.com/api/sendhttp.php",
                                    params=params, timeout=10)
        status = "sent" if resp.status_code == 200 else "failed"
        await log_communication(case_id=case_id, tenant_id=tenant_id,
            channel="sms", message_type=message_type,
            recipient_phone=to_phone, message_body=message, delivery_status=status)
        return {"status": status}
```

### 5.4 AI Voice Call (Exotel + ElevenLabs TTS)

```python
# backend/services/voice_service.py
"""
AI Voice Call — ENTERPRISE PLAN ONLY
Flow:
  1. Advocate triggers call (or AIPOT-COMMUNICATOR triggers)
  2. ElevenLabs generates TTS audio (Indian English voice)
  3. Audio uploaded to S3 as temp .mp3 (1h TTL)
  4. Exotel places outbound call; client hears AI voice
  5. DTMF keypad input handled by Exotel for confirmations
  6. Call transcript stored in S3 + PostgreSQL
"""
import httpx
from database.vendor_configs import get_vendor_config

CALL_SCRIPTS = {
    "hearing_reminder": (
        "Namaste. This is an automated reminder from {advocate_name}'s legal office. "
        "Your hearing in {case_title} is scheduled on {hearing_date} at {hearing_time} "
        "in {court_name}. Please ensure you are present. "
        "Press 1 to confirm. Press 2 to request a callback. Thank you."
    ),
    "document_collection": (
        "Namaste {client_name}. We require the following documents: {document_list}. "
        "Please WhatsApp them to {whatsapp_number}. "
        "Press 1 if already sent. Press 2 if you need more time. Thank you."
    ),
    "payment_reminder": (
        "Namaste {client_name}. Outstanding payment of Rupees {amount} is due on {due_date} "
        "for {case_title}. A payment link has been sent to your WhatsApp. "
        "Press 1 if already paid. Press 2 to speak with our team. Thank you."
    )
}

class VoiceService:
    async def generate_tts_audio(self, script: str, voice_id: str = None) -> str:
        """Returns S3 presigned URL of generated .mp3"""
        config = await get_vendor_config("elevenlabs")
        voice  = voice_id or config.get("voice_id", "EXAVITQu4vr4xnSDxMaL")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
                headers={"xi-api-key": config["api_key"],
                         "Content-Type": "application/json"},
                json={"text": script, "model_id": "eleven_multilingual_v2",
                      "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}},
                timeout=30)
        from services.storage import upload_to_s3
        from uuid import uuid4
        s3_url = await upload_to_s3(resp.content, "letese-voice-temp",
                                    f"calls/{uuid4()}.mp3", ttl_hours=1)
        return s3_url

    async def place_outbound_call(self, to_phone: str, s3_audio_url: str,
                                  case_id: str, tenant_id: str,
                                  call_script: str = "") -> dict:
        config = await get_vendor_config("exotel")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.exotel.com/v1/Accounts/{config['sid']}/Calls/connect",
                auth=(config["api_key"], config["api_token"]),
                data={
                    "From": config["caller_id"], "To": to_phone,
                    "CallerId": config["caller_id"],
                    "Url": f"https://api.letese.xyz/webhooks/exotel/call-flow"
                           f"?audio_url={s3_audio_url}",
                    "StatusCallback": f"https://api.letese.xyz/webhooks/exotel/call-status"
                                      f"?case_id={case_id}",
                    "Record": "true", "RecordingChannels": "dual"
                })
        call_sid = resp.json().get("Call", {}).get("Sid")
        await log_ai_call(case_id=case_id, tenant_id=tenant_id,
                          to_phone=to_phone, call_sid=call_sid,
                          script=call_script, status="initiated")
        return {"status": "initiated", "call_sid": call_sid}
```

---

## 6. TECHNICAL STACK & ENVIRONMENT

### 6.1 Complete Stack Reference

```yaml
frontend:
  framework:    Flutter 3.22+
  language:     Dart 3.4+
  targets:      Android (API 26+), iOS 14+, Web (Chrome/Safari/Firefox)
  state_mgmt:   Riverpod 2.5+
  http:         Dio 5.x
  websocket:    web_socket_channel 2.4+
  offline:      drift (SQLite) for case diary cache
  editor:       flutter_inappwebview 6.x (Tiptap WebView)
  fonts:        google_fonts (Inter, Noto Sans Gurmukhi, Noto Sans Devanagari)
  push:         firebase_messaging 15.x (FCM / APNS)

backend_api:
  runtime:      Python 3.11+
  framework:    FastAPI 0.111+
  server:       uvicorn[standard] 0.30+
  validation:   Pydantic v2
  orm:          SQLAlchemy 2.0 (async) + asyncpg
  migrations:   Alembic 1.13+
  kafka:        aiokafka 0.10+
  redis:        aioredis 2.x

aipot_agents:
  runtime:      Python 3.11+
  scraping:     playwright 1.44+
  html_parse:   beautifulsoup4 4.12+
  nlp:          spacy 3.7+ (en_core_web_sm)
  http:         httpx 0.27+
  llm_openai:   openai 1.30+
  llm_claude:   anthropic 0.28+

database:
  primary:      PostgreSQL 16 + pgvector 0.7+ + pg_trgm
  pool:         PgBouncer (transaction mode, max 100 connections)
  cache:        Redis 7.2
  search:       pg_trgm for fuzzy case/party search

message_broker:
  platform:     Apache Kafka 3.7
  ui:           Kafka UI (Provectus) for monitoring

editor:
  engine:       Tiptap v2 + Y.js 13.x + y-websocket
  export:       Pandoc 3.x (server-side DOCX), Puppeteer (PDF)
  import:       mammoth.js (DOCX→HTML in WebView)

infrastructure:
  containers:   Docker 25+ / Kubernetes 1.30+
  ci_cd:        GitHub Actions + ArgoCD
  secrets:      AWS Secrets Manager
  storage:      AWS S3 (prod) / MinIO (local dev)
  monitoring:   Prometheus 2.52 + Grafana 11 + Loki 3
  alerting:     PagerDuty + Slack webhooks
  ssl:          cert-manager (Let's Encrypt)
  cdn:          CloudFront Mumbai edge (prod)

hosting:
  dev_machine_1:
    os:      Ubuntu 24.04 (Portable SSD, USB-C 3.0)
    role:    Primary dev — Kafka, PostgreSQL, Redis, Python backends
    ram:     16GB minimum
    storage: 500GB (use ext4 partition for Docker volumes)

  dev_machine_2:
    hardware: Mac Mini M4
    role:     LLM inference (Ollama Metal), Flutter iOS simulator, Xcode builds
    ram:      16–24GB unified memory
    ollama:   [llama3:8b, mistral:7b, codellama:13b]

  production:
    platform: AWS EKS
    region:   ap-south-1 (Mumbai — Indian data sovereignty)
    nodes:    3x t3.large minimum
```

### 6.2 Ubuntu 24.04 SSD Setup Script

```bash
#!/bin/bash
# scripts/setup/ubuntu_ssd_setup.sh
set -e

# Docker
apt-get update && apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# K3s (lightweight Kubernetes for SSD)
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --disable traefik --docker" sh -

# Python 3.11 + pip
apt-get install -y python3.11 python3.11-venv python3-pip

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Kafka + Kafka UI via Docker Compose
mkdir -p /opt/letese/kafka && cat > /opt/letese/kafka/docker-compose.yml << 'EOF'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment: { ZOOKEEPER_CLIENT_PORT: 2181 }
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports: ["9092:9092"]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    depends_on: [zookeeper]
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports: ["8080:8080"]
    environment: { KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092 }
    depends_on: [kafka]
EOF
cd /opt/letese/kafka && docker compose up -d
echo "Setup complete. Kafka UI: http://localhost:8080"
```

### 6.3 Mac Mini M4 Ollama Setup

```bash
#!/bin/bash
# Install Ollama (Metal GPU accelerated on M4)
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull llama3:8b
ollama pull mistral:7b
ollama pull codellama:13b

# Listen on all interfaces (so Ubuntu SSD can reach it)
# Edit /Library/LaunchDaemons/com.ollama.ollama.plist
# Add environment variable: OLLAMA_HOST=0.0.0.0

# Verify from Ubuntu SSD:
# curl http://mac-mini-m4.local:11434/api/tags | python3 -m json.tool
```

### 6.4 Environment Variables

```bash
# .env.production — stored in AWS Secrets Manager, never in Git

# Database
DATABASE_URL=postgresql+asyncpg://letese_user:${DB_PASS}@postgres-primary:5432/letese_prod
PGBOUNCER_URL=postgresql+asyncpg://letese_user:${DB_PASS}@pgbouncer:6432/letese_prod
REDIS_URL=redis://redis-primary:6379/0
KAFKA_BOOTSTRAP_SERVERS=kafka-1:9092,kafka-2:9092,kafka-3:9092

# Auth
JWT_ALGORITHM=RS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_PRIVATE_KEY_PATH=/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/secrets/jwt_public.pem

# AWS
AWS_REGION=ap-south-1
AWS_S3_BUCKET_DOCS=letese-tenant-docs-prod
AWS_S3_BUCKET_VOICE=letese-voice-prod
AWS_SECRETS_MANAGER_PREFIX=letese/prod/

# Feature flags
WHATSAPP_ENABLED=true
AI_VOICE_CALLS_ENABLED=false   # Enterprise only
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://mac-mini-m4.local:11434
MAX_FREE_CASES=30
MAX_FREE_STORAGE_GB=5
```


---

## 7. DATABASE SCHEMA — MULTI-TENANT POSTGRESQL

```sql
-- ================================================================
-- LETESE● MASTER SCHEMA — PostgreSQL 16 + pgvector
-- Run: psql -U postgres -d letese_prod -f schema.sql
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ── TENANTS ──────────────────────────────────────────────────────
CREATE TABLE tenants (
    tenant_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(255) NOT NULL,
    plan                 VARCHAR(20)  NOT NULL DEFAULT 'basic'
                           CHECK (plan IN ('basic','professional','elite','enterprise')),
    email                VARCHAR(255) NOT NULL UNIQUE,
    phone                VARCHAR(20)  NOT NULL,
    bar_enrolment_no     VARCHAR(100),
    gstin                VARCHAR(20),
    firm_address         TEXT,
    storage_used_bytes   BIGINT       NOT NULL DEFAULT 0,
    cases_active_count   INTEGER      NOT NULL DEFAULT 0,
    scraper_enabled      BOOLEAN      NOT NULL DEFAULT FALSE,
    ai_drafting_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    translation_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    status               VARCHAR(20)  NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','suspended','trial','cancelled')),
    razorpay_customer_id VARCHAR(100),
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at           TIMESTAMPTZ
);

-- ── USERS ────────────────────────────────────────────────────────
CREATE TABLE users (
    user_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    whatsapp_number VARCHAR(20),
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'advocate'
                      CHECK (role IN ('super_admin','admin','advocate','clerk','paralegal','intern')),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    otp_secret      VARCHAR(100),
    google_sub      VARCHAR(255),
    last_login_at   TIMESTAMPTZ,
    notification_prefs JSONB   NOT NULL DEFAULT
                      '{"whatsapp":true,"sms":true,"email":true,"inapp":true}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ── CASES ────────────────────────────────────────────────────────
CREATE TABLE cases (
    case_id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID        NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    assigned_user_id    UUID        REFERENCES users(user_id),
    case_number         VARCHAR(150),
    case_title          VARCHAR(600) NOT NULL,
    court_code          VARCHAR(50)  NOT NULL,
    court_display_name  VARCHAR(255),
    petition_type       VARCHAR(100),
    client_name         VARCHAR(255) NOT NULL,
    client_phone        VARCHAR(20)  NOT NULL,
    client_email        VARCHAR(255),
    client_whatsapp     VARCHAR(20),
    status              VARCHAR(30)  NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','closed','stayed','transferred','archived')),
    urgency_level       VARCHAR(10)  NOT NULL DEFAULT 'low'
                          CHECK (urgency_level IN ('critical','high','medium','low')),
    next_hearing_at     TIMESTAMPTZ,
    last_order_text     TEXT,
    last_order_date     DATE,
    last_order_summary  TEXT,
    last_scraped_at     TIMESTAMPTZ,
    scrape_error_count  INTEGER     NOT NULL DEFAULT 0,
    court_url           TEXT,
    notes               TEXT,
    metadata            JSONB       NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_cases_tenant_status ON cases(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_hearing_date  ON cases(next_hearing_at) WHERE status = 'active';
CREATE INDEX idx_cases_title_fts     ON cases USING gin(to_tsvector('english', case_title));
CREATE INDEX idx_cases_client_fts    ON cases USING gin(to_tsvector('english', client_name));

-- ── CASE HEARINGS ────────────────────────────────────────────────
CREATE TABLE case_hearings (
    hearing_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id      UUID        NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    tenant_id    UUID        NOT NULL,
    hearing_date TIMESTAMPTZ NOT NULL,
    court_code   VARCHAR(50),
    bench        VARCHAR(255),
    purpose      VARCHAR(255),
    outcome      TEXT,
    next_date    TIMESTAMPTZ,
    source       VARCHAR(20) NOT NULL DEFAULT 'scraper'
                   CHECK (source IN ('scraper','manual','advocate')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_hearings_case ON case_hearings(case_id, hearing_date DESC);

-- ── COMMUNICATION SCHEDULE ───────────────────────────────────────
CREATE TABLE communication_schedule (
    schedule_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id        UUID        NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    tenant_id      UUID        NOT NULL,
    message_type   VARCHAR(30) NOT NULL
                     CHECK (message_type IN (
                       'reminder_15d','reminder_7d','reminder_48h','reminder_24h',
                       'order_alert','payment_reminder','document_chase')),
    scheduled_at   TIMESTAMPTZ NOT NULL,
    sent           BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_at        TIMESTAMPTZ,
    channel        VARCHAR(20) NOT NULL DEFAULT 'whatsapp'
                     CHECK (channel IN ('whatsapp','sms','email','ai_call')),
    template_params JSONB      NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comm_schedule_due ON communication_schedule(scheduled_at, sent)
    WHERE sent = FALSE;

-- ── COMMUNICATION LOG ────────────────────────────────────────────
CREATE TABLE communication_log (
    log_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID        NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    tenant_id           UUID        NOT NULL,
    channel             VARCHAR(20) NOT NULL,
    message_type        VARCHAR(30) NOT NULL,
    recipient_phone     VARCHAR(20),
    recipient_email     VARCHAR(255),
    message_body        TEXT        NOT NULL,
    template_name       VARCHAR(100),
    delivery_status     VARCHAR(20) NOT NULL DEFAULT 'sent'
                          CHECK (delivery_status IN ('sent','delivered','read','failed','bounced')),
    provider_message_id VARCHAR(255),
    dispatched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at        TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    error_code          VARCHAR(50),
    error_message       TEXT,
    llm_tokens_used     INTEGER     DEFAULT 0,
    llm_cost_inr        DECIMAL(8,4) DEFAULT 0
);
CREATE INDEX idx_comm_log_case   ON communication_log(case_id, dispatched_at DESC);
CREATE INDEX idx_comm_log_phone  ON communication_log(recipient_phone, dispatched_at DESC);
CREATE INDEX idx_comm_log_failed ON communication_log(delivery_status)
    WHERE delivery_status = 'failed';

-- ── DOCUMENTS ────────────────────────────────────────────────────
CREATE TABLE documents (
    doc_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         UUID        REFERENCES cases(case_id) ON DELETE SET NULL,
    tenant_id       UUID        NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    uploaded_by     UUID        REFERENCES users(user_id),
    name            VARCHAR(500) NOT NULL,
    doc_type        VARCHAR(50) NOT NULL
                      CHECK (doc_type IN ('petition','affidavit','order','vakalatnama',
                                          'evidence','translated','ai_draft','other')),
    file_format     VARCHAR(10) NOT NULL CHECK (file_format IN ('pdf','docx','jpg','png','mp3')),
    s3_bucket       VARCHAR(255) NOT NULL,
    s3_key          VARCHAR(500) NOT NULL,
    s3_url          TEXT,
    file_size_bytes BIGINT      NOT NULL,
    language        VARCHAR(20) NOT NULL DEFAULT 'en'
                      CHECK (language IN ('en','hi','pa','ta','te','kn','mr','gu')),
    translation_of  UUID        REFERENCES documents(doc_id),
    accuracy_pct    DECIMAL(5,2),
    is_filing_ready BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ── Y.JS DOCUMENT STATE ──────────────────────────────────────────
CREATE TABLE yjs_documents (
    ydoc_id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id         UUID    NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    tenant_id      UUID    NOT NULL,
    ydoc_state     BYTEA   NOT NULL,
    version        INTEGER NOT NULL DEFAULT 1,
    last_editor_id UUID    REFERENCES users(user_id),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TASKS ────────────────────────────────────────────────────────
CREATE TABLE tasks (
    task_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID        NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    case_id          UUID        REFERENCES cases(case_id) ON DELETE CASCADE,
    assigned_to      UUID        REFERENCES users(user_id),
    title            VARCHAR(500) NOT NULL,
    description      TEXT,
    due_date         TIMESTAMPTZ  NOT NULL,
    priority         VARCHAR(10)  NOT NULL DEFAULT 'medium'
                       CHECK (priority IN ('critical','high','medium','low')),
    status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','in_progress','completed','cancelled')),
    source           VARCHAR(20)  NOT NULL DEFAULT 'manual'
                       CHECK (source IN ('manual','court_order','ai_extracted','communication')),
    source_order_text TEXT,
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tasks_due ON tasks(tenant_id, due_date, status) WHERE status != 'completed';

-- ── INVOICES ─────────────────────────────────────────────────────
CREATE TABLE invoices (
    invoice_id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID          NOT NULL REFERENCES tenants(tenant_id),
    case_id           UUID          REFERENCES cases(case_id),
    client_name       VARCHAR(255)  NOT NULL,
    client_gstin      VARCHAR(20),
    invoice_number    VARCHAR(50)   NOT NULL UNIQUE,
    issue_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    due_date          DATE          NOT NULL,
    subtotal_inr      DECIMAL(10,2) NOT NULL,
    gst_pct           DECIMAL(4,2)  NOT NULL DEFAULT 18.00,
    gst_inr           DECIMAL(10,2) NOT NULL,
    total_inr         DECIMAL(10,2) NOT NULL,
    paid_inr          DECIMAL(10,2) NOT NULL DEFAULT 0,
    status            VARCHAR(20)   NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('draft','sent','partial','paid','overdue','cancelled')),
    payment_link      TEXT,
    razorpay_order_id VARCHAR(100),
    s3_pdf_key        TEXT,
    notes             TEXT,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOGS ───────────────────────────────────────────────────
CREATE TABLE audit_logs (
    audit_id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type            VARCHAR(20) NOT NULL CHECK (audit_type IN ('small','major','compliance')),
    started_at            TIMESTAMPTZ NOT NULL,
    completed_at          TIMESTAMPTZ,
    duration_ms           INTEGER,
    checks_run            INTEGER     NOT NULL DEFAULT 0,
    checks_passed         INTEGER     NOT NULL DEFAULT 0,
    checks_failed         INTEGER     NOT NULL DEFAULT 0,
    auto_actions_taken    JSONB       NOT NULL DEFAULT '[]',
    escalation_triggered  BOOLEAN     NOT NULL DEFAULT FALSE,
    pagerduty_incident_id VARCHAR(100),
    full_report           JSONB       NOT NULL DEFAULT '{}',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_type_date ON audit_logs(audit_type, started_at DESC);

-- ── COURT CHECKLISTS ─────────────────────────────────────────────
CREATE TABLE court_checklists (
    checklist_id   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    court_code     VARCHAR(50)  NOT NULL,
    petition_type  VARCHAR(100) NOT NULL,
    version        VARCHAR(20)  NOT NULL DEFAULT '1.0',
    effective_date DATE         NOT NULL,
    rules          JSONB        NOT NULL,
    -- rules: [{ "rule_id":"R001","description":"...","severity":"CRITICAL|WARNING",
    --           "check_type":"word_count|section_present|format|fee","params":{...} }]
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_checklist_active ON court_checklists(court_code, petition_type, is_active)
    WHERE is_active = TRUE;

-- ── CASE EMBEDDINGS (pgvector) ───────────────────────────────────
CREATE TABLE case_embeddings (
    embedding_id     UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type      VARCHAR(30) NOT NULL
                       CHECK (source_type IN ('sc_judgment','hc_judgment','order')),
    case_citation    VARCHAR(400) NOT NULL,
    court_code       VARCHAR(50)  NOT NULL,
    judgment_year    INTEGER      NOT NULL,
    bench            VARCHAR(255),
    summary_text     TEXT         NOT NULL,
    full_text_url    TEXT,
    embedding_vector vector(768),
    metadata         JSONB        NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_embeddings_hnsw ON case_embeddings
    USING hnsw (embedding_vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_embeddings_court ON case_embeddings(court_code, judgment_year);

-- ── VENDOR CONFIGS ───────────────────────────────────────────────
CREATE TABLE vendor_configs (
    config_id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name         VARCHAR(100) NOT NULL UNIQUE,
    config_data         JSONB        NOT NULL,   -- Encrypted at application layer
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    last_verified_at    TIMESTAMPTZ,
    verification_status VARCHAR(20)  DEFAULT 'unverified'
                          CHECK (verification_status IN ('verified','failed','unverified')),
    updated_by          UUID         REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── LLM USAGE LOG ────────────────────────────────────────────────
CREATE TABLE llm_usage_log (
    usage_id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID    REFERENCES tenants(tenant_id),
    provider      VARCHAR(30)  NOT NULL,
    model         VARCHAR(100) NOT NULL,
    task_type     VARCHAR(50)  NOT NULL,
    tokens_input  INTEGER      NOT NULL,
    tokens_output INTEGER      NOT NULL,
    cost_inr      DECIMAL(8,4) NOT NULL DEFAULT 0,
    latency_ms    INTEGER,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_llm_usage_tenant ON llm_usage_log(tenant_id, created_at)
    WHERE created_at > NOW() - INTERVAL '31 days';

-- ── ROW-LEVEL SECURITY ───────────────────────────────────────────
ALTER TABLE cases             ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices          ENABLE ROW LEVEL SECURITY;

-- App sets: SET LOCAL app.current_tenant_id = '{uuid}' before every query
CREATE POLICY tenant_iso ON cases
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON documents
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON communication_log
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON tasks
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON invoices
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Super admin bypass (no tenant filter)
CREATE POLICY super_admin_bypass ON cases
    USING (current_setting('app.role', true) = 'super_admin');

-- ── AUTO updated_at TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['tenants','users','cases','documents','invoices','tasks'] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
  END LOOP;
END $$;
```

**Kafka Topics — create on broker startup:**
```
letese.scraper.jobs            retention: 1h   partitions: 6
letese.diary.updates           retention: 24h  partitions: 3
letese.orders.new              retention: 24h  partitions: 3
letese.communications.dispatch retention: 24h  partitions: 6
letese.police.heartbeats       retention: 2h   partitions: 1
letese.police.errors           retention: 7d   partitions: 3
letese.police.metrics          retention: 7d   partitions: 1
letese.build.status            retention: 7d   partitions: 1
```


---

## 8. AIPOT MULTI-AGENT SYSTEM ARCHITECTURE

### 8.1 AIPOT Base Class — Lifecycle, Retry, Heartbeat

```python
# backend/aipots/base.py
import asyncio, json, time, logging
from abc import ABC, abstractmethod
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
import aioredis

logger = logging.getLogger(__name__)

class BaseAIPOT(ABC):
    HEARTBEAT_INTERVAL_SECONDS = 60
    MAX_RETRY_ATTEMPTS         = 3
    RETRY_BACKOFF_BASE         = 2  # seconds (exponential: 2, 4, 8)

    def __init__(self, agent_id: str, kafka_servers: str, redis_url: str):
        self.agent_id      = agent_id
        self.kafka_servers = kafka_servers
        self.redis_url     = redis_url
        self.consumer      = None
        self.producer      = None
        self.redis         = None
        self._running      = False

    async def start(self):
        self.consumer = AIOKafkaConsumer(
            self.input_topic,
            bootstrap_servers=self.kafka_servers,
            group_id=f"letese-{self.agent_id}",
            auto_offset_reset="earliest",
            enable_auto_commit=False,
            max_poll_records=10,
        )
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.kafka_servers,
            value_serializer=lambda v: json.dumps(v).encode()
        )
        self.redis    = await aioredis.from_url(self.redis_url, decode_responses=True)
        await self.consumer.start()
        await self.producer.start()
        self._running = True
        logger.info(f"[{self.agent_id}] AWAKE — consuming {self.input_topic}")
        asyncio.create_task(self._heartbeat_loop())
        await self._consume_loop()

    async def stop(self):
        self._running = False
        if self.consumer: await self.consumer.stop()
        if self.producer: await self.producer.stop()
        if self.redis:    await self.redis.close()
        logger.info(f"[{self.agent_id}] SLEEPING")

    async def _heartbeat_loop(self):
        while self._running:
            await self.producer.send("letese.police.heartbeats", {
                "agent_id": self.agent_id,
                "timestamp": time.time(),
                "status": "alive"
            })
            await asyncio.sleep(self.HEARTBEAT_INTERVAL_SECONDS)

    async def _consume_loop(self):
        async for msg in self.consumer:
            if not self._running: break
            payload = json.loads(msg.value)
            attempt = 0
            while attempt < self.MAX_RETRY_ATTEMPTS:
                try:
                    start = time.monotonic()
                    await self.process_message(payload)
                    duration_ms = int((time.monotonic() - start) * 1000)
                    await self._emit_metric("SUCCESS", duration_ms, payload)
                    await self.consumer.commit()
                    break
                except Exception as e:
                    attempt += 1
                    wait = self.RETRY_BACKOFF_BASE ** attempt
                    logger.warning(f"[{self.agent_id}] Attempt {attempt} failed: {e}. Retry {wait}s")
                    if attempt >= self.MAX_RETRY_ATTEMPTS:
                        await self._publish_to_dlq(payload, str(e))
                        await self._publish_error(payload, str(e))
                        await self.consumer.commit()
                    else:
                        await asyncio.sleep(wait)

    async def _publish_to_dlq(self, payload: dict, error: str):
        await self.producer.send(f"{self.input_topic}.dlq", {
            "original_payload": payload, "error": error,
            "agent_id": self.agent_id, "failed_at": time.time()
        })

    async def _publish_error(self, payload: dict, error: str):
        await self.producer.send("letese.police.errors", {
            "agent_id": self.agent_id, "error": error,
            "payload": payload, "timestamp": time.time()
        })

    async def _emit_metric(self, outcome: str, duration_ms: int, payload: dict):
        await self.producer.send("letese.police.metrics", {
            "agent_id": self.agent_id, "outcome": outcome,
            "duration_ms": duration_ms, "tenant_id": payload.get("tenant_id"),
            "timestamp": time.time()
        })

    @property
    @abstractmethod
    def input_topic(self) -> str: pass

    @abstractmethod
    async def process_message(self, payload: dict) -> None: pass
```

### 8.2 AIPOT-SCRAPER — Court Web Scraper

```python
# backend/aipots/scraper.py
import hashlib
from playwright.async_api import async_playwright
from .base import BaseAIPOT

COURT_CONFIGS = {
    "PHAHC": {
        "name": "Punjab & Haryana High Court",
        "search_url": "https://hcpunjab.gov.in/",
        "requires_js": True,
        "selectors": {
            "next_date":  "span[id='caseStatusForm:caseStatusTable:0:nextDate']",
            "last_order": "span[id='caseStatusForm:caseStatusTable:0:orderDetails']",
            "bench":      "span[id='caseStatusForm:caseStatusTable:0:coramDetails']",
        }
    },
    "DHC":  { "name": "Delhi High Court",
              "search_url": "https://delhihighcourt.nic.in/case_status_new.asp",
              "requires_js": False,
              "selectors": { "next_date": "td.tdStyle:nth-child(4)",
                             "last_order": "td.tdStyle:nth-child(6)" } },
    "SC":   { "name": "Supreme Court of India",
              "search_url": "https://main.sci.gov.in/case-status",
              "requires_js": True,
              "selectors": { "next_date": ".case-next-date",
                             "last_order": ".case-order-text" } },
    "NCDRC":    { "name": "NCDRC",            "requires_js": False },
    "CHD_DC":   { "name": "Chandigarh DC",    "requires_js": True },
    "CONSUMER_PH": { "name": "P&H Consumer",  "requires_js": False },
    "TIS_HAZ":  { "name": "Tis Hazari DC",    "requires_js": True },
    "SAKET":    { "name": "Saket DC",         "requires_js": True },
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
]

class AIPOTScraper(BaseAIPOT):
    input_topic = "letese.scraper.jobs"

    async def process_message(self, payload: dict):
        case_id    = payload["case_id"]
        court_code = payload["court_code"]
        case_number= payload["case_number"]
        tenant_id  = payload["tenant_id"]
        config     = COURT_CONFIGS.get(court_code)
        if not config:
            raise ValueError(f"Unknown court_code: {court_code}")

        # Rate-limit dedup: skip if scraped < 14 min ago
        if await self.redis.get(f"scraper:last:{case_id}"):
            return

        extracted = await self._scrape_court(config, case_number)
        if not extracted:
            return

        # SHA-256 content dedup
        content_hash = hashlib.sha256(
            (extracted.get("last_order_text","") +
             str(extracted.get("next_hearing",""))).encode()
        ).hexdigest()
        existing_hash = await self.redis.get(f"scraper:hash:{case_id}")
        is_new = (existing_hash != content_hash)

        if is_new:
            await self.producer.send("letese.diary.updates", {
                "case_id": case_id, "tenant_id": tenant_id, "court_code": court_code,
                **extracted
            })
            if extracted.get("is_new_order"):
                await self.producer.send("letese.orders.new", {
                    "case_id":       case_id, "tenant_id":    tenant_id,
                    "court_code":    court_code,
                    "order_text":    extracted.get("last_order_text"),
                    "order_date":    extracted.get("last_order_date"),
                    "client_phone":  payload.get("client_phone"),
                    "client_name":   payload.get("client_name"),
                    "case_title":    payload.get("case_title"),
                    "advocate_name": payload.get("advocate_name"),
                })
            await self.redis.set(f"scraper:hash:{case_id}", content_hash, ex=86400)

        await self.redis.set(f"scraper:last:{case_id}", "1", ex=840)  # 14 min

    async def _scrape_court(self, config: dict, case_number: str) -> dict | None:
        proxy = await self.redis.lmove("scraper:proxy:pool","scraper:proxy:pool","LEFT","RIGHT")
        import random
        ua = random.choice(USER_AGENTS)
        if config.get("requires_js"):
            return await self._playwright_scrape(config, case_number, proxy, ua)
        else:
            return await self._httpx_scrape(config, case_number, proxy, ua)

    async def _playwright_scrape(self, config, case_number, proxy, ua) -> dict:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                proxy={"server": proxy} if proxy else None)
            ctx  = await browser.new_context(user_agent=ua,
                                             viewport={"width":1280,"height":720})
            page = await ctx.new_page()
            try:
                await page.goto(config["search_url"], timeout=30000)
                await page.wait_for_load_state("networkidle", timeout=15000)
                # Court-specific form fill (implement per court)
                await self._fill_case_search(page, case_number, config)
                result = {}
                for key, sel in config.get("selectors", {}).items():
                    el = await page.query_selector(sel)
                    result[key] = (await el.inner_text()).strip() if el else None
                return result
            finally:
                await browser.close()

    async def _httpx_scrape(self, config, case_number, proxy, ua) -> dict:
        import httpx
        proxies = {"http://": proxy, "https://": proxy} if proxy else None
        async with httpx.AsyncClient(proxies=proxies,
                                     headers={"User-Agent": ua}, timeout=20) as client:
            resp = await client.get(config["search_url"],
                                    params={"case_no": case_number})
        from bs4 import BeautifulSoup
        soup    = BeautifulSoup(resp.text, "html.parser")
        result  = {}
        for key, sel in config.get("selectors", {}).items():
            el = soup.select_one(sel)
            result[key] = el.get_text(strip=True) if el else None
        return result
```

### 8.3 AIPOT-COMPLIANCE — Checklist Validation Engine

```python
# backend/aipots/compliance.py
import re
import spacy
from .base import BaseAIPOT

nlp = spacy.load("en_core_web_sm")

MANDATORY_SECTIONS = {
    "CWP":  ["prayer","list of dates","synopsis","facts","grounds","verification"],
    "SLP":  ["prayer","list of dates","synopsis","facts","grounds","certificate of urgency"],
    "CS":   ["plaint","prayer","valuation","cause of action","limitation"],
    "default": ["prayer","facts","grounds","verification"],
}

class AIPOTCompliance(BaseAIPOT):
    """
    Kept warm in MVP — minimum 1 replica always running.
    Startup time ~3s (spaCy model load).
    Responds to POST /api/v1/compliance/check synchronously (no Kafka for compliance).
    This agent also consumes letese.compliance.checks for async batch validation.
    """
    input_topic = "letese.compliance.checks"

    async def process_message(self, payload: dict):
        result = await self.validate_document(
            document_text=payload["document_text"],
            court_code=payload["court_code"],
            petition_type=payload["petition_type"],
            tenant_id=payload.get("tenant_id"),
        )
        # Store result back to PostgreSQL for async retrieval
        await self._save_compliance_result(payload["doc_id"], result)

    async def validate_document(self, document_text: str, court_code: str,
                                  petition_type: str, tenant_id: str = None) -> dict:
        passed   = []
        failed   = []
        warnings = []
        text_lower = document_text.lower()

        # CHECK 1: Word count
        word_count = len(document_text.split())
        MIN_WORDS  = {"CWP": 500, "SLP": 800, "CS": 600, "default": 400}
        min_wc     = MIN_WORDS.get(petition_type, MIN_WORDS["default"])
        if word_count >= min_wc:
            passed.append({"rule": "word_count", "detail": f"{word_count} words (min {min_wc})"})
        else:
            failed.append({"rule": "word_count", "severity": "CRITICAL",
                           "detail": f"Only {word_count} words. Minimum {min_wc} required.",
                           "suggested_fix": f"Add at least {min_wc - word_count} more words."})

        # CHECK 2: Mandatory sections
        sections = MANDATORY_SECTIONS.get(petition_type, MANDATORY_SECTIONS["default"])
        for section in sections:
            if section in text_lower:
                passed.append({"rule": f"section_{section}", "detail": f"Section '{section}' found"})
            else:
                failed.append({"rule": f"section_{section}", "severity": "CRITICAL",
                               "detail": f"Mandatory section '{section.upper()}' is missing.",
                               "suggested_fix": f"Add a clearly labelled '{section.upper()}' section."})

        # CHECK 3: Party designations
        doc = nlp(document_text[:5000])
        has_petitioner  = any(t.text.lower() in ("petitioner","appellant","complainant")
                              for t in doc)
        has_respondent  = any(t.text.lower() in ("respondent","defendant","opposite party")
                              for t in doc)
        if has_petitioner and has_respondent:
            passed.append({"rule": "party_designations", "detail": "Both parties correctly designated"})
        else:
            warnings.append({"rule": "party_designations", "severity": "WARNING",
                             "detail": "Party designations (Petitioner/Respondent) not clearly found."})

        # CHECK 4: Paragraph numbering
        numbered = bool(re.search(r'^\s*\d+[\.\)]\s', document_text, re.MULTILINE))
        if numbered:
            passed.append({"rule": "paragraph_numbering", "detail": "Numbered paragraphs found"})
        else:
            warnings.append({"rule": "paragraph_numbering", "severity": "WARNING",
                             "detail": "Paragraphs do not appear to be numbered.",
                             "suggested_fix": "Number all paragraphs (1., 2., 3., …)"})

        # CHECK 5: Court fee mention
        if "court fee" in text_lower or "stamp paper" in text_lower:
            passed.append({"rule": "court_fee", "detail": "Court fee mentioned"})
        else:
            warnings.append({"rule": "court_fee", "severity": "WARNING",
                             "detail": "Court fee not mentioned. Verify filing fee for this petition type."})

        return {"passed": passed, "failed": failed, "warnings": warnings,
                "summary": {"total": len(passed)+len(failed)+len(warnings),
                             "critical_failures": len(failed),
                             "is_filing_ready": len(failed) == 0}}
```

### 8.4 AIPOT-POLICE — Digital Police Full Implementation

```python
# backend/aipots/police.py
import asyncio, time, logging
from .base import BaseAIPOT
from services.pagerduty import pagerduty_alert
from services.metrics   import get_metrics

logger = logging.getLogger(__name__)
SMALL_AUDIT_INTERVAL = 600   # 10 minutes
MAJOR_AUDIT_INTERVAL = 3600  # 60 minutes
AIPOT_IDS = ["AIPOT-SCRAPER", "AIPOT-COMPLIANCE", "AIPOT-COMMUNICATOR"]

class AIPOTPolice(BaseAIPOT):
    """
    NEVER sleeps. Minimum 2 Kubernetes replicas always.
    Runs its own timer loops — overrides the standard Kafka consumer loop.
    """
    input_topic = "letese.police.errors"

    async def start(self):
        # Set up Kafka producer + Redis for publishing
        from aiokafka import AIOKafkaProducer
        import aioredis
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.kafka_servers,
            value_serializer=lambda v: __import__("json").dumps(v).encode())
        self.redis    = await aioredis.from_url(self.redis_url, decode_responses=True)
        await self.producer.start()
        self._running = True
        await asyncio.gather(
            self._small_audit_loop(),
            self._major_audit_loop(),
            self._error_watch_loop(),
        )

    async def _small_audit_loop(self):
        while self._running:
            await self._run_small_audit()
            await asyncio.sleep(SMALL_AUDIT_INTERVAL)

    async def _major_audit_loop(self):
        while self._running:
            await self._run_major_audit()
            await asyncio.sleep(MAJOR_AUDIT_INTERVAL)

    async def _error_watch_loop(self):
        """Consume letese.police.errors without the base class retry logic."""
        from aiokafka import AIOKafkaConsumer
        import json
        consumer = AIOKafkaConsumer("letese.police.errors",
                                    bootstrap_servers=self.kafka_servers,
                                    group_id="letese-police-errors",
                                    auto_offset_reset="latest",
                                    enable_auto_commit=True)
        await consumer.start()
        async for msg in consumer:
            payload = json.loads(msg.value)
            await self.process_message(payload)

    async def process_message(self, payload: dict):
        agent_id  = payload.get("agent_id", "UNKNOWN")
        error_msg = payload.get("error", "")
        severity  = "P1" if any(k in error_msg.lower()
                        for k in ("tenant isolation","database","auth")) else "P2"
        logger.error(f"[POLICE] Error from {agent_id}: {error_msg}")
        await pagerduty_alert(severity=severity,
                              summary=f"AIPOT {agent_id}: {error_msg[:100]}",
                              details=payload)

    async def _run_small_audit(self):
        start   = time.time()
        results = {}
        actions = []
        metrics = await get_metrics()

        # 1. AIPOT heartbeats
        for aipot in AIPOT_IDS:
            last_ts = await self.redis.get(f"heartbeat:{aipot}")
            ok = last_ts and (time.time() - float(last_ts)) < 180
            results[f"heartbeat_{aipot}"] = "PASS" if ok else "FAIL"
            if not ok:
                actions.append(f"Restart pod: {aipot}")
                await self._restart_pod(aipot)

        # 2. Kafka consumer lag
        for topic in ["letese.scraper.jobs", "letese.communications.dispatch"]:
            lag = metrics.get(f"kafka_lag_{topic}", 0)
            results[f"kafka_{topic}"] = "PASS" if lag < 500 else f"WARN: lag={lag}"

        # 3. API P95 latency
        p95 = metrics.get("api_p95_latency_ms", 0)
        results["api_p95"] = "PASS" if p95 < 1000 else f"WARN: {p95}ms"

        # 4. Redis memory
        rmem = metrics.get("redis_memory_pct", 0)
        results["redis_mem"] = "PASS" if rmem < 70 else f"WARN: {rmem}%"

        # 5. PostgreSQL pool
        pgpool = metrics.get("pg_pool_utilisation_pct", 0)
        results["pg_pool"] = "PASS" if pgpool < 80 else f"WARN: {pgpool}%"

        # 6. Scraper success rate
        sr = metrics.get("scraper_success_rate_10min", 1.0)
        results["scraper_rate"] = "PASS" if sr >= 0.95 else f"WARN: {sr:.1%}"

        # 7. Pod counts
        results["pod_counts"] = "PASS"  # Verified by Kubernetes readiness probes

        passed  = sum(1 for v in results.values() if v == "PASS")
        failed  = sum(1 for v in results.values() if "FAIL" in v)
        await self._save_audit(
            "small", start, results, actions, passed, failed, failed > 0)
        if failed:
            await pagerduty_alert("P2", f"Small audit: {failed} checks failed", results)

    async def _run_major_audit(self):
        start   = time.time()
        results = {}
        actions = []

        # 1. DB replication consistency
        results["db_replication"]  = await self._check_db_replication()
        # 2. S3 write test
        results["s3_write"]        = await self._check_s3_write()
        # 3. DLQ depths
        for topic in ["letese.scraper.jobs", "letese.communications.dispatch"]:
            depth = await self._get_dlq_depth(f"{topic}.dlq")
            results[f"dlq_{topic}"] = "PASS" if depth == 0 else f"FAIL: depth={depth}"
            if depth > 0:
                actions.append(f"Page engineer: DLQ {topic} has {depth} messages")
        # 4. Communication delivery rate
        dr = await self._get_delivery_rate(hours=1)
        results["delivery_rate"]   = "PASS" if dr >= 0.97 else f"WARN: {dr:.1%}"
        # 5. Tenant isolation
        results["tenant_isolation"]= await self._check_tenant_isolation()
        # 6. SSL expiry
        results["ssl_expiry"]      = await self._check_ssl_expiry()
        # 7. Backup freshness
        results["backup_freshness"]= await self._check_backup_freshness()

        passed = sum(1 for v in results.values() if v == "PASS")
        failed = sum(1 for v in results.values() if "FAIL" in v)
        await self._save_audit(
            "major", start, results, actions, passed, failed, failed > 0)
        if failed:
            sev = "P1" if failed > 2 else "P2"
            await pagerduty_alert(sev, f"Major audit: {failed} checks failed", results)

    async def _restart_pod(self, aipot_id: str):
        """Signal Kubernetes to restart the AIPOT pod."""
        import httpx
        # In-cluster Kubernetes API
        k8s_url = "https://kubernetes.default.svc"
        token   = open("/var/run/secrets/kubernetes.io/serviceaccount/token").read()
        ns      = "letese"
        deploy  = aipot_id.lower().replace("_", "-")
        async with httpx.AsyncClient(verify=False) as c:
            await c.patch(
                f"{k8s_url}/apis/apps/v1/namespaces/{ns}/deployments/{deploy}",
                headers={"Authorization": f"Bearer {token}",
                         "Content-Type": "application/strategic-merge-patch+json"},
                json={"spec": {"template": {"metadata":
                      {"annotations": {"kubectl.kubernetes.io/restartedAt":
                                        str(time.time())}}}}}
            )

    async def _save_audit(self, audit_type, start, results, actions,
                           passed, failed, escalated):
        duration_ms = int((time.time() - start) * 1000)
        # INSERT INTO audit_logs (...)
        logger.info(f"[POLICE] {audit_type.upper()} audit: {passed} pass, {failed} fail")
```

---

## 9. COMPLETE FUNCTIONAL EXTRACTION

### 9.1 Case Intake — Full Workflow Logic

```
TRIGGER: Advocate taps "+ New Case" in Flutter app

STEP 1 — Flutter Form Collection
  Required:
    case_title      VARCHAR(600) — "Sharma v. Union of India"
    court_code      Dropdown → PHAHC|DHC|SC|NCDRC|CHD_DC|CONSUMER_PH|TIS_HAZ|SAKET
    petition_type   Dropdown filtered by court_code → CWP|CRM|SLP|CS|WP|...
    case_number     Optional (format validated per court)
    client_name     VARCHAR(255)
    client_phone    E.164 format, +91XXXXXXXXXX
    client_email    Optional
    client_whatsapp Pre-filled from client_phone (editable)

STEP 2 — Client Profile Check (Backend)
  Check if client_phone exists in cases table for this tenant.
  If yes → suggest linking to existing client (show existing cases list).
  If no  → create new client record inline.

STEP 3 — POST /api/v1/cases
  Validate plan limit:
    Basic:      cases_active_count < 30
    Professional: < 200
    Elite:      < 500
    Enterprise: unlimited
  If over limit → HTTP 402 { "upgrade_required": true, "current_plan": "basic" }
  If ok → INSERT into cases; UPDATE tenants.cases_active_count += 1

STEP 4 — Communication Schedule Population
  If next_hearing_at IS SET:
    Calculate 4 reminder timestamps:
      reminder_15d = next_hearing_at - 15 days
      reminder_7d  = next_hearing_at - 7 days
      reminder_48h = next_hearing_at - 48 hours
      reminder_24h = next_hearing_at - 24 hours
    INSERT into communication_schedule for each timestamp in future.
    Skip timestamps in the past.

STEP 5 — Initial Scraper Job
  If tenant.scraper_enabled = TRUE:
    Publish to letese.scraper.jobs:
    { case_id, court_code, case_number, tenant_id,
      client_phone, client_name, case_title, advocate_name }

STEP 6 — Flutter Response
  Return: { case_id, case_title, court_display_name, created_at }
  Navigate to → Case Detail screen
  Toast: "Case created. We're monitoring it 24/7."
```

### 9.2 Document Drafting — AI-Assisted Workflow

```
TRIGGER: Advocate taps "AI Draft" in Case Detail
PLAN REQUIREMENT: Elite or Enterprise

STEP 1 — Advocate Input (Flutter modal)
  court_code     Pre-filled from case (editable)
  petition_type  Pre-filled from case (editable)
  case_summary   Text area — plain-language description
  context_docs   List of doc_ids from case file to include as context

STEP 2 — Context Assembly (POST /api/v1/drafts/generate)
  a. Load checklist for {court_code} + {petition_type} from court_checklists
  b. Load selected docs from S3; extract text via pypdf2/mammoth
  c. Construct LLM prompt:

  SYSTEM:
    "You are AIPOT-DRAFT, a legal drafting assistant for Indian courts.
     Draft legal documents in formal legal English following the exact filing
     requirements of {court_display_name}.
     CRITICAL: The document MUST comply with ALL rules in the checklist.
     Non-compliance causes filing objections.
     Always include: title page, synopsis, list of dates, prayer,
     verification clause (unless petition type rules differ)."

  USER:
    "Draft a complete {petition_type} for {court_display_name}.
     CHECKLIST RULES: {checklist_rules_formatted}
     CASE SUMMARY: {case_summary}
     SUPPORTING DOCUMENT EXTRACTS: {document_text_extracts}
     Produce the complete draft. Formal legal language. Number all paragraphs."

STEP 3 — LLM Call via LLMGateway
  task_type   = "draft"
  max_tokens  = 4000
  Response    = streaming SSE → Flutter editor

STEP 4 — Post-Generation Compliance Check
  Immediately pass AI output to AIPOTCompliance.validate_document()
  If critical failures: display RED inline flags in editor
  Document status = "ai_draft" (NOT "filing_ready" yet)

STEP 5 — Editor Opened with Draft
  Compliance panel shows right side: passed / failed / warnings
  Advocate reviews, edits, resolves flagged items.

STEP 6 — "Mark as Filing Ready"
  Prerequisite: zero CRITICAL compliance failures
  Action: UPDATE documents SET is_filing_ready = TRUE
  Generates: Filing checklist PDF (all passed items, signature space)
```

### 9.3 Translation — Full Logic

```
TRIGGER: Upload non-English doc OR request translation
PLAN REQUIREMENT: Elite or Enterprise

STEP 1 — Upload
  POST /api/v1/documents/upload
  Language auto-detected via langdetect library
  S3 path: letese-tenant-docs/{tenant_id}/raw/{uuid}.{ext}

STEP 2 — Translation Request
  POST /api/v1/documents/{doc_id}/translate { target_language: "en" }

STEP 3 — Text Extraction
  PDF:  pdfplumber (text) or PyMuPDF + Tesseract (scanned)
  DOCX: python-docx
  Images: Tesseract with Indic language pack

STEP 4 — AI Translation
  Primary:  IndicTrans2 (AI4Bharat, self-hosted on Mac Mini M4)
    POST http://mac-mini-m4.local:8090/translate
    { "text": "<extracted>", "src_lang": "pan_Guru", "tgt_lang": "eng_Latn" }
    Response: { "translated_text": "...", "bleu_score": 0.87 }
  Fallback: Google Cloud Translation API

STEP 5 — Accuracy Calculation
  bleu_score      from IndicTrans2 response
  legal_vocab_pct % of key legal terms correctly translated
                  (verified against terminology DB in court_checklists)
  accuracy_pct    = (bleu_score * 0.6 + legal_vocab_pct * 0.4) * 100

STEP 6 — Result Storage
  INSERT documents: { doc_type:"translated", language:"en",
                      translation_of: original_doc_id,
                      accuracy_pct: 87.3,
                      is_filing_ready: (accuracy_pct >= 90) }

STEP 7 — Filing Gateway Decision
  accuracy >= 90%: { status:"APPROVED", is_filing_ready: true }
  80–89%:          { status:"REVIEW_REQUIRED", is_filing_ready: false }
  < 80%:           { status:"RETRANSLATE", is_filing_ready: false }

  Override: Advocate can manually accept below-threshold translation.
            Action logged: user_id + timestamp + reason.
```

### 9.4 Invoice Generation — Full Logic

```
TRIGGER: Advocate taps "Create Invoice" from Case Detail
         OR automated billing trigger

STEP 1 — Form Inputs
  case_id          Linked case
  client_name      Pre-filled
  client_gstin     Optional
  line_items       [ { description, amount_inr }, … ]
                   e.g. "Drafting Writ Petition", "Court appearance 12 Feb"
  due_date         Default: today + 7 days
  installments     Optional: [ { amount_inr, due_date }, … ]

STEP 2 — Computation
  subtotal = sum(line_items.amount_inr)
  gst_inr  = subtotal * 0.18
  total    = subtotal + gst_inr
  invoice_number = f"INV-{YYYY}-{sequence:04d}"

STEP 3 — PDF Generation (WeasyPrint)
  Render HTML template → PDF binary
  Template includes:
    Firm logo (S3 presigned URL)
    LETESE● watermark (faint, centered)
    Invoice number, dates, client details
    Line items table
    GST breakdown
    Total amount
    Razorpay payment link (QR + URL)
  Upload PDF to S3: letese-tenant-docs/{tenant_id}/invoices/{invoice_id}.pdf

STEP 4 — Razorpay Payment Link
  POST https://api.razorpay.com/v1/payment_links
  { "amount": total_inr * 100,    // paise
    "currency": "INR",
    "description": f"Legal fees — {case_title}",
    "customer": { "name": client_name, "contact": client_phone, "email": client_email },
    "notify": { "sms": true, "email": true },
    "reminder_enable": true,
    "callback_url": "https://api.letese.xyz/webhooks/razorpay/payment",
    "callback_method": "get" }
  Store: invoice.razorpay_order_id, invoice.payment_link

STEP 5 — Delivery
  WhatsApp template: letese_payment_reminder (see AIPOT-COMMUNICATOR)
  Email: PDF attached, payment link in CTA button

STEP 6 — Webhook Processing
  POST /webhooks/razorpay/payment (signed with HMAC-SHA256)
  Verify webhook signature before processing.
  Event "payment.captured":
    paid_amount = payload.payment.amount / 100
    UPDATE invoices SET
      paid_inr = paid_inr + paid_amount,
      status = CASE WHEN paid_inr + paid_amount >= total_inr
                    THEN 'paid' ELSE 'partial' END
    In-app notification: "Payment of ₹X received from {client_name}"
    If installments: mark installment paid; schedule next reminder.
```

### 9.5 Post-Judgment Remedy Analysis

```
TRIGGER: Advocate taps "Analyze Judgment" on closed case
PLAN REQUIREMENT: Enterprise

STEP 1 — Input
  Advocate uploads judgment PDF OR selects from case documents.
  Extract full text: pdfplumber (primary), PyMuPDF (fallback).

STEP 2 — Structured Analysis (LLM — GPT-4o, QUALITY mode)
  System: "You are a senior Indian legal analyst. Extract structured data
           from Indian court judgments. Return ONLY valid JSON."
  Prompt: "Analyze this judgment. Return JSON:
  {
    court, case_citation, date, bench, parties,
    result: ALLOWED|DISMISSED|PARTLY_ALLOWED,
    relief_granted: [...],
    directions_to_parties: [...],
    key_findings: [...],
    remedies_available: [{
      remedy_type: APPEAL|REVIEW|REVISION|CURATIVE,
      forum, limitation_period, grounds,
      applicable_provision
    }],
    summary: (200-word plain language summary)
  }
  JUDGMENT: {extracted_text}"

STEP 3 — Precedent Enrichment via pgvector
  For each remedy in remedies_available:
    SELECT case_citation, summary_text
    FROM case_embeddings
    WHERE court_code = {target_forum_court_code}
    ORDER BY embedding_vector <=> embed(remedy.grounds) LIMIT 5
  Attach top 3 precedents to each remedy card.

STEP 4 — Client Summary Generation (LLM — gpt-4o-mini)
  "Your case in {court} was {result} on {date}.
   {Plain language: what this means for the client}
   {What happens next: options and timeline}
   Your advocate will discuss next steps with you."

STEP 5 — Store & Display
  Save full analysis to cases.metadata["judgment_analysis"]
  Flutter Judgment Analysis screen:
    Panel 1: Summary (plain language)
    Panel 2: Relief Granted (bullet list)
    Panel 3: Remedies Available (expandable cards, 1 per remedy)
    Panel 4: Supporting Precedents (tap to read full judgment)
    Buttons: [Export Remedy Report (PDF)] [Send Summary to Client (WA/Email)]
```

---

## 10. API ENDPOINT REFERENCE

### 10.1 Authentication

```
POST  /api/v1/auth/send-otp     Body: { email }      → { message, expires_in: 600 }
POST  /api/v1/auth/login        Body: { email, otp } → { access_token, refresh_token, user, tenant }
POST  /api/v1/auth/google       Body: { id_token }   → { access_token, refresh_token, user, tenant }
POST  /api/v1/auth/refresh      Body: { refresh_token } → { access_token }
POST  /api/v1/auth/logout       Auth: Bearer         → { message }
```

### 10.2 Case Management

```
GET   /api/v1/cases               Query: status,court_code,limit,offset,search
POST  /api/v1/cases               Body: CaseCreateSchema
GET   /api/v1/cases/{id}          Full detail: hearings, orders, docs, tasks, comms
PUT   /api/v1/cases/{id}          Body: CaseUpdateSchema
DELETE /api/v1/cases/{id}         Soft delete
POST  /api/v1/cases/{id}/scrape   Triggers AIPOT-SCRAPER job
GET   /api/v1/cases/{id}/diary    Hearings + orders + tasks + communications
GET   /api/v1/cases/{id}/communications  Query: channel, limit, offset
```

### 10.3 Documents & Editor

```
POST  /api/v1/documents/upload           Multipart: file, case_id, doc_type, language
GET   /api/v1/documents/{id}/download-url → { presigned_url, expires_in: 3600 }
POST  /api/v1/documents/{id}/translate   Body: { target_language } → { job_id }
GET   /api/v1/documents/{id}/translation-status → { status, accuracy_pct, translated_doc_id }
POST  /api/v1/drafts/generate            Body: { case_id, petition_type, case_summary, context_doc_ids }
                                         → SSE stream (Content-Type: text/event-stream)
POST  /api/v1/compliance/check           Body: { document_text, court_code, petition_type }
                                         → { passed, failed, warnings }
GET   /api/v1/compliance/checklists/{court_code}  → Full checklist rules for court
```

### 10.4 Communications & Tasks

```
POST  /api/v1/communications/trigger     Body: { case_id, channel, message_type, custom_message? }
GET   /api/v1/inbox                      Query: tab, limit, offset
POST  /api/v1/tasks                      Body: { case_id, title, due_date, priority, description? }
GET   /api/v1/tasks                      Query: status, due (today|upcoming|overdue), assigned_to
PATCH /api/v1/tasks/{id}                 Body: { status, due_date? }
```

### 10.5 Invoices & Billing

```
POST  /api/v1/invoices             Body: InvoiceCreateSchema → { invoice_id, pdf_url, payment_link }
GET   /api/v1/invoices             Query: status, case_id, limit, offset
GET   /api/v1/invoices/{id}        Full invoice detail
POST  /api/v1/invoices/{id}/send   Send invoice to client via WA + Email
```

### 10.6 Admin & Monitoring

```
GET   /api/v1/admin/system-health  Auth: super_admin only → Full health JSON
GET   /api/v1/admin/audit-logs     Auth: admin+           → { logs, total }
POST  /api/v1/admin/audit/trigger  Auth: super_admin      Body: { type: small|major }
PATCH /api/v1/super-admin/vendors/{name}  Auth: super_admin  Body: config_object
GET   /api/v1/admin/analytics      Auth: admin+           Query: period
GET   /api/v1/admin/tenants        Auth: super_admin      Paginated tenant list
```

### 10.7 WebSocket Connections

```
WS  /ws/diary/{tenant_id}    Auth: ?token={jwt}
    Events: { event: "ORDER_DETECTED", case_id, order_text, next_hearing }
            { event: "HEARING_UPDATED", case_id, next_hearing_at }

WS  /ws/inbox/{tenant_id}    Auth: ?token={jwt}
    Events: { event_type: "NEW_MESSAGE"|"STATUS_UPDATE", item }

WS  /ws/health               Auth: ?token={jwt} (super_admin)
    Events: System metrics JSON every 10 seconds
```

### 10.8 Webhooks (Public — HMAC verified)

```
POST  /webhooks/whatsapp             360dialog delivery + incoming messages
POST  /webhooks/razorpay/payment     Payment captured / failed
POST  /webhooks/exotel/call-status   Call outcome (answered/no-answer/busy)
POST  /webhooks/exotel/call-flow     Returns TwiML-style XML for call IVR flow
```

---

## 11. SECURITY & COMPLIANCE LAYER

### 11.1 Authentication Service

```python
# backend/auth/service.py
import jwt, time, secrets
from cryptography.hazmat.primitives import serialization

class AuthService:
    def __init__(self, private_key_path: str, public_key_path: str):
        with open(private_key_path, "rb") as f:
            self.private_key = serialization.load_pem_private_key(f.read(), password=None)
        with open(public_key_path, "rb") as f:
            self.public_key = serialization.load_pem_public_key(f.read())

    def generate_otp(self, email: str, redis) -> str:
        otp = secrets.token_digits(6)
        redis.setex(f"otp:{email}", 600, otp)  # 10-min TTL
        return otp

    def verify_otp(self, email: str, otp: str, redis) -> bool:
        stored = redis.get(f"otp:{email}")
        if not stored or stored != otp: return False
        redis.delete(f"otp:{email}")  # One-time use
        return True

    def create_access_token(self, user: dict, tenant: dict) -> str:
        payload = {
            "sub":       str(user["user_id"]),
            "tenant_id": str(user["tenant_id"]),
            "role":      user["role"],
            "plan":      tenant["plan"],
            "email":     user["email"],
            "iat":       int(time.time()),
            "exp":       int(time.time()) + 900,  # 15 min
            "type":      "access"
        }
        return jwt.encode(payload, self.private_key, algorithm="RS256")

    def create_refresh_token(self, user_id: str, redis) -> str:
        token = secrets.token_urlsafe(64)
        redis.setex(f"refresh:{token}", 604800, user_id)  # 7 days
        return token

    def verify_token(self, token: str) -> dict:
        return jwt.decode(token, self.public_key, algorithms=["RS256"])


# FastAPI dependency — applied to all protected routes
async def get_current_user(
    credentials = Security(HTTPBearer()),
    db          = Depends(get_db),
    redis       = Depends(get_redis)
) -> dict:
    try:
        payload = auth_service.verify_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

    # Set RLS context — enforces tenant isolation at PostgreSQL level
    await db.execute(text(f"SET LOCAL app.current_tenant_id = '{payload['tenant_id']}'"))
    await db.execute(text(f"SET LOCAL app.role = '{payload['role']}'"))
    return payload
```

### 11.2 Security Controls Summary

```
Authentication:  Supabase Auth (OTP 6-digit, 10-min TTL) + Google OAuth
                 JWT RS256, access 15-min, refresh 7-day rotating

Authorisation:   PostgreSQL RLS — tenant_id enforced at DB layer
                 FastAPI middleware injects tenant_id into every query

Encryption:      TLS 1.3 on all public endpoints
                 PostgreSQL: AWS RDS AES-256
                 S3: SSE-S3 server-side encryption
                 Redis: encryption at rest
                 All keys: AWS KMS

API Security:    Rate limiting: 100 req/min per authenticated user
                 CORS: only letese.xyz and app.letese.xyz
                 CSRF: all state-changing endpoints
                 Input validation: Pydantic v2 on all request bodies

Secrets:         AWS Secrets Manager — no env vars in Git
                 Key rotation enforced every 90 days

Dependencies:    GitHub Dependabot; Trivy weekly container scan
                 All images: distroless base
```

---

## 12. DEPLOYMENT & INFRASTRUCTURE

### 12.1 Kubernetes Pod Specifications

```yaml
# k8s/aipots/scraper.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aipot-scraper
  labels: { app: aipot-scraper }
spec:
  replicas: 0        # HPA starts at 0 (sleeping)
  selector: { matchLabels: { app: aipot-scraper } }
  template:
    spec:
      containers:
      - name: scraper
        image: letese/aipot-scraper:latest
        resources:
          requests: { memory: "128Mi", cpu: "100m" }
          limits:   { memory: "256Mi", cpu: "500m" }
        env:
        - name: KAFKA_BOOTSTRAP_SERVERS
          valueFrom: { secretKeyRef: { name: letese-secrets, key: KAFKA_BOOTSTRAP_SERVERS } }
        - name: REDIS_URL
          valueFrom: { secretKeyRef: { name: letese-secrets, key: REDIS_URL } }
        livenessProbe:
          httpGet: { path: /health, port: 8010 }
          initialDelaySeconds: 10
          periodSeconds: 30
---
# HPA — Kafka lag-based scaling
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: aipot-scraper-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aipot-scraper
  minReplicas: 0    # Scales to zero when idle
  maxReplicas: 10
  metrics:
  - type: External
    external:
      metric:
        name: kafka_consumer_lag
        selector: { matchLabels: { topic: "letese.scraper.jobs" } }
      target: { type: AverageValue, averageValue: "10" }
---
# AIPOT-POLICE — NEVER scales to zero
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aipot-police
spec:
  replicas: 2   # Always 2 replicas — no HPA
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxUnavailable: 0, maxSurge: 1 }
  template:
    spec:
      containers:
      - name: police
        image: letese/aipot-police:latest
        resources:
          requests: { memory: "128Mi", cpu: "100m" }
          limits:   { memory: "256Mi", cpu: "300m" }
```

### 12.2 GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/deploy.yaml
name: LETESE Deploy

on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: letese_test }
        ports: ["5432:5432"]
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with: { python-version: "3.11" }
    - run: pip install -r requirements.txt
    - run: pytest tests/ -v --cov=backend --cov-report=xml
    - run: flutter test
      working-directory: frontend/flutter_app

  security_scan:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: zaproxy/action-api-scan@v0.7.0
      with: { target: http://localhost:8000/openapi.json }
    - uses: aquasecurity/trivy-action@master
      with: { image-ref: "letese/api:${{ github.sha }}", severity: "CRITICAL,HIGH" }

  build_push:
    needs: [test, security_scan]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: |
        docker build -t letese/api:${{ github.sha }} -f backend/Dockerfile .
        docker build -t letese/aipot-scraper:${{ github.sha }} -f aipots/scraper/Dockerfile .
        docker build -t letese/aipot-police:${{ github.sha }} -f aipots/police/Dockerfile .
        docker push letese/api:${{ github.sha }}
        docker push letese/aipot-scraper:${{ github.sha }}
        docker push letese/aipot-police:${{ github.sha }}

  deploy:
    needs: build_push
    runs-on: ubuntu-latest
    steps:
    - run: |
        argocd app sync letese-production \
          --server $ARGOCD_SERVER --auth-token $ARGOCD_TOKEN \
          --revision ${{ github.sha }}
        argocd app wait letese-production --timeout 300
```

---

## 13. TESTING & QUALITY GATES

### 13.1 Test Requirements Per PR

```
Unit Tests:
  Backend (pytest-cov):    > 80% coverage
  Flutter (flutter test):  > 70% coverage

Integration Tests (every PR):
  [ ] POST /auth/login → verify JWT claims (tenant_id, role, plan)
  [ ] POST /cases → DB insert + Kafka job published to letese.scraper.jobs
  [ ] AIPOT-SCRAPER mock: court portal → diary update on letese.diary.updates
  [ ] AIPOT-COMMUNICATOR mock: WA API → message sent + logged in communication_log
  [ ] AIPOT-POLICE Small Audit: inject failing metric → verify FAIL result
  [ ] Document upload → S3 mock → metadata in documents table
  [ ] Compliance check: non-compliant doc → failures returned correctly
  [ ] Tenant isolation: User A's token cannot read User B's cases → 403

Performance Tests (nightly, Locust):
  [ ] 500 concurrent WebSocket diary connections → update latency < 5s
  [ ] 200 concurrent uploads (10MB each) → < 10s per file
  [ ] 1000 API req/s on GET /cases → P99 < 500ms
  [ ] AIPOT wake: 0 → 1 replica → first message processed in < 2s

Security Tests (weekly, OWASP ZAP):
  [ ] Zero CRITICAL findings
  [ ] Zero HIGH findings (injection, auth bypass, CSRF)
  [ ] Tenant isolation: 50 cross-tenant query attempts all return 403
  [ ] SSL/TLS: A+ rating on SSL Labs
```

### 13.2 Definition of Done (Per Sprint)

```
A sprint is NOT complete until ALL of the following pass:

□ All unit tests green; coverage thresholds met
□ All integration tests green
□ AIPOT-POLICE Major Audit passes with zero failures on staging
□ Zero open P1 or P2 bugs
□ ArgoCD shows all deployments healthy
□ API P95 latency < 500ms under load for 15-minute window (Grafana)
□ QA engineer has manually tested all sprint features
□ New endpoints documented in /contracts/api.openapi.yaml
□ New Kafka events documented in /contracts/kafka.events.schema.json
□ Database migrations tested with rollback script
```

---

## APPENDIX A — COURT CODE REFERENCE

```
PHAHC       Punjab & Haryana High Court
DHC         Delhi High Court
SC          Supreme Court of India
NCDRC       National Consumer Disputes Redressal Commission
BHC         Bombay High Court
MHC         Madras High Court
CHC         Calcutta High Court
AHC         Allahabad High Court
CHD_DC      Chandigarh District Courts
CONSUMER_PH Punjab Consumer Forums
TIS_HAZ     Tis Hazari District Court (Delhi)
SAKET       Saket District Court (Delhi)
NCLT_P      NCLT Principal Bench (Delhi)
NCLT_CH     NCLT Chandigarh Bench
ITAT_CH     ITAT Chandigarh Bench
```

## APPENDIX B — KAFKA EVENT SCHEMAS

```json
// letese.scraper.jobs
{ "case_id":"uuid","court_code":"PHAHC","case_number":"CWP-1234-2024",
  "tenant_id":"uuid","client_phone":"+919876543210","client_name":"Rajinder Sharma",
  "case_title":"Sharma v. Union of India","advocate_name":"Adv. Priya Kapoor",
  "priority":"normal|high|urgent" }

// letese.orders.new
{ "case_id":"uuid","tenant_id":"uuid","court_code":"PHAHC",
  "order_text":"Full order text...","order_date":"2025-02-12",
  "client_phone":"+919876543210","client_name":"Rajinder Sharma",
  "case_title":"Sharma v. Union of India","advocate_name":"Adv. Priya Kapoor",
  "next_hearing":"2025-03-15T10:30:00+05:30" }

// letese.communications.dispatch
{ "case_id":"uuid","tenant_id":"uuid",
  "message_type":"reminder_15d|reminder_7d|reminder_48h|reminder_24h|order_alert|payment",
  "channel":"whatsapp|sms|email|ai_call",
  "recipient_phone":"+919876543210","recipient_email":"client@email.com",
  "template_params":{"client_name":"Rajinder","hearing_date":"15 March 2025"},
  "schedule_id":"uuid","priority":"normal|high" }

// letese.police.heartbeats
{ "agent_id":"AIPOT-SCRAPER","timestamp":1708000000.123,
  "status":"alive","active_jobs":3,"memory_mb":142 }

// letese.build.status (agent coordination)
{ "agent_id":"AGENT-SCRAPER","module":"D-AIPOT-SCRAPER","day":2,
  "status":"COMPLETE|IN_PROGRESS|BLOCKED",
  "blocker":null,"output_url":"http://scraper-service:8010/health" }
```

## APPENDIX C — SUBSCRIPTION PLAN FEATURES

```
LETESE● Basic (Free Forever)
  Cases:           30 active
  Storage:         5 GB
  Scraper:         ✗
  Reminders:       Email only
  AI Drafting:     ✗
  Translation:     ✗
  Users:           1
  Support:         Community

LETESE● Professional (₹3,999/mo)
  Cases:           200 active
  Storage:         25 GB
  Scraper:         ✓ (8 courts)
  Reminders:       WhatsApp + SMS + Email
  AI Drafting:     ✗
  Translation:     ✗
  Users:           3
  Support:         Email (48h SLA)

LETESE● Elite (₹8,999/mo)
  Cases:           500 active
  Storage:         100 GB
  Scraper:         ✓
  Reminders:       ✓
  AI Drafting:     ✓ (GPT-4o)
  Translation:     ✓ (with accuracy %)
  HC/SC Compliance:✓
  Users:           7
  Support:         Priority (12h SLA)

LETESE● Enterprise (Custom pricing)
  Cases:           Unlimited
  Storage:         Custom
  Scraper:         ✓ (all courts + custom)
  Reminders:       ✓ + AI Voice Calls
  AI Drafting:     ✓ (best available model)
  Translation:     ✓
  Compliance:      ✓
  Precedent Search:✓
  Post-Judgment Analysis: ✓
  Users:           Unlimited
  Support:         Dedicated account manager (4h SLA)
```

---

*END OF SYSTEM_MASTER_BLUEPRINT.md*

*Version 1.0 — LETESE● Legal Technologies Pvt. Ltd.*  
*letese.xyz | info@letese.xyz*  
*Classification: INTERNAL — AGENT EXECUTION ONLY*  
*This file is the authoritative single source of truth for all autonomous build agents.*  
*Last updated: 2025*

