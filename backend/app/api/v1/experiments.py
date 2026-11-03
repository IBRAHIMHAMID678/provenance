import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Experiment, ExperimentRun, Dataset, EvaluationResult, Workspace
from app.services.adapters import get_adapter
from app.schemas.insurance_schemas import get_schema
from app.services.evaluation_service import evaluation_engine

router = APIRouter(prefix="/experiments", tags=["Experiments"])

@router.get("")
def list_experiments(db: Session = Depends(get_db)):
    exps = db.query(Experiment).order_by(Experiment.created_at.desc()).all()
    results = []
    for e in exps:
        results.append({
            "id": e.id,
            "name": e.name,
            "description": e.description,
            "status": e.status,
            "configuration": e.configuration,
            "created_at": e.created_at.isoformat(),
            "runs_count": len(e.runs)
        })
    return {"experiments": results}

@router.post("")
def create_experiment(
    name: str = Body(..., embed=True),
    description: Optional[str] = Body(None, embed=True),
    configuration: Optional[Dict[str, Any]] = Body(default_factory=dict, embed=True),
    db: Session = Depends(get_db)
):
    ws = db.query(Workspace).filter_by(slug="default").first()
    exp = Experiment(
        workspace_id=ws.id,
        name=name,
        description=description or "Extraction engine comparative experiment",
        configuration=configuration or {"methods": ["native_pymupdf", "hybrid", "llm"]}
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return {"id": exp.id, "name": exp.name, "status": exp.status}

@router.post("/{experiment_id}/run")
def execute_experiment_run(
    experiment_id: str,
    dataset_id: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    exp = db.query(Experiment).filter_by(id=experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    # Select dataset
    if dataset_id:
        ds = db.query(Dataset).filter_by(id=dataset_id).first()
    else:
        ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()

    if not ds or not ds.dataset_documents:
        raise HTTPException(status_code=400, detail="No dataset with documents available. Generate a synthetic dataset first.")

    exp.status = "running"
    run = ExperimentRun(
        experiment_id=exp.id,
        dataset_id=ds.id,
        status="running"
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Determine extraction methods to evaluate
    methods_to_test = exp.configuration.get("methods", ["native_pymupdf", "hybrid", "llm"])
    eval_summaries = []

    # Gather ground truth for dataset documents
    ground_truth_by_doc: Dict[str, Dict[str, Any]] = {}
    doc_objects = {}
    for ds_doc in ds.dataset_documents:
        doc = ds_doc.document
        doc_objects[doc.id] = doc
        gt_dict = {a.field_name: a.expected_value for a in ds_doc.annotations}
        ground_truth_by_doc[doc.id] = gt_dict

    critical_fields = ["claim_id", "policy_number", "requested_amount", "invoice_number", "total_amount"]

    for mid in methods_to_test:
        adapter = get_adapter(mid)
        predictions_by_doc: Dict[str, Dict[str, Any]] = {}
        latencies: List[float] = []
        total_machine_cost = 0.0

        for doc_id, doc in doc_objects.items():
            schema = get_schema(doc.document_type)
            res = adapter.extract(doc.id, doc.storage_path, schema)
            latencies.append(res.duration_ms)
            total_machine_cost += res.calculated_cost_usd
            predictions_by_doc[doc_id] = {f.field_name: f.normalized_value for f in res.fields}

        # Calculate metrics using EvaluationEngine
        summary = evaluation_engine.evaluate_run(
            method_id=mid,
            predictions_by_doc=predictions_by_doc,
            ground_truth_by_doc=ground_truth_by_doc,
            critical_fields=critical_fields,
            latencies_ms=latencies,
            machine_cost=total_machine_cost,
            human_review_time_seconds=0.0
        )

        # Persist Evaluation Result
        eval_record = EvaluationResult(
            experiment_run_id=run.id,
            dataset_id=ds.id,
            method_id=mid,
            exact_accuracy=summary.exact_accuracy,
            normalized_accuracy=summary.normalized_accuracy,
            critical_field_accuracy=summary.critical_field_accuracy,
            document_level_accuracy=summary.document_level_accuracy,
            completeness=summary.completeness,
            hallucination_rate=summary.hallucination_rate,
            human_review_rate=summary.human_review_rate,
            first_pass_acceptance_rate=1.0 - summary.human_review_rate,
            p50_latency_ms=summary.p50_latency_ms,
            p90_latency_ms=summary.p90_latency_ms,
            p95_latency_ms=summary.p95_latency_ms,
            cost_per_document=summary.cost_per_document,
            cost_per_correct_field=summary.cost_per_correct_field if summary.cost_per_correct_field != float("inf") else 999.0,
            total_machine_cost=summary.total_machine_cost,
            total_human_review_cost=summary.total_human_review_cost,
            total_evaluated_fields=summary.total_fields,
            total_correct_fields=summary.total_correct_fields,
            field_breakdown=summary.field_breakdown
        )
        db.add(eval_record)
        eval_summaries.append(summary.model_dump())

    run.status = "completed"
    exp.status = "completed"
    db.commit()

    return {
        "run_id": run.id,
        "dataset_name": ds.name,
        "evaluations": eval_summaries
    }

