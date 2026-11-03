# IMPLEMENTATION PLAN & EXECUTION ROADMAP
## Insurance Document Intelligence Lab

### Phase 1: Environment & Persistence Core
- [x] Inspect environment (Python 3.11.9, Node 22.17.1, PyMuPDF, ReportLab, SQLite, D: drive storage).
- [x] Establish architecture & engineering specifications.
- [ ] Initialize backend structure and database schema in `backend/app/db/` with SQLAlchemy 2.0.
- [ ] Implement data models: Workspaces, Documents, DocumentPages, ProcessingJobs, ExtractionRuns, ExtractedFields, FieldEvidence, ValidationRules, ValidationResults, ReviewTasks, AuditEvents, Datasets, GroundTruthAnnotations, Experiments, EvaluationRuns, CostRecords, SecurityTestRuns, SystemSettings.
- [ ] Implement Storage service abstraction targeting `D:\PDF Extracter\backend\data\`.

### Phase 2: PDF Inspection, Quality Profiling & Synthetic Generator
- [ ] Implement `SyntheticDocumentGenerator` using ReportLab to generate clean digital, scanned (rasterized with noise), and mixed insurance claim forms, policy declarations, and invoices.
- [ ] Implement `PDFInspector` to compute text density, selectable character count, image area ratio, DPI, skew, and rotation for each page.
- [ ] Implement Document Type Classifier (Claim, Policy, Invoice, Medical Bill, etc.).

### Phase 3: Extraction Adapters & Hybrid Router
- [ ] Define `BaseExtractionAdapter` abstract contract with typed `ExtractionResult`, `ExtractedFieldRecord`, `EvidenceRecord`, `MethodMetrics`.
- [ ] Implement `NativePyMuPDFAdapter` with word/block bounding boxes and table detection.
- [ ] Implement `TesseractAdapter` and `PaddleOCRAdapter` with honest capability detection.
- [ ] Implement `LLMAdapter` and `MultimodalAdapter` with structured Pydantic extraction, token counters, and MockProvider for offline testing.
- [ ] Implement `HybridRouter` utilizing page quality heuristics to choose the optimal engine.

### Phase 4: Validation Engine, Provenance & Confidence
- [ ] Implement deterministic validation rules (Required fields, Type coercion, Arithmetic cross-checks, Chronological checks).
- [ ] Implement `ProvenanceEngine` to link values to exact page numbers and PDF coordinate bounding boxes.
- [ ] Implement `ConfidenceEngine` to compute reliability scores and trigger human review thresholds.

### Phase 5: Background Worker & REST API
- [ ] Implement durable background job processor with state transitions, retries, and cancellation.
- [ ] Implement complete REST API endpoints across health, documents, extraction, validation, review, datasets, experiments, evaluation, cost, security, settings, and exports.
- [ ] Add CSV, JSON, and evaluation report exporters.

### Phase 6: Ground Truth, Evaluation & Cost Accounting
- [ ] Implement Dataset & Annotation management with train/validation/test splits.
- [ ] Implement `EvaluationEngine` computing Field Exact Match, Normalized Match, Precision/Recall, Hallucination Rate, Latency (P50/P95), and Cost per Correct Field.
- [ ] Implement `CostAccountingEngine` computing Machine Cost vs Fully Loaded Cost (including human review minutes).

### Phase 7: Adversarial Security & Injection Testing Suite
- [ ] Implement adversarial test runner executing prompt injection payloads, malformed PDFs, boundary violations, and SSRF probes.
- [ ] Generate structured security audit reports.

### Phase 8: Next.js Frontend Development
- [ ] Scaffold Next.js 14 application with TypeScript and Tailwind CSS in `D:\PDF Extracter\frontend\`.
- [ ] Implement editorial, high-density design system (graphite/charcoal/warm stone/amber/olive palette).
- [ ] Build all 11 pages: Overview, Documents, Document Detail (with PDF canvas & bounding box overlays), Processing Queue, Human Review workspace, Extraction Lab, Experiments, Evaluation, Cost Analysis, Datasets & Annotation, Security Tests, Settings.
- [ ] Connect every page directly to real backend API endpoints.

### Phase 9: Verification, End-to-End Testing & Deliverables
- [ ] Write unit, integration, and security tests using Pytest.
- [ ] Run full test suites and capture test logs.
- [ ] Generate sample synthetic dataset for instant hands-on demonstration.
- [ ] Build Windows startup scripts (`start_backend.bat`, `start_frontend.bat`, `check_system.py`).
- [ ] Finalize `BUILD_STATUS.md`, `DECISIONS.md`, `TEST_PLAN.md`, `SECURITY.md`, and `EVALUATION_METHODOLOGY.md`.

