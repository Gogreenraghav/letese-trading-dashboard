"""
Authentication Router - Login, Register, Profile
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User, ActivityLog
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""
    firm_name: str = ""
    role: str = "advocate"

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        hashed_password=get_password_hash(data.password),
        name=data.name,
        firm_name=data.firm_name,
        role=data.role,
    )
    db.add(user)
    db.commit()
    
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user_id": user.id}

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "firm_name": current_user.firm_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "max_cases": current_user.max_cases,
        "created_at": str(current_user.created_at),
    }

@router.put("/profile")
def update_profile(name: str = None, firm_name: str = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if name: current_user.name = name
    if firm_name: current_user.firm_name = firm_name
    db.commit()
    return {"message": "Profile updated"}