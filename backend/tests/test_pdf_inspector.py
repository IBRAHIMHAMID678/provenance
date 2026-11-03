from app.services.pdf_inspector import pdf_inspector

def test_pdf_inspection_digital(sample_claim_pdf):
    pdf_path, gt = sample_claim_pdf
    res = pdf_inspector.inspect_document("test_doc_001", pdf_path)
    
    assert res.total_pages == 1
    assert res.overall_quality == "HIGH_DIGITAL"
    assert res.digital_page_count == 1
    assert res.scanned_page_count == 0
    assert len(res.pages) == 1
    
    p1 = res.pages[0]
    assert p1.has_selectable_text is True
    assert p1.char_count > 100
    assert p1.quality_grade == "HIGH_DIGITAL"
    assert p1.recommended_engine == "native"

