import os
import pytest
import fitz
from app.services.ground_truth import REFERENCE_DOCUMENTS, get_ground_truth_by_id
from app.services.synthetic_generator import synthetic_generator

def test_ground_truth_repository_diversity():
    # 1. Total specifications >= 40
    assert len(REFERENCE_DOCUMENTS) >= 40, f"Expected >= 40 reference documents, got {len(REFERENCE_DOCUMENTS)}"

    # 2. Layout variants >= 8
    layouts = set(d.get("layout") for d in REFERENCE_DOCUMENTS if d.get("layout"))
    assert len(layouts) >= 8, f"Expected >= 8 layout variants, got {len(layouts)}: {layouts}"

    # 3. Multi-page documents >= 10
    multipage_docs = [d for d in REFERENCE_DOCUMENTS if d.get("pages", 1) >= 2]
    assert len(multipage_docs) >= 10, f"Expected >= 10 multi-page docs, got {len(multipage_docs)}"

    # 4. Degraded scans >= 8
    scans = [d for d in REFERENCE_DOCUMENTS if d.get("is_scan", False)]
    assert len(scans) >= 8, f"Expected >= 8 degraded scans, got {len(scans)}"

    # 5. Over 12 distinct field names across the dataset
    all_fields = set()
    for d in REFERENCE_DOCUMENTS:
        all_fields.update(d["ground_truth"].keys())
    assert len(all_fields) >= 12, f"Expected >= 12 fields, got {len(all_fields)}: {all_fields}"

def test_render_multipage_and_degraded_scan(tmp_path):
    # Test rendering a multi-page document
    multipage_spec = next(d for d in REFERENCE_DOCUMENTS if d.get("pages", 1) == 3)
    p_multi = str(tmp_path / "test_multi.pdf")
    gt_multi = synthetic_generator.render_from_spec(multipage_spec, p_multi)
    assert os.path.exists(p_multi)
    doc_m = fitz.open(p_multi)
    assert len(doc_m) == 3
    doc_m.close()

    # Test rendering a degraded scan
    scan_spec = next(d for d in REFERENCE_DOCUMENTS if d.get("is_scan", False))
    p_scan = str(tmp_path / "test_scan.pdf")
    gt_scan = synthetic_generator.render_from_spec(scan_spec, p_scan)
    assert os.path.exists(p_scan)
    doc_s = fitz.open(p_scan)
    assert len(doc_s) >= 1
    # Check that image is present in the scan
    page0 = doc_s[0]
    images = page0.get_images()
    assert len(images) >= 1, "Degraded scan must contain rasterized image"
    doc_s.close()
