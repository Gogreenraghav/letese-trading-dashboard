"""
LETESE● Documents Endpoints
POST   /api/v1/documents/upload              — Upload file (multipart)
GET    /api/v1/documents/{id}                — Get document metadata
GET    /api/v1/documents/{id}/download-url   — S3 presigned download URL
POST   /api/v1/documents/{id}/translate      — Translate document
GET    /api/v1/documents/{id}/translation-status
POST   /api/v1/drafts/generate                — AI Draft (SSE stream)
POST   /api/v1/compliance/check              — Validate document
GET    /api/v1/compliance/checklists/{court} — Get court checklist
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import uuid
from app.db.database import get_db
from app.services.auth_service import auth_service

router = APIRouter()


async def get_current_user(authorization: str = Header(...)) -> dict:
    from app.services.auth_service import auth_service
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    try:
        return auth_service.verify_token(authorization[7:])
    except ValueError as e:
        raise HTTPException(401, str(e))


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    case_id: UUID | None = Form(None),
    doc_type: str = Form(...),
    language: str = Form("en"),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    Upload a document to S3, store metadata in PostgreSQL.
    Supported types: pdf, docx, jpg, png, mp3
    """
    from app.models.models import Document, Tenant
    from app.core.config import settings
    import boto3

    allowed_types = {"pdf", "docx", "jpg", "png", "mp3"}
    content_type_map = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "image/jpeg": "jpg",
        "image/png": "png",
        "audio/mpeg": "mp3",
    }

    file_ext = content_type_map.get(file.content_type, "pdf")
    if file_ext not in allowed_types:
        raise HTTPException(400, f"File type not allowed: {file_ext}")

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Check storage limit
    tenant = await db.get(Tenant, UUID(user["tenant_id"]))
    plan_limits_gb = {"basic": 5, "professional": 25, "elite": 100, "enterprise": 1000}
    limit_gb = plan_limits_gb.get(tenant.plan, 5)
    used_gb = tenant.storage_used_bytes / (1024**3)

    if used_gb >= limit_gb:
        raise HTTPException(402, {"upgrade_required": True, "message": "Storage limit reached"})

    # Upload to S3
    s3_key = f"letese-tenant-docs/{user['tenant_id']}/raw/{uuid.uuid4()}.{file_ext}"
    try:
        s3 = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        s3.put_object(Bucket=settings.AWS_S3_BUCKET_DOCS, Key=s3_key, Body=content)
        s3_url = f"https://{settings.AWS_S3_BUCKET_DOCS}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
    except Exception as e:
        # Dev fallback: skip S3
        s3_key = f"dev/{s3_key}"
        s3_url = None

    doc = Document(
        case_id=case_id,
        tenant_id=UUID(user["tenant_id"]),
        uploaded_by=UUID(user["sub"]),
        name=file.filename,
        doc_type=doc_type,
        file_format=file_ext,
        s3_bucket=settings.AWS_S3_BUCKET_DOCS,
        s3_key=s3_key,
        s3_url=s3_url,
        file_size_bytes=file_size,
        language=language,
    )
    db.add(doc)
    tenant.storage_used_bytes += file_size
    await db.commit()
    await db.refresh(doc)

    return {
        "doc_id": str(doc.doc_id),
        "name": doc.name,
        "file_format": doc.file_format,
        "file_size_bytes": doc.file_size_bytes,
        "s3_url": s3_url,
        "created_at": doc.created_at.isoformat(),
    }


