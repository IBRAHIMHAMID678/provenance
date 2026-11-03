from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import EvaluationResult, Dataset

router = APIRouter(prefix="/evaluation", tags=["Evaluation Engine"])

@router.get("/runs")
def list_evaluation_runs(db: Session = Depends(get_db)):
    runs = db.query(EvaluationResult).order_by(EvaluationResult.created_at.desc()).all()
    results = []
    for r in runs:
        results.append({
            "id": r.id,
            "experiment_run_id": r.experiment_run_id,
            "dataset_id": r.dataset_id,
            "method_id": r.method_id,
            "exact_accuracy": r.exact_accuracy,
            "normalized_accuracy": r.normalized_accuracy,
            "critical_field_accuracy": r.critical_field_accuracy,
            "document_level_accuracy": r.document_level_accuracy,
            "cost_per_correct_field": r.cost_per_correct_field,
            "total_correct_fields": r.total_correct_fields,
            "total_evaluated_fields": r.total_evaluated_fields,
            "p50_latency_ms": r.p50_latency_ms,
            "created_at": r.created_at.isoformat()
        })
    return {"runs": results}

@router.get("/summary")
def get_evaluation_summary(db: Session = Depends(get_db)):
    # Group latest runs by method_id
    results_by_method = {}
    evals = db.query(EvaluationResult).order_by(EvaluationResult.created_at.desc()).all()
    for e in evals:
        if e.method_id not in results_by_method:
            results_by_method[e.method_id] = {
                "method_id": e.method_id,
                "exact_accuracy": e.exact_accuracy,
                "normalized_accuracy": e.normalized_accuracy,
                "critical_field_accuracy": e.critical_field_accuracy,
                "document_level_accuracy": e.document_level_accuracy,
                "completeness": e.completeness,
                "hallucination_rate": e.hallucination_rate,
                "p50_latency_ms": e.p50_latency_ms,
                "cost_per_correct_field": e.cost_per_correct_field,
                "total_machine_cost": e.total_machine_cost,
                "field_breakdown": e.field_breakdown
            }
    return {"summary": list(results_by_method.values())}

@router.get("/runs/{run_id}")
def get_evaluation_run_detail(run_id: str, db: Session = Depends(get_db)):
    r = db.query(EvaluationResult).filter_by(id=run_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Evaluation record not found.")

    return {
        "id": r.id,
        "method_id": r.method_id,
        "exact_accuracy": r.exact_accuracy,
        "normalized_accuracy": r.normalized_accuracy,
        "critical_field_accuracy": r.critical_field_accuracy,
        "document_level_accuracy": r.document_level_accuracy,
        "completeness": r.completeness,
        "hallucination_rate": r.hallucination_rate,
        "human_review_rate": r.human_review_rate,
        "first_pass_acceptance_rate": r.first_pass_acceptance_rate,
        "p50_latency_ms": r.p50_latency_ms,
        "p90_latency_ms": r.p90_latency_ms,
        "p95_latency_ms": r.p95_latency_ms,
        "cost_per_document": r.cost_per_document,
        "cost_per_correct_field": r.cost_per_correct_field,
        "total_machine_cost": r.total_machine_cost,
        "total_human_review_cost": r.total_human_review_cost,
        "total_evaluated_fields": r.total_evaluated_fields,
        "total_correct_fields": r.total_correct_fields,
        "field_breakdown": r.field_breakdown,
        "created_at": r.created_at.isoformat()
    }

