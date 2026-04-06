"""
LETESE● FastAPI Main Application
MODULE C: API Gateway (FastAPI REST + WebSocket)
"""
import time
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings

# ── Metrics Middleware ──────────────────────────────────────────────
class MetricsMiddleware(BaseHTTPMiddleware):
    """Records every API request in the metrics store for Prometheus scraping."""

    async def dispatch(self, request: Request, call_next):
        # Skip metrics endpoint itself to avoid recursion
        if request.url.path == "/metrics":
            return await call_next(request)

        from app.services.metrics_store import metrics_store

        start = time.monotonic()
        response = await call_next(request)
        duration = time.monotonic() - start

        # Normalize path: replace UUID/digit segments with placeholders to reduce cardinality
        path = request.url.path
        import re
        path = re.sub(r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '/{id}', path)
        path = re.sub(r'/\d+', '/{id}', path)

        metrics_store.record_request(
            method=request.method,
            endpoint=path,
            status=response.status_code,
            duration_s=duration,
        )
        return response


app = FastAPI(
    title="LETESE● Legal SaaS API",
    version="1.0.0",
    description="Legal Practice Management SaaS — Punjab & Haryana High Court",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS — restrict to letese domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://letese.xyz", "https://app.letese.xyz", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics collection middleware (must be added before routes)
app.add_middleware(MetricsMiddleware)

# ── Health ─────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    from app.services.health_check import health_check_service
    report = await health_check_service.check_all()
    return report


@app.get("/ready")
async def readiness_check():
    return {"status": "ready"}


# ── Include Routers ────────────────────────────────────────────────
from app.api.v1.endpoints import auth, cases, documents, communications, tasks, invoices, admin, team, webhooks
from app.api.v1.endpoints import metrics as metrics_endpoint

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(metrics_endpoint.router, tags=["Metrics"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(communications.router, prefix="/api/v1/communications", tags=["Communications"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["Invoices"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(team.router, prefix="/api/v1/admin", tags=["Team"])
app.include_router(webhooks.router, tags=["Webhooks"])


# ── WebSocket Endpoints ────────────────────────────────────────────
from app.api.v1.endpoints import websocket

app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
