import time
from typing import Tuple, Optional, Dict, Any, List
from app.services.adapters.base import BaseExtractionAdapter, ExtractionResult, ExtractedFieldItem, EvidenceItem
from app.services.adapters.native_pymupdf import native_adapter
from app.services.adapters.tesseract_ocr import tesseract_adapter
from app.services.adapters.paddleocr_adapter import paddleocr_adapter
from app.services.adapters.llm_adapter import llm_adapter
from app.services.pdf_inspector import pdf_inspector
from app.schemas.insurance_schemas import DocumentSchemaDefinition
from app.config import settings

class HybridRouterAdapter(BaseExtractionAdapter):
    @property
    def method_id(self) -> str:
        return "hybrid"

    @property
    def display_name(self) -> str:
        return "Adaptive Hybrid Router"

    def is_available(self) -> Tuple[bool, str]:
        return True, "Adaptive Hybrid Router orchestrator is active."

    def extract(
        self,
        doc_id: str,
        pdf_path: str,
        schema: DocumentSchemaDefinition,
        options: Optional[Dict[str, Any]] = None
    ) -> ExtractionResult:
        start_time = time.time()
        routing_log: List[Dict[str, Any]] = []
        warnings: List[str] = []
        errors: List[str] = []

        # Step 1: Inspect Page & Document Quality
        inspection = pdf_inspector.inspect_document(doc_id, pdf_path)
        
        # Step 2: Route based on overall quality
        # If document is clean digital, start with native PyMuPDF; if scanned, prioritize deep learning / OCR engine
        chosen_initial_engine = "native"
        if inspection.overall_quality == "SCANNED":
            paddle_avail, _ = paddleocr_adapter.is_available()
            tess_avail, _ = tesseract_adapter.is_available()
            if paddle_avail:
                chosen_initial_engine = "paddleocr"
            elif tess_avail:
                chosen_initial_engine = "tesseract"
            else:
                chosen_initial_engine = "native"
                warnings.append("Document is scanned but OCR engines are unavailable; falling back to native text stream.")

        routing_log.append({
            "stage": "inspection",
            "overall_quality": inspection.overall_quality,
            "digital_pages": inspection.digital_page_count,
            "scanned_pages": inspection.scanned_page_count,
            "selected_initial_engine": chosen_initial_engine
        })

        # Step 3: Run Primary Extraction
        if chosen_initial_engine == "paddleocr":
            primary_result = paddleocr_adapter.extract(doc_id, pdf_path, schema, options)
        elif chosen_initial_engine == "tesseract":
            primary_result = tesseract_adapter.extract(doc_id, pdf_path, schema, options)
        else:
            primary_result = native_adapter.extract(doc_id, pdf_path, schema, options)

        # Step 4: Quality & Completeness Verification
        # Check if critical required fields are missing
        missing_critical_fields = [
            f.field_name for f in primary_result.fields 
            if f.is_critical and (f.state == "missing" or not f.raw_value)
        ]

        total_extracted = sum(1 for f in primary_result.fields if f.state == "extracted" and f.raw_value)
        completeness_ratio = (total_extracted / len(schema.fields)) if schema.fields else 0.0

        routing_log.append({
            "stage": "primary_verification",
            "completeness_ratio": round(completeness_ratio, 2),
            "missing_critical_count": len(missing_critical_fields),
            "missing_critical_fields": missing_critical_fields
        })

        final_fields = primary_result.fields
        final_evidence = primary_result.evidence
        accumulated_cost = primary_result.calculated_cost_usd
        input_tokens = primary_result.input_tokens
        output_tokens = primary_result.output_tokens

        # Step 5: Escalate to LLM only if critical fields are missing or extraction is low quality
        if missing_critical_fields or completeness_ratio < 0.60:
            routing_log.append({
                "stage": "escalation",
                "action": "invoke_llm",
                "reason": f"Completeness ratio ({completeness_ratio:.2f}) or missing critical fields: {missing_critical_fields}"
            })
            
            llm_res = llm_adapter.extract(doc_id, pdf_path, schema, options)
            accumulated_cost += llm_res.calculated_cost_usd
            input_tokens += llm_res.input_tokens
            output_tokens += llm_res.output_tokens
            warnings.extend(llm_res.warnings)

            # Merge results: fill gaps in primary with LLM
            merged_fields: List[ExtractedFieldItem] = []
            primary_map = {f.field_name: f for f in primary_result.fields}
            llm_map = {f.field_name: f for f in llm_res.fields}

            for fdef in schema.fields:
                fn = fdef.name
                prim = primary_map.get(fn)
                llm_f = llm_map.get(fn)

                if prim and prim.state == "extracted" and prim.raw_value:
                    # Native high confidence value preserved
                    merged_fields.append(prim)
                elif llm_f and llm_f.state == "extracted" and llm_f.raw_value:
                    # Fill from LLM
                    llm_f.confidence = 0.88
                    merged_fields.append(llm_f)
                else:
                    merged_fields.append(prim or llm_f)

            final_fields = merged_fields
            final_evidence.extend(llm_res.evidence)
        else:
            routing_log.append({
                "stage": "escalation",
                "action": "skipped_llm",
                "reason": "Sufficient native completeness achieved with zero token expenditure."
            })

        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)

        return ExtractionResult(
            doc_id=doc_id,
            method_id=self.method_id,
            status="completed",
            duration_ms=elapsed_ms,
            fields=final_fields,
            evidence=final_evidence,
            warnings=warnings,
            errors=errors,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            calculated_cost_usd=round(accumulated_cost, 6),
            metadata={
                "routing_log": routing_log,
                "strategy": "quality_driven_cost_optimal"
            }
        )

hybrid_router = HybridRouterAdapter()

