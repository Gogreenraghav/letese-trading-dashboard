"""
SQLAlchemy Database Models — Multi-tenant SaaS
"""
from sqlalchemy import (
    Column, String, Integer, BigInteger, Boolean,
    DateTime, Date, Text, Numeric, ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)

    # Subscription
    plan = Column(String(20), default="free")  # free | basic | pro | enterprise
    razorpay_customer_id = Column(String(100), nullable=True)
    subscription_id = Column(String(100), nullable=True)
    subscription_status = Column(String(20), default="trial")  # active | cancelled | trial | past_due
    subscription_start = Column(Date, nullable=True)
    subscription_end = Column(Date, nullable=True)

    # Telegram
    telegram_chat_id = Column(BigInteger, nullable=True)
    telegram_username = Column(String(100), nullable=True)
    telegram_bot_token = Column(String(100), nullable=True)  # per-user bot token

    # Limits
    max_stocks = Column(Integer, default=5)
    max_strategies = Column(Integer, default=1)
    live_trading = Column(Boolean, default=False)

    # Status
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    portfolios = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")
    trades = relationship("Trade", back_populates="user", cascade="all, delete-orphan")
    watchlists = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    signals = relationship("Signal", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_plan", "plan"),
        Index("ix_users_status", "is_active"),
    )


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    symbol = Column(String(20), nullable=False)  # TCS.NS, RELIANCE.NS
    exchange = Column(String(10), default="NSE")  # NSE | BSE
    quantity = Column(Integer, default=0)
    avg_price = Column(Numeric(12, 2), default=0)
    current_price = Column(Numeric(12, 2), nullable=True)
    market_value = Column(Numeric(12, 2), nullable=True)
    pnl = Column(Numeric(12, 2), default=0)
    pnl_pct = Column(Numeric(6, 2), default=0)

    # Trade info
    entry_time = Column(DateTime(timezone=True), nullable=True)
    strategy = Column(String(50), nullable=True)
    status = Column(String(20), default="open")  # open | closed | squared_off
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="portfolios")

    __table_args__ = (
        Index("ix_portfolio_user_symbol", "user_id", "symbol"),
        Index("ix_portfolio_status", "status"),
    )


class Trade(Base):
    __tablename__ = "trades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    symbol = Column(String(20), nullable=False)
    exchange = Column(String(10), default="NSE")
    action = Column(String(10), nullable=False)  # BUY | SELL
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    order_value = Column(Numeric(14, 2), default=0)
    brokerage = Column(Numeric(10, 2), default=0)
    net_charges = Column(Numeric(10, 2), default=0)
    pnl = Column(Numeric(12, 2), nullable=True)  # For SELL trades

    # Order tracking
    order_id = Column(String(100), nullable=True)  # Broker order ID
    order_type = Column(String(20), default="market")  # market | limit | stop
    status = Column(String(20), default="pending")  # pending | executed | cancelled | rejected

    strategy = Column(String(50), nullable=True)
    signal_id = Column(UUID(as_uuid=True), nullable=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="trades")

    __table_args__ = (
        Index("ix_trades_user_date", "user_id", "created_at"),
        Index("ix_trades_symbol", "symbol"),
    )


class Signal(Base):
    __tablename__ = "signals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # null = system-wide

    symbol = Column(String(20), nullable=False)
    exchange = Column(String(10), default="NSE")
    action = Column(String(10), nullable=False)  # BUY | SELL | HOLD
    confidence = Column(Numeric(5, 2), default=0)  # 0-100

    entry_price = Column(Numeric(12, 2), nullable=True)
    target_price = Column(Numeric(12, 2), nullable=True)
    stop_loss = Column(Numeric(12, 2), nullable=True)
    trailing_stop = Column(Numeric(12, 2), nullable=True)

    strategy = Column(String(50), nullable=True)
    timeframe = Column(String(10), default="daily")  # intraday | daily | weekly
    rationale = Column(Text, nullable=True)  # AI reasoning

    ai_provider = Column(String(20), nullable=True)  # groq | deepseek | openrouter
    ai_response_id = Column(String(100), nullable=True)

    news_sentiment = Column(String(10), nullable=True)  # bullish | bearish | neutral
    technical_score = Column(Numeric(5, 2), default=0)

    status = Column(String(20), default="active")  # active | triggered | expired | cancelled
    triggered_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="signals")

    __table_args__ = (
        Index("ix_signals_symbol_status", "symbol", "status"),
        Index("ix_signals_user_active", "user_id", "status"),
    )


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False, default="My Watchlist")
    symbol = Column(String(20), nullable=False)
    exchange = Column(String(10), default="NSE")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="watchlists")

    __table_args__ = (
        Index("ix_watchlist_user", "user_id"),
    )


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)  # "Zerodha", "AngelOne"
    provider = Column(String(50), nullable=False)  # zerodha | angelone | samco
    encrypted_api_key = Column(Text, nullable=True)
    encrypted_secret = Column(Text, nullable=True)
    encrypted_password = Column(Text, nullable=True)  # For broker login
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="api_keys")


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    target_user_id = Column(UUID(as_uuid=True), nullable=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())