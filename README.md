# Provenance · Document Intelligence Lab

<p align="center">
  <strong>Autonomous Document Extraction, Verification, Routing & Ground-Truth Benchmarking</strong><br>
  <em>"Extract less blindly. Verify more intelligently."</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/OCR-RapidOCR_PP--OCRv4-00F2FE?style=flat" alt="RapidOCR">
  <img src="https://img.shields.io/badge/Tests-48%2F48_Passed-10B981?style=flat" alt="Tests">
  <img src="https://img.shields.io/badge/Docker-Production_Ready-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat" alt="License">
</p>

---

## 📖 About The Project

Most document extraction pipelines fail in production because they treat complex insurance documents, claim forms, declarations, and medical invoices as simple PDF-to-JSON problems—accumulating expensive LLM API bills, silently accepting hallucinations, and leaving human reviewers to blindly double-check every field.

**Provenance** is an enterprise-grade document extraction, verification, routing, and empirical benchmarking platform built to solve a critical operational question:

> **How can organizations extract reliable information from insurance documents at the lowest total cost, without depending on manual verification for every document?**

Rather than optimizing for raw API token costs, Provenance optimizes for **Cost per Correct Field ($/CF)**—factoring in machine compute, token usage, and human reviewer labor economics ($35.00/hr).

---

## 🏛️ System Architecture

```
                                  ┌──────────────────────────────┐
                                  │      Incoming PDF Stream     │
                                  └──────────────┬───────────────┘
                                                 │
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │    PDF Quality Inspector     │
                                  │  (Density, DPI, Image Ratio) │
                                  └──────────────┬───────────────┘
                                                 │
                         ┌───────────────────────┴───────────────────────┐
                         ▼                                               ▼
            ┌──────────────────────────┐                    ┌──────────────────────────┐
            │   Native PyMuPDF Engine  │                    │   RapidOCR PP-OCRv4 DL   │
            │  (Clean Digital Vectors) │                    │    (Scans & Degraded)    │
            │   ~20-45ms · $0.00 Cost  │                    │   Normalized Bounding    │
            └────────────┬─────────────┘                    └────────────┬─────────────┘
                         │                                               │
                         └───────────────────────┬───────────────────────┘
                                                 │
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │    LLM Schema Extraction     │
                                  │  (Prompt Injection Defenses) │
                                  └──────────────┬───────────────┘
                                                 │
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │   Deterministic Validation   │
                                  │ (Math, Dates, Cross-Fields)  │
                                  └──────────────┬───────────────┘
                                                 │
                         ┌───────────────────────┴───────────────────────┐
                         ▼ (Confidence >= 0.85)                          ▼ (Confidence < 0.85)
            ┌──────────────────────────┐                    ┌──────────────────────────┐
            │   Verified Clean Store   │                    │    Human Review Station  │
            │   (Immutable Provenance) │                    │  (Non-destructive Edits) │
            └──────────────────────────┘                    └──────────────────────────┘
```

---

## ✨ Key Features

- **Adaptive Zero-Cost Quality Routing:** Automatically inspects selectable character densities and image area ratios to route clean digital PDFs through zero-cost native PyMuPDF vector extraction, engaging deep-learning OCR only when truly needed.
- **Sub-Pixel Evidence & Provenance:** Every extracted key-value pair is mapped to an immutable normalized bounding box (`[nx0, ny0, nx1, ny1]`), ensuring complete visual auditability.
- **Audited Human-in-the-Loop Review Station:** Active timer calculating loaded review labor cost ($35.00/hr), side-by-side SVG reticle evidence, and non-destructive versioning.
- **Empirical Ground-Truth Benchmarking:** Evaluates performance against a strictly held-out testbed partition ($Train \cap Test = \emptyset$) with 100% annotated gold standards.
- **Air-Gapped & Sandboxed Security:** 10-vector adversarial defense matrix mitigating indirect prompt injection, SSRF, stored XSS, and directory path traversal.
- **Obsidian Spatial Interface:** High-density operational console built with Next.js 14, Tailwind CSS, 3D CSS perspective transforms, and real-time hardware telemetry.

---

## 🖼️ User Interface & Operations Console

| Screen | Route | Visual Preview |
| :--- | :--- | :--- |
| **01. Operational Overview** | `/` | Real-time throughput, system TCO, and engine latency telemetry |
| **02. Document Ingestion Vault** | `/documents` | Spatial drag-and-drop reticle with deterministic SHA-256 deduplication |
| **03. Spatial Document Stage** | `/documents/[id]` | SVG normalized bounding box overlays with interactive zoom controls |
| **04. Processing Queue** | `/queue` | Asynchronous worker state machine with live thread activity monitors |
| **05. Human Review Station** | `/review` | Active labor cost timer ($35/hr) with non-destructive correction inputs |
| **06. Extraction Lab** | `/lab` | Multi-engine comparative profiler (PyMuPDF, RapidOCR, LLM) |
| **07. Experiment Matrix** | `/experiments` | Reproducible A/B benchmark trials across standardized gold datasets |
| **08. Scientific Evaluation** | `/evaluation` | Exact vs Normalized accuracy, hallucination rates, and $/CF rankings |
| **09. Cost Accounting & ROI** | `/cost` | Interactive unit economics sliders, break-even analysis, and TCO model |
| **10. Benchmark Datasets** | `/datasets` | Partition viewer (Train 60% / Val 10% / Held-Out Test 30%) |
| **11. Adversarial Security Lab** | `/security` | 10-vector penetration testing console and live audit suite |
| **12. System Settings** | `/settings` | Storage volume telemetry and engine hardware probe LEDs |

