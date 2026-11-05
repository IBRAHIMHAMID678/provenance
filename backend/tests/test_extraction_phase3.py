import pytest
import os
import fitz
from app.services.adapters.llm_adapter import llm_adapter
from app.schemas.insurance_schemas import get_schema
from app.config import settings

def test_page_chunking_and_attribution(tmp_path):
    # Create a 2-page PDF where policy_number is on Page 1 and damage_type is on Page 2
    pdf_path = str(tmp_path / "multipage_test.pdf")
    doc = fitz.open()

    p1 = doc.new_page()
    p1.insert_text((72, 100), "INSURANCE CLAIM FORM PAGE 1\nClaim ID: CLM-P3-9999\nPolicy Number: POL-778899\nClaimant Name: Alice Morgan")

    p2 = doc.new_page()
    p2.insert_text((72, 100), "ADDITIONAL DETAILS PAGE 2\nDamage Category: Water and Structural Damage\nIncident Location: Sector 7 Industrial Zone\nIncident Date: 2026-03-15")

    doc.save(pdf_path)
    doc.close()

    schema = get_schema("claim_form")
    result = llm_adapter.extract("doc_phase3_test", pdf_path, schema)

    assert result.status == "completed"
    assert result.metadata["page_count"] == 2
    
    # Check that fields from both pages were extracted and attributed
    fields_by_name = {f.field_name: f for f in result.fields}
    assert "policy_number" in fields_by_name
    assert fields_by_name["policy_number"].raw_value == "POL-778899"
    assert fields_by_name["policy_number"].evidence_located is True

    evidence_by_name = {e.field_name: e for e in result.evidence}
    assert evidence_by_name["policy_number"].page_number == 1

    # Check damage_type on page 2
    assert "incident_date" in fields_by_name
    assert fields_by_name["incident_date"].raw_value == "2026-03-15"
    assert evidence_by_name["incident_date"].page_number == 2

def test_cost_ceiling_truncation(tmp_path):
    # Set a tiny cost ceiling and verify warning
    pdf_path = str(tmp_path / "cost_ceiling_test.pdf")
    doc = fitz.open()
    for i in range(5):
        p = doc.new_page()
        p.insert_text((72, 100), f"Page {i+1} Claim ID: CLM-COST-{i}")
    doc.save(pdf_path)
    doc.close()

    orig_ceiling = settings.PER_DOCUMENT_COST_CEILING_USD
    try:
        settings.PER_DOCUMENT_COST_CEILING_USD = 0.0000001  # extremely low to trigger ceiling
        schema = get_schema("claim_form")
        res = llm_adapter.extract("doc_cost_ceiling", pdf_path, schema)
        assert any("cost ceiling reached" in w for w in res.warnings)
    finally:
        settings.PER_DOCUMENT_COST_CEILING_USD = orig_ceiling

def test_model_metadata_and_pricing():
    schema = get_schema("claim_form")
    mock_dict, pt, ct, provider, model = llm_adapter._call_provider("Claim ID: CLM-101", schema)
    assert provider == "mock"
    assert model == "mock-regex-extractor"
    assert pt > 0
    assert ct > 0

