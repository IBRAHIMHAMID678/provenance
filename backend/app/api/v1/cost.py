from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import ExtractionRun, ReviewDecision, Document
from app.config import settings

router = APIRouter(prefix="/cost", tags=["Cost Accounting"])

@router.get("/summary")
def get_cost_summary(db: Session = Depends(get_db)):
    # Total machine cost from extraction runs
    total_machine_cost = db.query(func.sum(ExtractionRun.calculated_cost_usd)).scalar() or 0.0
    total_runs = db.query(ExtractionRun).count()

    # Total human review seconds
    total_review_seconds = db.query(func.sum(ReviewDecision.time_spent_seconds)).scalar() or 0.0
    human_hours = total_review_seconds / 3600.0
    total_human_cost = human_hours * settings.HUMAN_REVIEWER_HOURLY_RATE

    total_loaded_cost = total_machine_cost + total_human_cost

    # Breakdown by method
    method_costs = (
        db.query(
            ExtractionRun.method_id,
            func.count(ExtractionRun.id).label("count"),
            func.sum(ExtractionRun.calculated_cost_usd).label("cost")
        )
        .group_by(ExtractionRun.method_id)
        .all()
    )

    by_method = [
        {
            "method_id": m.method_id,
            "runs_count": m.count,
            "total_cost_usd": round(m.cost or 0.0, 4)
        } for m in method_costs
    ]

    return {
        "total_machine_cost_usd": round(total_machine_cost, 4),
        "total_human_review_cost_usd": round(total_human_cost, 4),
        "total_fully_loaded_cost_usd": round(total_loaded_cost, 4),
        "total_extraction_runs": total_runs,
        "total_human_review_hours": round(human_hours, 2),
        "hourly_reviewer_rate": settings.HUMAN_REVIEWER_HOURLY_RATE,
        "by_method": by_method
    }

@router.get("/unit-economics")
def calculate_unit_economics(
    monthly_volume: int = Query(10000, ge=100),
    review_rate: float = Query(0.12, ge=0.0, le=1.0),
    human_minutes_per_review: float = Query(2.5, ge=0.1),
    hourly_rate: float = Query(35.0, ge=10.0),
    machine_cost_per_doc: float = Query(0.001, ge=0.0)
):
    """
    Financial impact calculator projecting monthly TCO under different review rates & engine choices.
    """
    total_machine = monthly_volume * machine_cost_per_doc
    reviewed_docs = monthly_volume * review_rate
    review_hours = (reviewed_docs * human_minutes_per_review) / 60.0
    total_human = review_hours * hourly_rate
    total_monthly = total_machine + total_human

    cost_per_doc = total_monthly / monthly_volume if monthly_volume > 0 else 0.0

    return {
        "monthly_volume": monthly_volume,
        "review_rate": review_rate,
        "projected_monthly_machine_cost": round(total_machine, 2),
        "projected_monthly_human_cost": round(total_human, 2),
        "projected_total_monthly_spend": round(total_monthly, 2),
        "projected_fully_loaded_cost_per_document": round(cost_per_doc, 4),
        "annual_projected_spend": round(total_monthly * 12.0, 2)
    }

