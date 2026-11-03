from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Tuple, Any
from pydantic import BaseModel, Field
from app.schemas.insurance_schemas import DocumentSchemaDefinition

class EvidenceItem(BaseModel):
    field_name: str
    page_number: int
    evidence_text: str
    bbox_x0: Optional[float] = None
    bbox_y0: Optional[float] = None
    bbox_x1: Optional[float] = None
    bbox_y1: Optional[float] = None
    char_confidence: float = 1.0

class ExtractedFieldItem(BaseModel):
    field_name: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    data_type: str = "string"
    state: str = "extracted"  # extracted, missing, ambiguous, conflicting, invalid
    confidence: float = 1.0
    is_critical: bool = False
    needs_review: bool = False

class ExtractionResult(BaseModel):
    doc_id: str
    method_id: str  # native_pymupdf, tesseract, paddleocr, llm, multimodal, hybrid
    status: str = "completed"  # completed, partial, failed
    duration_ms: float = 0.0
    fields: List[ExtractedFieldItem] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    input_tokens: int = 0
    output_tokens: int = 0
    calculated_cost_usd: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)

class BaseExtractionAdapter(ABC):
    @property
    @abstractmethod
    def method_id(self) -> str:
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        pass

    @abstractmethod
    def is_available(self) -> Tuple[bool, str]:
        """Returns (is_available, reason_or_diagnostic_message)"""
        pass

    @abstractmethod
    def extract(
        self,
        doc_id: str,
        pdf_path: str,
        schema: DocumentSchemaDefinition,
        options: Optional[Dict[str, Any]] = None
    ) -> ExtractionResult:
        """Executes extraction over the document returning structured fields and provenance."""
        pass

