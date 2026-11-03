from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import SecurityTestRun
from app.services.security_service import security_suite

router = APIRouter(prefix="/security", tags=["Adversarial Security"])

@router.post("/run-audit")
def run_security_audit(db: Session = Depends(get_db)):
    test_results = security_suite.run_security_audit()
    saved = []
    for tc in test_results:
        rec = SecurityTestRun(
            test_case_id=tc.test_id,
            attack_vector=tc.attack_category,
            payload_sample=tc.payload,
            expected_behavior=tc.expected_behavior,
            actual_behavior=tc.actual_behavior,
            passed=tc.passed,
            evidence_log=tc.evidence_log
        )
        db.add(rec)
        saved.append(tc.model_dump())

    db.commit()
    return {
        "message": f"Completed security audit suite with {len(test_results)} test vectors.",
        "all_passed": all(t.passed for t in test_results),
        "tests": saved
    }

@router.get("/results")
def list_security_results(db: Session = Depends(get_db)):
    records = db.query(SecurityTestRun).order_by(SecurityTestRun.created_at.desc()).limit(50).all()
    results = [
        {
            "id": r.id,
            "test_id": r.test_case_id,
            "attack_category": r.attack_vector,
            "payload": r.payload_sample,
            "expected_behavior": r.expected_behavior,
            "actual_behavior": r.actual_behavior,
            "passed": r.passed,
            "evidence_log": r.evidence_log,
            "created_at": r.created_at.isoformat()
        } for r in records
    ]
    return {"results": results}

