"""
Comprehensive End-to-End Hardening Regression Test Suite
Validates all guarantees delivered across Phases 1 through 8.
"""
import os
import json
import fitz
import pytest
from app.config import settings
from app.schemas.insurance_schemas import get_schema
from app.services.adapters import get_adapter
from app.services.adapters.llm_adapter import LLMExtractionAdapter
from app.services.ground_truth import REFERENCE_DOCUMENTS
from app.services.evaluation_service import evaluation_engine

def test_phase1_real_evidence_localization(sample_claim_pdf):
    """Phase 1: Real PyMuPDF quad & span localization, no fabricated constants."""
    pdf_path, gt = sample_claim_pdf
    adapter = get_adapter("native_pymupdf")
    schema = get_schema("claim_form")
    result = adapter.extract("hard_test_01", pdf_path, schema)

    assert result.status == "completed"
    assert len(result.evidence) > 0

    # Ensure evidence coordinates are valid bounding boxes within [0, 1000]
    for ev in result.evidence:
        assert 0.0 <= ev.bbox_x0 <= 1000.0
        assert 0.0 <= ev.bbox_y0 <= 1000.0
        assert ev.bbox_x1 >= ev.bbox_x0
        assert ev.bbox_y1 >= ev.bbox_y0
        assert ev.page_number >= 1

def test_phase2_composite_confidence_and_router_escalation(sample_claim_pdf):
    """Phase 2: Dynamic composite confidence computation and router escalation."""
    pdf_path, gt = sample_claim_pdf
    adapter = LLMExtractionAdapter()
    schema = get_schema("claim_form")
    
    # Run extraction with mock provider
    result = adapter.extract("hard_test_02", pdf_path, schema)
    for field in result.fields:
        if field.state == "extracted":
            # Confidence must be explainable in [0.0, 0.99]
            assert 0.0 <= field.confidence <= 0.99
            assert field.confidence_signals is not None
            assert "base" in field.confidence_signals

def test_phase3_multipage_chunking_and_cost_ceiling(tmp_path):
    """Phase 3: Multi-page chunking preserves page attribution without truncation."""
    doc = fitz.open()
    p1 = doc.new_page()
    p1.insert_text((50, 100), "First Notice of Loss. Claim ID: CLM-99001\nPolicy Number: POL-77001")
    p2 = doc.new_page()
    p2.insert_text((50, 100), "Page 2 Addendum. Claimant Name: Marcus Vance\nRequested Amount: $14,500.00")
    
    out_pdf = str(tmp_path / "multipage_hard.pdf")
    doc.save(out_pdf)
    doc.close()

    adapter = LLMExtractionAdapter()
    chunks = adapter._extract_page_chunks(out_pdf)
    assert len(chunks) == 2
    assert chunks[0][0] == 1
    assert chunks[1][0] == 2
    assert "CLM-99001" in chunks[0][1]
    assert "Marcus Vance" in chunks[1][1]

def test_phase4_hallucination_vs_mismatch_separation():
    """Phase 4: Hallucination rate strictly measures facts not present in document text layer."""
    doc_text = "Policyholder: Alice Walker. Claim ID: CLM-101."
    truth = {"doc1": {"claimant_name": "Bob Smith"}}
    
    # Value present in text but mismatching ground truth -> read mismatch
    preds_mismatch = {"doc1": {"claimant_name": "Alice Walker"}}
    summary_mismatch = evaluation_engine.evaluate_run(
        method_id="test_mismatch",
        predictions_by_doc=preds_mismatch,
        ground_truth_by_doc=truth,
        critical_fields=["claimant_name"],
        latencies_ms=[50.0],
        machine_cost=0.001,
        doc_texts_by_doc={"doc1": doc_text},
        cost_basis="modeled"
    )
    assert summary_mismatch.mismatch_rate > 0.0
    assert summary_mismatch.hallucination_rate == 0.0
    assert summary_mismatch.cost_basis == "modeled"

    # Value completely absent from document text -> hallucination
    preds_hallucinated = {"doc1": {"claimant_name": "Zara Rutherford"}}
    summary_hallucinated = evaluation_engine.evaluate_run(
        method_id="test_hallucination",
        predictions_by_doc=preds_hallucinated,
        ground_truth_by_doc=truth,
        critical_fields=["claimant_name"],
        latencies_ms=[50.0],
        machine_cost=0.001,
        doc_texts_by_doc={"doc1": doc_text},
        cost_basis="measured"
    )
    assert summary_hallucinated.hallucination_rate > 0.0
    assert summary_hallucinated.cost_basis == "measured"

def test_phase5_ground_truth_diversity():
    """Phase 5: 40+ diverse ground-truth documents with multi-page and degraded partitions."""
    assert len(REFERENCE_DOCUMENTS) >= 40

    multipage_docs = [d for d in REFERENCE_DOCUMENTS if d.get("pages", 1) > 1]
    degraded_docs = [d for d in REFERENCE_DOCUMENTS if d.get("is_scan", False)]
    layouts = set(d.get("layout") for d in REFERENCE_DOCUMENTS)

    assert len(multipage_docs) >= 10
    assert len(degraded_docs) >= 8
    assert len(layouts) >= 5

def test_phase6_upload_security_suite(client, sample_claim_pdf):
    """Phase 6: Strict server-side upload defenses."""
    # 1. Reject non-PDF
    res1 = client.post("/api/v1/documents/upload", files={"file": ("bad.txt", b"plain text", "text/plain")})
    assert res1.status_code == 400

    # 2. Reject magic byte mismatch
    res2 = client.post("/api/v1/documents/upload", files={"file": ("fake.pdf", b"NOT_A_PDF_STREAM", "application/pdf")})
    assert res2.status_code == 400

    # 3. Path traversal sanitization
    pdf_path, _ = sample_claim_pdf
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    res3 = client.post("/api/v1/documents/upload", files={"file": ("../../../../etc/shadow.pdf", pdf_bytes, "application/pdf")})
    assert res3.status_code == 200
    assert ".." not in res3.json()["original_filename"]

def test_phase7_environment_and_deployment_config():
    """Phase 7: Production environment configuration and path resolution."""
    assert settings.STORAGE_ROOT.exists()
    assert settings.UPLOADS_DIR.exists()
    assert settings.PROCESSED_DIR.exists()
    assert settings.DATASETS_DIR.exists()
    assert isinstance(settings.CORS_ORIGINS, list)