*(Full high-resolution screenshots are preserved in `docs/screenshots/`)*

---

## 🚀 Quick Start & Deployment

### 1. Docker Compose Deployment (Recommended for Production)
Spin up the entire stack—PostgreSQL 16, FastAPI backend, and Next.js 14 frontend—with automated schema migrations and healthchecks:
```bash
docker compose up -d --build
```
- Frontend UI: `http://localhost:3000`
- Backend API & OpenAPI Docs: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/api/health`

### 2. Local Development Startup

#### Backend (FastAPI)
```powershell
cd "backend"
python -m pip install -r requirements.txt
python run_backend.py
```
*API will be available at `http://localhost:8000/api` (Interactive Swagger docs: `http://localhost:8000/docs`).*

#### Frontend (Next.js 14)
```powershell
cd "frontend"
npm install
npm run build
npm run start
```
*Console will be available at `http://localhost:3000`.*

---

## 🧪 Testing & Verification Suite

Provenance ships with a rigorous 48-test verification suite covering unit, integration, security, and hardening guarantees:
```powershell
python -m pytest backend/tests/ -v -p no:cacheprovider
```

**Results:** `48 passed, 0 failed in 5.29s (100% pass rate)`
- `test_hardening.py`: Complete regression suite verifying all Phase 1–8 architectural hardening guarantees.
- `test_adapters.py`: Native PyMuPDF, RapidOCR, and Adaptive Hybrid router verification.
- `test_full_workflow_integration.py`: Complete 15-stage workflow from ingestion to human review audit trail.
- `test_rigorous_security_audit.py`: 10-vector adversarial penetration and input validation suite.
- `test_security_phase6.py`: Upload magic bytes (%PDF-), MIME verification, size limit, page limit, and prompt injection delimiter defenses.
- `test_dataset_phase5.py`: 40-document ground truth evaluation verifying partition disjointness, multi-page, and degraded scan coverage.
- `test_extraction_phase3.py`: Multi-page extraction chunking, page attribution, and per-document cost ceiling enforcement.
- `test_router_escalation.py`: Verified router escalation for unlocated and low-confidence fields.
- `test_evaluation.py`: Separation of true hallucination rate vs mismatch rate, and exact/normalized metric calculations.

---

## 🛡️ Production Hardening Milestones (Phases 1–9)

- **Phase 1 — Real Spatial Evidence & Polygon Quads:** PyMuPDF quad polygon search replaces synthetic bounding boxes. Unlocated text spans are explicitly flagged and escalated.
- **Phase 2 — Dynamic Explainable Confidence:** Confidence is computed from four verifiable signals (base prior, spatial quad hit, schema type validation, native consensus agreement) with router escalation below 0.85.
- **Phase 3 — Multi-Page Extraction & Schema Validation:** Replaced character truncation with page-by-page chunking, dynamic Pydantic schema validation, and per-document cost ceilings.
- **Phase 4 — Hallucination vs. Mismatch Separation:** Rigorously separated true hallucinations (invented facts not present in the document text layer) from read mismatches, with transparent `[measured]` vs `[modeled]` cost labeling.
- **Phase 5 — Diverse 40-Document Ground Truth:** 40+ deterministic ground-truth documents spanning 8 layouts, 13 multi-page forms, and 11 degraded scans with realistic skew and low DPI.
- **Phase 6 — Server-Side Upload Security:** Enforces magic bytes `%PDF-`, MIME verification, 25MB file size limit, 100-page limit, encrypted PDF rejection, traversal path sanitization, and prompt injection delimiter defenses.
- **Phase 7 — Docker, Postgres & Alembic Migrations:** Production containerization with unprivileged non-root user, PostgreSQL connection support, and automated Alembic schema migrations.
- **Phase 8 — Usability & Artyreal Design Aesthetic:** Streamlined 4-link core navigation, collapsible tools menu, centered empty state onboarding, 3-step persistent guided tour, and zero-horizontal-scroll 390px mobile responsiveness.
- **Phase 9 — Comprehensive Verification & Delivery:** 48/48 green test suite, verified documentation, and clean merge.

---

## 📚 Technical Specifications & Audit Reports

The complete engineering documentation is indexed in `docs/`:
- [`POST_BUILD_AUDIT.md`](docs/POST_BUILD_AUDIT.md) — Severity-ranked defect audit and remediation logs.
- [`FRONTEND_VISUAL_QA.md`](docs/FRONTEND_VISUAL_QA.md) — Visual QA verification across all 12 views with Edge headless screenshots.
- [`SECURITY_TEST_REPORT.md`](docs/SECURITY_TEST_REPORT.md) — 10-vector adversarial penetration and input validation audit.
- [`DATASET_AND_BENCHMARK_REPORT.md`](docs/DATASET_AND_BENCHMARK_REPORT.md) — Ground truth evaluation with zero cross-partition leakage.
- [`OCR_CAPABILITY_REPORT.md`](docs/OCR_CAPABILITY_REPORT.md) — Empirical matrix benchmark across digital, scan, low-quality, mixed, and multi-page PDFs.
- [`REAL_WORKFLOW_TEST_REPORT.md`](docs/REAL_WORKFLOW_TEST_REPORT.md) — 15-stage end-to-end integration test execution audit.
- [`FIXES_APPLIED.md`](docs/FIXES_APPLIED.md) — Comprehensive technical changelog of all architectural remediations.

---

## 📄 License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
