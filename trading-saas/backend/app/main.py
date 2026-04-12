"""
NSE-BSE Trading SaaS Backend
FastAPI Application
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import psycopg2
from psycopg2.extras import RealDictCursor
import os

from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.admin.router import router as admin_router
from app.trading.router import router as trading_router
from app.database import get_db, init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="NSE-BSE Trading SaaS API",
    description="Multi-tenant trading bot SaaS platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(trading_router, prefix="/api/v1/trading", tags=["Trading"])

@app.get("/")
async def root():
    return {"message": "NSE-BSE Trading SaaS API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "trading-saas"}

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
