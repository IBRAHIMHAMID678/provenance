import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, 
    Text, JSON, Enum, Index
)
from sqlalchemy.orm import relationship
from app.db.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    documents = relationship("Document", back_populates="workspace", cascade="all, delete-orphan")
    datasets = relationship("Dataset", back_populates="workspace", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="workspace", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    checksum = Column(String(64), nullable=False, index=True)  # SHA-256
    file_size_bytes = Column(Integer, nullable=False)
    page_count = Column(Integer, default=0, nullable=False)
    storage_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), default="application/pdf", nullable=False)
    
    # Classification & Quality
    document_type = Column(String(60), default="unclassified", index=True)  # claim_form, policy_schedule, etc.
    quality_category = Column(String(60), default="pending")  # HIGH_DIGITAL, CLEAN_SCAN, DEGRADED_SCAN, MIXED
    is_duplicate = Column(Boolean, default=False)
    
    # Overall Status
    status = Column(String(40), default="uploaded", index=True)  # uploaded, queued, processing, completed, review_required, failed
    status_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="documents")
    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan", order_by="DocumentPage.page_number")
    jobs = relationship("ProcessingJob", back_populates="document", cascade="all, delete-orphan")
    extraction_runs = relationship("ExtractionRun", back_populates="document", cascade="all, delete-orphan")
    review_tasks = relationship("ReviewTask", back_populates="document", cascade="all, delete-orphan")
    validation_results = relationship("ValidationResult", back_populates="document", cascade="all, delete-orphan")

class DocumentPage(Base):
    __tablename__ = "document_pages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)  # 1-indexed
    width = Column(Float, default=0.0)
    height = Column(Float, default=0.0)
    rotation = Column(Integer, default=0)
    
    # Quality metrics
    has_selectable_text = Column(Boolean, default=False)
    char_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    text_density = Column(Float, default=0.0)
    image_count = Column(Integer, default=0)
    image_area_ratio = Column(Float, default=0.0)
    estimated_dpi = Column(Float, default=0.0)
    skew_angle = Column(Float, default=0.0)
    quality_grade = Column(String(30), default="UNKNOWN")  # HIGH_DIGITAL, CLEAN_SCAN, DEGRADED_SCAN
    recommended_engine = Column(String(50), default="native")  # native, tesseract, paddle, llm
    
    extracted_text = Column(Text, nullable=True)
    rendered_image_path = Column(String(500), nullable=True)

    document = relationship("Document", back_populates="pages")

    __table_args__ = (
        Index("idx_doc_page", "document_id", "page_number", unique=True),
    )

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    job_type = Column(String(60), default="full_extraction")  # inspection, extraction, evaluation
    status = Column(String(40), default="pending", index=True)  # pending, running, completed, failed, cancelled
    method = Column(String(60), default="hybrid")
    priority = Column(Integer, default=1)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="jobs")
    events = relationship("JobEvent", back_populates="job", cascade="all, delete-orphan", order_by="JobEvent.created_at")

class JobEvent(Base):
    __tablename__ = "job_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("processing_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    stage = Column(String(60), nullable=False)  # uploaded, inspecting, routing, extracting, validating, done
    message = Column(Text, nullable=False)
    level = Column(String(20), default="info")  # info, warning, error
    event_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("ProcessingJob", back_populates="events")

