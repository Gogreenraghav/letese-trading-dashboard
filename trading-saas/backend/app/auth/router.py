"""
Authentication Router — Signup, Login, Token
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from app.database import get_db
from app.auth.utils import hash_password, verify_password, create_access_token, decode_token
from app.admin.utils import get_current_admin
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

# ── Request/Response Schemas ──────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    phone: str = Field(min_length=10, max_length=20)
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2, max_length=200)
    referral_code: str = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str
    plan: str

class SignupResponse(BaseModel):
    message: str
    user_id: str
    email: str

# ── Endpoints ─────────────────────────────────────────────────────────

@router.post("/signup", response_model=SignupResponse)
async def signup(data: SignupRequest):
    """Register a new user."""
    with get_db() as conn:
        cur = conn.cursor()
        
        # Check if email/phone already exists
        cur.execute("SELECT id FROM trading_users WHERE email = %s OR phone = %s", (data.email, data.phone))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email or phone already registered")
        
        # Get free plan
        cur.execute("SELECT id FROM trading_plans WHERE name = 'free'")
        free_plan = cur.fetchone()
        if not free_plan:
            raise HTTPException(status_code=500, detail="Free plan not found")
        
        # Create user
        password_hash = hash_password(data.password)
        cur.execute("""
            INSERT INTO trading_users 
            (email, phone, password_hash, full_name, plan_id, subscription_status, 
             subscription_start, subscription_end, is_verified, is_active)
            VALUES (%s, %s, %s, %s, %s, 'trial', NOW(), NOW() + INTERVAL '7 days', true, true)
            RETURNING id
        """, (data.email, data.phone, password_hash, data.full_name, free_plan['id']))
        
        user_id = cur.fetchone()['id']
        conn.commit()
        
        return SignupResponse(
            message="Signup successful! You have 7 days free trial.",
            user_id=str(user_id),
            email=data.email
        )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """Login and get JWT token."""
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.plan_id,
                   u.telegram_chat_id, u.subscription_status,
                   p.name as plan_name, p.display_name as plan_display
            FROM trading_users u
            JOIN trading_plans p ON p.id = u.plan_id
            WHERE u.email = %s AND u.is_active = true
        """, (data.email,))
        
        user = cur.fetchone()
        if not user or not verify_password(data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
        cur.execute("UPDATE trading_users SET last_login_at = NOW() WHERE id = %s", (user['id'],))
        conn.commit()
        
        token = create_access_token({
            "sub": str(user['id']),
            "email": user['email'],
            "role": user['role'] or 'user',
            "plan": user['plan_name']
        })
        
        return TokenResponse(
            access_token=token,
            user_id=str(user['id']),
            email=user['email'],
            full_name=user['full_name'],
            role=user['role'] or 'user',
            plan=user['plan_name']
        )


@router.get("/me")
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user profile."""
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT u.id, u.email, u.phone, u.full_name, u.role, u.plan_id,
                   u.subscription_status, u.subscription_start, u.subscription_end,
                   u.telegram_chat_id, u.trading_mode, u.initial_capital,
                   u.max_risk_per_trade, u.preferred_strategy,
                   u.last_login_at, u.created_at,
                   p.name as plan_name, p.display_name as plan_display,
                   p.price_monthly, p.telegram_enabled, p.live_trading
            FROM trading_users u
            JOIN trading_plans p ON p.id = u.plan_id
            WHERE u.id = %s
        """, (user_id,))
        
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return dict(user)


@router.put("/me")
async def update_me(
    full_name: str = None,
    phone: str = None,
    trading_mode: str = None,
    max_risk_per_trade: int = None,
    preferred_strategy: str = None,
    telegram_chat_id: int = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update current user profile."""
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    updates = []
    values = []
    
    if full_name: updates.append("full_name = %s"); values.append(full_name)
    if phone: updates.append("phone = %s"); values.append(phone)
    if trading_mode: updates.append("trading_mode = %s"); values.append(trading_mode)
    if max_risk_per_trade: updates.append("max_risk_per_trade = %s"); values.append(max_risk_per_trade)
    if preferred_strategy: updates.append("preferred_strategy = %s"); values.append(preferred_strategy)
    if telegram_chat_id: updates.append("telegram_chat_id = %s"); values.append(telegram_chat_id)
    
    updates.append("updated_at = NOW()")
    values.append(user_id)
    
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(f"UPDATE trading_users SET {', '.join(updates)} WHERE id = %s", values)
        conn.commit()
        
        return {"message": "Profile updated successfully"}
