"""
LETESE● Invoices Endpoints
POST   /api/v1/invoices              — Create invoice
GET    /api/v1/invoices              — List invoices
GET    /api/v1/invoices/{id}          — Invoice detail
POST   /api/v1/invoices/{id}/send     — Send to client via WhatsApp + Email
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from pydantic import BaseModel
from datetime import date, timedelta
from typing import Optional
from decimal import Decimal
from app.db.database import get_db
from app.services.auth_service import auth_service

router = APIRouter()


def get_user(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    return auth_service.verify_token(authorization[7:])


class InvoiceLineItem(BaseModel):
    description: str
    amount_inr: float


class InvoiceCreate(BaseModel):
    case_id: Optional[UUID] = None
    client_name: str
    client_gstin: Optional[str] = None
    client_email: Optional[str] = None
    line_items: list[InvoiceLineItem]
    due_date: date
    notes: Optional[str] = None


@router.post("")
async def create_invoice(
    body: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user),
):
    """Create invoice. Computes GST @ 18%, generates Razorpay payment link."""
    from app.models.models import Invoice, Case
    import uuid

    subtotal = sum(Decimal(str(item.amount_inr)) for item in body.line_items)
    gst_pct = Decimal("18.0")
    gst_inr = subtotal * gst_pct / Decimal("100")
    total = subtotal + gst_inr

    # Generate invoice number: INV-YYYY-NNNN
    year = date.today().year
    result = await db.execute(
        select(Invoice).where(
            Invoice.tenant_id == UUID(user["tenant_id"]),
        ).order_by(Invoice.created_at.desc())
    )
    last_inv = result.scalar_one_or_none()
    seq = 1
    if last_inv and str(last_inv.invoice_number).startswith(f"INV-{year}"):
        seq = int(last_inv.invoice_number.split("-")[-1]) + 1
    invoice_number = f"INV-{year}-{seq:04d}"

    invoice = Invoice(
        tenant_id=UUID(user["tenant_id"]),
        case_id=body.case_id,
        client_name=body.client_name,
        client_gstin=body.client_gstin,
        invoice_number=invoice_number,
        due_date=body.due_date,
        subtotal_inr=subtotal,
        gst_pct=gst_pct,
        gst_inr=gst_inr,
        total_inr=total,
        notes=body.notes,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)

    # Generate PDF and upload to S3
    from app.services.invoice_pdf import InvoicePDFService

    pdf_service = InvoicePDFService()
    s3_key = f"letese-tenant-docs/{user['tenant_id']}/invoices/{invoice.invoice_id}.pdf"

    line_items = [
        {"description": item.description, "amount_inr": item.amount_inr}
        for item in body.line_items
    ]

    pdf_url = await pdf_service.generate_and_upload(
        {
            "invoice_number": invoice.invoice_number,
            "issue_date": str(invoice.issue_date),
            "due_date": str(invoice.due_date),
            "client_name": invoice.client_name,
            "client_gstin": invoice.client_gstin or "",
            "line_items": line_items,
            "subtotal_inr": float(invoice.subtotal_inr),
            "gst_pct": float(invoice.gst_pct),
            "gst_inr": float(invoice.gst_inr),
            "total_inr": float(invoice.total_inr),
            "paid_inr": float(invoice.paid_inr or 0),
            "payment_link": invoice.payment_link or "#",
        },
        s3_key,
    )

    invoice.s3_pdf_key = s3_key
    await db.commit()

    # TODO: Create Razorpay payment link

    return {
        "invoice_id": str(invoice.invoice_id),
        "invoice_number": invoice.invoice_number,
        "total_inr": float(invoice.total_inr),
        "gst_inr": float(invoice.gst_inr),
        "subtotal_inr": float(invoice.subtotal_inr),
        "due_date": str(invoice.due_date),
        "status": invoice.status,
        "payment_link": invoice.payment_link,
        "pdf_url": pdf_url,
    }


@router.get("")
async def list_invoices(
    status: Optional[str] = None,
    case_id: Optional[UUID] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user),
):
    from app.models.models import Invoice

    query = select(Invoice).where(Invoice.tenant_id == UUID(user["tenant_id"]))
    if status:
        query = query.where(Invoice.status == status)
    if case_id:
        query = query.where(Invoice.case_id == case_id)
    query = query.order_by(Invoice.created_at.desc()).limit(limit)

    result = await db.execute(query)
    invoices = result.scalars().all()

    return {
        "invoices": [
            {
                "invoice_id": str(i.invoice_id),
                "invoice_number": i.invoice_number,
                "client_name": i.client_name,
                "total_inr": float(i.total_inr),
                "paid_inr": float(i.paid_inr),
                "status": i.status,
                "due_date": str(i.due_date),
                "created_at": i.created_at.isoformat(),
            }
            for i in invoices
        ]
    }


@router.post("/{invoice_id}/send")
async def send_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user),
):
    """Send invoice to client via WhatsApp + Email."""
    from app.models.models import Invoice
    from app.services.kafka_producer import publish_communication_dispatch

    invoice = await db.get(Invoice, invoice_id)
    if not invoice or str(invoice.tenant_id) != user["tenant_id"]:
        raise HTTPException(404, "Invoice not found")

    # Get case for phone number
    case = await db.get(invoice.case_id) if invoice.case_id else None

    await publish_communication_dispatch({
        "case_id": str(invoice.case_id) if invoice.case_id else None,
        "tenant_id": user["tenant_id"],
        "message_type": "payment_reminder",
        "channel": "whatsapp",
        "recipient_phone": case.client_phone if case else None,
        "recipient_email": invoice.client_gstin,
        "template_params": {
            "firm_name": "LETESE● Legal",
            "amount": str(invoice.total_inr),
            "due_date": str(invoice.due_date),
            "case_title": case.case_title if case else "Legal Services",
            "payment_link": invoice.payment_link or "#",
        },
        "priority": "high",
    })

    invoice.status = "sent"
    await db.commit()

    return {"message": "Invoice dispatch queued", "invoice_id": str(invoice_id)}


@router.get("/{invoice_id}/pdf")
async def get_invoice_pdf(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_user),
):
    """Return a presigned S3 URL (or local path) to download the invoice PDF."""
    from app.models.models import Invoice
    from app.services.invoice_pdf import InvoicePDFService

    invoice = await db.get(Invoice, invoice_id)
    if not invoice or str(invoice.tenant_id) != user["tenant_id"]:
        raise HTTPException(404, "Invoice not found")

    s3_key = invoice.s3_pdf_key
    if not s3_key:
        raise HTTPException(404, "PDF not yet generated for this invoice")

    pdf_service = InvoicePDFService()

    # Local dev fallback
    if s3_key.startswith("/tmp/"):
        return {"download_url": s3_key, "local": True}

    # Return presigned S3 URL (valid 1 hour)
    presigned_url = pdf_service.generate_presigned_url(s3_key, expires_in=3600)
    return {"download_url": presigned_url, "local": False}

