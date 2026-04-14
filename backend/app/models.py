from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    advocate = "advocate"
    clerk = "clerk"
    paralegal = "paralegal"
    intern = "intern"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    firm_name = Column(String, nullable=True)
    role = Column(String, default="advocate")
    is_active = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    max_cases = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="user")
    cases = relationship("Case", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")

class Plan(Base):
    __tablename__ = "plans"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    monthly_price = Column(Integer, default=0)
    yearly_price = Column(Integer, default=0)
    max_cases = Column(Integer, default=10)
    max_advocates = Column(Integer, default=1)
    features = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="plan")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    plan_id = Column(String, ForeignKey("plans.id"), nullable=True)
    razorpay_subscription_id = Column(String, nullable=True)
    razorpay_customer_id = Column(String, nullable=True)
    razorpay_order_id = Column(String, nullable=True)
    status = Column(String, default="pending")
    plan_name = Column(String, nullable=True)
    amount_paid = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    billing_cycle = Column(String, default="monthly")
    started_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")

class Case(Base):
    __tablename__ = "cases"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    case_number = Column(String, nullable=True)
    case_type = Column(String, nullable=True)
    court_code = Column(String, nullable=True)
    court_name = Column(String, nullable=True)
    case_title = Column(String, nullable=False)
    opposite_party = Column(String, nullable=True)
    filing_number = Column(String, nullable=True)
    filing_date = Column(DateTime, nullable=True)
    registration_date = Column(DateTime, nullable=True)
    status = Column(String, default="pending")
    stage = Column(String, nullable=True)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    priority = Column(String, default="medium")
    next_hearing_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="cases")
    hearings = relationship("Hearing", back_populates="case")
    documents = relationship("Document", back_populates="case")

class Hearing(Base):
    __tablename__ = "hearings"
    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    hearing_date = Column(DateTime, nullable=True)
    court_name = Column(String, nullable=True)
    judge_name = Column(String, nullable=True)
    stage = Column(String, nullable=True)
    purpose = Column(String, nullable=True)
    order_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="hearings")

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    title = Column(String, nullable=False)
    doc_type = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    uploaded_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="documents")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    user_email = Column(String, nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activity_logs")

class Instrument(Base):
    __tablename__ = "instruments"
    id = Column(String, primary_key=True, index=True)
    instrument_token = Column(String, unique=True, index=True, nullable=False)
    exchange_token = Column(String, nullable=True)
    tradingsymbol = Column(String, index=True, nullable=False)
    name = Column(String, nullable=True)
    expiry = Column(String, nullable=True)
    strike = Column(Float, nullable=True)
    tick_size = Column(Float, default=0.05)
    lot_size = Column(Integer, default=1)
    instrument_type = Column(String, nullable=True)
    segment = Column(String, nullable=True)
    exchange = Column(String, nullable=True)
    underlying_symbol = Column(String, nullable=True)

class ZerodhaToken(Base):
    __tablename__ = "zerodha_tokens"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    enctoken = Column(Text, nullable=True)
    api_key = Column(String, nullable=True)
    is_active = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)