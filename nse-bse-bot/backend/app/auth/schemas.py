"""
Auth Pydantic Schemas
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import date, datetime


class SignUpSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=64)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain a digit")
        return v


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    plan: str
    subscription_status: str
    telegram_chat_id: Optional[int]
    max_stocks: int
    max_strategies: int
    live_trading: bool
    is_admin: bool
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    telegram_chat_id: Optional[int] = None
    telegram_username: Optional[str] = None


class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


# Forward reference resolution
TokenResponse.model_rebuild()