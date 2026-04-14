"""
FastAPI Main Application - LETESE Trading Platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, admin, instruments, payments, subscriptions

app = FastAPI(title="LETESE Trading API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(instruments.router)
app.include_router(payments.router)
app.include_router(subscriptions.router)

@app.on_event("startup")
async def startup():
    from app.database import engine, Base
    from app import models
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"status": "ok", "service": "LETESE Trading API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "api": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)