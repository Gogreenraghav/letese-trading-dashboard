# LETESE● Legal Practice Management SaaS — MVP Build

> **Agent:** Tiwari | **Task:** Build LETESE Legal SaaS Full MVP  
> **Blueprint:** `SYSTEM_MASTER_BLUEPRINT.md` | **Status:** 🚧 IN PROGRESS

---

## Day 1 — Completed ✅

### MODULE A — Database Schema ✅
- `backend/app/db/schema.sql` — Full PostgreSQL 16 schema
- Tables: tenants, users, cases, case_hearings, communication_schedule, communication_log,
  documents, yjs_documents, tasks, invoices, audit_logs, court_checklists,
  case_embeddings, vendor_configs, llm_usage_log
- Row-Level Security (RLS) enforced at DB layer
- pgvector for case embeddings (HNSW index)
- `backend/app/models/models.py` — SQLAlchemy 2.0 async ORM models

### MODULE B — Auth & RBAC ✅
- `backend/app/services/auth_service.py` — JWT RS256, OTP (6-digit, 10-min TTL), Google OAuth
- Roles: super_admin, admin, advocate, clerk, paralegal, intern
- PostgreSQL RLS context injection on every request
- RBAC permission matrix in `app/services/rbac.py`

### MODULE C — FastAPI API Gateway ✅
- `backend/app/main.py` — FastAPI app with CORS, WebSocket routes, Prometheus metrics middleware
- `backend/app/api/v1/endpoints/auth.py` — Send OTP, Login, Google OAuth, Refresh
- `backend/app/api/v1/endpoints/cases.py` — CRUD, search, plan limits, scrape trigger
- `backend/app/api/v1/endpoints/documents.py` — Upload, translate, compliance check
- `backend/app/api/v1/endpoints/tasks.py` — Task list, create, update
- `backend/app/api/v1/endpoints/invoices.py` — Invoice create, list, send
- `backend/app/api/v1/endpoints/admin.py` — System health, tenant CRUD, analytics
- `backend/app/api/v1/endpoints/websocket.py` — Diary, Inbox, Health WebSockets
- `backend/app/api/v1/endpoints/communications.py` — WhatsApp/SMS/Email outbox
- `backend/app/api/v1/endpoints/metrics.py` — Prometheus /metrics endpoint
- `backend/app/api/v1/deps.py` — Shared dependencies (get_current_user, get_db)

### MODULE D/H — AIPOT Agents ✅
- `backend/app/aipots/base.py` — BaseAIPOT: lifecycle, exponential retry, Kafka, Redis, heartbeat
- `backend/app/aipots/scraper.py` — Court web scraper: PHAHC, DHC, SC, NCDRC + Playwright/httpx
- `backend/app/aipots/compliance.py` — Document validator: word count, sections, parties, numbering
- `backend/app/aipots/police.py` — Digital Police: Small Audit (10min), Major Audit (60min), PagerDuty
- `backend/app/aipots/communicator.py` — WhatsApp/SMS/Email dispatch agent

### MODULE E — Flutter Frontend ✅
- `frontend/flutter_app/lib/theme/app_theme.dart` — Glassmorphism 2.0 dark theme, LETESE brand
- `frontend/flutter_app/lib/services/api_service.dart` — Dio HTTP client, JWT interceptor
- `frontend/flutter_app/lib/screens/auth_screen.dart` — Login with OTP + Google OAuth
- `frontend/flutter_app/lib/screens/case_diary_screen.dart` — Case list with urgency badges, filters
- `frontend/flutter_app/lib/main.dart` — App shell, bottom nav, New Case form

### MODULE G — Communications ✅
- `backend/app/services/kafka_producer.py` — Publish to scraper, diary, comms, build topics
- `backend/app/services/comm_scheduler.py` — Auto-schedule 15d/7d/48h/24h WhatsApp reminders

### Services ✅
- `backend/app/services/llm_gateway.py` — OpenAI, Anthropic, Ollama with cost optimization
- `backend/app/services/health_check.py` — Aggregated health: PostgreSQL, Redis, Kafka, S3
- `backend/app/services/metrics_store.py` — In-memory Prometheus metrics store
- `backend/app/services/pagerduty.py` — Alert routing for critical incidents
- `backend/app/core/config.py` — Pydantic BaseSettings from environment variables

### Contracts ✅
- `contracts/auth.schema.json` — JWT payload, RBAC roles
- `contracts/cases.schema.json` — Case object, court codes, petition types
- `contracts/kafka.events.schema.json` — All Kafka event schemas

### Docker & DevOps ✅
- `docker-compose.yml` — Full local dev stack: PostgreSQL 16, Redis 7, Kafka 3.7, Kafka-UI, API, AIPOTs
- `backend/Dockerfile` — API server image (multi-stage)
- `backend/Dockerfile.aipot` — AIPOT agents image
- `.github/workflows/ci.yaml` — GitHub Actions CI/CD: lint, pytest, docker build, smoke test

