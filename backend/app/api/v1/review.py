from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import ReviewTask, ReviewDecision, ExtractedField, Document, AuditEvent

router = APIRouter(prefix="/review", tags=["Human Review Queue"])

@router.get("/queue")
def list_review_queue(
    status: Optional[str] = "pending",
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(ReviewTask)
    if status and status != "all":
        q = q.filter(ReviewTask.status == status)

    tasks = q.order_by(ReviewTask.created_at.desc()).limit(limit).all()
    results = []
    for t in tasks:
        f = t.field
        doc = t.document
        ev = f.evidence if f else None
        is_mock = False
        if f and f.extraction_run and f.extraction_run.raw_response and isinstance(f.extraction_run.raw_response, dict):
            is_mock = f.extraction_run.raw_response.get("metadata", {}).get("is_mock", False)
        results.append({
            "task_id": t.id,
            "document_id": t.document_id,
            "document_filename": doc.original_filename if doc else "Unknown",
            "field_id": t.field_id,
            "field_name": f.field_name if f else "Unknown",
            "extracted_value": f.raw_value if f else None,
            "confidence_score": f.confidence_score if f else 0.0,
            "confidence_signals": getattr(f, "confidence_signals", {}) if f else {},
            "priority": t.priority,
            "reason": t.reason,
            "status": t.status,
            "is_mock": is_mock,
            "evidence_located": getattr(f, "evidence_located", True) if f else True,
            "evidence_text": ev.evidence_text if ev else None,
            "page_number": ev.page_number if ev else 1,
            "bbox": [ev.bbox_x0, ev.bbox_y0, ev.bbox_x1, ev.bbox_y1] if ev and ev.bbox_x0 is not None else None,
            "quads": getattr(ev, "quads", None) if ev else None,
            "created_at": t.created_at.isoformat()
        })
    return {"tasks": results, "total": len(results)}

@router.post("/{task_id}/accept")
def accept_field(
    task_id: str,
    reviewer: str = Body("operator_1", embed=True),
    time_spent_seconds: float = Body(12.0, embed=True),
    db: Session = Depends(get_db)
):
    task = db.query(ReviewTask).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Review task not found.")

    field = task.field
    task.status = "accepted"
    task.resolved_at = datetime.utcnow()

    decision = ReviewDecision(
        task_id=task.id,
        reviewer=reviewer,
        action="accept",
        original_value=field.raw_value if field else None,
        corrected_value=field.raw_value if field else None,
        time_spent_seconds=time_spent_seconds,
        notes="Operator confirmed machine extraction"
    )
    db.add(decision)

    audit = AuditEvent(
        entity_type="review_decision",
        entity_id=task.id,
        action="review_accept",
        actor=reviewer,
        payload={"field_name": field.field_name if field else "", "value": field.raw_value if field else ""}
    )
    db.add(audit)
    db.commit()

    return {"message": "Field accepted.", "task_id": task.id}

@router.post("/{task_id}/correct")
def correct_field(
    task_id: str,
    corrected_value: str = Body(..., embed=True),
    reviewer: str = Body("operator_1", embed=True),
    time_spent_seconds: float = Body(25.0, embed=True),
    notes: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    task = db.query(ReviewTask).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Review task not found.")

    field = task.field
    original_val = field.raw_value if field else None
    
    # Non-destructive: update field state, but preserve trace
    if field:
        field.normalized_value = corrected_value
        field.state = "corrected"
        field.confidence_score = 1.0
        field.needs_review = False

    task.status = "corrected"
    task.resolved_at = datetime.utcnow()

    decision = ReviewDecision(
        task_id=task.id,
        reviewer=reviewer,
        action="correct",
        original_value=original_val,
        corrected_value=corrected_value,
        time_spent_seconds=time_spent_seconds,
        notes=notes or "Human operator manual correction"
    )
    db.add(decision)

    audit = AuditEvent(
        entity_type="review_decision",
        entity_id=task.id,
        action="review_correct",
        actor=reviewer,
        payload={
            "field_name": field.field_name if field else "",
            "original_value": original_val,
            "corrected_value": corrected_value
        }
    )
    db.add(audit)
    db.commit()

    return {"message": "Correction recorded and audited.", "task_id": task.id, "corrected_value": corrected_value}

