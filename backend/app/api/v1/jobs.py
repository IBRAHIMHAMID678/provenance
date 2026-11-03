from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import ProcessingJob, JobEvent, Document
from app.workers.queue import background_worker

router = APIRouter(prefix="/jobs", tags=["Processing Queue"])

@router.get("")
def list_jobs(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    q = db.query(ProcessingJob)
    if status and status != "all":
        q = q.filter(ProcessingJob.status == status)

    jobs = q.order_by(ProcessingJob.created_at.desc()).limit(limit).all()
    results = []
    for j in jobs:
        doc = j.document
        duration_s = None
        if j.started_at and j.completed_at:
            duration_s = round((j.completed_at - j.started_at).total_seconds(), 2)

        results.append({
            "id": j.id,
            "document_id": j.document_id,
            "document_filename": doc.original_filename if doc else "Unknown",
            "job_type": j.job_type,
            "method": j.method,
            "status": j.status,
            "priority": j.priority,
            "retry_count": j.retry_count,
            "error_message": j.error_message,
            "duration_seconds": duration_s,
            "started_at": j.started_at.isoformat() if j.started_at else None,
            "created_at": j.created_at.isoformat()
        })
    return {"jobs": results}

@router.get("/{job_id}")
def get_job_detail(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    events = db.query(JobEvent).filter_by(job_id=job.id).order_by(JobEvent.created_at.asc()).all()
    events_data = [
        {
            "stage": e.stage,
            "message": e.message,
            "level": e.level,
            "timestamp": e.created_at.isoformat()
        } for e in events
    ]

    return {
        "id": job.id,
        "document_id": job.document_id,
        "status": job.status,
        "method": job.method,
        "error_message": job.error_message,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "events": events_data
    }

@router.post("/{job_id}/cancel")
def cancel_job(job_id: str):
    cancelled = background_worker.cancel(job_id)
    if not cancelled:
        raise HTTPException(status_code=400, detail="Job could not be cancelled or was already finished.")
    return {"message": "Job cancellation initiated.", "job_id": job_id}

