import re
from typing import Tuple, Dict

class DocumentClassifier:
    CATEGORY_KEYWORDS: Dict[str, list[str]] = {
        "claim_form": [
            "claim form", "notice of loss", "claimant name", "incident date", "claim id", 
            "claim number", "damage description", "date of loss", "claim amount"
        ],
        "policy_schedule": [
            "policy schedule", "policy declaration", "policyholder", "period of insurance", 
            "coverage schedule", "deductible", "limit of liability", "gross premium", "underwriter"
        ],
        "insurance_invoice": [
            "invoice", "tax invoice", "subtotal", "total amount due", "repair bill", 
            "vendor", "bill to", "due date", "remittance"
        ],
        "medical_expense_bill": [
            "medical bill", "patient name", "healthcare provider", "date of service", 
            "procedure code", "cpt code", "hospital charges", "physician"
        ],
        "settlement_agreement": [
            "settlement agreement", "release and discharge", "releasee", "releasor", 
            "full and final settlement", "indemnify", "agreed compensation"
        ],
        "insurance_certificate": [
            "certificate of insurance", "this certificate is issued", "certificate holder", 
            "insured party", "authorized representative", "liability coverage"
        ]
    }

    @classmethod
    def classify_text(cls, full_text: str) -> Tuple[str, float]:
        text_lower = full_text.lower()
        if not text_lower.strip():
            return "unclassified", 0.0

        scores: Dict[str, int] = {}
        for category, keywords in cls.CATEGORY_KEYWORDS.items():
            match_count = 0
            for kw in keywords:
                if kw in text_lower:
                    match_count += 1
            scores[category] = match_count

        best_category = max(scores, key=scores.get)
        best_count = scores[best_category]

        if best_count >= 2:
            confidence = min(0.95, 0.4 + (best_count * 0.15))
            return best_category, confidence
        elif best_count == 1:
            return best_category, 0.50
        else:
            return "claim_form", 0.30  # Default fallback

document_classifier = DocumentClassifier()

