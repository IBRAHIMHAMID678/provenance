# ARCHITECTURAL DECISIONS RECORD (ADR)
## Insurance Document Intelligence Lab

### ADR 001: Storage & Execution on D: Drive
- **Status**: Approved & Implemented.
- **Context**: The user's C: drive was at 95% capacity (~5 GB free), while D: drive possessed ~89 GB free. Furthermore, the user explicitly commanded: "every thing should in D drive not C".
- **Decision**: All application code, databases, uploads, caches, models, and node_modules will reside strictly inside `D:\PDF Extracter\`.
- **Consequences**: Zero risk of disk exhaustion on C: drive; complete self-contained portable installation.

### ADR 002: Framework & Technology Stack
- **Status**: Approved.
- **Context**: Need a production-grade, typed, asynchronous backend capable of high-throughput document processing and scientific evaluation, paired with an accessible, high-density operations dashboard.
- **Decision**:
  - Backend: FastAPI 0.140, Python 3.11.9, SQLAlchemy 2.0 with SQLite WAL mode.
  - PDF & Image Engine: PyMuPDF 1.26.6 for fast native C-level extraction, ReportLab 5.0.1 for synthetic PDF benchmark generation.
  - Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Consequences**: Standard, widely supported technologies with zero licensing friction and optimal local CPU performance.

### ADR 003: Honest OCR & Model Capability Degradation
- **Status**: Approved.
- **Context**: Tesseract or PaddleOCR may or may not have native system binaries or C++ DLLs installed in every host environment.
- **Decision**: All OCR and LLM adapters implement strict capability detection methods (`is_available() -> tuple[bool, str]`). If a binary or API key is absent, the system raises a typed `CapabilityUnavailableError` with diagnostic instructions instead of fabricating or mocking outputs. Mock providers are explicitly labeled as `[MOCK_PROVIDER]` for deterministic automated tests.
- **Consequences**: Complies with the prompt's Strict Anti-Fabrication Rule 8 & 9.

### ADR 004: Evidence & Provenance Data Model
- **Status**: Approved.
- **Context**: Machine learning extractions without traceable evidence are unacceptable in insurance claims adjudication.
- **Decision**: The `FieldEvidence` entity records `page_number`, `bbox_x0`, `bbox_y0`, `bbox_x1`, `bbox_y1` in normalized 0-1000 coordinate space, `raw_text_snippet`, `extraction_method`, and `source_hash`. The frontend renders dynamic SVG overlays directly matching these coordinates on the PDF page canvas.
- **Consequences**: Full explainability for claims adjusters; instant point-and-click verification between fields and document pages.

### ADR 005: Cost Metric - Cost per Correct Field ($/CF)
- **Status**: Approved.
- **Context**: Optimizing for cost-per-page or raw API token prices incentivizes cheap models that output incorrect data, shifting massive labor costs to human reviewers.
- **Decision**: The primary operational metric is:
  $$\text{Cost per Correct Field} = \frac{\text{Machine Cost} + \text{Human Review Cost}}{\text{Count of Correct Applicable Fields}}$$
  Failed documents or documents with zero correct fields are penalized, never silently omitted.
- **Consequences**: Accurately reflects true organizational TCO (Total Cost of Ownership).

### ADR 006: Non-Destructive Human Corrections & Ground Truth Protection
- **Status**: Approved.
- **Context**: When a human corrects a field, overwriting machine extraction loses provenance and prevents retraining or error analysis.
- **Decision**: Machine extraction records are immutable. Human edits create a separate `ReviewDecision` linked to an `AuditEvent`. Furthermore, review edits do not automatically contaminate the benchmark's Gold Standard dataset without explicit supervisory promotion.
- **Consequences**: Data integrity guaranteed across all evaluation runs.

