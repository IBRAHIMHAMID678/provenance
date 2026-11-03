from typing import Dict, List, Any
from app.services.adapters.base import BaseExtractionAdapter
from app.services.adapters.native_pymupdf import native_adapter
from app.services.adapters.tesseract_ocr import tesseract_adapter
from app.services.adapters.paddleocr_adapter import paddleocr_adapter
from app.services.adapters.llm_adapter import llm_adapter
from app.services.adapters.multimodal_adapter import multimodal_adapter
from app.services.adapters.hybrid_router import hybrid_router

ADAPTER_REGISTRY: Dict[str, BaseExtractionAdapter] = {
    "native_pymupdf": native_adapter,
    "tesseract": tesseract_adapter,
    "paddleocr": paddleocr_adapter,
    "llm": llm_adapter,
    "multimodal": multimodal_adapter,
    "hybrid": hybrid_router
}

def get_adapter(method_id: str) -> BaseExtractionAdapter:
    if method_id not in ADAPTER_REGISTRY:
        return hybrid_router
    return ADAPTER_REGISTRY[method_id]

def list_adapters_info() -> List[Dict[str, Any]]:
    results = []
    for mid, adapter in ADAPTER_REGISTRY.items():
        avail, reason = adapter.is_available()
        results.append({
            "method_id": mid,
            "display_name": adapter.display_name,
            "is_available": avail,
            "status_message": reason
        })
    return results

