import re
import time
import io
from typing import Tuple, Optional, Dict, Any, List
import fitz
from app.services.adapters.base import BaseExtractionAdapter, ExtractionResult, ExtractedFieldItem, EvidenceItem
from app.schemas.insurance_schemas import DocumentSchemaDefinition
from app.config import settings

class PaddleOCRAdapter(BaseExtractionAdapter):
    def __init__(self):
        self._engine = None

    @property
    def method_id(self) -> str:
        return "paddleocr"

    @property
    def display_name(self) -> str:
        return "PaddleOCR Deep Learning Adapter (PP-OCRv4)"

    def is_available(self) -> Tuple[bool, str]:
        if not settings.ENABLE_PADDLE_OCR:
            return False, "PaddleOCR is disabled in settings (ENABLE_PADDLE_OCR=False)."
        
        try:
            from rapidocr_onnxruntime import RapidOCR
            return True, "RapidOCR / PaddleOCR (ONNXRuntime PP-OCRv4) is installed and operational."
        except ImportError:
            pass

        try:
            import paddleocr
            return True, "PaddleOCR package is installed and operational."
        except ImportError as e:
            return False, f"Neither rapidocr_onnxruntime nor paddleocr is installed: {str(e)}"

    def _get_engine(self):
        if self._engine is not None:
            return self._engine
        
        try:
            from rapidocr_onnxruntime import RapidOCR
            self._engine = RapidOCR()
            return self._engine
        except ImportError:
            pass

        try:
            from paddleocr import PaddleOCR
            self._engine = PaddleOCR(use_angle_cls=True, lang='en')
            return self._engine
        except ImportError:
            return None

    @staticmethod
    def _normalize_value(raw: str, data_type: str) -> str:
        if not raw:
            return ""
        val = raw.strip()
        if data_type in ("decimal", "currency"):
            cleaned = re.sub(r"[^\d.-]", "", val)
            try:
                f = float(cleaned)
                return f"{f:.2f}"
            except ValueError:
                return cleaned
        elif data_type == "date":
            m = re.search(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", val)
            if m:
                return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
            m2 = re.search(r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})", val)
            if m2:
                return f"{int(m2.group(3)):04d}-{int(m2.group(1)):02d}-{int(m2.group(2)):02d}"
            return val
        return val

    def extract(
        self,
        doc_id: str,
        pdf_path: str,
        schema: DocumentSchemaDefinition,
        options: Optional[Dict[str, Any]] = None
    ) -> ExtractionResult:
        start_time = time.time()
        available, reason = self.is_available()
        
        if not available:
            return ExtractionResult(
                doc_id=doc_id,
                method_id=self.method_id,
                status="failed",
                duration_ms=0.0,
                fields=[
                    ExtractedFieldItem(
                        field_name=f.name,
                        raw_value=None,
                        normalized_value=None,
                        data_type=f.data_type,
                        state="invalid",
                        confidence=0.0,
                        is_critical=f.is_critical,
                        needs_review=True
                    ) for f in schema.fields
                ],
                evidence=[],
                warnings=["PaddleOCR engine is currently unavailable in this environment."],
                errors=[f"CapabilityUnavailableError: {reason}"],
                calculated_cost_usd=0.0,
                metadata={"is_available": False, "diagnostic": reason}
            )

        engine = self._get_engine()
        if not engine:
            return ExtractionResult(
                doc_id=doc_id,
                method_id=self.method_id,
                status="failed",
                duration_ms=0.0,
                fields=[],
                evidence=[],
                warnings=[],
                errors=["Failed to instantiate OCR engine."],
                calculated_cost_usd=0.0
            )

        extracted_fields: List[ExtractedFieldItem] = []
        evidence_list: List[EvidenceItem] = []
        warnings: List[str] = []
        errors: List[str] = []

        field_labels = {
            "claim_id": [r"^claim\s*(?:id|number|#|ref|no\.?)(?:\s*/\s*reference)?[:\s/]*$"],
            "policy_number": [r"^policy\s*(?:number|id|#|no\.?)[:\s/]*$"],
            "claimant_name": [r"^claimant(?:\s*full)?\s*name[:\s/]*$", r"^insured\s*name[:\s/]*$"],
            "policyholder_name": [r"^(?:named\s*)?policyholder(?:\s*name)?[:\s/]*$", r"^named\s*insured[:\s/]*$"],
            "insurer_name": [r"^(?:underwriting\s*)?insurer(?:\s*name)?[:\s/]*$", r"^underwriter[:\s/]*$"],
            "incident_date": [r"^(?:date\s*of\s*loss\s*/\s*incident|incident\s*date|date\s*of\s*loss)[:\s/]*$"],
            "filing_date": [r"^(?:claim\s*)?filing\s*date[:\s/]*$", r"^date\s*reported[:\s/]*$"],
            "effective_date": [r"^(?:effective|start)\s*date[:\s/]*$"],
            "expiration_date": [r"^(?:expiration|expiry|end)\s*date[:\s/]*$"],
            "requested_amount": [r"^(?:total\s*)?(?:requested|claimed)\s*amount[:\s/]*$"],
            "premium_amount": [r"^(?:gross\s*)?premium\s*(?:amount)?[:\s/]*$"],
            "coverage_limit": [r"^(?:limit\s*of\s*liability|coverage\s*limit)[:\s/]*$"],
            "deductible": [r"^(?:deductible\s*(?:excess)?|excess)[:\s/]*$"],
            "subtotal": [r"^subtotal\s*(?:amount)?[:\s/]*$"],
            "tax_amount": [r"^tax\s*(?:amount(?:\s*\(\d+%\))?)?[:\s/]*$"],
            "discount_amount": [r"^discount\s*(?:amount)?[:\s/]*$"],
            "total_amount": [r"^total\s*(?:amount\s*due|amount)?[:\s/]*$"],
            "invoice_number": [r"^invoice\s*(?:number|no\.?|#)[:\s/]*$"],
            "invoice_date": [r"^invoice\s*date[:\s/]*$"],
            "vendor_name": [r"^vendor(?:\s*name)?[:\s/]*$"],
            "currency": [r"^currency[:\s/]*$"],
            "coverage_type": [r"^coverage\s*type[:\s/]*$"],
            "incident_location": [r"^incident\s*location[:\s/]*$"],
            "damage_type": [r"^damage\s*category[:\s/]*$"],
            "claim_status": [r"^claim\s*status[:\s/]*$"]
        }

        inline_patterns = {
            "claim_id": [r"claim\s*(?:id|number|#|ref)(?:\s*/\s*reference)?[:\s]+([A-Z0-9-]+)"],
            "policy_number": [r"policy\s*(?:number|id|#|no\.?)[:\s]+([A-Z0-9-]+)"],
            "claimant_name": [r"claimant\s*(?:full\s*)?name[:\s]+([A-Za-z\s.'-]+?)(?=\s{2,}|$)", r"insured\s*name[:\s]+([A-Za-z\s.'-]+?)(?=\s{2,}|$)"],
            "incident_date": [r"(?:date\s*of\s*loss\s*/\s*incident|incident\s*date)[:\s]+([0-9\/-]+)"],
            "filing_date": [r"(?:claim\s*)?filing\s*date[:\s]+([0-9\/-]+)"],
            "requested_amount": [r"(?:total\s*)?(?:requested|claimed)\s*amount[:\s]+([$€£]?\s*[\d,]+(?:\.\d{2})?)"],
            "currency": [r"currency[:\s]+([A-Z]{3})"],
            "claim_status": [r"claim\s*status[:\s]+([A-Za-z\s]+)"]
        }

        try:
            doc = fitz.open(pdf_path)
            total_pages = len(doc)
            extracted_values: Dict[str, Dict[str, Any]] = {}

            for page_idx in range(total_pages):
                page = doc[page_idx]
                page_num = page_idx + 1

                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                pix_w = pix.width
                pix_h = pix.height

                ocr_items = []
                try:
                    ocr_res, _ = engine(img_bytes)
                    if ocr_res:
                        for it in ocr_res:
                            box = it[0]
                            text = str(it[1]).strip()
                            conf = float(it[2])
                            ocr_items.append({"text": text, "conf": conf, "box": box})
                except Exception as e:
                    warnings.append(f"OCR page {page_num} scan error: {str(e)}")

                num_items = len(ocr_items)

                # 1. Check consecutive lines: label item followed by value item
                for i in range(num_items):
                    cur_text = ocr_items[i]["text"]
                    clean_cur = cur_text.replace(" ", "").lower()

                    for fn, label_regexes in field_labels.items():
                        if fn in extracted_values:
                            continue
                        
                        matched_label = False
                        for lr in label_regexes:
                            if re.search(lr, cur_text.strip(), re.IGNORECASE) or re.search(lr.replace(r"\s*", ""), clean_cur, re.IGNORECASE):
                                matched_label = True
                                break

                        if matched_label and i + 1 < num_items:
                            next_item = ocr_items[i + 1]
                            val_text = next_item["text"].strip()
                            
                            # Ensure next line isn't itself a label
                            is_another_label = False
                            for other_lbls in field_labels.values():
                                for olr in other_lbls:
                                    if re.search(olr, val_text, re.IGNORECASE):
                                        is_another_label = True
                                        break
                                if is_another_label:
                                    break

                            if not is_another_label and val_text:
                                extracted_values[fn] = {
                                    "raw_val": val_text,
                                    "page_num": page_num,
                                    "box": next_item["box"],
                                    "conf": next_item["conf"],
                                    "snippet": f"{cur_text} {val_text}",
                                    "pix_w": pix_w,
                                    "pix_h": pix_h
                                }

                # 2. Check inline matching in case label and value are on same line
                for i in range(num_items):
                    cur_text = ocr_items[i]["text"]
                    for fn, inlines in inline_patterns.items():
                        if fn in extracted_values:
                            continue
                        for ir in inlines:
                            m = re.search(ir, cur_text, re.IGNORECASE)
                            if m:
                                val_text = m.group(1).strip()
                                extracted_values[fn] = {
                                    "raw_val": val_text,
                                    "page_num": page_num,
                                    "box": ocr_items[i]["box"],
                                    "conf": ocr_items[i]["conf"],
                                    "snippet": cur_text,
                                    "pix_w": pix_w,
                                    "pix_h": pix_h
                                }
                                break

            doc.close()

            # Build field list and evidence items
            for fdef in schema.fields:
                fn = fdef.name
                if fn in extracted_values:
                    info = extracted_values[fn]
                    raw_val = info["raw_val"]
                    norm_val = self._normalize_value(raw_val, fdef.data_type)
                    box = info["box"]
                    conf = info["conf"]

                    # Convert pixel box coordinates to 0-1000 normalized coordinates
                    if box and len(box) >= 4:
                        xs = [p[0] for p in box]
                        ys = [p[1] for p in box]
                        min_x, max_x = min(xs), max(xs)
                        min_y, max_y = min(ys), max(ys)
                        nx0 = round((min_x / info["pix_w"]) * 1000.0, 1)
                        ny0 = round((min_y / info["pix_h"]) * 1000.0, 1)
                        nx1 = round((max_x / info["pix_w"]) * 1000.0, 1)
                        ny1 = round((max_y / info["pix_h"]) * 1000.0, 1)
                    else:
                        nx0 = ny0 = nx1 = ny1 = None

                    extracted_fields.append(ExtractedFieldItem(
                        field_name=fn,
                        raw_value=raw_val,
                        normalized_value=norm_val,
                        data_type=fdef.data_type,
                        state="extracted",
                        confidence=round(conf, 4),
                        is_critical=fdef.is_critical,
                        needs_review=(conf < 0.70)
                    ))

                    evidence_list.append(EvidenceItem(
                        field_name=fn,
                        page_number=info["page_num"],
                        evidence_text=raw_val,
                        bbox_x0=nx0,
                        bbox_y0=ny0,
                        bbox_x1=nx1,
                        bbox_y1=ny1,
                        char_confidence=round(conf, 4)
                    ))
                else:
                    extracted_fields.append(ExtractedFieldItem(
                        field_name=fn,
                        raw_value=None,
                        normalized_value=None,
                        data_type=fdef.data_type,
                        state="missing",
                        confidence=0.0,
                        is_critical=fdef.is_critical,
                        needs_review=fdef.is_required
                    ))

        except Exception as e:
            errors.append(f"PaddleOCR extraction failed: {str(e)}")

        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
        calculated_cost = round((elapsed_ms / 3600000.0) * settings.CPU_HOUR_COST, 6)

        return ExtractionResult(
            doc_id=doc_id,
            method_id=self.method_id,
            status="completed" if not errors else "failed",
            duration_ms=elapsed_ms,
            fields=extracted_fields,
            evidence=evidence_list,
            warnings=warnings,
            errors=errors,
            calculated_cost_usd=calculated_cost,
            metadata={"engine": "RapidOCR/PaddleOCR PP-OCRv4", "page_count": total_pages if 'total_pages' in locals() else 0}
        )

paddleocr_adapter = PaddleOCRAdapter()
