from app.services.adapters import get_adapter
from app.schemas.insurance_schemas import get_schema

def test_native_adapter_extraction(sample_claim_pdf):
    pdf_path, gt = sample_claim_pdf
    adapter = get_adapter("native_pymupdf")
    schema = get_schema("claim_form")
    
    result = adapter.extract("test_native_01", pdf_path, schema)
    assert result.status == "completed"
    assert result.method_id == "native_pymupdf"
    assert result.duration_ms > 0
    assert result.calculated_cost_usd == 0.0  # Native has zero external API cost
    
    # Check claim_id field
    claim_id_field = next((f for f in result.fields if f.field_name == "claim_id"), None)
    assert claim_id_field is not None
    assert claim_id_field.state == "extracted"
    assert claim_id_field.raw_value == gt["claim_id"]

def test_hybrid_router_extraction(sample_claim_pdf):
    pdf_path, gt = sample_claim_pdf
    adapter = get_adapter("hybrid")
    schema = get_schema("claim_form")
    
    result = adapter.extract("test_hybrid_01", pdf_path, schema)
    assert result.status == "completed"
    assert result.method_id == "hybrid"
    assert "routing_log" in result.metadata
    assert len(result.fields) > 0

def test_tesseract_adapter_graceful_capability_check():
    adapter = get_adapter("tesseract")
    avail, reason = adapter.is_available()
    assert isinstance(avail, bool)
    assert isinstance(reason, str)