### Tests ✅
- `backend/tests/test_auth.py` — Full auth test suite: OTP, JWT, RBAC, rate limiting
- `backend/run_test.py` — API server integration test runner

### Code Fixes Applied ✅
- `cases.py` — Added missing `Case` model import (was referenced in SQL query without import)
- `scraper.py` — Fixed `async_playwright()` import (was `async_playwright` → `from playwright.async_api import async_playwright`);
  replaced `redis.lmove()` (Redis 6.2+ only) with portable `_proxy_lmove()` fallback
- `base.py`, `police.py`, `health_check.py` — Replaced deprecated `import aioredis` with
  `import redis.asyncio as aioredis` (redis v5 compatible)
- All Python files pass `python3 -m py_compile` syntax check

---

## Day 2 — In Progress 🚧

- [ ] Flutter APK/web build compilation
- [ ] JWT RS256 key pair generation (`/secrets/jwt_private.pem`, `/secrets/jwt_public.pem`)
- [ ] Real database migration (`alembic upgrade head` or raw `psql`)
- [ ] Super Admin Dashboard (React/Next.js)
- [ ] Customer Admin Dashboard
- [ ] Tiptap rich-text editor screen
- [ ] AIPOT-COMMUNICATOR full implementation
- [ ] Prometheus + Grafana monitoring stack
- [ ] Production deployment (VPS / Kubernetes)
- [ ] End-to-end API integration tests with real database

---

## Quick Start (with Docker)

