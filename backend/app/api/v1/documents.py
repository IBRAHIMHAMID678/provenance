import os
import re
from pathlib import Path
from typing import List, Optional
import fitz
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Document, Workspace, ProcessingJob, ExtractionRun, ExtractedField, FieldEvidence, ValidationResult, DocumentPage
from app.services.storage import storage_service
from app.services.classification import document_classifier
from app.services.pdf_inspector import pdf_inspector
from app.workers.queue import background_worker
from app.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    workspace_slug: str = Form("default"),
    auto_process: bool = Form(True),
    db: Session = Depends(get_db)
):
    # Phase 6 Security Validation: Filename sanitization & path traversal defense
    raw_filename = file.filename or "uploaded.pdf"
    # Strip directory traversal characters, null bytes, and path separators
    clean_filename = Path(raw_filename.replace("\\", "/")).name
    clean_filename = re.sub(r'[\x00/\\:*?"<>|]', '_', clean_filename)
    if not clean_filename or clean_filename.strip() in (".", ".."):
        clean_filename = "uploaded.pdf"
    orig_name = clean_filename

    # Validation 1: Extension & MIME
    ext = os.path.splitext(orig_name)[1].lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF documents are supported.")

    if file.content_type:
        mime = file.content_type.lower().strip()
        allowed_mimes = ("application/pdf", "application/x-pdf", "application/octet-stream", "binary/octet-stream")
        if mime not in allowed_mimes:
            raise HTTPException(status_code=400, detail=f"Invalid MIME type: {file.content_type}. Only application/pdf is accepted.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")
    if len(content) > (settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024):
        raise HTTPException(status_code=400, detail=f"File exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB.")

    # Validation 2: PDF Header Magic Bytes (%PDF-)
    if not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Malformed PDF header; file does not match PDF signature.")

    # Validation 3: PDF Structure, Encryption, and Page Limit
    try:
        pdf_doc = fitz.open(stream=content, filetype="pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Corrupted or unreadable PDF: {str(e)}")

    try:
        if pdf_doc.is_encrypted or pdf_doc.needs_pass:
            raise HTTPException(status_code=400, detail="Encrypted or password-protected PDFs are not supported.")
        
        page_count = len(pdf_doc)
        if page_count > settings.MAX_PAGE_COUNT:
            raise HTTPException(
                status_code=400,
                detail=f"Document exceeds maximum page limit of {settings.MAX_PAGE_COUNT} pages (found {page_count})."
            )
    finally:
        pdf_doc.close()

    # Workspace resolution
    ws = db.query(Workspace).filter_by(slug=workspace_slug).first()
    if not ws:
        ws = Workspace(name="Default Workspace", slug="default")
        db.add(ws)
        db.flush()

    # Save to storage on D:
    storage_path, checksum, file_size = storage_service.save_upload(content, orig_name)

    # Duplicate detection
    existing_doc = db.query(Document).filter_by(checksum=checksum, workspace_id=ws.id).first()
    is_duplicate = existing_doc is not None

    # Create document record
    doc = Document(
        workspace_id=ws.id,
        filename=os.path.basename(storage_path),
        original_filename=orig_name,
        checksum=checksum,
        file_size_bytes=file_size,
        storage_path=storage_path,
        is_duplicate=is_duplicate,
        status="uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Initial Quick Inspection
    try:
        inspection = pdf_inspector.inspect_document(doc.id, storage_path)
        doc.page_count = inspection.total_pages
        doc.quality_category = inspection.overall_quality

        # Classify document type from page 1 text
        p1_text = inspection.pages[0].extracted_text_preview if inspection.pages else ""
        doc_type, conf = document_classifier.classify_text(p1_text)
        doc.document_type = doc_type

        # Save pages
        for p in inspection.pages:
            dp = DocumentPage(
                document_id=doc.id,
                page_number=p.page_number,
                width=p.width,
                height=p.height,
                rotation=p.rotation,
                has_selectable_text=p.has_selectable_text,
                char_count=p.char_count,
                word_count=p.word_count,
                text_density=p.text_density,
                image_count=p.image_count,
                image_area_ratio=p.image_area_ratio,
                estimated_dpi=p.estimated_dpi,
                quality_grade=p.quality_grade,
                recommended_engine=p.recommended_engine,
                extracted_text=p.extracted_text_preview,
                rendered_image_path=p.rendered_image_path
            )
            db.add(dp)
        db.commit()
    except Exception as e:
        doc.status = "failed"
        doc.status_message = f"Inspection failed: {str(e)}"
        db.commit()

    # Auto queue processing if requested
    if auto_process:
        job = ProcessingJob(
            document_id=doc.id,
            job_type="full_extraction",
            status="pending",
            method="hybrid"
        )
        db.add(job)
        doc.status = "queued"
        db.commit()
        db.refresh(job)
        background_worker.enqueue(job.id)

    return {
        "document_id": doc.id,
        "original_filename": doc.original_filename,
        "document_type": doc.document_type,
        "page_count": doc.page_count,
        "quality_category": doc.quality_category,
        "is_synthetic": getattr(doc, "is_synthetic", False),
        "status": doc.status,
        "is_duplicate": is_duplicate
    }

@router.get("")
def list_documents(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if search:
        query = query.filter(Document.original_filename.ilike(f"%{search}%"))
    if status and status != "all":
        query = query.filter(Document.status == status)
    if document_type and document_type != "all":
        query = query.filter(Document.document_type == document_type)

    total = query.count()
    docs = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for d in docs:
        items.append({
            "id": d.id,
            "filename": d.original_filename,
            "document_type": d.document_type,
            "page_count": d.page_count,
            "file_size_bytes": d.file_size_bytes,
            "quality_category": d.quality_category,
            "status": d.status,
            "status_message": d.status_message,
            "is_duplicate": d.is_duplicate,
            "is_synthetic": getattr(d, "is_synthetic", False),
            "created_at": d.created_at.isoformat()
        })

    return {"total": total, "items": items}

@router.get("/{doc_id}")
def get_document_detail(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter_by(id=doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Latest extraction run
    latest_run = db.query(ExtractionRun).filter_by(document_id=doc.id).order_by(ExtractionRun.created_at.desc()).first()
    fields_data = []
    if latest_run:
        fields = db.query(ExtractedField).filter_by(extraction_run_id=latest_run.id).all()
        for f in fields:
            ev = f.evidence
            fields_data.append({
                "id": f.id,
                "field_name": f.field_name,
                "raw_value": f.raw_value,
                "normalized_value": f.normalized_value,
                "data_type": f.data_type,
                "state": f.state,
                "confidence_score": f.confidence_score,
                "is_critical": f.is_critical,
                "needs_review": f.needs_review,
                "evidence_located": getattr(f, "evidence_located", True),
                "confidence_signals": getattr(f, "confidence_signals", {}) or {},
                "evidence": {
                    "page_number": ev.page_number,
                    "evidence_text": ev.evidence_text,
                    "bbox": [ev.bbox_x0, ev.bbox_y0, ev.bbox_x1, ev.bbox_y1] if ev and ev.bbox_x0 is not None else None,
                    "char_confidence": ev.char_confidence if ev else None,
                    "is_located": getattr(ev, "is_located", True) if ev else False,
                    "quads": getattr(ev, "quads", None) if ev else None
                } if ev else None
            })

    # Validation results
    val_records = db.query(ValidationResult).filter_by(document_id=doc.id).all()
    validation_data = [
        {
            "rule_id": vr.rule_id,
            "passed": vr.passed,
            "severity": vr.severity,
            "explanation": vr.explanation,
            "affected_fields": vr.affected_fields
        } for vr in val_records
    ]

    # Pages
    pages = db.query(DocumentPage).filter_by(document_id=doc.id).order_by(DocumentPage.page_number).all()
    pages_data = [
        {
            "page_number": p.page_number,
            "width": p.width,
            "height": p.height,
            "has_selectable_text": p.has_selectable_text,
            "char_count": p.char_count,
            "quality_grade": p.quality_grade,
            "recommended_engine": p.recommended_engine,
            "image_url": f"/api/documents/{doc.id}/rendered-page/{p.page_number}"
        } for p in pages
    ]

    return {
        "id": doc.id,
        "original_filename": doc.original_filename,
        "checksum": doc.checksum,
        "file_size_bytes": doc.file_size_bytes,
        "page_count": doc.page_count,
        "document_type": doc.document_type,
        "quality_category": doc.quality_category,
        "is_synthetic": getattr(doc, "is_synthetic", False),
        "status": doc.status,
        "status_message": doc.status_message,
        "created_at": doc.created_at.isoformat(),
        "latest_extraction": {
            "method_id": latest_run.method_id,
            "duration_ms": latest_run.duration_ms,
            "cost_usd": latest_run.calculated_cost_usd,
            "status": latest_run.status,
            "is_mock": bool(latest_run.raw_response.get("metadata", {}).get("is_mock", False)) if latest_run and latest_run.raw_response and isinstance(latest_run.raw_response, dict) else False
        } if latest_run else None,
        "fields": fields_data,
        "validations": validation_data,
        "pages": pages_data
    }

@router.get("/{doc_id}/file")
def get_document_raw_pdf(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter_by(id=doc_id).first()
    if not doc or not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="PDF file not found on storage.")
    
    # Path traversal boundary verification
    real_path = Path(doc.storage_path).resolve()
    storage_root = Path(settings.STORAGE_ROOT).resolve()
    if not str(real_path).startswith(str(storage_root)):
        raise HTTPException(status_code=403, detail="Access denied: Path outside storage root.")

    return FileResponse(
        path=doc.storage_path,
        media_type="application/pdf",
        filename=doc.original_filename
    )

@router.get("/{doc_id}/rendered-page/{page_number}")
def get_rendered_page(doc_id: str, page_number: int, db: Session = Depends(get_db)):
    page = db.query(DocumentPage).filter_by(document_id=doc_id, page_number=page_number).first()
    if not page or not page.rendered_image_path or not os.path.exists(page.rendered_image_path):
        raise HTTPException(status_code=404, detail="Page render image not found.")

    # Path traversal boundary verification
    real_path = Path(page.rendered_image_path).resolve()
    storage_root = Path(settings.STORAGE_ROOT).resolve()
    if not str(real_path).startswith(str(storage_root)):
        raise HTTPException(status_code=403, detail="Access denied: Path outside storage root.")

    return FileResponse(
        path=page.rendered_image_path,
        media_type="image/png"
    )

@router.post("/{doc_id}/process")
def trigger_process_document(
    doc_id: str,
    method: str = Query("hybrid"),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter_by(id=doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    job = ProcessingJob(
        document_id=doc.id,
        job_type="full_extraction",
        status="pending",
        method=method
    )
    doc.status = "queued"
    db.add(job)
    db.commit()
    db.refresh(job)

    background_worker.enqueue(job.id)
    return {"message": "Processing job queued", "job_id": job.id, "method": method}

@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter_by(id=doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    storage_service.delete_document_files(doc.id, doc.storage_path)
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully", "id": doc_id}

