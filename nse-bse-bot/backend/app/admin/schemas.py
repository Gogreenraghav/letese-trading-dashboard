"""
Admin Schemas
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import uuid as uuid_lib


class AdminUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    plan: str
    subscription_status: str
    telegram_chat_id: Optional[int]
    is_active: bool
    is_admin: bool
    email_verified: bool
    max_stocks: int
    live_trading: bool
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator("id", mode="before")
    @classmethod
    def validate_id(cls, v):
        if hasattr(v, "__str__"):
            return str(v)
        return v


class AdminDashboardStats(BaseModel):
    total_users: int
    active_users: int
    free_users: int
    basic_users: int
    pro_users: int
    enterprise_users: int
    total_revenue_month: float
    total_trades_month: int
    total_signals_generated: int


class AdminPlanUpdate(BaseModel):
    plan: str
    subscription_status: Optional[str] = None
    subscription_end: Optional[str] = None


class AdminUserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    plan: str = "free"
    is_admin: bool = False