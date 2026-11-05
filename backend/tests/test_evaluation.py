from app.services.evaluation_service import evaluation_engine

def test_evaluation_metrics_calculation():
    preds = {
        "doc1": {"claim_id": "CLM-100", "requested_amount": "5000.00", "currency": "USD"},
        "doc2": {"claim_id": "CLM-200", "requested_amount": "8000.00", "currency": "USD"}
    }
    truth = {
        "doc1": {"claim_id": "CLM-100", "requested_amount": "$5,000.00", "currency": "USD"},
        "doc2": {"claim_id": "CLM-200", "requested_amount": "8500.00", "currency": "USD"}  # Discrepancy
    }
    
    summary = evaluation_engine.evaluate_run(
        method_id="test_method",
        predictions_by_doc=preds,
        ground_truth_by_doc=truth,
        critical_fields=["claim_id", "requested_amount"],
        latencies_ms=[120.0, 150.0],
        machine_cost=0.010,
        human_review_time_seconds=60.0
    )
    
    assert summary.total_documents == 2
    assert summary.total_fields == 6
    # doc1 has 3 normalized matches (CLM-100, 5000.00, USD), doc2 has 2 (CLM-200, USD) -> 5 correct
    assert summary.total_correct_fields == 5
    assert summary.normalized_accuracy > 0.8
    assert summary.p50_latency_ms == 135.0
    assert summary.cost_per_correct_field > 0
    assert summary.cost_per_correct_field != float("inf")

def test_evaluation_zero_correct_division_protection():
    preds = {"doc1": {"claim_id": "WRONG"}}
    truth = {"doc1": {"claim_id": "EXPECTED"}}
    
    summary = evaluation_engine.evaluate_run(
        method_id="failing_method",
        predictions_by_doc=preds,
        ground_truth_by_doc=truth,
        critical_fields=["claim_id"],
        latencies_ms=[50.0],
        machine_cost=0.05
    )
    
    assert summary.total_correct_fields == 0
    assert summary.cost_per_correct_field == float("inf")

def test_evaluation_hallucination_vs_mismatch_separation():
    # Doc text contains "EXPECTED" and "OTHER_TEXT_IN_DOC", but does NOT contain "FABRICATED_GHOST"
    doc_text = "Claim reference EXPECTED with OTHER_TEXT_IN_DOC noted."
    
    preds = {
        "doc1": {
            "field_a": "OTHER_TEXT_IN_DOC",  # Mismatch (present in text, but wrong field)
            "field_b": "FABRICATED_GHOST"     # Hallucination (invented fact, completely absent from text)
        }
    }
    truth = {
        "doc1": {
            "field_a": "EXPECTED",
            "field_b": "EXPECTED_B"
        }
    }
    
    summary = evaluation_engine.evaluate_run(
        method_id="llm",
        predictions_by_doc=preds,
        ground_truth_by_doc=truth,
        critical_fields=["field_a"],
        latencies_ms=[100.0],
        machine_cost=0.002,
        doc_texts_by_doc={"doc1": doc_text},
        cost_basis="measured"
    )
    
    assert summary.total_fields == 2
    assert summary.cost_basis == "measured"
    assert summary.hallucination_rate == 0.5  # 1 hallucination out of 2 fields
    assert summary.mismatch_rate == 0.5       # 1 mismatch out of 2 fields


