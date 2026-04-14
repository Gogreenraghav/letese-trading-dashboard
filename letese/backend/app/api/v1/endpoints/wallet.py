# LETESE● Wallet API Endpoints
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.models import Wallet, WalletTopupRequest, WalletTransaction, Tenant, User
from app.schemas.wallet import (
    WalletResponse,
    TopupRequestCreate,
    TopupRequestResponse,
    TopupApproveRequest,
    TopupRejectRequest,
    TopupRequestListResponse,
    WalletTransactionResponse,
)

router = APIRouter(tags=["Wallet"])


# ── Auth Dependency ──────────────────────────────────────────────────
def get_user_from_token(authorization: str = Header(...)) -> dict:
    """Extract and verify JWT payload from Authorization header."""
    from app.services.auth_service import auth_service
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization[7:]
    try:
        return auth_service.verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


def require_role(roles: list[str]):
    """Factory: returns a dependency that checks role."""
    def dep(current_user: dict = Depends(get_user_from_token)):
        if current_user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return dep


# ── CLIENT: Get my wallet ────────────────────────────────────────────
@router.get("/me", response_model=WalletResponse)
async def get_my_wallet(
    current_user: dict = Depends(get_user_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's tenant wallet balance."""
    result = await db.execute(
        select(Wallet).where(Wallet.tenant_id == uuid.UUID(current_user["tenant_id"]))
    )
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(
            tenant_id=uuid.UUID(current_user["tenant_id"]),
            balance_inr=Decimal("0.00"),
            total_loaded_inr=Decimal("0.00"),
        )
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)
    return wallet


# ── CLIENT: My topup requests ───────────────────────────────────────
@router.get("/topup/me", response_model=list[TopupRequestResponse])
async def get_my_topup_requests(
    current_user: dict = Depends(get_user_from_token),
    db: AsyncSession = Depends(get_db),
):
    """List all topup requests for current user's tenant."""
    tenant_id = uuid.UUID(current_user["tenant_id"])
    result = await db.execute(
        select(WalletTopupRequest)
        .where(WalletTopupRequest.tenant_id == tenant_id)
        .order_by(WalletTopupRequest.created_at.desc())
    )
    reqs = result.scalars().all()
    # Attach user names
    items = []
    for req in reqs:
        user_res = await db.execute(select(User.full_name).where(User.user_id == req.requested_by_user_id))
        user_name = user_res.scalar_one_or_none()
        items.append(TopupRequestResponse(
            request_id=req.request_id,
            tenant_id=req.tenant_id,
            requested_by_user_id=req.requested_by_user_id,
            requested_by_name=user_name,
            amount_inr=req.amount_inr,
            payment_method=req.payment_method,
            transaction_ref=req.transaction_ref,
            remarks=req.remarks,
            status=req.status,
            admin_notes=req.admin_notes,
            approved_by_user_id=req.approved_by_user_id,
            approved_at=req.approved_at,
            created_at=req.created_at,
        ))
    return items


# ── CLIENT: Request topup ───────────────────────────────────────────
@router.post("/topup/request", response_model=TopupRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_topup_request(
    payload: TopupRequestCreate,
    current_user: dict = Depends(get_user_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Client requests a wallet topup via offline payment."""
    valid_methods = {"cash", "upi", "bank_transfer", "cheque", "other"}
    if payload.payment_method not in valid_methods:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment_method. Must be one of: {sorted(valid_methods)}",
        )

    req = WalletTopupRequest(
        tenant_id=uuid.UUID(current_user["tenant_id"]),
        requested_by_user_id=uuid.UUID(current_user["sub"]),
        amount_inr=payload.amount_inr,
        payment_method=payload.payment_method,
        transaction_ref=payload.transaction_ref,
        remarks=payload.remarks,
        status="pending",
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return TopupRequestResponse(
        request_id=req.request_id,
        tenant_id=req.tenant_id,
        requested_by_user_id=req.requested_by_user_id,
        requested_by_name=current_user.get("full_name"),
        amount_inr=req.amount_inr,
        payment_method=req.payment_method,
        transaction_ref=req.transaction_ref,
        remarks=req.remarks,
        status=req.status,
        admin_notes=None,
        approved_by_user_id=None,
        approved_at=None,
        created_at=req.created_at,
    )


# ── CLIENT: My transactions ──────────────────────────────────────────
@router.get("/transactions/me", response_model=list[WalletTransactionResponse])
async def get_my_transactions(
    limit: int = 50,
    current_user: dict = Depends(get_user_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Get wallet transaction history for current tenant."""
    tenant_id = uuid.UUID(current_user["tenant_id"])
    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.tenant_id == tenant_id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


# ════════════════════════════════════════════════════════════════════════
# ADMIN ROUTES
# ════════════════════════════════════════════════════════════════════════


async def _get_or_create_wallet(db: AsyncSession, tenant_id: uuid.UUID) -> Wallet:
    result = await db.execute(select(Wallet).where(Wallet.tenant_id == tenant_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(tenant_id=tenant_id, balance_inr=Decimal("0.00"), total_loaded_inr=Decimal("0.00"))
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)
    return wallet


async def _attach_user_name(db: AsyncSession, user_id: uuid.UUID) -> str | None:
    res = await db.execute(select(User.full_name).where(User.user_id == user_id))
    return res.scalar_one_or_none()


def _build_topup_response(db: AsyncSession, req: WalletTopupRequest) -> TopupRequestResponse:
    # Fetched eagerly in callers
    return TopupRequestResponse.model_validate(req)


# ── ADMIN: List all topup requests ──────────────────────────────────
@router.get("/admin/topup", response_model=TopupRequestListResponse)
async def admin_list_topup_requests(
    status_filter: str | None = None,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list all topup requests, optionally filter by status."""
    tenant_id = uuid.UUID(current_user["tenant_id"])

    query = (
        select(WalletTopupRequest)
        .order_by(WalletTopupRequest.created_at.desc())
    )
    if status_filter:
        query = query.where(WalletTopupRequest.status == status_filter)

    # Non-super_admin can only see their own tenant
    if current_user["role"] != "super_admin":
        query = query.where(WalletTopupRequest.tenant_id == tenant_id)

    result = await db.execute(query)
    reqs = result.scalars().all()

    pending_res = await db.execute(
        select(func.count(WalletTopupRequest.request_id))
        .where(WalletTopupRequest.status == "pending")
    )
    pending_count = pending_res.scalar() or 0

    items = []
    for req in reqs:
        user_name = await _attach_user_name(db, req.requested_by_user_id)
        items.append(TopupRequestResponse(
            request_id=req.request_id,
            tenant_id=req.tenant_id,
            requested_by_user_id=req.requested_by_user_id,
            requested_by_name=user_name,
            amount_inr=req.amount_inr,
            payment_method=req.payment_method,
            transaction_ref=req.transaction_ref,
            remarks=req.remarks,
            status=req.status,
            admin_notes=req.admin_notes,
            approved_by_user_id=req.approved_by_user_id,
            approved_at=req.approved_at,
            created_at=req.created_at,
        ))

    return TopupRequestListResponse(items=items, total=len(items), pending_count=pending_count)


# ── ADMIN: Approve topup ─────────────────────────────────────────────
@router.post("/admin/topup/{request_id}/approve", response_model=TopupRequestResponse)
async def admin_approve_topup(
    request_id: uuid.UUID,
    payload: TopupApproveRequest,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Admin approves a topup request and adds amount to wallet."""
    result = await db.execute(
        select(WalletTopupRequest).where(WalletTopupRequest.request_id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Topup request not found")
    if req.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve: request is already '{req.status}'",
        )

    # Non-super_admin tenant isolation
    if current_user["role"] != "super_admin":
        if req.tenant_id != uuid.UUID(current_user["tenant_id"]):
            raise HTTPException(status_code=403, detail="Cannot approve for another tenant")

    # Update request
    req.status = "approved"
    req.approved_by_user_id = uuid.UUID(current_user["sub"])
    req.approved_at = datetime.now(timezone.utc)
    if payload.admin_notes:
        req.admin_notes = payload.admin_notes

    # Credit wallet
    wallet = await _get_or_create_wallet(db, req.tenant_id)
    balance_before = wallet.balance_inr
    new_balance = wallet.balance_inr + req.amount_inr
    wallet.balance_inr = new_balance
    wallet.total_loaded_inr = wallet.total_loaded_inr + req.amount_inr

    # Record transaction
    txn = WalletTransaction(
        tenant_id=req.tenant_id,
        amount_inr=req.amount_inr,
        type="credit",
        source="topup",
        reference_id=req.request_id,
        reference_type="wallet_topup_request",
        description=(
            f"Top-up approved ({req.payment_method})"
            + (f" | Ref: {req.transaction_ref}" if req.transaction_ref else "")
        ),
        balance_before_inr=balance_before,
        balance_after_inr=new_balance,
    )
    db.add(txn)
    await db.commit()
    await db.refresh(req)

    user_name = await _attach_user_name(db, req.requested_by_user_id)
    return TopupRequestResponse(
        request_id=req.request_id,
        tenant_id=req.tenant_id,
        requested_by_user_id=req.requested_by_user_id,
        requested_by_name=user_name,
        amount_inr=req.amount_inr,
        payment_method=req.payment_method,
        transaction_ref=req.transaction_ref,
        remarks=req.remarks,
        status=req.status,
        admin_notes=req.admin_notes,
        approved_by_user_id=req.approved_by_user_id,
        approved_at=req.approved_at,
        created_at=req.created_at,
    )


# ── ADMIN: Reject topup ──────────────────────────────────────────────
@router.post("/admin/topup/{request_id}/reject", response_model=TopupRequestResponse)
async def admin_reject_topup(
    request_id: uuid.UUID,
    payload: TopupRejectRequest,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Admin rejects a topup request with optional reason."""
    result = await db.execute(
        select(WalletTopupRequest).where(WalletTopupRequest.request_id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Topup request not found")
    if req.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject: request is already '{req.status}'",
        )

    if current_user["role"] != "super_admin":
        if req.tenant_id != uuid.UUID(current_user["tenant_id"]):
            raise HTTPException(status_code=403, detail="Cannot reject for another tenant")

    req.status = "rejected"
    req.admin_notes = payload.admin_notes
    await db.commit()
    await db.refresh(req)

    user_name = await _attach_user_name(db, req.requested_by_user_id)
    return TopupRequestResponse(
        request_id=req.request_id,
        tenant_id=req.tenant_id,
        requested_by_user_id=req.requested_by_user_id,
        requested_by_name=user_name,
        amount_inr=req.amount_inr,
        payment_method=req.payment_method,
        transaction_ref=req.transaction_ref,
        remarks=req.remarks,
        status=req.status,
        admin_notes=req.admin_notes,
        approved_by_user_id=req.approved_by_user_id,
        approved_at=req.approved_at,
        created_at=req.created_at,
    )


# ── ADMIN: Get any tenant's wallet ───────────────────────────────────
@router.get("/admin/{tenant_id}/wallet", response_model=WalletResponse)
async def admin_get_tenant_wallet(
    tenant_id: uuid.UUID,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Admin: view a specific tenant's wallet."""
    if current_user["role"] != "super_admin":
        if uuid.UUID(current_user["tenant_id"]) != tenant_id:
            raise HTTPException(status_code=403, detail="Cannot view another tenant's wallet")
    wallet = await _get_or_create_wallet(db, tenant_id)
    return wallet
