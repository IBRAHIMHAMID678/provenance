from typing import Dict, Any, List
from app.config import settings

class CostAccountingEngine:
    @staticmethod
    def calculate_machine_cost(
        method_id: str,
        input_tokens: int,
        output_tokens: int,
        duration_ms: float,
        pages_count: int
    ) -> float:
        if method_id == "native_pymupdf":
            # Native C extraction: purely local CPU overhead (fractions of a cent)
            cpu_hours = (duration_ms / 1000.0) / 3600.0
            return round(cpu_hours * settings.CPU_HOUR_COST, 6)
        
        elif method_id == "tesseract":
            # Tesseract local compute cost
            cpu_hours = (duration_ms / 1000.0) / 3600.0
            return round(cpu_hours * settings.CPU_HOUR_COST, 6)

        elif method_id == "paddleocr":
            gpu_hours = (duration_ms / 1000.0) / 3600.0
            return round(gpu_hours * settings.GPU_HOUR_COST, 6)

        elif method_id == "multimodal":
            # Vision tile model pricing: ~$0.0025 per page + output tokens
            base_img_cost = pages_count * 0.0025
            token_cost = (output_tokens / 1_000_000.0) * settings.MOCK_LLM_OUTPUT_TOKEN_PRICE_PER_M
            return round(base_img_cost + token_cost, 6)

        elif method_id in ("llm", "hybrid"):
            token_cost = (
                (input_tokens / 1_000_000.0 * settings.MOCK_LLM_INPUT_TOKEN_PRICE_PER_M) +
                (output_tokens / 1_000_000.0 * settings.MOCK_LLM_OUTPUT_TOKEN_PRICE_PER_M)
            )
            return round(token_cost, 6)

        return 0.0

    @staticmethod
    def calculate_human_review_cost(review_time_seconds: float) -> float:
        hours = review_time_seconds / 3600.0
        return round(hours * settings.HUMAN_REVIEWER_HOURLY_RATE, 4)

    @classmethod
    def calculate_fully_loaded_cost(
        cls,
        machine_cost: float,
        review_time_seconds: float
    ) -> float:
        human_cost = cls.calculate_human_review_cost(review_time_seconds)
        return round(machine_cost + human_cost, 4)

cost_accounting_engine = CostAccountingEngine()

