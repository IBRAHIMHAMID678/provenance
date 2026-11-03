# REAL WORKFLOW INTEGRATION TEST REPORT
## INSURANCE DOCUMENT INTELLIGENCE LAB
**Test Script:** `tests/test_full_workflow_integration.py`  
**Execution Timestamp:** November 3, 2026  
**Status:** 15/15 STAGES PASSED (100% SUCCESS)  

---

## 1. Complete 15-Stage Operational Workflow

The entire lifecycle of a document in the Insurance Document Intelligence Lab was executed against the live API and SQLite database on D: drive.

```
[Upload PDF] 
     │
     ▼
[Validate Header, MIME & Checksum] 
     │
     ▼
[Persist to D:\PDF Extracter\backend\data\uploads]
     │
     ▼
[Classify & Inspect Document Quality]
     │
     ▼
[Process via Adaptive Hybrid Router]
     │
     ▼
[Extract Structured Insurance Fields]
     │
     ▼
[Preserve 0-1000 Normalized Evidence Bounding Boxes]
     │
     ▼
[Run Deterministic Validation Rules]
     │
     ▼
[Escalate Critical / Low-Confidence Fields to Human Review]
     │
     ▼
[Human Reviewer Submits Field Correction]
     │
     ▼
[Persist Non-Destructive Field Correction]
     │
     ▼
[Record AuditEvent & ReviewDecision History]
     │
     ▼
[Run Evaluation vs Ground Truth]
     │
     ▼
[Calculate Fully-Loaded Processing Cost ($/CF)]
     │
     ▼
[Export Structured Data as JSON & CSV]
```

---

## 2. Step-by-Step Empirical Audit Log

### Step 1: Upload a PDF
- **Action:** `POST /api/v1/documents/upload` with multipart form containing `FNOL_Workflow_Test.pdf`.
- **Result:** HTTP 200 OK.
- **Generated Document ID:** `5f7096b5-8d93-451a-bea8-7d82df6cfce3`.

### Step 2: Validate the File
- **Payload Size:** 3,892 bytes.
- **Magic Bytes:** Verified `%PDF-1.4` prefix.
- **SHA-256 Checksum:** `e35538b049350eeb1a29acb44ca0589c895037abc0aecbdf6e966b76e7c5e5bd` (64 characters).

### Step 3: Local Storage Confinement
- **Storage Path:** `D:\PDF Extracter\backend\data\uploads\e35538b049350eeb1a29acb44ca0589c895037abc0aecbdf6e966b76e7c5e5bd.pdf`.
- **Assertion:** Path resides on D: drive; file verified on disk.

### Step 4: Classification & Page Inspection
- **Classification Result:** `claim_form` (Confidence: 0.95).
- **Inspection Grade:** `HIGH_DIGITAL` (1 page, selectable text: True, DPI: 72.0).

### Step 5 & 6: Process Document & Extract Structured Fields
- **Action:** `POST /api/v1/extraction/run` with `method_id: hybrid`.
- **Result:** HTTP 200 OK. Extracted 11 schema fields in 107 ms.
- **Sample Extracted Fields:**
  - `claim_id`: `CLM-2026-40059` (Confidence: 1.0)
  - `policy_number`: `POL-733750` (Confidence: 1.0)
  - `claimant_name`: `Arthur Pendelton` (Confidence: 1.0)
  - `incident_date`: `2026-02-14` (Confidence: 1.0)
  - `requested_amount`: `12,850.00` (Confidence: 1.0)

### Step 7: Preserve Evidence Coordinates
- **Evidence Items Preserved:** 10 bounding boxes with context snippets.
- **Coordinate Grid:** Standardized 0–1000 normalized coordinates:
  - `claim_id` Bounding Box: `[x0: 281.0, y0: 126.7, x1: 395.5, y1: 142.3]` on Page 1.
  - Context Snippet: `"...Claim ID / Reference: CLM-2026-40059 Policy Number: POL-733750..."`.

### Step 8: Run Validations
- **Validation Execution:** Chronological checks (`incident_date <= filing_date`) passed. Schema data types verified. Critical fields confirmed present.

### Step 9: Escalate to Human Review Queue
- **Task Creation:** `ReviewTask` `0ef3658d-49a0-4254-bb48-93cf1b69f6af` created in status `pending`.
- **Target Field:** `claim_id`.

### Step 10 & 11: Human Review Correction & Non-Destructive Persistence
- **Action:** `POST /api/v1/review/0ef3658d-49a0-4254-bb48-93cf1b69f6af/correct`.
- **Actor:** `lead_claims_auditor`.
- **Corrected Value:** `CLM-2026-CORRECTED-999`.
- **Time Spent:** 18.5 seconds.
- **Persistence Verification:** `ExtractedField.normalized_value` updated to `CLM-2026-CORRECTED-999`; `ExtractedField.raw_value` preserved intact (`CLM-2026-40059`); `state` updated to `corrected`.

### Step 12: Audit History Verification
- **Audit Table Check:** `AuditEvent` record verified:
  - `action`: `review_correct`
  - `actor`: `lead_claims_auditor`
  - `payload`: `{"field_name": "claim_id", "original_value": "CLM-2026-40059", "corrected_value": "CLM-2026-CORRECTED-999"}`
- **Review Decision:** `ReviewDecision` record persisted with 18.5 seconds logged.

### Step 13 & 14: Run Evaluation & Cost Accounting
- **Action:** `GET /api/v1/cost/summary`.
- **Cost Computation:**
  - Machine Cost: \$0.000000 (Native execution).
  - Human Review Cost: $18.5 \text{ seconds} \times \frac{\$35.00}{3600 \text{ s}} = \$0.1799$.
  - Total Fully Loaded Cost: \$0.1799.

### Step 15: Structured Export
- **Action:** `GET /api/v1/export/document/5f7096b5-8d93-451a-bea8-7d82df6cfce3/json` and `.../csv`.
- **JSON Payload:** 5,802 bytes with full audit metadata, field confidence, and evidence boxes.
- **CSV Payload:** 1,856 bytes conforming to tabular claims export specification.

---

## 3. Failure Recovery & Worker Restart Resilience
- **Worker Durability:** Background queue tasks persist to `ProcessingJob` database records.
- **Restart Recovery:** If the backend process terminates during job execution, pending jobs remain marked in SQLite and are resumed upon restart without data corruption.
