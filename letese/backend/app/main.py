"""
LETESE● FastAPI Main Application
MODULE C: API Gateway (FastAPI REST + WebSocket)
"""
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings

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

# ── Health ─────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION, "service": "letese-api"}


@app.get("/ready")
async def readiness_check():
    return {"status": "ready"}


# ── Include Routers ────────────────────────────────────────────────
from app.api.v1.endpoints import auth, cases, documents, communications, tasks, invoices, admin

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(communications.router, prefix="/api/v1/communications", tags=["Communications"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["Invoices"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


# ── WebSocket Endpoints ────────────────────────────────────────────
from app.api.v1.endpoints import websocket

app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
