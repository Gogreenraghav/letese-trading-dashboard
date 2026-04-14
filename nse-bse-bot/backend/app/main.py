"""
FastAPI Main Application — NSE-BSE Trading Bot SaaS Backend
"""
import os
import sys
from pathlib import Path

# Add backend dir to path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import logging

# Load env
load_dotenv()

# ─── App Setup ─────────────────────────────────────────────────

app = FastAPI(
    title="LETESE Trading Bot API",
    description="AI-powered NSE & BSE Trading Bot SaaS Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────

origins = [
    "http://localhost:3000",
    "http://localhost:3005",
    "https://trading.letese.com",
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────

from .auth.router import router as auth_router
from .users.router import router as users_router
from .admin.router import router as admin_router
from .subscriptions.router import router as subscriptions_router

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(subscriptions_router, prefix="/api")

# ─── Health ────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "NSE-BSE Trading Bot API",
        "version": "1.0.0",
    }


@app.get("/api/health")
def api_health():
    return {"status": "ok", "timestamp": "2026-04-14"}


# ─── Global Error Handler ───────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )


# ─── Startup: Create Admin User ─────────────────────────────────

from .database import engine, Base
from .models import User
from sqlalchemy.orm import Session
from .auth.utils import hash_password
import os

@app.on_event("startup")
def create_admin():
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created")

        # Create default admin if not exists
        db = Session(bind=engine)
        admin_email = os.getenv("ADMIN_EMAIL", "admin@letese.com")
        existing = db.query(User).filter(User.email == admin_email).first()

        if not existing:
            admin = User(
                email=admin_email,
                password_hash=hash_password(os.getenv("ADMIN_PASSWORD", "admin123")),
                full_name="Super Admin",
                plan="enterprise",
                is_admin=True,
                is_active=True,
                subscription_status="active",
                email_verified=True,
                max_stocks=200,
                max_strategies=10,
                live_trading=True,
            )
            db.add(admin)
            db.commit()
            print(f"✅ Default admin created: {admin_email}")
        else:
            print("✅ Admin user already exists")

        db.close()
    except Exception as e:
        print(f"⚠️  Startup admin check failed: {e}")


# ─── Run ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
