import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Dataset, DatasetDocument, GroundTruthAnnotation, Document, Workspace
from app.services.synthetic_generator import synthetic_generator
from app.services.ground_truth import REFERENCE_DOCUMENTS
from app.services.storage import storage_service
from app.services.pdf_inspector import pdf_inspector
from app.config import settings

router = APIRouter(prefix="/datasets", tags=["Datasets & Ground Truth"])

@router.get("")
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).all()
    results = []
    for d in datasets:
        doc_count = len(d.dataset_documents)
        results.append({
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "source_type": d.source_type,
            "version": d.version,
            "document_count": doc_count,
            "created_at": d.created_at.isoformat()
        })
    return {"datasets": results}

@router.post("/generate-synthetic")
def generate_synthetic_dataset(
    dataset_name: str = Body("Insurance Benchmark Gold V1", embed=True),
    count: int = Body(40, le=50, embed=True),
    db: Session = Depends(get_db)
):
    ws = db.query(Workspace).filter_by(slug="default").first()
    if not ws:
        ws = Workspace(name="Default Workspace", slug="default")
        db.add(ws)
        db.flush()

    # Create dataset
    dataset = Dataset(
        workspace_id=ws.id,
        name=dataset_name,
        description="Verified benchmark partition with 40+ documents, 8 layout variants, multi-page splits, and degraded scans.",
        source_type="synthetic",
        version="1.0.0"
    )
    db.add(dataset)
    db.flush()

    created_docs = []

    for i in range(count):
        spec = REFERENCE_DOCUMENTS[i % len(REFERENCE_DOCUMENTS)]
        temp_filename = f"synthetic_eval_{spec['id']}.pdf"
        temp_path = str(settings.STORAGE_ROOT / "processed" / temp_filename)
        
        gt = synthetic_generator.render_from_spec(spec, temp_path)
        dtype = spec["doc_type"]
        qual = "DEGRADED_SCAN" if spec.get("is_scan") else "HIGH_DIGITAL"
        pages = spec.get("pages", 1)

        if dtype == "claim_form":
            orig_name = f"Claim_FNOL_{gt.get('claim_id', spec['id'])}.pdf"
        elif dtype == "insurance_invoice":
            orig_name = f"Invoice_{gt.get('invoice_number', spec['id'])}.pdf"
        else:
            orig_name = f"Policy_{gt.get('policy_number', spec['id'])}.pdf"

        with open(temp_path, "rb") as f:
            pdf_bytes = f.read()

        storage_path, checksum, file_size = storage_service.save_upload(pdf_bytes, orig_name)

        doc = Document(
            workspace_id=ws.id,
            filename=os.path.basename(storage_path),
            original_filename=orig_name,
            checksum=checksum,
            file_size_bytes=file_size,
            storage_path=storage_path,
            document_type=dtype,
            quality_category=qual,
            page_count=pages,
            is_synthetic=True,
            status="completed"
        )
        db.add(doc)
        db.flush()

        # Render preview pages
        pdf_inspector.inspect_document(doc.id, storage_path)

        # Link to dataset with partition split
        split = spec.get("split", "test")
        ds_doc = DatasetDocument(
            dataset_id=dataset.id,
            document_id=doc.id,
            split=split,
            quality_profile=qual
        )
        db.add(ds_doc)
        db.flush()

        # Seed Gold Standard Annotations directly from independent ground truth
        for fname, exp_val in gt.items():
            ann = GroundTruthAnnotation(
                dataset_document_id=ds_doc.id,
                field_name=fname,
                expected_value=str(exp_val),
                normalized_value=str(exp_val),
                page_number=1,
                is_gold_standard=True,
                annotator="ground_truth_repository"
            )
            db.add(ann)

        created_docs.append(orig_name)
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

    db.commit()
    return {
        "message": f"Successfully created synthetic benchmark dataset '{dataset.name}' with {count} documents across {len(REFERENCE_DOCUMENTS)} verified ground truth specifications.",
        "dataset_id": dataset.id,
        "document_count": count,
        "documents": created_docs,
        "sample_documents": created_docs[:5]
    }

