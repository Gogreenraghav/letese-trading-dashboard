# LETESE● Legal Practice Management SaaS — MVP Build

> **Agent:** Tiwari | **Task:** Build LETESE Legal SaaS Full MVP  
> **Blueprint:** `SYSTEM_MASTER_BLUEPRINT.md` | **Status:** 🚧 IN PROGRESS

---

## What Was Built

### MODULE A — Database Schema ✅
- `backend/app/db/schema.sql` — Full PostgreSQL 16 schema
- Tables: tenants, users, cases, case_hearings, communication_schedule, communication_log, documents, yjs_documents, tasks, invoices, audit_logs, court_checklists, case_embeddings, vendor_configs, llm_usage_log
- Row-Level Security (RLS) enforced at DB layer
- pgvector for case embeddings (HNSW index)
- `backend/app/models/models.py` — SQLAlchemy async ORM models

### MODULE B — Auth & RBAC ✅
- `backend/app/services/auth_service.py` — JWT RS256, OTP (6-digit, 10-min TTL), Google OAuth
- Roles: super_admin, admin, advocate, clerk, paralegal, intern
- PostgreSQL RLS context injection on every request

### MODULE C — FastAPI API Gateway ✅
- `backend/app/main.py` — FastAPI app with CORS, WebSocket routes
- `backend/app/api/v1/endpoints/auth.py` — Send OTP, Login, Google OAuth, Refresh
- `backend/app/api/v1/endpoints/cases.py` — CRUD, search, plan limits, scrape trigger
- `backend/app/api/v1/endpoints/documents.py` — Upload, translate, compliance check
- `backend/app/api/v1/endpoints/tasks.py` — Task list, create, update
- `backend/app/api/v1/endpoints/invoices.py` — Invoice create, list, send
- `backend/app/api/v1/endpoints/admin.py` — System health, tenant CRUD, analytics, audit trigger
- `backend/app/api/v1/endpoints/websocket.py` — Diary, Inbox, Health WebSockets

### MODULE D/H — AIPOT Agents ✅
- `backend/app/aipots/base.py` — BaseAIPOT: lifecycle, exponential retry, Kafka, Redis, heartbeat
- `backend/app/aipots/scraper.py` — Court web scraper: PHAHC, DHC, SC, NCDRC + Playwright/httpx
- `backend/app/aipots/compliance.py` — Document validator: word count, sections, parties, numbering
- `backend/app/aipots/police.py` — Digital Police: Small Audit (10min), Major Audit (60min), PagerDuty

### MODULE E — Flutter Frontend ✅
- `frontend/flutter_app/lib/theme/app_theme.dart` — Glassmorphism 2.0 dark theme, LETESE brand logo
- `frontend/flutter_app/lib/services/api_service.dart` — Dio HTTP client, JWT interceptor, API classes
- `frontend/flutter_app/lib/screens/auth_screen.dart` — Login with OTP + Google OAuth
- `frontend/flutter_app/lib/screens/case_diary_screen.dart` — Case list with urgency badges, filters
- `frontend/flutter_app/lib/main.dart` — App shell, bottom nav, New Case form

### MODULE G — Communications ✅
- `backend/app/services/kafka_producer.py` — Publish to scraper, diary, comms, build topics
- `backend/app/services/comm_scheduler.py` — Auto-schedule 15d/7d/48h/24h WhatsApp reminders

### Services ✅
- `backend/app/services/llm_gateway.py` — OpenAI, Anthropic, Ollama with cost optimization
- `backend/app/core/config.py` — Pydantic settings from environment

### Contracts ✅
- `contracts/auth.schema.json` — JWT payload, RBAC roles
- `contracts/cases.schema.json` — Case object, court codes, petition types
- `contracts/kafka.events.schema.json` — All Kafka event schemas

---

## What's Left (PAPERCLIP TASK)

1. **Flutter app needs compilation** — `flutter build apk` / `flutter build web`
2. **docker-compose up** — needs Docker installed on deployment server
3. **Database migration** — run `schema.sql` against PostgreSQL
4. **JWT key pair** — generate RS256 keys, place in `/secrets/`
5. **API keys** — set env vars for OpenAI, Anthropic, Razorpay, WhatsApp, MSG91
6. **Tiptap editor** — `frontend/flutter_app/lib/screens/editor_screen.dart` (Module F)
7. **AIPOT-COMMUNICATOR** — WhatsApp/SMS/Email dispatch agent (Module G)
8. **Super Admin Dashboard** — React/Next.js frontend (Module E-SA)
9. **Customer Admin Dashboard** — (Module E-CA)
10. **Prometheus + Grafana** — monitoring stack (Module H setup)

---

## Quick Start (Local Dev)

```bash
# 1. Start infrastructure
docker compose up -d postgres redis kafka-1 zookeeper kafka-ui

# 2. Install Python deps
pip install -r backend/requirements.txt

# 3. Set env vars
export DATABASE_URL=postgresql+asyncpg://letese_user:letese_pass@localhost:5432/letese_prod
export REDIS_URL=redis://localhost:6379/0
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# 4. Run API
cd backend && uvicorn app.main:app --reload --port 8000

# 5. Run Flutter
cd frontend/flutter_app && flutter run

# 6. Run AIPOTs (separate terminals)
python -m app.aipots.scraper
python -m app.aipots.police
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Flutter 3.22+, Riverpod, Dio |
| API | Python 3.12, FastAPI 0.111, Pydantic v2 |
| Database | PostgreSQL 16, pgvector, PgBouncer |
| Cache | Redis 7.2 |
| Message Broker | Apache Kafka 3.7 |
| AI Agents | Playwright, spaCy, OpenAI, Anthropic |
| Search | pg_trgm (fuzzy), pgvector (embeddings) |
| Storage | AWS S3 |
| Payments | Razorpay |
| Communications | WhatsApp (360dialog), SMS (MSG91), Voice (Exotel) |
| Infra | Docker, Kubernetes, ArgoCD |

---

*LETESE● Legal Technologies Pvt. Ltd. | letese.xyz | Version 1.0*
