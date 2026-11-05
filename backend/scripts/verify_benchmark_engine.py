import os
import sys
import json
import time
from pathlib import Path

# Set up Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.db.models import Workspace, Dataset, DatasetDocument, GroundTruthAnnotation, Document, ExperimentRun, EvaluationResult
from app.services.synthetic_generator import SyntheticDocumentGenerator
from app.services.storage import storage_service
from app.services.pdf_inspector import pdf_inspector
from app.services.adapters.native_pymupdf import native_adapter
from app.services.adapters.paddleocr_adapter import paddleocr_adapter
from app.services.adapters.hybrid_router import HybridRouterAdapter
from app.services.evaluation_service import evaluation_engine
from app.schemas.insurance_schemas import get_schema
from app.config import settings

def run_benchmark_verification():
    db = SessionLocal()
    print("=================================================================")
    print("INSURANCE DOCUMENT INTELLIGENCE LAB - BENCHMARK VERIFICATION AUDIT")
    print("=================================================================\n")

    # 1. Clean or get workspace
    ws = db.query(Workspace).filter_by(slug="default").first()
    if not ws:
        ws = Workspace(name="Default Workspace", slug="default")
        db.add(ws)
        db.commit()

    # 2. Seed Gold Benchmark Dataset
    benchmark_name = "Deterministic Insurance Benchmark Gold 30"
    existing_ds = db.query(Dataset).filter_by(name=benchmark_name).first()
    if existing_ds:
        # Delete existing dataset documents and annotations to ensure clean deterministic run
        for dd in existing_ds.dataset_documents:
            db.query(GroundTruthAnnotation).filter_by(dataset_document_id=dd.id).delete()
            db.delete(dd)
        db.delete(existing_ds)
        db.commit()

    dataset = Dataset(
        workspace_id=ws.id,
        name=benchmark_name,
        description="Deterministic 30-document multi-class benchmark partition with verified ground truth.",
        source_type="synthetic",
        version="1.0.0"
    )
    db.add(dataset)
    db.commit()

    print(f">> Generating 30 Deterministic Documents for Dataset '{benchmark_name}'...")
    TOTAL_DOCS = 30
    temp_dir = settings.STORAGE_ROOT / "processed" / "benchmark_temp"
    temp_dir.mkdir(parents=True, exist_ok=True)

    # Clean partition splits: 18 Train (60%), 6 Val (20%), 6 Test (20%)
    split_assignment = ["train"] * 18 + ["val"] * 6 + ["test"] * 6

    dataset_documents = []
    checksum_set = set()
    documents_metadata = []

    for idx in range(TOTAL_DOCS):
        seed = 1000 + idx * 37
        split = split_assignment[idx]
        doc_type_idx = idx % 3

        temp_pdf = str(temp_dir / f"bench_doc_{idx:02d}.pdf")

        if doc_type_idx == 0:
            gt = SyntheticDocumentGenerator.generate_claim_form(temp_pdf, seed=seed)
            dtype = "claim_form"
            orig_name = f"Gold_Claim_{gt['claim_id']}.pdf"
        elif doc_type_idx == 1:
            gt = SyntheticDocumentGenerator.generate_invoice(temp_pdf, seed=seed)
            dtype = "insurance_invoice"
            orig_name = f"Gold_Invoice_{gt['invoice_number']}.pdf"
        else:
            gt = SyntheticDocumentGenerator.generate_policy_schedule(temp_pdf, seed=seed)
            dtype = "policy_schedule"
            orig_name = f"Gold_Policy_{gt['policy_number']}.pdf"

        with open(temp_pdf, "rb") as f:
            pdf_bytes = f.read()

        storage_path, checksum, file_size = storage_service.save_upload(pdf_bytes, orig_name)
        checksum_set.add(checksum)

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

        # Render preview and extract inspection
        pdf_inspector.inspect_document(doc.id, storage_path)

        ds_doc = DatasetDocument(
            dataset_id=dataset.id,
            document_id=doc.id,
            split=split,
            quality_profile="HIGH_DIGITAL"
        )
        db.add(ds_doc)
        db.flush()

        # Seed Ground Truth Annotations
        for fname, exp_val in gt.items():
            ann = GroundTruthAnnotation(
                dataset_document_id=ds_doc.id,
                field_name=fname,
                expected_value=str(exp_val),
                normalized_value=str(exp_val),
                page_number=1,
                is_gold_standard=True,
                annotator="synthetic_benchmark_generator"
            )
            db.add(ann)

        dataset_documents.append(ds_doc)
        documents_metadata.append({
            "doc_id": doc.id,
            "filename": orig_name,
            "storage_path": storage_path,
            "type": dtype,
            "split": split,
            "ground_truth": gt
        })

        if os.path.exists(temp_pdf):
            os.remove(temp_pdf)

    db.commit()
    print(f"   Successfully seeded {len(dataset_documents)} documents with annotations.")

    # 3. Partition Verification & Leakage Assertion
    print("\n--- PARTITION INTEGRITY AUDIT ---")
    train_docs = [d for d in documents_metadata if d["split"] == "train"]
    val_docs = [d for d in documents_metadata if d["split"] == "val"]
    test_docs = [d for d in documents_metadata if d["split"] == "test"]

    print(f"   Train Partition:      {len(train_docs)} documents ({len(train_docs)/TOTAL_DOCS*100:.1f}%)")
    print(f"   Validation Partition: {len(val_docs)} documents ({len(val_docs)/TOTAL_DOCS*100:.1f}%)")
    print(f"   Test Partition:       {len(test_docs)} documents ({len(test_docs)/TOTAL_DOCS*100:.1f}%)")

    # Check for duplicate leakage across splits
    train_checksums = {d["filename"] for d in train_docs}
    val_checksums = {d["filename"] for d in val_docs}
    test_checksums = {d["filename"] for d in test_docs}

    leakage_train_val = train_checksums.intersection(val_checksums)
    leakage_train_test = train_checksums.intersection(test_checksums)
    leakage_val_test = val_checksums.intersection(test_checksums)

    has_leakage = bool(leakage_train_val or leakage_train_test or leakage_val_test)
    print(f"   Partition Leakage Detected: {has_leakage}")
    if has_leakage:
        raise ValueError("Data leakage detected between dataset partitions!")

    # Check Ground Truth Completeness
    total_annotations = db.query(GroundTruthAnnotation).join(DatasetDocument).filter(DatasetDocument.dataset_id == dataset.id).count()
    print(f"   Total Ground Truth Annotations: {total_annotations} (Avg {total_annotations/TOTAL_DOCS:.1f} fields/doc)")

    # 4. Run Comparative Benchmark on the Test Partition
    print("\n--- RUNNING COMPARATIVE BENCHMARK RUNS (IDENTICAL TEST PARTITION) ---")
    eval_target_docs = test_docs  # 6 held-out test documents

    ground_truth_by_doc = {d["doc_id"]: d["ground_truth"] for d in eval_target_docs}
    critical_fields = ["claim_id", "policy_number", "claimant_name", "invoice_number", "total_amount", "premium_amount"]

    benchmark_engines = [
        {"id": "native_pymupdf", "name": "PyMuPDF Native", "adapter": native_adapter},
        {"id": "paddleocr", "name": "PaddleOCR DL Engine", "adapter": paddleocr_adapter},
        {"id": "hybrid", "name": "Adaptive Hybrid Router", "adapter": HybridRouterAdapter()}
    ]

    benchmark_summaries = {}

    for eng in benchmark_engines:
        m_id = eng["id"]
        m_name = eng["name"]
        adapter = eng["adapter"]
        print(f"\n>> Evaluating [{m_name}] across {len(eval_target_docs)} identical documents...")

        predictions_by_doc = {}
        latencies = []
        total_cost = 0.0

        for d in eval_target_docs:
            schema = get_schema(d["type"])
            t0 = time.time()
            res = adapter.extract(d["doc_id"], d["storage_path"], schema)
            elapsed_ms = (time.time() - t0) * 1000.0
            latencies.append(elapsed_ms)
            total_cost += res.calculated_cost_usd

            doc_preds = {}
            for f in res.fields:
                if f.raw_value:
                    doc_preds[f.field_name] = f.raw_value
            predictions_by_doc[d["doc_id"]] = doc_preds

        # Pass to Evaluation Engine
        summary = evaluation_engine.evaluate_run(
            method_id=m_id,
            predictions_by_doc=predictions_by_doc,
            ground_truth_by_doc=ground_truth_by_doc,
            critical_fields=critical_fields,
            latencies_ms=latencies,
            machine_cost=total_cost,
            human_review_time_seconds=0.0,
            reviewed_docs_count=0
        )

        benchmark_summaries[m_id] = summary.model_dump()

        print(f"   Documents Evaluated:     {summary.total_documents}")
        print(f"   Exact Match Accuracy:    {summary.exact_accuracy*100:.1f}%")
        print(f"   Normalized Accuracy:     {summary.normalized_accuracy*100:.1f}%")
        print(f"   Critical Field Accuracy: {summary.critical_field_accuracy*100:.1f}%")
        print(f"   Completeness:            {summary.completeness*100:.1f}%")
        print(f"   Hallucination Rate:      {summary.hallucination_rate*100:.1f}%")
        print(f"   P50 / P95 Latency:       {summary.p50_latency_ms} ms / {summary.p95_latency_ms} ms")
        print(f"   Total Machine Cost:      ${summary.total_machine_cost:.6f}")
        print(f"   Cost Per Correct Field:  ${summary.cost_per_correct_field:.6f}")

    # 5. Save Benchmark Audit Report Artifact
    out_dir = settings.STORAGE_ROOT / "datasets"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "benchmark_audit_results.json"
    
    audit_data = {
        "dataset_name": benchmark_name,
        "dataset_id": dataset.id,
        "total_documents": TOTAL_DOCS,
        "partitions": {
            "train": len(train_docs),
            "validation": len(val_docs),
            "test": len(test_docs)
        },
        "duplicate_leakage_detected": has_leakage,
        "total_annotations": total_annotations,
        "evaluation_target": "test_partition",
        "benchmark_summaries": benchmark_summaries
    }

    with open(report_file, "w") as f:
        json.dump(audit_data, f, indent=2)

    db.close()
    print(f"\n>> Benchmark verification completed successfully. Saved to: {report_file}")

if __name__ == "__main__":
    run_benchmark_verification()

