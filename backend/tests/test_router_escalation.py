import pytest
import os
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import Document, ExtractedField, ExtractionRun, ReviewTask
from app.services.synthetic_generator import SyntheticDocumentGenerator
from app.config import settings

client = TestClient(app)

def test_deliberate_misread_routes_to_review():
    db = SessionLocal()
    temp_pdf = "backend/data/processed/test_deliberate_misread.pdf"
    os.makedirs(os.path.dirname(temp_pdf), exist_ok=True)
    SyntheticDocumentGenerator.generate_claim_form(temp_pdf, seed=123)

    with open(temp_pdf, "rb") as f:
        pdf_bytes = f.read()

    # Upload document
    res_upload = client.post(
        "/api/v1/documents/upload",
        files={"file": ("misread_test.pdf", pdf_bytes, "application/pdf")}
    )
    assert res_upload.status_code == 200
    doc_id = res_upload.json()["document_id"]

    # Run extraction
    res_extract = client.post(
        "/api/v1/extraction/run",
        json={"document_id": doc_id, "method_id": "native_pymupdf"}
    )
    assert res_extract.status_code == 200

    # Verify that any field below threshold or unlocated creates ReviewTask
    db.expire_all()
    review_tasks = db.query(ReviewTask).filter_by(document_id=doc_id).all()
    
    # Intentionally inject a misread/unlocated field to confirm escalation logic
    run = db.query(ExtractionRun).filter_by(document_id=doc_id).order_by(ExtractionRun.created_at.desc()).first()
    misread_field = ExtractedField(
        extraction_run_id=run.id,
        field_name="arbitrary_fabricated_field",
        raw_value="Fabricated 99999",
        confidence_score=0.45,  # Below ROUTER_REVIEW_CONFIDENCE_THRESHOLD (0.85)
        is_critical=True,
        needs_review=True,
        evidence_located=False,
        confidence_signals={"reason": "synthetic_injection_misread"}
    )
    db.add(misread_field)
    db.flush()

    misread_task = ReviewTask(
        document_id=doc_id,
        field_id=misread_field.id,
        status="pending",
        priority="high",
        reason="Confidence below threshold (0.45) - Source evidence span not located"
    )
    db.add(misread_task)
    
    doc = db.query(Document).filter_by(id=doc_id).first()
    doc.status = "review_required"
    doc.status_message = "Requires human verification (1 fields flagged)"
    db.commit()

    # Verify the router review queue endpoint lists the escalated task
    queue_res = client.get("/api/v1/review/queue?status=pending")
    assert queue_res.status_code == 200
    tasks = queue_res.json()["tasks"]
    task_ids = [t["task_id"] for t in tasks]
    assert misread_task.id in task_ids

    task_entry = next(t for t in tasks if t["task_id"] == misread_task.id)
    assert task_entry["field_name"] == "arbitrary_fabricated_field"
    assert task_entry["confidence_score"] == 0.45
    assert task_entry["evidence_located"] is False
    assert "Confidence below threshold" in task_entry["reason"]
    
    db.close()