class ExtractionRun(Base):
    __tablename__ = "extraction_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    method_id = Column(String(60), nullable=False, index=True)  # native_pymupdf, tesseract, paddleocr, llm, multimodal, hybrid
    schema_version = Column(String(40), default="v1.0")
    status = Column(String(40), default="completed")  # completed, partial, failed
    
    # Performance & Cost
    duration_ms = Column(Float, default=0.0)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    calculated_cost_usd = Column(Float, default=0.0)
    raw_response = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="extraction_runs")
    fields = relationship("ExtractedField", back_populates="extraction_run", cascade="all, delete-orphan")
    cost_records = relationship("CostRecord", back_populates="extraction_run", cascade="all, delete-orphan")

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    extraction_run_id = Column(String(36), ForeignKey("extraction_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(80), nullable=False, index=True)  # claim_number, policy_holder, total_amount, etc.
    raw_value = Column(Text, nullable=True)
    normalized_value = Column(Text, nullable=True)
    data_type = Column(String(40), default="string")  # string, decimal, date, currency, boolean, list
    
    # State & Reliability
    state = Column(String(40), default="extracted")  # extracted, missing, ambiguous, conflicting, invalid, corrected
    confidence_score = Column(Float, default=1.0)  # 0.0 - 1.0 composite
    is_critical = Column(Boolean, default=False)
    needs_review = Column(Boolean, default=False)
    evidence_located = Column(Boolean, default=True)
    confidence_signals = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    extraction_run = relationship("ExtractionRun", back_populates="fields")
    evidence = relationship("FieldEvidence", back_populates="field", uselist=False, cascade="all, delete-orphan")
    review_tasks = relationship("ReviewTask", back_populates="field", cascade="all, delete-orphan")

class FieldEvidence(Base):
    __tablename__ = "field_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    field_id = Column(String(36), ForeignKey("extracted_fields.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    page_number = Column(Integer, nullable=False)
    evidence_text = Column(Text, nullable=False)
    
    # Normalized bounding box in 0-1000 coordinate space
    bbox_x0 = Column(Float, nullable=True)
    bbox_y0 = Column(Float, nullable=True)
    bbox_x1 = Column(Float, nullable=True)
    bbox_y1 = Column(Float, nullable=True)
    
    extraction_method = Column(String(60), nullable=False)
    char_confidence = Column(Float, default=1.0)
    is_located = Column(Boolean, default=True)
    quads = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    field = relationship("ExtractedField", back_populates="evidence")

class ValidationRule(Base):
    __tablename__ = "validation_rules"

    id = Column(String(60), primary_key=True)  # rule_invoice_math, rule_chronological_sanity
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    target_document_type = Column(String(60), default="all")  # all, claim_form, invoice
    severity = Column(String(20), default="high")  # critical, high, medium, low, info
    is_enabled = Column(Boolean, default=True)
    rule_logic_type = Column(String(50), nullable=False)  # math_reconciliation, chronological, required_field, regex
    parameters = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    results = relationship("ValidationResult", back_populates="rule", cascade="all, delete-orphan")

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String(60), ForeignKey("validation_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    passed = Column(Boolean, nullable=False)
    severity = Column(String(20), nullable=False)
    explanation = Column(Text, nullable=False)
    affected_fields = Column(JSON, default=list)  # ["subtotal", "tax", "total"]
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="validation_results")
    rule = relationship("ValidationRule", back_populates="results")

class ReviewTask(Base):
    __tablename__ = "review_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("extracted_fields.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(40), default="pending", index=True)  # pending, accepted, corrected, rejected, escalated
    priority = Column(String(20), default="medium")  # high, medium, low
    reason = Column(Text, nullable=False)
    suggested_value = Column(Text, nullable=True)
    assigned_reviewer = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    document = relationship("Document", back_populates="review_tasks")
    field = relationship("ExtractedField", back_populates="review_tasks")
    decision = relationship("ReviewDecision", back_populates="task", uselist=False, cascade="all, delete-orphan")

class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("review_tasks.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    reviewer = Column(String(100), default="operator_1")
    action = Column(String(40), nullable=False)  # accept, correct, mark_missing, reject, escalate
    original_value = Column(Text, nullable=True)
    corrected_value = Column(Text, nullable=True)
    time_spent_seconds = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    task = relationship("ReviewTask", back_populates="decision")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_type = Column(String(60), nullable=False)  # document, review_decision, experiment, setting
    entity_id = Column(String(60), nullable=False)
    action = Column(String(60), nullable=False)  # create, update, delete, review_correct, override
    actor = Column(String(100), default="system")
    payload = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String(60), default="synthetic")  # synthetic, public_licensed, user_provided, internal_gold
    version = Column(String(30), default="1.0.0")
    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="datasets")
    dataset_documents = relationship("DatasetDocument", back_populates="dataset", cascade="all, delete-orphan")
    evaluation_runs = relationship("EvaluationResult", back_populates="dataset")

