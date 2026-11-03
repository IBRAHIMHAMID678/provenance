import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Dataset, DatasetDocument, GroundTruthAnnotation, Document, Workspace
from app.services.synthetic_generator import synthetic_generator
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
    count: int = Body(6, le=30, embed=True),
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
        description="Synthetic ground-truth partition with multi-type claims, policies, and invoices.",
        source_type="synthetic",
        version="1.0.0"
    )
    db.add(dataset)
    db.flush()

    splits = ["test", "test", "val", "train"]
    created_docs = []

    for i in range(count):
        seed = 100 + i * 17
        doc_type_choice = i % 3
        temp_filename = f"synthetic_eval_{i+1}.pdf"
        temp_path = str(settings.STORAGE_ROOT / "processed" / temp_filename)
        
        if doc_type_choice == 0:
            gt = synthetic_generator.generate_claim_form(temp_path, seed=seed)
            dtype = "claim_form"
            orig_name = f"Claim_FNOL_{gt['claim_id']}.pdf"
        elif doc_type_choice == 1:
            gt = synthetic_generator.generate_invoice(temp_path, seed=seed)
            dtype = "insurance_invoice"
            orig_name = f"Invoice_{gt['invoice_number']}.pdf"
        else:
            gt = synthetic_generator.generate_policy_schedule(temp_path, seed=seed)
            dtype = "policy_schedule"
            orig_name = f"Policy_{gt['policy_number']}.pdf"

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
            quality_category="HIGH_DIGITAL",
            page_count=1,
            status="completed"
        )
        db.add(doc)
        db.flush()

        # Render preview page
        pdf_inspector.inspect_document(doc.id, storage_path)

        # Link to dataset with partition split
        split = splits[i % len(splits)]
        ds_doc = DatasetDocument(
            dataset_id=dataset.id,
            document_id=doc.id,
            split=split,
            quality_profile="HIGH_DIGITAL"
        )
        db.add(ds_doc)
        db.flush()

        # Seed Gold Standard Annotations
        for fname, exp_val in gt.items():
            ann = GroundTruthAnnotation(
                dataset_document_id=ds_doc.id,
                field_name=fname,
                expected_value=str(exp_val),
                normalized_value=str(exp_val),
                page_number=1,
                is_gold_standard=True,
                annotator="synthetic_truth_generator"
            )
            db.add(ann)

        created_docs.append(orig_name)
        if os.path.exists(temp_path):
            os.remove(temp_path)

    db.commit()
    return {
        "message": f"Successfully created synthetic benchmark dataset '{dataset.name}' with {count} documents.",
        "dataset_id": dataset.id,
        "documents": created_docs
    }

