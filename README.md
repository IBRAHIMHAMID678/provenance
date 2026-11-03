# Insurance Document Intelligence Lab

> **"Extract less blindly. Verify more intelligently."**

An enterprise document extraction, verification, routing, and benchmarking platform built for insurance operations. Optimizes for **Cost per Correct Field** rather than raw API token costs.

---

## 🏛️ System Architecture

- **Backend**: FastAPI 0.140, Python 3.11, SQLAlchemy 2.0 (SQLite WAL), PyMuPDF, ReportLab.
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Storage**: Clean filesystem storage abstraction located in `D:\PDF Extracter\backend\data\`.
- **Extraction Engines**: PyMuPDF Native, Tesseract OCR, PaddleOCR, LLM (Groq/Gemini/Mock), Multimodal Vision, and Adaptive Hybrid Router.

---

## 🚀 Quick Start (Windows)

### 1. Backend Setup
```powershell
cd "D:\PDF Extracter\backend"
python -m pip install -r requirements.txt
python run_backend.py
```
Backend API and OpenAPI docs will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```powershell
cd "D:\PDF Extracter\frontend"
npm install
npm run dev
```
Frontend operations dashboard will be available at `http://localhost:3000`.

---

## 📚 Engineering Documentation
- [Project Specification](docs/PROJECT_SPEC.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Build Status](docs/BUILD_STATUS.md)
- [Architectural Decisions (ADR)](docs/DECISIONS.md)
- [Test Plan](docs/TEST_PLAN.md)
- [Security & Threat Model](docs/SECURITY.md)
- [Evaluation Methodology](docs/EVALUATION_METHODOLOGY.md)

