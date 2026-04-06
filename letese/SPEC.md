# LETESE● Legal Practice Management SaaS — Specification

## 1. Overview

**LETESE●** is a cloud-based legal practice management SaaS for Indian law firms.
It automates court case tracking, client communication, document drafting, and billing.

**Live:** https://letese.xyz | https://app.letese.xyz | https://api.letese.xyz

---

## 2. Technical Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile App | Flutter | 3.22+ |
| Frontend Web | Next.js | 14 |
| API Server | FastAPI | 0.111 |
| Language | Python | 3.12 |
| Database | PostgreSQL + pgvector | 16 |
| Cache/Broker | Redis + Kafka | 7.2 / 3.7 |
| AI Agents | Custom AIPOT framework | — |
| Container | Docker + Kubernetes | 25 / 1.30 |
| CI/CD | GitHub Actions + ArgoCD | — |
| Monitoring | Prometheus + Grafana | — |
| Payments | Razorpay | — |
| Comms | WhatsApp, SMS, Email, Voice | — |

---

## 3. Features by Plan

### Basic (₹999/mo)
- 30 active cases
- 5 GB storage
- 1 user
- Email reminders only

### Professional (₹3,999/mo)
- 200 active cases
- 25 GB storage
- 3 users
- WhatsApp + SMS + Email reminders
- Court scraper (8 courts)

### Elite (₹8,999/mo)
- 500 active cases
- 100 GB storage
- 7 users
- AI document drafting (GPT-4o)
- Translation (Indic languages)
- HC/SC compliance checker

### Enterprise (Custom)
- Unlimited cases
- Custom storage
- Unlimited users
- AI Voice Calls (Exotel)
- Precedent search (pgvector)
- Post-judgment analysis

---

## 4. Architecture

### Multi-Agent AIPOT System
- **AIPOT-SCRAPER:** Court web scraper (Playwright + httpx)
- **AIPOT-COMPLIANCE:** Document validator (spaCy NLP)
- **AIPOT-COMMUNICATOR:** WhatsApp/SMS/Email/Voice dispatcher
- **AIPOT-POLICE:** Infrastructure monitor (24/7, 2 replicas)

### 3-Tier Dashboard
- **Super Admin:** System health, tenant management, vendor config, digital police
- **Customer Admin:** Team RBAC, billing, analytics, settings
- **User Terminal:** Case diary, inbox, tasks, profile (Flutter mobile)

---

## 5. API Base URL

Production: `https://api.letese.xyz/api/v1`

---

## 6. Authentication

- JWT RS256 — Access: 15 min, Refresh: 7 days
- OTP: 6-digit, 10-min TTL
- Google OAuth
- Roles: super_admin, admin, advocate, clerk, paralegal, intern

---

## 7. Database

PostgreSQL 16 with:
- Row-Level Security (tenant isolation at DB layer)
- pgvector (case embeddings, HNSW index)
- pg_trgm (fuzzy case search)
- PgBouncer (connection pooling, 100 max)

---

## 8. Kafka Topics

| Topic | Retention | Partitions |
|-------|---------|------------|
| letese.scraper.jobs | 1h | 6 |
| letese.diary.updates | 24h | 3 |
| letese.orders.new | 24h | 3 |
| letese.communications.dispatch | 24h | 6 |
| letese.police.heartbeats | 2h | 1 |
| letese.police.errors | 7d | 3 |
| letese.police.metrics | 7d | 1 |
| letese.build.status | 7d | 1 |

---

## 9. Supported Courts

| Code | Court |
|------|-------|
| PHAHC | Punjab & Haryana High Court |
| DHC | Delhi High Court |
| SC | Supreme Court of India |
| NCDRC | NCDRC |
| BHC | Bombay High Court |
| MHC | Madras High Court |
| CHD_DC | Chandigarh District Courts |
| TIS_HAZ | Tis Hazari District Court |
| SAKET | Saket District Court |
| NCLT_P | NCLT Principal Bench |

---

## 10. Third-Party Integrations

| Service | Purpose |
|---------|---------|
| OpenAI | AI drafting (GPT-4o) |
| Anthropic | Claude 3.5 Sonnet |
| Ollama (Mac Mini M4) | Local LLM inference |
| 360dialog | WhatsApp Business API |
| MSG91 | SMS |
| SendGrid | Email |
| Exotel | AI Voice Calls |
| ElevenLabs | TTS |
| Razorpay | Payments |
| Google OAuth | Authentication |
| IndicTrans2 | Punjabi/Hindi translation |

---

## 11. Compliance

- GDPR compliant (data export, deletion)
- TLS 1.3 on all public endpoints
- AES-256 encryption at rest
- Tenant isolation enforced at PostgreSQL RLS layer
- OWASP Top 10 hardening

---

## 12. Deployment

See `docs/DEPLOYMENT.md`

Production: AWS EKS (ap-south-1, Mumbai region)
CDN: CloudFront Mumbai edge
Domain: Cloudflare

---

*LETESE● Legal Technologies Pvt. Ltd. | Version 1.0.0*
*Built with ❤️ for Indian law firms*
