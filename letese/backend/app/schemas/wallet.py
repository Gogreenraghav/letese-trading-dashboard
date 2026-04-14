# LETESE● Wallet Schemas
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field


# ── Wallet ──────────────────────────────────────────────────────────
class WalletResponse(BaseModel):
    wallet_id: UUID
    tenant_id: UUID
    balance_inr: Decimal
    total_loaded_inr: Decimal

    class Config:
        from_attributes = True


# ── Topup Request ───────────────────────────────────────────────────
class TopupRequestCreate(BaseModel):
    amount_inr: Decimal = Field(..., gt=0, description="Amount in INR (> 0)")
    payment_method: str = Field(..., description="cash | upi | bank_transfer | cheque | other")
    transaction_ref: str | None = Field(None, max_length=200)
    remarks: str | None = None


class TopupRequestResponse(BaseModel):
    request_id: UUID
    tenant_id: UUID
    requested_by_user_id: UUID
    requested_by_name: str | None = None
    amount_inr: Decimal
    payment_method: str
    transaction_ref: str | None
    remarks: str | None
    status: str
    admin_notes: str | None
    approved_by_user_id: UUID | None
    approved_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class TopupApproveRequest(BaseModel):
    admin_notes: str | None = None


class TopupRejectRequest(BaseModel):
    admin_notes: str | None = Field(None, description="Reason for rejection")


# ── Transaction ────────────────────────────────────────────────────
class WalletTransactionResponse(BaseModel):
    transaction_id: UUID
    tenant_id: UUID
    amount_inr: Decimal
    type: str  # credit | debit
    source: str
    reference_id: UUID | None
    reference_type: str | None
    description: str | None
    balance_before_inr: Decimal
    balance_after_inr: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


# ── Admin list filters ──────────────────────────────────────────────
class TopupRequestListResponse(BaseModel):
    items: list[TopupRequestResponse]
    total: int
    pending_count: int
