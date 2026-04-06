# LETESE● Super Admin Dashboard

## Module E-SA — Super Admin Web Console

### Access
- Route prefix: `/super-admin/`
- Requires: `role: "super_admin"` JWT
- Base URL: `http://localhost:8000`

### Tech Stack
- **Next.js 14** (App Router)
- **Tailwind CSS 3** + custom Glassmorphism theme
- **TanStack Table v8** for data tables
- **Recharts** for audit trend charts
- **Sonner** for toast notifications
- **Lucide React** for icons

### Design System
- Background: `#0A0E1A` (bgObsidian)
- Glassmorphism: `rgba(255,255,255,0.04)` bg, `rgba(255,255,255,0.08)` border
- Accent: `#00D4FF` (neonCyan), `#8B5CF6` (electricPurple)
- LETESE logo + branding throughout
- 200ms transitions

### Routes
| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Dashboard overview | KPIs, alerts summary |
| `/health` | SystemHealthMatrix | AIPOT + infra live status |
| `/tenants` | TenantManagementPanel | Tenant CRUD, impersonate |
| `/api-vendors` | APIVendorHub | Third-party config |
| `/police` | DigitalPoliceConsole | Audit feed, DLQ, alerts |
| `/audit` | AuditLogTable | Filterable audit log viewer |

### WebSocket Endpoints
- `/ws/health` — 10-second system health stream
- `/ws/police` — 50-event live audit feed

### Development
```bash
cd frontend/super-admin
npm install
npm run dev   # → http://localhost:3001
```

### Backend Dependencies
- `GET /api/v1/admin/system-health`
- `GET /api/v1/admin/tenants`
- `POST /api/v1/admin/tenants`
- `PATCH /api/v1/admin/tenants/{id}`
- `POST /api/v1/admin/tenants/{id}/impersonate`
- `GET /api/v1/admin/audit-logs`
- `POST /api/v1/admin/audit/trigger`
- `PATCH /api/v1/super-admin/vendors/{name}`
