import threading
import time
import queue
import traceback
from datetime import datetime
from typing import Optional, Callable, Dict, Any
from app.db.session import SessionLocal
from app.db.models import ProcessingJob, JobEvent, Document, ExtractionRun, ExtractedField, FieldEvidence, ValidationResult, ReviewTask
from app.services.adapters import get_adapter
from app.services.pdf_inspector import pdf_inspector
from app.schemas.insurance_schemas import get_schema
from app.services.rule_validator import rule_validator

class BackgroundJobWorker:
    def __init__(self, max_threads: int = 2):
        self.job_queue: queue.Queue = queue.Queue()
        self.cancelled_jobs: set = set()
        self.is_running = True
        self.threads = []
        for _ in range(max_threads):
            t = threading.Thread(target=self._worker_loop, daemon=True)
            t.start()
            self.threads.append(t)

    def enqueue(self, job_id: str):
        self.job_queue.put(job_id)

    def cancel(self, job_id: str) -> bool:
        self.cancelled_jobs.add(job_id)
        db = SessionLocal()
        try:
            job = db.query(ProcessingJob).filter_by(id=job_id).first()
            if job and job.status in ("pending", "running"):
                job.status = "cancelled"
                db.commit()
                return True
        finally:
            db.close()
        return False

    def _log_event(self, db, job_id: str, stage: str, message: str, level: str = "info"):
        event = JobEvent(
            job_id=job_id,
            stage=stage,
            message=message,
            level=level
        )
        db.add(event)
        db.commit()

    def _worker_loop(self):
        while self.is_running:
            try:
                job_id = self.job_queue.get(timeout=1.0)
            except queue.Empty:
                continue

            if job_id in self.cancelled_jobs:
                self.job_queue.task_done()
                continue

            db = SessionLocal()
            try:
                job = db.query(ProcessingJob).filter_by(id=job_id).first()
                if not job:
                    self.job_queue.task_done()
                    continue

                doc = db.query(Document).filter_by(id=job.document_id).first()
                if not doc:
                    job.status = "failed"
                    job.error_message = "Document not found in storage."
                    db.commit()
                    self.job_queue.task_done()
                    continue

                # Transition to running
                job.status = "running"
                job.started_at = datetime.utcnow()
                doc.status = "processing"
                db.commit()
                self._log_event(db, job_id, "inspection", f"Inspecting PDF structure for {doc.original_filename}")

                # Stage 1: Inspection & Quality Analysis
                inspection = pdf_inspector.inspect_document(doc.id, doc.storage_path)
                doc.page_count = inspection.total_pages
                doc.quality_category = inspection.overall_quality
                db.commit()
                self._log_event(
                    db, job_id, "quality_profile", 
                    f"Document quality: {inspection.overall_quality}. Digital pages: {inspection.digital_page_count}, Scanned: {inspection.scanned_page_count}"
                )

                if job_id in self.cancelled_jobs:
                    job.status = "cancelled"
                    db.commit()
                    self.job_queue.task_done()
                    continue

                # Stage 2: Extraction
                adapter = get_adapter(job.method)
                schema = get_schema(doc.document_type)
                self._log_event(db, job_id, "extraction", f"Executing extraction using method: {adapter.display_name}")

                extract_res = adapter.extract(doc.id, doc.storage_path, schema)
                
                # Persist Extraction Run
                run = ExtractionRun(
                    document_id=doc.id,
                    method_id=extract_res.method_id,
                    status=extract_res.status,
                    duration_ms=extract_res.duration_ms,
                    input_tokens=extract_res.input_tokens,
                    output_tokens=extract_res.output_tokens,
                    calculated_cost_usd=extract_res.calculated_cost_usd,
                    raw_response={"metadata": extract_res.metadata}
                )
                db.add(run)
                db.flush()

                # Persist Extracted Fields & Evidence
                evidence_map = {e.field_name: e for e in extract_res.evidence}
                low_confidence_fields = []

                for f_item in extract_res.fields:
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
                        ev = evidence_map[f_item.field_name]
                        fe = FieldEvidence(
                            field_id=ef.id,
                            page_number=ev.page_number,
                            evidence_text=ev.evidence_text,
                            bbox_x0=ev.bbox_x0,
                            bbox_y0=ev.bbox_y0,
                            bbox_x1=ev.bbox_x1,
                            bbox_y1=ev.bbox_y1,
                            extraction_method=extract_res.method_id,
                            char_confidence=ev.char_confidence,
                            is_located=ev.is_located,
                            quads=ev.quads
                        )
                        db.add(fe)

                    # Trigger review task if confidence below threshold, unlocated evidence, or flagged
                    if (f_item.confidence < settings.ROUTER_REVIEW_CONFIDENCE_THRESHOLD) or (f_item.needs_review) or (not f_item.evidence_located):
                        low_confidence_fields.append((ef, f_item))

                # Stage 3: Deterministic Validation
                self._log_event(db, job_id, "validation", "Running deterministic business & cross-field validation rules")
                val_results = rule_validator.validate_document(doc.document_type, extract_res.fields)
                has_critical_failure = False

                for vr in val_results:
                    v_record = ValidationResult(
                        document_id=doc.id,
                        rule_id=vr.rule_id,
                        passed=vr.passed,
                        severity=vr.severity,
                        explanation=vr.explanation,
                        affected_fields=vr.affected_fields
                    )
                    db.add(v_record)
                    if not vr.passed and vr.severity == "critical":
                        has_critical_failure = True

                # Stage 4: Create Human Review Tasks if needed
                for ef_record, f_item in low_confidence_fields:
                    review_reason = (
                        "Source evidence span not located in document."
                        if not f_item.evidence_located
                        else (f"Confidence below threshold ({f_item.confidence:.2f})" if f_item.raw_value else "Required field is missing.")
                    )
                    rt = ReviewTask(
                        document_id=doc.id,
                        field_id=ef_record.id,
                        status="pending",
                        priority="high" if f_item.is_critical else "medium",
                        reason=review_reason
                    )
                    db.add(rt)

                # Final Status Determination
                job.completed_at = datetime.utcnow()
                if low_confidence_fields or has_critical_failure:
                    job.status = "completed"
                    doc.status = "review_required"
                    doc.status_message = f"Requires human verification ({len(low_confidence_fields)} fields flagged)"
                else:
                    job.status = "completed"
                    doc.status = "completed"
                    doc.status_message = "Successfully extracted and validated with zero high-severity errors."

                db.commit()
                self._log_event(db, job_id, "done", f"Processing completed. Final state: {doc.status}")

            except Exception as e:
                db.rollback()
                job.status = "failed"
                job.error_message = str(e)
                if doc:
                    doc.status = "failed"
                    doc.status_message = str(e)
                db.commit()
                self._log_event(db, job_id, "error", f"Processing exception: {traceback.format_exc()}", level="error")
            finally:
                db.close()
                self.job_queue.task_done()

background_worker = BackgroundJobWorker(max_threads=2)