```bash
# 1. Start infrastructure
cd letese
docker compose up -d postgres redis kafka-1 zookeeper kafka-ui

# 2. Wait for postgres to be ready
docker compose ps

# 3. Install Python dependencies
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install psutil  # for metrics service

# 4. Set environment variables
export DATABASE_URL=postgresql+asyncpg://letese_user:letese_pass@localhost:5432/letese_prod
export REDIS_URL=redis://localhost:6379/0
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export DEBUG=true

# 5. Run database migrations
python -c "import asyncio; from app.db.database import create_all; asyncio.run(create_all())"

# 6. Seed demo data
python -c "import asyncio; from app.db.database import seed_database; asyncio.run(seed_database())"

# 7. Run the API server
uvicorn app.main:app --reload --port 8000

# 8. Run the test suite
python run_test.py

# 9. Run AIPOT agents (separate terminals)
python -m app.aipots.scraper
python -m app.aipots.police

# 10. Flutter dev (requires Flutter SDK)
cd frontend/flutter_app && flutter run

# ── Without Docker ───────────────────────────────────────────────────
# Install postgres (pgvector), redis, kafka locally, then:
# DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/letese_prod
# REDIS_URL=redis://localhost:6379/0
# KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Flutter | 3.22+ |
| State | Riverpod | |
| HTTP Client | Dio | |
| API | Python | 3.12 |
| Web Framework | FastAPI | 0.111 |
| Data Validation | Pydantic | 2.8 |
| Database ORM | SQLAlchemy | 2.0 (async) |
| Database | PostgreSQL + pgvector | 16 |
| Connection Pooler | PgBouncer | |
| Cache / Queue | Redis | 7 |
| Message Broker | Apache Kafka | 3.7 |
| AI Scrapers | Playwright + httpx | 1.44 / 0.27 |
| NLP | spaCy | 3.7 |
| LLM Gateway | OpenAI + Anthropic + Ollama | |
| Auth | JWT RS256 + OTP | |
| Payments | Razorpay | |
| WhatsApp | 360dialog | |
| SMS | MSG91 | |
| Voice | Exotel | |
| Storage | AWS S3 | |
| PDF Generation | WeasyPrint | 62 |
| Container | Docker + Docker Compose | |
| CI/CD | GitHub Actions | |

---

## Project Structure

```
letese/
├── backend/
│   ├── Dockerfile              # API server image
│   ├── Dockerfile.aipot       # AIPOT agents image
│   ├── requirements.txt       # Python dependencies
│   ├── run_test.py            # API integration test runner
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py            # FastAPI application entry point
│   │   ├── core/
│   │   │   └── config.py      # Pydantic settings from env vars
│   │   ├── db/
│   │   │   ├── database.py    # SQLAlchemy async engine + session
│   │   │   ├── schema.sql      # PostgreSQL schema + RLS policies
│   │   │   └── seed_data.py   # Demo data generator
│   │   ├── models/
│   │   │   └── models.py      # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── deps.py        # Shared FastAPI dependencies
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py           # Login, OTP, Google OAuth
│   │   │       │   ├── cases.py          # Case CRUD + search
│   │   │       │   ├── documents.py       # Upload, translate
│   │   │       │   ├── communications.py   # WhatsApp/SMS outbox
│   │   │       │   ├── tasks.py           # Task management
│   │   │       │   ├── invoices.py         # Billing
│   │   │       │   ├── admin.py            # Super admin routes
│   │   │       │   ├── metrics.py          # Prometheus /metrics
│   │   │       │   └── websocket.py        # Real-time streams
│   │   │       └── router.py   # v1 API router assembly
│   │   ├── services/
│   │   │   ├── auth_service.py      # JWT RS256 + OTP
│   │   │   ├── rbac.py               # Permission matrix
│   │   │   ├── health_check.py       # /health aggregator
│   │   │   ├── kafka_producer.py     # aiokafka publisher
│   │   │   ├── comm_scheduler.py     # Reminder scheduling
│   │   │   ├── llm_gateway.py        # OpenAI/Anthropic/Ollama
│   │   │   ├── metrics_store.py      # Prometheus in-memory store
│   │   │   ├── metrics_service.py    # Background metric collector
│   │   │   ├── build_status.py       # Build pipeline status
│   │   │   └── pagerduty.py          # Alert routing
│   │   └── aipots/
│   │       ├── base.py           # BaseAIPOT: Kafka consumer + heartbeat
│   │       ├── scraper.py        # Court web scraper agent
│   │       ├── compliance.py     # Document validator agent
│   │       ├── police.py         # Digital police audit engine
│   │       └── communicator.py   # WhatsApp/SMS/Email dispatcher
│   └── tests/
│       └── test_auth.py         # Auth + RBAC test suite
├── frontend/
│   └── flutter_app/             # Flutter 3.22+ mobile app
│       └── lib/
│           ├── main.dart
│           ├── theme/app_theme.dart
│           ├── services/api_service.dart
│           └── screens/
│               ├── auth_screen.dart
│               └── case_diary_screen.dart
├── contracts/
│   ├── auth.schema.json
│   ├── cases.schema.json
│   └── kafka.events.schema.json
├── .github/
│   └── workflows/
│       └── ci.yaml               # Lint → pytest → Docker build → smoke test
├── docker-compose.yml            # Full local dev stack
├── README.md
└── SYSTEM_MASTER_BLUEPRINT.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Aggregated health check |
| GET | /ready | Readiness probe |
| GET | /metrics | Prometheus metrics |
| WS | /ws/diary | Real-time diary stream |
| WS | /ws/inbox | Real-time inbox stream |
| POST | /api/v1/auth/send-otp | Send OTP to email |
| POST | /api/v1/auth/verify-otp | Verify OTP + get JWT |
| POST | /api/v1/auth/google | Google OAuth callback |
| POST | /api/v1/auth/refresh | Refresh access token |
| GET | /api/v1/cases | List cases (filterable, searchable) |
| POST | /api/v1/cases | Create case (plan limits enforced) |
| GET | /api/v1/cases/{id} | Case detail + hearings + docs + tasks |
| PUT | /api/v1/cases/{id} | Update case |
| DELETE | /api/v1/cases/{id} | Soft-delete (archive) case |
| POST | /api/v1/cases/{id}/scrape | Trigger AIPOT-SCRAPER |
| GET | /api/v1/documents | List documents |
| POST | /api/v1/documents/upload | Upload file (S3) |
| POST | /api/v1/documents/{id}/translate | Translate document |
| GET | /api/v1/tasks | List tasks |
| POST | /api/v1/tasks | Create task |
| PUT | /api/v1/tasks/{id} | Update task |
| GET | /api/v1/invoices | List invoices |
| POST | /api/v1/invoices | Create invoice |
| POST | /api/v1/communications/send | Send WhatsApp/SMS |
| GET | /api/v1/admin/health | Admin system health |
| GET | /api/v1/admin/tenants | List tenants |
| POST | /api/v1/admin/tenants | Create tenant |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/letese_prod
PGBOUNCER_URL=postgresql+asyncpg://user:pass@localhost:6432/letese_prod

# Redis
REDIS_URL=redis://localhost:6379/0

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# JWT (RS256 — generate key pair in /secrets/)
JWT_PRIVATE_KEY_PATH=/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/secrets/jwt_public.pem

# AWS
AWS_REGION=ap-south-1
AWS_S3_BUCKET_DOCS=letese-tenant-docs-prod
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Communications
WHATSAPP_API_KEY=
MSG91_AUTH_KEY=
EXOTEL_API_KEY=
EXOTEL_API_TOKEN=
ELEVENLABS_API_KEY=

# App
DEBUG=false
```

---

*LETESE● Legal Technologies Pvt. Ltd. | letese.xyz | Version 1.0*