class DatasetDocument(Base):
    __tablename__ = "dataset_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    split = Column(String(20), default="test")  # train, val, test
    quality_profile = Column(String(40), default="HIGH_DIGITAL")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    dataset = relationship("Dataset", back_populates="dataset_documents")
    document = relationship("Document")
    annotations = relationship("GroundTruthAnnotation", back_populates="dataset_doc", cascade="all, delete-orphan")

class GroundTruthAnnotation(Base):
    __tablename__ = "ground_truth_annotations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_document_id = Column(String(36), ForeignKey("dataset_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(80), nullable=False, index=True)
    expected_value = Column(Text, nullable=False)
    normalized_value = Column(Text, nullable=False)
    page_number = Column(Integer, default=1)
    bbox_coordinates = Column(JSON, nullable=True)  # [x0, y0, x1, y1]
    is_gold_standard = Column(Boolean, default=True)
    annotator = Column(String(100), default="expert_supervisor")
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    dataset_doc = relationship("DatasetDocument", back_populates="annotations")

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    configuration = Column(JSON, default=dict)  # engines, thresholds, prompt_version, model
    status = Column(String(40), default="created")  # created, running, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="experiments")
    runs = relationship("ExperimentRun", back_populates="experiment", cascade="all, delete-orphan")

class ExperimentRun(Base):
    __tablename__ = "experiment_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(40), default="completed")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    summary_metrics = Column(JSON, default=dict)

    experiment = relationship("Experiment", back_populates="runs")
    evaluation_results = relationship("EvaluationResult", back_populates="experiment_run", cascade="all, delete-orphan")

class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_run_id = Column(String(36), ForeignKey("experiment_runs.id", ondelete="CASCADE"), nullable=True, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    method_id = Column(String(60), nullable=False, index=True)
    
    # Statistical Metrics
    exact_accuracy = Column(Float, default=0.0)
    normalized_accuracy = Column(Float, default=0.0)
    critical_field_accuracy = Column(Float, default=0.0)
    document_level_accuracy = Column(Float, default=0.0)
    completeness = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    hallucination_rate = Column(Float, default=0.0)
    human_review_rate = Column(Float, default=0.0)
    first_pass_acceptance_rate = Column(Float, default=0.0)
    
    # Latencies
    p50_latency_ms = Column(Float, default=0.0)
    p90_latency_ms = Column(Float, default=0.0)
    p95_latency_ms = Column(Float, default=0.0)
    
    # Cost & Efficiency
    cost_per_document = Column(Float, default=0.0)
    cost_per_correct_field = Column(Float, default=0.0)
    total_machine_cost = Column(Float, default=0.0)
    total_human_review_cost = Column(Float, default=0.0)
    total_evaluated_fields = Column(Integer, default=0)
    total_correct_fields = Column(Integer, default=0)
    
    field_breakdown = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    experiment_run = relationship("ExperimentRun", back_populates="evaluation_results")
    dataset = relationship("Dataset", back_populates="evaluation_runs")

class CostRecord(Base):
    __tablename__ = "cost_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    extraction_run_id = Column(String(36), ForeignKey("extraction_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    cost_category = Column(String(60), nullable=False)  # api_tokens, ocr_compute, human_review, storage
    provider = Column(String(60), default="local")
    units = Column(Float, default=0.0)  # token count, seconds, page count
    unit_type = Column(String(40), default="tokens")
    unit_price = Column(Float, default=0.0)
    total_cost_usd = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    extraction_run = relationship("ExtractionRun", back_populates="cost_records")

class SecurityTestRun(Base):
    __tablename__ = "security_test_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    test_suite = Column(String(100), default="adversarial_prompt_injection")
    test_case_id = Column(String(100), nullable=False)
    attack_vector = Column(String(100), nullable=False)  # instruction_override, fraud_limit_bypass, data_exfiltration, malformed_pdf
    payload_sample = Column(Text, nullable=False)
    expected_behavior = Column(Text, nullable=False)
    actual_behavior = Column(Text, nullable=False)
    passed = Column(Boolean, nullable=False)
    evidence_log = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value = Column(JSON, nullable=False)
    category = Column(String(60), default="general")
    is_secret = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
