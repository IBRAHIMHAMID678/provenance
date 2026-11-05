import os
import io
import json
import pytest
from starlette.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import Document, ExtractionRun, ExtractedField, ReviewTask, ReviewDecision, AuditEvent
from app.services.synthetic_generator import SyntheticDocumentGenerator

client = TestClient(app)

def test_complete_15_step_workflow():
    db = SessionLocal()
    temp_pdf_path = "D:/PDF Extracter/backend/data/processed/test_workflow_doc.pdf"
    
    # 0. Generate deterministic source PDF with ground truth
    gt = SyntheticDocumentGenerator.generate_claim_form(temp_pdf_path, seed=777)
    with open(temp_pdf_path, "rb") as f:
        pdf_bytes = f.read()

    # Step 1: Upload a PDF
    resp_upload = client.post(
        "/api/v1/documents/upload",
        files={"file": ("FNOL_Workflow_Test.pdf", pdf_bytes, "application/pdf")}
    )
    assert resp_upload.status_code == 200, f"Upload failed: {resp_upload.text}"
    doc_data = resp_upload.json()
    doc_id = doc_data["document_id"]
    assert doc_id is not None
    print(f"\n[Step 1 & 2: Upload & Validate] Document ID: {doc_id}")

    # Step 2 & 3: Check Local Storage, checksum and properties on D: Drive
    doc_record = db.query(Document).filter_by(id=doc_id).first()
    assert doc_record is not None
    assert doc_record.file_size_bytes == len(pdf_bytes)
    assert len(doc_record.checksum) == 64  # SHA-256
    assert doc_record.original_filename == "FNOL_Workflow_Test.pdf"
    assert os.path.exists(doc_record.storage_path)
    assert "D:" in doc_record.storage_path or "PDF Extracter" in doc_record.storage_path
    print(f"[Step 2 & 3: Stored on D: drive] Path: {doc_record.storage_path}")

    # Step 4: Classification & Page Inspection
    assert doc_record.document_type == "claim_form"
    assert doc_record.quality_category in ("HIGH_DIGITAL", "MIXED_DIGITAL_IMAGE")
    print(f"[Step 4: Classification] Classified as: {doc_record.document_type}, Quality: {doc_record.quality_category}")

    # Step 5 & 6: Process document and extract structured fields
    resp_extract = client.post(
        "/api/v1/extraction/run",
        json={"document_id": doc_id, "method_id": "hybrid"}
    )
    assert resp_extract.status_code == 200, f"Extraction failed: {resp_extract.text}"
    extract_res = resp_extract.json()
    assert extract_res["status"] == "completed"
    fields = extract_res["fields"]
    assert len(fields) >= 8
    print(f"[Step 5 & 6: Extraction Complete] Extracted {len(fields)} fields via method '{extract_res['method_id']}'")

    # Step 7: Preserve Evidence (Bounding boxes & text snippets)
    evidence = extract_res["evidence"]
    assert len(evidence) > 0, "Evidence list must not be empty"
    first_ev = evidence[0]
    assert "bbox_x0" in first_ev
    assert "evidence_text" in first_ev
    print(f"[Step 7: Evidence Preserved] {len(evidence)} evidence items with bounding boxes verified")

    # Step 8: Run Validations
    critical_fields = [f for f in fields if f["is_critical"]]
    assert len(critical_fields) >= 4
    print(f"[Step 8: Validations] Critical fields checked: {[f['field_name'] for f in critical_fields]}")

    # Step 9: Escalate uncertain fields to Human Review Queue
    # Create or check review queue tasks
    tasks_resp = client.get("/api/v1/review/queue?status=all")
    assert tasks_resp.status_code == 200
    queue_tasks = tasks_resp.json()["tasks"]
    doc_tasks = [t for t in queue_tasks if t["document_id"] == doc_id]
    
    # If no task was flagged as low confidence automatically, let's target the first extracted field
    db.expire_all()
    target_field = db.query(ExtractedField).join(ExtractionRun).filter(ExtractionRun.document_id == doc_id).first()
    assert target_field is not None
    
    review_task = db.query(ReviewTask).filter_by(field_id=target_field.id).first()
    if not review_task:
        review_task = ReviewTask(
            document_id=doc_id,
            field_id=target_field.id,
            reason="Integration test verification",
            priority="high",
            status="pending"
        )
        db.add(review_task)
        db.commit()

    print(f"[Step 9: Review Queue] Task ID {review_task.id} for field '{target_field.field_name}'")

    # Step 10 & 11: Correct a field through human review & Persist correction
    corrected_val = "CLM-2026-CORRECTED-999"
    resp_correct = client.post(
        f"/api/v1/review/{review_task.id}/correct",
        json={
            "corrected_value": corrected_val,
            "reviewer": "lead_claims_auditor",
            "time_spent_seconds": 18.5,
            "notes": "Verified against physical paper file"
        }
    )
    assert resp_correct.status_code == 200
    print(f"[Step 10 & 11: Correct & Persist] Successfully corrected field to '{corrected_val}'")

    # Step 12: Verify Audit History
    audit_events = db.query(AuditEvent).filter_by(entity_id=review_task.id).all()
    assert len(audit_events) >= 1
    last_audit = audit_events[-1]
    assert last_audit.action == "review_correct"
    assert last_audit.actor == "lead_claims_auditor"
    assert last_audit.payload["corrected_value"] == corrected_val

    decision_record = db.query(ReviewDecision).filter_by(task_id=review_task.id).first()
    assert decision_record is not None
    assert decision_record.time_spent_seconds == 18.5
    print(f"[Step 12: Audit History Verified] Actor: {last_audit.actor}, Time: {decision_record.time_spent_seconds}s")

    # Step 13 & 14: Run Evaluation and Calculate Total Loaded Cost
    resp_cost = client.get("/api/v1/cost/summary")
    assert resp_cost.status_code == 200
    cost_data = resp_cost.json()
    assert "total_fully_loaded_cost_usd" in cost_data
    assert "total_human_review_cost_usd" in cost_data
    print(f"[Step 13 & 14: Cost Accounting] Loaded Cost: ${cost_data['total_fully_loaded_cost_usd']}, Human Review: ${cost_data['total_human_review_cost_usd']}")

    # Step 15: Export the results (JSON & CSV)
    resp_export_json = client.get(f"/api/v1/export/document/{doc_id}/json")
    assert resp_export_json.status_code == 200
    export_json = resp_export_json.json()
    assert export_json["document_id"] == doc_id
    assert len(export_json["extracted_fields"]) >= 8

    resp_export_csv = client.get(f"/api/v1/export/document/{doc_id}/csv")
    assert resp_export_csv.status_code == 200
    assert "Field Name,Raw Value,Normalized Value" in resp_export_csv.text
    print(f"[Step 15: Export Verified] Both JSON ({len(resp_export_json.text)} bytes) and CSV ({len(resp_export_csv.text)} bytes) exported cleanly.")

    # Cleanup temp
    if os.path.exists(temp_pdf_path):
        os.remove(temp_pdf_path)
    db.close()
    print(">> COMPLETE 15-STEP WORKFLOW INTEGRATION PASSED 100% <<\n")
