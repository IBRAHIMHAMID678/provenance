import re
import time
import fitz
from typing import Tuple, Optional, Dict, Any, List
from app.services.adapters.base import BaseExtractionAdapter, ExtractionResult, ExtractedFieldItem, EvidenceItem
from app.schemas.insurance_schemas import DocumentSchemaDefinition, FieldDefinition

class NativePyMuPDFAdapter(BaseExtractionAdapter):
    @property
    def method_id(self) -> str:
        return "native_pymupdf"

    @property
    def display_name(self) -> str:
        return "PyMuPDF Native Extraction"

    def is_available(self) -> Tuple[bool, str]:
        return True, "PyMuPDF (fitz) is available and functional."

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
        warnings: List[str] = []
        errors: List[str] = []
        extracted_fields: List[ExtractedFieldItem] = []
        evidence_list: List[EvidenceItem] = []
        total_pages = 0

        try:
            doc = fitz.open(pdf_path)
            total_pages = len(doc)
            
            patterns = {
                "claim_id": [
                    r"(?:claim\s*(?:id|number|#|ref)(?:\s*/\s*reference)?|claim\s*no\.?)[:\s]*(?:\n|\r|\s)+([A-Z0-9-]+)",
                    r"claim\s*(?:id|number|#|ref)[:\s]+(?:\n|\r|\s)*([A-Z0-9-]+)"
                ],
                "policy_number": [
                    r"policy\s*(?:number|id|#|no\.?)[:\s/]+(?:\n|\r|\s)*([A-Z0-9-]+)"
                ],
                "claimant_name": [
                    r"claimant\s*(?:full\s*)?name[:\s/]+(?:\n|\r|\s)*([A-Za-z\s.'-]+?)(?=\n\n|\r|\n[A-Z]|$)",
                    r"insured\s*name[:\s/]+(?:\n|\r|\s)*([A-Za-z\s.'-]+?)(?=\n|$)"
                ],
                "policyholder_name": [
                    r"(?:named\s*)?policyholder(?:\s*name)?[:\s/]+(?:\n|\r|\s)*([A-Za-z\s.'-]+?)(?=\n\n|\r|\n[A-Z]|$)",
                    r"named\s*insured[:\s/]+(?:\n|\r|\s)*([A-Za-z\s.'-]+?)(?=\n|$)"
                ],
                "insurer_name": [
                    r"(?:underwriting\s*)?insurer(?:\s*name)?[:\s/]+(?:\n|\r|\s)*([A-Za-z\s.'-]+?)(?=\n|$)",
                    r"underwriter[:\s/]+(?:\n|\r|\s)*([A-Za-z\s.'-]+?)(?=\n|$)"
                ],
                "incident_date": [
                    r"(?:date\s*of\s*loss\s*/\s*incident|incident\s*date|date\s*of\s*loss)[:\s/]+(?:\n|\r|\s)*([0-9\/-]+|\w+\s+\d{1,2},?\s+\d{4})"
                ],
                "filing_date": [
                    r"(?:claim\s*)?filing\s*date[:\s/]+(?:\n|\r|\s)*([0-9\/-]+|\w+\s+\d{1,2},?\s+\d{4})",
                    r"date\s*reported[:\s/]+(?:\n|\r|\s)*([0-9\/-]+|\w+\s+\d{1,2},?\s+\d{4})"
                ],
                "effective_date": [
                    r"(?:effective|start)\s*date[:\s/]+(?:\n|\r|\s)*([0-9\/-]+|\w+\s+\d{1,2},?\s+\d{4})"
                ],
                "expiration_date": [
                    r"(?:expiration|expiry|end)\s*date[:\s/]+(?:\n|\r|\s)*([0-9\/-]+|\w+\s+\d{1,2},?\s+\d{4})"
                ],
                "requested_amount": [
                    r"(?:total\s*)?(?:requested|claimed)\s*amount[:\s/]+(?:\n|\r|\s)*([$€£]?\s*[\d,]+(?:\.\d{2})?)"
                ],
                "premium_amount": [
                    r"(?:gross\s*)?premium\s*(?:amount)?[:\s/]+(?:\n|\r|\s)*([$€£]?\s*[\d,]+(?:\.\d{2})?)"
                ],
                "coverage_limit": [
                    r"(?:limit\s*of\s*liability|coverage\s*limit)[:\s/]+(?:\n|\r|\s)*([$€£]?\s*[\d,]+(?:\.\d{2})?)"
                ],
                "deductible": [
                    r"(?:deductible\s*(?:excess)?|excess)[:\s/]+(?:\n|\r|\s)*([$€£]?\s*[\d,]+(?:\.\d{2})?)"
                ],
                "subtotal": [
                    r"subtotal\s*(?:amount)?[:\s/]+(?:\n|\r|\s)*([$€£]?\s*[\d,]+(?:\.\d{2})?)"
                ],
                "tax_amount": [
                    r"tax\s*(?:amount(?:\s*\(\d+%\))?)?[:\s/]+(?:\n|\r|\s)*([$€£]?\s*[\d,]+(?:\.\d{2})?)"
                ],
                "discount_amount": [
                    r"discount\s*(?:amount)?[:\s/]+(?:\n|\r|\s)*([-$€£]?\s*[\d,]+(?:\.\d{2})?)"
                ],
                "total_amount": [
                    r"total\s*(?:amount\s*due|amount)?[:\s/]+(?:\n|\r|\s)*([$€£]?\s*[\d,]+(?:\.\d{2})?)"
                ],
                "invoice_number": [
                    r"invoice\s*(?:number|no\.?|#)[:\s/]+(?:\n|\r|\s)*([A-Z0-9-]+)"
                ],
                "invoice_date": [
                    r"invoice\s*date[:\s/]+(?:\n|\r|\s)*([0-9\/-]+|\w+\s+\d{1,2},?\s+\d{4})"
                ],
                "vendor_name": [
                    r"vendor(?:\s*name)?[:\s/]+(?:\n|\r|\s)*([A-Za-z0-9\s.,'-]+?)(?=\n|$)"
                ],
                "currency": [
                    r"currency[:\s/]+(?:\n|\r|\s)*([A-Z]{3})"
                ],
                "coverage_type": [
                    r"coverage\s*type[:\s/]+(?:\n|\r|\s)*([A-Za-z0-9\s.,'-]+?)(?=\n|$)"
                ]
            }

            extracted_values: Dict[str, Tuple[str, int, Optional[fitz.Rect], str]] = {}

            for page_idx in range(total_pages):
                page = doc[page_idx]
                page_num = page_idx + 1
                page_text = page.get_text("text")

                for fdef in schema.fields:
                    fn = fdef.name
                    if fn in extracted_values:
                        continue

                    regex_list = patterns.get(fn, [rf"{re.escape(fdef.display_name)}[:\s/]+(?:\n|\r|\s)*([^\n\r]+)"])
                    for reg in regex_list:
                        m = re.search(reg, page_text, re.IGNORECASE)
                        if m:
                            raw_val = m.group(1).strip().rstrip(".,;")
                            # Find coordinates using page.search_for
                            rect_matches = page.search_for(raw_val)
                            rect = rect_matches[0] if rect_matches else None
                            snippet = page_text[max(0, m.start() - 20): min(len(page_text), m.end() + 40)].replace("\n", " ").strip()
                            extracted_values[fn] = (raw_val, page_num, rect, snippet)
                            break

            for fdef in schema.fields:
                fn = fdef.name
                if fn in extracted_values:
                    raw_val, p_num, rect, snippet = extracted_values[fn]
                    norm_val = self._normalize_value(raw_val, fdef.data_type)
                    page = doc[p_num - 1]
                    pw = page.rect.width if page.rect.width > 0 else 612.0
                    ph = page.rect.height if page.rect.height > 0 else 792.0

                    if rect:
                        nx0 = round((rect.x0 / pw) * 1000.0, 1)
                        ny0 = round((rect.y0 / ph) * 1000.0, 1)
                        nx1 = round((rect.x1 / pw) * 1000.0, 1)
                        ny1 = round((rect.y1 / ph) * 1000.0, 1)
                    else:
                        nx0 = ny0 = nx1 = ny1 = None

                    extracted_fields.append(ExtractedFieldItem(
                        field_name=fn,
                        raw_value=raw_val,
                        normalized_value=norm_val,
                        data_type=fdef.data_type,
                        state="extracted",
                        confidence=0.98,
                        is_critical=fdef.is_critical,
                        needs_review=False
                    ))
                    evidence_list.append(EvidenceItem(
                        field_name=fn,
                        page_number=p_num,
                        evidence_text=snippet,
                        bbox_x0=nx0,
                        bbox_y0=ny0,
                        bbox_x1=nx1,
                        bbox_y1=ny1,
                        char_confidence=0.99
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

            doc.close()
        except Exception as e:
            errors.append(f"PyMuPDF native extraction failed: {str(e)}")

        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
        return ExtractionResult(
            doc_id=doc_id,
            method_id=self.method_id,
            status="completed" if not errors else "failed",
            duration_ms=elapsed_ms,
            fields=extracted_fields,
            evidence=evidence_list,
            warnings=warnings,
            errors=errors,
            calculated_cost_usd=0.0,
            metadata={"engine": "PyMuPDF_fitz", "pages_scanned": total_pages}
        )

native_adapter = NativePyMuPDFAdapter()
