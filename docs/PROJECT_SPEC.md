# PROJECT SPECIFICATION
## Insurance Document Intelligence Lab

### 1. Executive Summary & Problem Definition
Traditional document processing pipelines rely either on rigid rule-based parsing or brute-force multi-modal LLM calls. In insurance operations (claims, underwriting, policy schedules, invoices, settlements), both extremes fail:
- **Rule/Template OCR fails** on scan artifacts, formatting variance, rotated pages, multi-column layouts, and handwritten notes.
- **Direct LLM processing fails** economically ($0.05–$0.25 per page), lacks verifiable character-level bounding-box provenance, hallucinates plausible figures, and introduces prompt-injection vulnerabilities from untrusted policyholder inputs.

**Insurance Document Intelligence Lab** solves this by establishing a disciplined, evidence-driven document extraction, verification, routing, and benchmarking platform. The core operational metric is **Cost per Correct Field ($/CF)** rather than cost per API request.

---

### 2. Operational Objectives
1. **Reduce Expensive Model Calls**: Clean digital pages extract natively via PyMuPDF with sub-millisecond latency and $0.00 marginal cost.
2. **Deterministic Extraction & Evidence Preservation**: Every extracted value is mapped to exact page indices, character coordinates (bounding boxes), raw text excerpts, and normalized representation.
3. **Multi-Method Comparative Benchmarking**: Native PDF extraction, Tesseract OCR, PaddleOCR, LLM (Groq/Gemini/Local), Multimodal LLM, and the Adaptive Hybrid Router compete under identical document inputs and schemas.
4. **Automated Cross-Field Reconciliation**: Deterministic validation engine validates arithmetic (subtotal + tax - discount == total), chronological sanity (incident <= filing <= policy_end), and cross-identifier consistency.
5. **Confidence & Abstention Framework**: Rather than trusting uncalibrated LLM confidence, compute a composite reliability score (OCR confidence, schema compliance, cross-field validation, method consensus) to automatically escalate uncertain fields to a human review queue.
6. **Audit-Grade Human Review**: Changes made by reviewers do not silently overwrite raw extraction outputs; separate machine and human layers are audited.
7. **End-to-End Cost Accounting**: Granular tracking of input/output tokens, image API fees, CPU OCR runtime, storage, and estimated human review time at configurable hourly rates.
8. **Untrusted Input Security & Prompt Injection Defense**: Strictly isolates PDF extracted text as untrusted data payloads; automated adversarial test suite verifies resistance to prompt injection, schema override, and SSRF attacks.

---

### 3. Supported Insurance Document Schemas
The platform provides 9 production insurance document categories:
1. `claim_form`: Claim ID, policy number, claimant name, incident date, filing date, incident description, damage location, requested amount, currency.
2. `policy_schedule`: Policy number, insurer name, policyholder, effective date, expiration date, coverage type, deductible, coverage limit, premium amount.
3. `insurance_declaration`: Declaration ID, underwriter, risk address, liability limit, premium schedule.
4. `insurance_invoice`: Invoice number, billing date, due date, vendor name, subtotal, tax, discount, total amount, line items.
5. `medical_expense_bill`: Patient name, provider name, procedure codes, service date, unit price, total charge.
6. `accident_report`: Report number, reporting officer, incident location, weather conditions, involved parties, narrative.
7. `settlement_agreement`: Settlement ID, claim reference, releasee, releasor, settlement amount, indemnity terms.
8. `insurance_certificate`: Certificate number, insured entity, policy reference, coverage verification, issuer signature.
9. `supporting_correspondence`: Letter date, sender, recipient, subject, referenced claim ID, summary notes.

---

### 4. Technical Constraints & Environment Specification
- **Host OS**: Windows 11 on D: drive (`D:\PDF Extracter`).
- **Python**: 3.11.9 with FastAPI 0.140, SQLAlchemy 2.0, Pydantic v2, PyMuPDF 1.26.6, ReportLab 5.0.1, Pytest 9.1.1.
- **Node.js**: v22.17.1, npm 10.9.2, Next.js 14, Tailwind CSS, Lucide React, Recharts.
- **Storage**: Local filesystem storage abstraction located in `D:\PDF Extracter\backend\data\`.
- **Database**: SQLite with WAL mode enabled and foreign keys enforced; PostgreSQL-ready SQLAlchemy models.

