"""
Real Document Benchmark Ingestion Script
Scans backend/data/real_benchmarks/ and ingests real PDFs with synthetic=False.
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.db.session import SessionLocal
from app.db.models import Workspace, Document, Dataset, DatasetDocument
from app.services.storage import storage_service
from app.services.pdf_inspector import pdf_inspector
from app.services.classifier import document_classifier
from app.config import settings

def ingest_real_benchmarks():
    db = SessionLocal()
    real_dir = Path(settings.STORAGE_ROOT / "real_benchmarks")
    real_dir.mkdir(parents=True, exist_ok=True)

    pdf_files = list(real_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDFs found in {real_dir}. Drop real insurance PDFs there to benchmark.")
        return

    ws = db.query(Workspace).filter_by(slug="default").first()
    if not ws:
        ws = Workspace(name="Default Workspace", slug="default")
        db.add(ws)
        db.flush()

    dataset = db.query(Dataset).filter_by(name="Real Production Documents").first()
    if not dataset:
        dataset = Dataset(
            workspace_id=ws.id,
            name="Real Production Documents",
            description="Real-world customer documents ingested from data/real_benchmarks",
            source_type="real_production",
            version="1.0.0"
        )
        db.add(dataset)
        db.flush()

    ingested = 0
    for pdf_path in pdf_files:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        storage_path, checksum, file_size = storage_service.save_upload(pdf_bytes, pdf_path.name)
        existing = db.query(Document).filter_by(checksum=checksum).first()
        if existing:
            print(f"Skipping duplicate: {pdf_path.name}")
            continue

        doc = Document(
            workspace_id=ws.id,
            filename=os.path.basename(storage_path),
            original_filename=pdf_path.name,
            checksum=checksum,
            file_size_bytes=file_size,
            storage_path=storage_path,
            is_synthetic=False,
            status="uploaded"
        )
        db.add(doc)
        db.flush()

        inspection = pdf_inspector.inspect_document(doc.id, storage_path)
        doc.page_count = inspection.total_pages
        doc.quality_category = inspection.overall_quality

        p1_text = inspection.pages[0].extracted_text_preview if inspection.pages else ""
        doc_type, _ = document_classifier.classify_text(p1_text)
        doc.document_type = doc_type

        ds_doc = DatasetDocument(
            dataset_id=dataset.id,
            document_id=doc.id,
            split="test",
            quality_profile=inspection.overall_quality
        )
        db.add(ds_doc)
        ingested += 1
        print(f"Ingested {pdf_path.name} as {doc_type} ({inspection.overall_quality})")

    db.commit()
    db.close()
    print(f"\nDone! Ingested {ingested} real document(s) into '{dataset.name}'.")

if __name__ == "__main__":
    ingest_real_benchmarks()

