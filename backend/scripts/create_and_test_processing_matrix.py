import os
import sys
import json
import time
from pathlib import Path
from PIL import Image, ImageFilter
import io
import fitz

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.synthetic_generator import SyntheticDocumentGenerator
from app.services.adapters.native_pymupdf import native_adapter
from app.services.adapters.paddleocr_adapter import paddleocr_adapter
from app.services.adapters.tesseract_ocr import tesseract_adapter
from app.services.adapters.hybrid_router import HybridRouterAdapter
from app.services.pdf_inspector import pdf_inspector
from app.schemas.insurance_schemas import get_schema

def make_scanned_pdf(src_pdf_path: str, out_pdf_path: str, dpi: int = 150, degrade: bool = False):
    """Renders all pages of src_pdf_path into bitmaps and saves as a pure image PDF (no text stream)."""
    src_doc = fitz.open(src_pdf_path)
    out_doc = fitz.open()

    for page in src_doc:
        pix = page.get_pixmap(dpi=dpi)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        
        if degrade:
            # Low DPI degradation: blur and slight noise
            img = img.resize((img.width // 2, img.height // 2), Image.Resampling.BILINEAR)
            img = img.filter(ImageFilter.GaussianBlur(radius=0.8))
            img = img.resize((pix.width, pix.height), Image.Resampling.NEAREST)

        img_bytes_io = io.BytesIO()
        img.save(img_bytes_io, format="JPEG", quality=45 if degrade else 80)
        img_bytes = img_bytes_io.getvalue()

        # Insert as pure image page
        rect = page.rect
        new_page = out_doc.new_page(width=rect.width, height=rect.height)
        new_page.insert_image(rect, stream=img_bytes)

    out_doc.save(out_pdf_path)
    out_doc.close()
    src_doc.close()

def make_mixed_pdf(digital_pdf: str, scanned_pdf: str, out_pdf: str):
    """Combines Page 1 of digital with Page 1 of scanned."""
    d1 = fitz.open(digital_pdf)
    d2 = fitz.open(scanned_pdf)
    out = fitz.open()
    out.insert_pdf(d1, from_page=0, to_page=0)
    out.insert_pdf(d2, from_page=0, to_page=0)
    out.save(out_pdf)
    out.close()
    d1.close()
    d2.close()

def make_multipage_pdf(out_pdf: str):
    """Generates a 3-page synthetic document with Claim, Invoice, and Explanation of Benefits."""
    temp1 = out_pdf + ".t1.pdf"
    temp2 = out_pdf + ".t2.pdf"
    temp3 = out_pdf + ".t3.pdf"

    gt1 = SyntheticDocumentGenerator.generate_claim_form(temp1, seed=501)
    gt2 = SyntheticDocumentGenerator.generate_invoice(temp2, seed=502)
    gt3 = SyntheticDocumentGenerator.generate_claim_form(temp3, seed=503)

    out = fitz.open()
    for t in [temp1, temp2, temp3]:
        d = fitz.open(t)
        out.insert_pdf(d)
        d.close()
        os.remove(t)
    out.save(out_pdf)
    out.close()
    return gt1

def run_matrix_tests():
    out_dir = Path("D:/PDF Extracter/backend/data/test_matrix")
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=================================================================")
    print("INSURANCE DOCUMENT INTELLIGENCE LAB - DOCUMENT PROCESSING MATRIX")
    print("=================================================================\n")

    # 1. Generate 5 test documents
    print("[1/5] Generating 1. Clean Digital PDF...")
    p_digital = str(out_dir / "01_clean_digital.pdf")
    gt_digital = SyntheticDocumentGenerator.generate_claim_form(p_digital, seed=101)

    print("[2/5] Generating 2. Scanned PDF (Pure Bitmap, 150 DPI)...")
    p_scanned = str(out_dir / "02_scanned.pdf")
    make_scanned_pdf(p_digital, p_scanned, dpi=150, degrade=False)

    print("[3/5] Generating 3. Low-Quality Scanned PDF (Degraded 75 DPI + Noise)...")
    p_low_qual = str(out_dir / "03_low_quality_scanned.pdf")
    make_scanned_pdf(p_digital, p_low_qual, dpi=75, degrade=True)

    print("[4/5] Generating 4. Mixed Digital/Scanned PDF...")
    p_mixed = str(out_dir / "04_mixed_digital_scanned.pdf")
    make_mixed_pdf(p_digital, p_scanned, p_mixed)

    print("[5/5] Generating 5. Multi-Page PDF (3 pages)...")
    p_multipage = str(out_dir / "05_multipage.pdf")
    gt_multipage = make_multipage_pdf(p_multipage)

    test_docs = [
        {"name": "01_clean_digital", "path": p_digital, "type": "claim_form", "gt": gt_digital},
        {"name": "02_scanned", "path": p_scanned, "type": "claim_form", "gt": gt_digital},
        {"name": "03_low_quality_scanned", "path": p_low_qual, "type": "claim_form", "gt": gt_digital},
        {"name": "04_mixed_digital_scanned", "path": p_mixed, "type": "claim_form", "gt": gt_digital},
        {"name": "05_multipage", "path": p_multipage, "type": "claim_form", "gt": gt_multipage},
    ]

    hybrid_router = HybridRouterAdapter()
    schema = get_schema("claim_form")

    matrix_results = []

    print("\n--- RUNNING EXTRACTION MATRIX ---")
    for doc_item in test_docs:
        name = doc_item["name"]
        path = doc_item["path"]
        gt = doc_item["gt"]
        print(f"\n>> Document: {name}")

        # Quality inspection
        inspection = pdf_inspector.inspect_document(name, path)
        print(f"   Quality: {inspection.overall_quality} (Digital Pages: {inspection.digital_page_count}, Scanned: {inspection.scanned_page_count}, Avg DPI: {inspection.pages[0].estimated_dpi if inspection.pages else 0})")

        # Test Native
        res_native = native_adapter.extract(name, path, schema)
        extracted_native_cnt = sum(1 for f in res_native.fields if f.state == "extracted" and f.raw_value)
        print(f"   [Native PyMuPDF] Status: {res_native.status} | Extracted: {extracted_native_cnt}/{len(schema.fields)} | Duration: {res_native.duration_ms}ms | Cost: ${res_native.calculated_cost_usd:.6f}")

        # Test PaddleOCR
        res_ocr = paddleocr_adapter.extract(name, path, schema)
        extracted_ocr_cnt = sum(1 for f in res_ocr.fields if f.state == "extracted" and f.raw_value)
        evidence_ocr_cnt = len(res_ocr.evidence)
        print(f"   [PaddleOCR DL]   Status: {res_ocr.status} | Extracted: {extracted_ocr_cnt}/{len(schema.fields)} | Evidence Boxes: {evidence_ocr_cnt} | Duration: {res_ocr.duration_ms}ms | Cost: ${res_ocr.calculated_cost_usd:.6f}")

        # Test Tesseract Availability
        tess_avail, tess_diag = tesseract_adapter.is_available()
        res_tess = tesseract_adapter.extract(name, path, schema)
        print(f"   [Tesseract OCR]  Available: {tess_avail} | Diagnostic: {tess_diag[:60]}... | Status: {res_tess.status}")

        # Test Hybrid Router
        res_hybrid = hybrid_router.extract(name, path, schema)
        extracted_hybrid_cnt = sum(1 for f in res_hybrid.fields if f.state == "extracted" and f.raw_value)
        print(f"   [Hybrid Router]  Status: {res_hybrid.status} | Extracted: {extracted_hybrid_cnt}/{len(schema.fields)} | Duration: {res_hybrid.duration_ms}ms | Total Cost: ${res_hybrid.calculated_cost_usd:.6f}")

        # Compare with Ground Truth
        correct_native = 0
        correct_ocr = 0
        correct_hybrid = 0
        for f in schema.fields:
            fn = f.name
            expected = gt.get(fn)
            if expected:
                # Check Native
                nf = next((x for x in res_native.fields if x.field_name == fn), None)
                if nf and nf.raw_value and str(nf.raw_value).lower() in str(expected).lower():
                    correct_native += 1
                # Check OCR
                of = next((x for x in res_ocr.fields if x.field_name == fn), None)
                if of and of.raw_value and (str(of.raw_value).lower() in str(expected).lower() or str(expected).lower() in str(of.raw_value).lower()):
                    correct_ocr += 1
                # Check Hybrid
                hf = next((x for x in res_hybrid.fields if x.field_name == fn), None)
                if hf and hf.raw_value and (str(hf.raw_value).lower() in str(expected).lower() or str(expected).lower() in str(hf.raw_value).lower()):
                    correct_hybrid += 1

        print(f"   -> Accuracy vs Ground Truth: Native: {correct_native}/5 | PaddleOCR: {correct_ocr}/5 | Hybrid: {correct_hybrid}/5")

        matrix_results.append({
            "document": name,
            "quality": inspection.overall_quality,
            "native": {
                "extracted": extracted_native_cnt,
                "correct": correct_native,
                "duration_ms": res_native.duration_ms,
                "cost_usd": res_native.calculated_cost_usd,
                "status": res_native.status
            },
            "paddleocr": {
                "extracted": extracted_ocr_cnt,
                "correct": correct_ocr,
                "evidence_count": evidence_ocr_cnt,
                "duration_ms": res_ocr.duration_ms,
                "cost_usd": res_ocr.calculated_cost_usd,
                "status": res_ocr.status
            },
            "tesseract": {
                "available": tess_avail,
                "diagnostic": tess_diag,
                "status": res_tess.status
            },
            "hybrid": {
                "extracted": extracted_hybrid_cnt,
                "correct": correct_hybrid,
                "duration_ms": res_hybrid.duration_ms,
                "cost_usd": res_hybrid.calculated_cost_usd,
                "status": res_hybrid.status
            }
        })

    # Save summary report JSON for inclusion in documentation
    report_file = out_dir / "processing_matrix_results.json"
    with open(report_file, "w") as f:
        json.dump(matrix_results, f, indent=2)

    print(f"\nMatrix results successfully saved to: {report_file}")

if __name__ == "__main__":
    run_matrix_tests()
