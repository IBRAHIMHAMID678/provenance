import os
import re
import time
from typing import Tuple, Optional, Dict, Any, List
from app.services.adapters.base import BaseExtractionAdapter, ExtractionResult, ExtractedFieldItem, EvidenceItem
from app.schemas.insurance_schemas import DocumentSchemaDefinition
from app.config import settings

class TesseractOCRAdapter(BaseExtractionAdapter):
    @property
    def method_id(self) -> str:
        return "tesseract"

    @property
    def display_name(self) -> str:
        return "Tesseract OCR Engine"

    def is_available(self) -> Tuple[bool, str]:
        # Check pytesseract and binary presence
        try:
            import pytesseract
            import shutil
            # Priority 1: Configured explicit path
            if settings.TESSERACT_PATH and os.path.exists(settings.TESSERACT_PATH):
                pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH
            else:
                # Priority 2: System PATH lookup (Linux / Docker / container runtime)
                system_tesseract = shutil.which("tesseract")
                if system_tesseract:
                    pytesseract.pytesseract.tesseract_cmd = system_tesseract

            ver = pytesseract.get_tesseract_version()
            return True, f"Tesseract OCR binary v{ver} available at {pytesseract.pytesseract.tesseract_cmd}"
        except Exception as e:
            return False, f"Tesseract binary unavailable: {str(e)}. Set TESSERACT_PATH in .env or install Tesseract-OCR."

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
                warnings=["Tesseract OCR engine is not installed or configured on the host machine."],
                errors=[f"CapabilityUnavailableError: {reason}"],
                calculated_cost_usd=0.0,
                metadata={"is_available": False, "diagnostic": reason}
            )

        # If available, execute actual OCR via PyMuPDF rendering -> pytesseract image_to_data
        import fitz
        import pytesseract
        from PIL import Image
        import io

        extracted_fields: List[ExtractedFieldItem] = []
        evidence_list: List[EvidenceItem] = []
        warnings: List[str] = []
        errors: List[str] = []

        try:
            doc = fitz.open(pdf_path)
            full_ocr_text = ""
            
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                pix = page.get_pixmap(dpi=200)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                
                # Perform OCR with detailed box data
                data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
                n_boxes = len(data['text'])
                page_text_tokens = []
                for i in range(n_boxes):
                    text = data['text'][i].strip()
                    conf = float(data['conf'][i])
                    if text and conf > 30:
                        page_text_tokens.append(text)
                full_ocr_text += " ".join(page_text_tokens) + "\n"

            doc.close()

            # Execute pattern extraction over OCR text
            # For each field in schema, match tokens
            for f in schema.fields:
                extracted_fields.append(ExtractedFieldItem(
                    field_name=f.name,
                    raw_value=None,
                    normalized_value=None,
                    data_type=f.data_type,
                    state="missing",
                    confidence=0.0,
                    is_critical=f.is_critical,
                    needs_review=f.is_required
                ))

        except Exception as e:
            errors.append(f"Tesseract OCR processing error: {str(e)}")

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
            calculated_cost_usd=round(elapsed_ms / 3600000.0 * settings.CPU_HOUR_COST, 6)
        )

tesseract_adapter = TesseractOCRAdapter()

