"""
User Schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime


class PortfolioSchema(BaseModel):
    id: str
    symbol: str
    exchange: str
    quantity: int
    avg_price: float
    current_price: Optional[float]
    market_value: Optional[float]
    pnl: float
    pnl_pct: float
    entry_time: Optional[datetime]
    strategy: Optional[str]
    status: str

    class Config:
        from_attributes = True


class TradeSchema(BaseModel):
    id: str
    symbol: str
    exchange: str
    action: str
    quantity: int
    price: float
    order_value: float
    pnl: Optional[float]
    order_type: str
    status: str
    strategy: Optional[str]
    executed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class SignalSchema(BaseModel):
    id: str
    symbol: str
    exchange: str
    action: str
    confidence: float
    entry_price: Optional[float]
    target_price: Optional[float]
    stop_loss: Optional[float]
    strategy: str
    timeframe: str
    rationale: Optional[str]
    news_sentiment: Optional[str]
    technical_score: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class WatchlistSchema(BaseModel):
    id: str
    name: str
    symbol: str
    exchange: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioStats(BaseModel):
    total_value: float
    total_pnl: float
    total_pnl_pct: float
    day_pnl: float
    open_positions: int
    closed_today: int


class DashboardStats(BaseModel):
    portfolio: PortfolioStats
    today_signals: int
    active_signals: int
    today_trades: int