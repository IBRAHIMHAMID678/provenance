from app.services.rule_validator import rule_validator
from app.services.adapters.base import ExtractedFieldItem

def test_invoice_reconciliation_pass():
    fields = [
        ExtractedFieldItem(field_name="subtotal", raw_value="1000.00", normalized_value="1000.00"),
        ExtractedFieldItem(field_name="tax_amount", raw_value="80.00", normalized_value="80.00"),
        ExtractedFieldItem(field_name="discount_amount", raw_value="30.00", normalized_value="30.00"),
        ExtractedFieldItem(field_name="total_amount", raw_value="1050.00", normalized_value="1050.00")
    ]
    results = rule_validator.validate_document("insurance_invoice", fields)
    math_rule = next((r for r in results if r.rule_id == "rule_invoice_reconciliation"), None)
    assert math_rule is not None
    assert math_rule.passed is True

def test_invoice_reconciliation_fail():
    fields = [
        ExtractedFieldItem(field_name="subtotal", raw_value="1000.00", normalized_value="1000.00"),
        ExtractedFieldItem(field_name="tax_amount", raw_value="80.00", normalized_value="80.00"),
        ExtractedFieldItem(field_name="discount_amount", raw_value="0.00", normalized_value="0.00"),
        ExtractedFieldItem(field_name="total_amount", raw_value="1500.00", normalized_value="1500.00")  # Discrepancy
    ]
    results = rule_validator.validate_document("insurance_invoice", fields)
    math_rule = next((r for r in results if r.rule_id == "rule_invoice_reconciliation"), None)
    assert math_rule is not None
    assert math_rule.passed is False
    assert math_rule.severity == "critical"

def test_chronological_sanity():
    fields = [
        ExtractedFieldItem(field_name="incident_date", raw_value="2026-05-10", normalized_value="2026-05-10"),
        ExtractedFieldItem(field_name="filing_date", raw_value="2026-05-01", normalized_value="2026-05-01")  # Filing before incident!
    ]
    results = rule_validator.validate_document("claim_form", fields)
    chrono_rule = next((r for r in results if r.rule_id == "rule_chronological_sanity"), None)
    assert chrono_rule is not None
    assert chrono_rule.passed is False

