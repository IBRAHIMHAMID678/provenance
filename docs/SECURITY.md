# SECURITY & THREAT MODEL
## Insurance Document Intelligence Lab

### 1. Threat Landscape
Insurance claims and invoices submitted to automated extraction pipelines are inherently untrusted external inputs. Attack vectors include:
1. **Direct Prompt Injection via Document Content**: Embedded white-on-white text or hidden OCR layers designed to hijack LLM instructions (e.g., instructing the model to mark fraud checks passed or inflate claim limits).
2. **Denial of Service & Resource Exhaustion (Zip Bombs / PDF Decompression)**: Malformed PDFs with recursive stream compression or infinite object loops designed to exhaust server RAM or hang OCR workers.
3. **Arbitrary Code Execution & SSRF**: Exploit attempts leveraging PDF rendering engine vulnerabilities (e.g. Ghostscript or poppler buffer overflows) or external URI action triggers.
4. **Path Traversal & Filename Spoofing**: Malicious filenames containing `../` or null bytes targeting host storage overwrites.
5. **PII Leakage in Operational Logs**: Accidental exposure of policyholder SSNs, medical diagnostics, or banking numbers in debug logs or telemetry.

---

### 2. Mitigation Strategies & Implementation Controls

#### A. PDF Validation & Ingestion Sanitization
- File signature inspection: Files must begin with `%PDF-` bytes; file extensions are untrusted.
- File size boundary: Configurable ceiling (default 25 MB).
- Page count ceiling: Configurable ceiling (default 100 pages per document).
- Filename sanitization: `Path(filename).name` stripped of all non-alphanumeric characters except standard safe delimiters (`_`, `-`, `.`). Stored internally under UUID4 keys.

#### B. Prompt Injection Defense Architecture
- **Instruction/Data Boundary Enforcement**: System instructions are strictly isolated from user document text using delimited XML/JSON data containers (e.g. `<untrusted_document_content>`).
- **Strict Pydantic Output Enforcement**: The extraction output must deserialize into rigid Pydantic schemas. Unrecognized keys or natural language commentary are immediately rejected.
- **Zero Tool Execution**: Extraction models operate in isolated read-only contexts with zero tool permissions, zero internet access, and no shell execution privileges.
- **Deterministic Post-Validation**: Every output from an LLM is cross-checked by the deterministic Python validation engine. Even if an injection forces a status to "APPROVED", the validation engine flags contradictory data.

#### C. Data Protection & Tenant Isolation
- File storage located on D: drive (`D:\PDF Extracter\backend\data\uploads`) is shielded from direct web server public directory indexing.
- Files are retrieved solely through authenticated FastAPI streaming endpoints with content-disposition and MIME security headers.
- Operational logs are masked: sensitive identifiers (SSN, credit card, bank routing) are redacted using regex filters before writing to disk.
- Secrets (`API_KEYS`, database credentials) are loaded from `.env` and never surfaced in frontend API responses or settings dumps.

