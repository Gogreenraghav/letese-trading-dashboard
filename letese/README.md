# LETESE● Legal Practice Management SaaS

> 🤖 AI-powered legal practice management for Indian law firms.

**Track cases. Automate reminders. Draft faster. Win more.**

[![CI](https://github.com/YOUR_ORG/letese/actions/workflows/ci.yaml/badge.svg)](https://github.com/YOUR_ORG/letese/actions)
[![Python](https://img.shields.io/badge/python-3.12-blue)](https://python.org)
[![Flutter](https://img.shields.io/badge/flutter-3.22-blue)](https://flutter.dev)

---

## 🌟 Features

| | | |
|--|--|--|
| 🔍 **Court Case Tracker** | Auto-scrapes P&H HC, Delhi HC, SC | 24/7 monitoring |
| 📅 **Smart Reminders** | WhatsApp + SMS + Email | Automated |
| ✏️ **AI Document Drafting** | GPT-4o legal drafts | Elite+ |
| 📄 **Live Document Editor** | 3-user real-time collab | Tiptap + Y.js |
| 🔐 **Multi-User RBAC** | 6 roles, granular permissions | Team ready |
| 💰 **Smart Billing** | Razorpay invoices | Auto-payment |
| 🌐 **Multi-Language** | Punjabi, Hindi, English | Indic support |
| 🔔 **Unified Inbox** | WhatsApp + Email in one | AI-sorted |
| ✅ **Compliance Checker** | Auto court rule validation | Elite+ |
| 📱 **Mobile App** | Flutter iOS + Android | Play Store |

---

## 📂 Project Structure

```
letese/
├── backend/               # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST API endpoints
│   │   ├── aipots/            # AIPOT AI agents
│   │   ├── services/          # Business logic
│   │   ├── models/             # SQLAlchemy models
│   │   └── db/                # Database config + migrations
│   ├── tests/             # pytest test suite
│   └── Dockerfile
├── frontend/
│   ├── flutter_app/      # Flutter mobile app
│   ├── super-admin/       # Next.js Super Admin Dashboard
│   ├── customer-admin/   # Next.js Customer Admin Dashboard
│   └── landing/           # Next.js Marketing Site
├── infrastructure/
│   ├── k8s/              # Kubernetes manifests
│   ├── argocd/            # ArgoCD ApplicationSets
│   ├── prometheus/        # Prometheus config + alerts
│   ├── grafana/           # Grafana dashboards
│   └── dns/               # Cloudflare DNS
├── scripts/               # Setup + deployment scripts
├── contracts/             # API + Kafka JSON schemas
├── docs/                   # Deployment documentation
├── SPEC.md                 # This specification
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.12
- Node.js 20+ (for frontend)

### 1. Clone & Setup

```bash
git clone https://github.com/YOUR_ORG/letese.git
cd letese
cp backend/.env.production.example backend/.env
```

### 2. Start Infrastructure

```bash
docker compose up -d postgres redis kafka-1 zookeeper kafka-ui
```

### 3. Run Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Run Frontend

```bash
cd frontend/flutter_app
flutter run
```

### 5. Access

| Service | URL |
|---------|-----|
| API Docs | http://localhost:8000/docs |
| Kafka UI | http://localhost:8080 |
| Flutter App | http://localhost:3000 |

---

## 📦 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment to AWS EKS with ArgoCD.

---

## 🧪 Testing

```bash
# Backend tests
pytest backend/tests/ -v

# Load testing
locust -f backend/tests/load_test.py --host=https://api.letese.xyz

# Security scan
pytest backend/tests/security_scan.py
```

---

## 📄 License

Proprietary — LETESE● Legal Technologies Pvt. Ltd.

---

*Built with ❤️ for Indian law firms | letese.xyz*