@router.get("/{doc_id}/download-url")
async def get_download_url(
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Generate S3 presigned URL (1 hour expiry)."""
    import boto3
    from app.core.config import settings
    from app.models.models import Document

    doc = await db.get(Document, doc_id)
    if not doc or str(doc.tenant_id) != user["tenant_id"]:
        raise HTTPException(404, "Document not found")

    try:
        s3 = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": doc.s3_bucket, "Key": doc.s3_key},
            ExpiresIn=3600,
        )
    except Exception:
        url = doc.s3_url or "/dev/null"

    return {"presigned_url": url, "expires_in": 3600}


@router.post("/{doc_id}/translate")
async def translate_document(
    doc_id: UUID,
    source_language: str = "hi",
    target_language: str = "en",
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    Translate document. Elite/Enterprise plan required.
    1. Extract text from PDF via S3
    2. Translate using IndicTrans2 (Punjabi/Hindi) or Google Translate
    3. Calculate accuracy
    4. Store translated document
    """
    from app.models.models import Document
    from app.services.translation_service import TranslationService, LANGUAGE_NAMES

    if user["plan"] not in ("elite", "enterprise"):
        raise HTTPException(403, "Translation requires Elite or Enterprise plan")

    doc = await db.get(Document, doc_id)
    if not doc or str(doc.tenant_id) != user["tenant_id"]:
        raise HTTPException(404, "Document not found")

    # Extract text
    service = TranslationService()
    text = await service.extract_text_from_pdf(doc.s3_key)

    if not text:
        raise HTTPException(400, "Could not extract text from document. Is it a scanned PDF?")

    # Translate
    result = await service.translate(text, source_language, target_language)

    # Create translated document record
    translated_doc = Document(
        case_id=doc.case_id,
        tenant_id=UUID(user["tenant_id"]),
        uploaded_by=UUID(user["sub"]),
        name=f"[Translated → {LANGUAGE_NAMES.get(target_language, target_language)}] {doc.name}",
        doc_type="translated",
        file_format=doc.file_format,
        s3_bucket=doc.s3_bucket,
        s3_key=f"dev/translated/{uuid.uuid4()}.txt",
        file_size_bytes=len(result["translated_text"].encode()),
        language=target_language,
        translation_of=doc_id,
        accuracy_pct=result["accuracy_pct"],
        is_filing_ready=result["accuracy_pct"] >= 90,
    )
    db.add(translated_doc)
    await db.commit()
    await db.refresh(translated_doc)

    readiness = service.get_filing_readiness(result["accuracy_pct"])

    return {
        "translated_doc_id": str(translated_doc.doc_id),
        "accuracy_pct": result["accuracy_pct"],
        "bleu_score": result["bleu_score"],
        "engine": result["engine"],
        "filing_readiness": readiness,
        "translated_preview": result["translated_text"][:200] + "...",
    }


@router.post("/compliance/check")
async def compliance_check(
    document_text: str,
    court_code: str,
    petition_type: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Validate a document against court checklist rules. Elite/Enterprise."""
    if user["plan"] not in ("elite", "enterprise"):
        raise HTTPException(403, "Compliance check requires Elite or Enterprise plan")

    from app.aipots.compliance import AIPOTCompliance
    import asyncio
    validator = AIPOTCompliance.__new__(AIPOTCompliance)
    result = await validator.validate_document(document_text, court_code, petition_type, user["tenant_id"])

    return result


@router.get("/compliance/checklists/{court_code}")
async def get_checklist(
    court_code: str,
    petition_type: str = "CWP",
    db: AsyncSession = Depends(get_db),
):
    """Get active compliance checklist for a court + petition type."""
    from app.models.models import CourtChecklist
    from sqlalchemy import select

    result = await db.execute(
        select(CourtChecklist).where(
            CourtChecklist.court_code == court_code,
            CourtChecklist.petition_type == petition_type,
            CourtChecklist.is_active == True,
        )
    )
    checklist = result.scalar_one_or_none()
    if not checklist:
        # Return default checklist
        return {
            "court_code": court_code,
            "petition_type": petition_type,
            "rules": [
                {"rule_id": "R001", "description": "Petitioner/Appellant designation", "severity": "CRITICAL"},
                {"rule_id": "R002", "description": "Respondent/Defendant designation", "severity": "CRITICAL"},
                {"rule_id": "R003", "description": "Prayer clause", "severity": "CRITICAL"},
                {"rule_id": "R004", "description": "Verification clause", "severity": "CRITICAL"},
                {"rule_id": "R005", "description": "Minimum 500 words", "severity": "CRITICAL"},
                {"rule_id": "R006", "description": "List of dates", "severity": "WARNING"},
                {"rule_id": "R007", "description": "Court fee mentioned", "severity": "WARNING"},
                {"rule_id": "R008", "description": "Paragraph numbering", "severity": "WARNING"},
            ]
        }
    return {"court_code": court_code, "petition_type": petition_type, "rules": checklist.rules}


@router.post("/analyze-judgment")
async def analyze_judgment(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    Post-Judgment Remedy Analysis — Enterprise plan only.
    Analyzes closed case judgment, identifies available remedies.
    """
    if user.get("plan") != "enterprise":
        raise HTTPException(
            status_code=403,
            detail="Post-judgment analysis requires Enterprise plan",
        )

    from app.models.models import Case, Document
    from app.services.judgment_analysis import JudgmentAnalysisService

    case = await db.get(Case, case_id)
    if not case or str(case.tenant_id) != user["tenant_id"]:
        raise HTTPException(status_code=404, detail="Case not found")

    # Get the latest order/judgment document
    result = await db.execute(
        select(Document).where(
            Document.case_id == case_id,
            Document.doc_type.in_(["order", "judgment"]),
        ).order_by(Document.created_at.desc())
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(
            status_code=400,
            detail="No judgment/order document found in case. Upload judgment PDF first.",
        )

    service = JudgmentAnalysisService()
    analysis = await service.analyze_judgment(
        judgment_text=doc.s3_key,  # Would fetch + extract text from S3; placeholder here
        case_id=str(case_id),
        tenant_id=user["tenant_id"],
    )

    return analysis
