# Real Insurance PDF Benchmark Ingestion Directory

This directory is the documented local storage path for ingesting and benchmarking private, real-world insurance documents.

## How to Benchmark Real Documents

1. **Drop your PDFs here**:
   Place any real insurance claims, policy schedules, or invoices directly into this directory:
   `D:\PDF Extracter\backend\data\real_benchmarks\`

2. **Ingest and Evaluate**:
   Run the ingestion script from the repository root:
   ```bash
   python scripts/ingest_real_benchmarks.py
   ```
   This will:
   - Compute SHA-256 checksums and verify integrity.
   - Run page inspection, DPI estimation, and quality profiling.
   - Automatically classify document types (FNOL Claim, Commercial Invoice, Policy Declarations).
   - Label documents with `synthetic: false` in the database.
   - Ingest into the `Real Production Documents` benchmark dataset for cross-engine evaluation.

3. **View in UI**:
   Navigate to the **Datasets** or **Evaluation** page in the web interface (`http://localhost:3000/datasets`).
   Documents will appear labeled with `[PRODUCTION / REAL DOCUMENT]`.
