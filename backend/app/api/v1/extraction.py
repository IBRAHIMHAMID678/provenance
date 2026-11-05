from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Document, ExtractionRun, ExtractedField, FieldEvidence, ReviewTask
from app.services.adapters import get_adapter, list_adapters_info
from app.schemas.insurance_schemas import get_schema
from app.config import settings

router = APIRouter(prefix="/extraction", tags=["Extraction Lab"])

@router.get("/methods")
def list_methods():
    return {"methods": list_adapters_info()}

@router.post("/run")
def run_extraction_method(
    document_id: str = Body(..., embed=True),
    method_id: str = Body(..., embed=True),
    schema_override: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter_by(id=document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    adapter = get_adapter(method_id)
    schema_name = schema_override or doc.document_type
    schema = get_schema(schema_name)

    result = adapter.extract(doc.id, doc.storage_path, schema)

    # Persist Extraction Run
    run = ExtractionRun(
        document_id=doc.id,
        method_id=result.method_id,
        status=result.status,
        duration_ms=result.duration_ms,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        calculated_cost_usd=result.calculated_cost_usd,
        raw_response={"metadata": result.metadata}
    )
    db.add(run)
    db.flush()

    # Persist Extracted Fields & Evidence & Route to Review
    evidence_map = {e.field_name: e for e in result.evidence}
    flagged_count = 0
    for f_item in result.fields:
        ef = ExtractedField(
            extraction_run_id=run.id,
            field_name=f_item.field_name,
            raw_value=f_item.raw_value,
            normalized_value=f_item.normalized_value,
            data_type=f_item.data_type,
            state=f_item.state,
            confidence_score=f_item.confidence,
            is_critical=f_item.is_critical,
            needs_review=f_item.needs_review or (not f_item.evidence_located),
            evidence_located=f_item.evidence_located,
            confidence_signals=f_item.confidence_signals or {}
        )
        db.add(ef)
        db.flush()

        if f_item.field_name in evidence_map:
            ev_item = evidence_map[f_item.field_name]
            fe = FieldEvidence(
                field_id=ef.id,
                page_number=ev_item.page_number,
                evidence_text=ev_item.evidence_text,
                bbox_x0=ev_item.bbox_x0,
                bbox_y0=ev_item.bbox_y0,
                bbox_x1=ev_item.bbox_x1,
                bbox_y1=ev_item.bbox_y1,
                extraction_method=result.method_id,
                char_confidence=ev_item.char_confidence,
                is_located=getattr(ev_item, "is_located", True),
                quads=getattr(ev_item, "quads", None)
            )
            db.add(fe)

        # Trigger review task if confidence below threshold, unlocated evidence, or flagged
        if (f_item.confidence < settings.ROUTER_REVIEW_CONFIDENCE_THRESHOLD) or (f_item.needs_review) or (not f_item.evidence_located):
            review_reason = (
                "Source evidence span not located in document."
                if not f_item.evidence_located
                else (f"Confidence below threshold ({f_item.confidence:.2f})" if f_item.raw_value else "Required field is missing.")
            )
            rt = ReviewTask(
                document_id=doc.id,
                field_id=ef.id,
                status="pending",
                priority="high" if f_item.is_critical else "medium",
                reason=review_reason
            )
            db.add(rt)
            flagged_count += 1

    if flagged_count > 0:
        doc.status = "review_required"
        doc.status_message = f"Requires human verification ({flagged_count} fields flagged)"
    else:
        doc.status = "completed"

    db.commit()
    return result.model_dump()


