"""
Auth Router — Signup, Login, Token refresh
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
import re

from ..database import get_db
from ..models import User
from .utils import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_admin_user
)
from .schemas import (
    SignUpSchema, LoginSchema, TokenResponse, UserResponse,
    UserUpdateSchema, ChangePasswordSchema
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _user_response(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "plan": user.plan,
        "subscription_status": user.subscription_status,
        "telegram_chat_id": user.telegram_chat_id,
        "max_stocks": user.max_stocks,
        "max_strategies": user.max_strategies,
        "live_trading": user.live_trading,
        "is_admin": user.is_admin,
        "email_verified": user.email_verified,
        "created_at": user.created_at,
    }


@router.post("/signup", status_code=201)
def signup(schema: SignUpSchema, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check existing
    if db.query(User).filter(User.email == schema.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Plan limits based on email (or default to free)
    plan_limits = {
        "free": (5, 1, False),
        "basic": (20, 1, False),
        "pro": (50, 5, True),
        "enterprise": (200, 10, True),
    }

    user = User(
        email=schema.email.lower().strip(),
        password_hash=hash_password(schema.password),
        full_name=schema.full_name.strip(),
        phone=schema.phone,
        plan="free",
        max_stocks=5,
        max_strategies=1,
        live_trading=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=token,
        user=UserResponse(**_user_response(user))
    )


@router.post("/login")
def login(schema: LoginSchema, db: Session = Depends(get_db)):
    """Login and get JWT token"""
    user = db.query(User).filter(User.email == schema.email.lower().strip()).first()

    if not user or not verify_password(schema.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact support.")

    token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=token,
        user=UserResponse(**_user_response(user))
    )


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(**_user_response(current_user))


@router.put("/me")
def update_me(
    schema: UserUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile"""
    update_data = schema.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(current_user, key, val)
    db.commit()
    db.refresh(current_user)
    return UserResponse(**_user_response(current_user))


@router.post("/change-password")
def change_password(
    schema: ChangePasswordSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change password"""
    if not verify_password(schema.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(schema.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.get("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Email verification endpoint (token-based)"""
    # TODO: implement email verification token flow
    return {"message": "Email verification not yet implemented"}