import csv
import io
import json
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Document, ExtractionRun, ExtractedField, EvaluationResult

router = APIRouter(prefix="/export", tags=["Exports & Reporting"])

@router.get("/document/{doc_id}/json")
def export_document_json(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter_by(id=doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    latest_run = db.query(ExtractionRun).filter_by(document_id=doc.id).order_by(ExtractionRun.created_at.desc()).first()
    fields_list = []
    if latest_run:
        fields = db.query(ExtractedField).filter_by(extraction_run_id=latest_run.id).all()
        for f in fields:
            ev = f.evidence
            fields_list.append({
                "field_name": f.field_name,
                "raw_value": f.raw_value,
                "normalized_value": f.normalized_value,
                "data_type": f.data_type,
                "confidence_score": f.confidence_score,
                "state": f.state,
                "is_critical": f.is_critical,
                "evidence": {
                    "page_number": ev.page_number if ev else None,
                    "evidence_text": ev.evidence_text if ev else None,
                    "bbox": [ev.bbox_x0, ev.bbox_y0, ev.bbox_x1, ev.bbox_y1] if ev and ev.bbox_x0 is not None else None
                } if ev else None
            })

    payload = {
        "document_id": doc.id,
        "filename": doc.original_filename,
        "checksum": doc.checksum,
        "document_type": doc.document_type,
        "quality_category": doc.quality_category,
        "page_count": doc.page_count,
        "status": doc.status,
        "extraction_method": latest_run.method_id if latest_run else None,
        "extracted_fields": fields_list
    }

    json_str = json.dumps(payload, indent=2)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={doc.original_filename}_extracted.json"}
    )

@router.get("/document/{doc_id}/csv")
def export_document_csv(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter_by(id=doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    latest_run = db.query(ExtractionRun).filter_by(document_id=doc.id).order_by(ExtractionRun.created_at.desc()).first()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Field Name", "Raw Value", "Normalized Value", "Type", "Confidence", "State", "Critical", "Page", "Evidence Snippet"])

    if latest_run:
        fields = db.query(ExtractedField).filter_by(extraction_run_id=latest_run.id).all()
        for f in fields:
            ev = f.evidence
            writer.writerow([
                f.field_name,
                f.raw_value or "",
                f.normalized_value or "",
                f.data_type,
                f.confidence_score,
                f.state,
                f.is_critical,
                ev.page_number if ev else "",
                ev.evidence_text if ev else ""
            ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={doc.original_filename}_fields.csv"}
    )

@router.get("/evaluation/csv")
def export_evaluation_csv(db: Session = Depends(get_db)):
    evals = db.query(EvaluationResult).order_by(EvaluationResult.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Method", "Exact Accuracy", "Normalized Accuracy", "Critical Field Accuracy", 
        "Document Level Accuracy", "Completeness", "Hallucination Rate", "P50 Latency (ms)", 
        "Cost per Correct Field ($)", "Total Machine Cost ($)", "Timestamp"
    ])

    for e in evals:
        writer.writerow([
            e.id,
            e.method_id,
            e.exact_accuracy,
            e.normalized_accuracy,
            e.critical_field_accuracy,
            e.document_level_accuracy,
            e.completeness,
            e.hallucination_rate,
            e.p50_latency_ms,
            e.cost_per_correct_field,
            e.total_machine_cost,
            e.created_at.isoformat()
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=evaluation_metrics_benchmark.csv"}
    )

