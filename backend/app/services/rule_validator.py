import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.services.adapters.base import ExtractedFieldItem

class RuleEvaluationResult(BaseModel):
    rule_id: str
    rule_name: str
    passed: bool
    severity: str  # critical, high, medium, low, info
    explanation: str
    affected_fields: List[str]

class RuleValidator:
    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
        if not date_str:
            return None
        cleaned = date_str.strip()
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"):
            try:
                return datetime.strptime(cleaned, fmt)
            except ValueError:
                pass
        return None

    @staticmethod
    def _parse_float(val: Optional[str]) -> Optional[float]:
        if not val:
            return None
        cleaned = re.sub(r"[^\d.-]", "", str(val))
        try:
            return float(cleaned)
        except ValueError:
            return None

    def validate_document(
        self,
        document_type: str,
        fields: List[ExtractedFieldItem]
    ) -> List[RuleEvaluationResult]:
        results: List[RuleEvaluationResult] = []
        field_map = {f.field_name: f for f in fields}

        # 1. Math Reconciliation for Invoices (Subtotal + Tax - Discount == Total)
        if document_type in ("insurance_invoice", "repair_bill") or "total_amount" in field_map:
            sub = self._parse_float(field_map.get("subtotal", ExtractedFieldItem(field_name="subtotal")).normalized_value)
            tax = self._parse_float(field_map.get("tax_amount", ExtractedFieldItem(field_name="tax_amount")).normalized_value) or 0.0
            disc = self._parse_float(field_map.get("discount_amount", ExtractedFieldItem(field_name="discount_amount")).normalized_value) or 0.0
            tot = self._parse_float(field_map.get("total_amount", ExtractedFieldItem(field_name="total_amount")).normalized_value)

            if sub is not None and tot is not None:
                expected_total = sub + tax - disc
                diff = abs(expected_total - tot)
                passed = diff <= 0.05
                exp = (
                    f"Subtotal ({sub:.2f}) + Tax ({tax:.2f}) - Discount ({disc:.2f}) = {expected_total:.2f}. "
                    f"Declared Total is {tot:.2f} (Delta: ${diff:.2f})."
                )
                results.append(RuleEvaluationResult(
                    rule_id="rule_invoice_reconciliation",
                    rule_name="Invoice Math Reconciliation",
                    passed=passed,
                    severity="critical" if not passed else "info",
                    explanation=exp,
                    affected_fields=["subtotal", "tax_amount", "discount_amount", "total_amount"]
                ))

        # 2. Chronological Sanity: Incident Date <= Filing Date
        inc_raw = field_map.get("incident_date")
        fil_raw = field_map.get("filing_date")
        if inc_raw and fil_raw and inc_raw.normalized_value and fil_raw.normalized_value:
            inc_dt = self._parse_date(inc_raw.normalized_value)
            fil_dt = self._parse_date(fil_raw.normalized_value)
            if inc_dt and fil_dt:
                passed = inc_dt <= fil_dt
                exp = (
                    f"Incident occurred on {inc_dt.strftime('%Y-%m-%d')}, filing was {fil_dt.strftime('%Y-%m-%d')}."
                    if passed else
                    f"Chronological violation: Incident ({inc_dt.strftime('%Y-%m-%d')}) reported as occurring AFTER filing date ({fil_dt.strftime('%Y-%m-%d')})."
                )
                results.append(RuleEvaluationResult(
                    rule_id="rule_chronological_sanity",
                    rule_name="Incident vs Filing Date Sanity",
                    passed=passed,
                    severity="high" if not passed else "info",
                    explanation=exp,
                    affected_fields=["incident_date", "filing_date"]
                ))

        # 3. Policy Term Coverage: Effective Date <= Expiration Date
        eff_raw = field_map.get("effective_date")
        exp_raw = field_map.get("expiration_date")
        if eff_raw and exp_raw and eff_raw.normalized_value and exp_raw.normalized_value:
            eff_dt = self._parse_date(eff_raw.normalized_value)
            exp_dt = self._parse_date(exp_raw.normalized_value)
            if eff_dt and exp_dt:
                passed = eff_dt < exp_dt
                exp = (
                    f"Policy term: {eff_dt.strftime('%Y-%m-%d')} to {exp_dt.strftime('%Y-%m-%d')}."
                    if passed else
                    f"Policy expiration ({exp_dt.strftime('%Y-%m-%d')}) precedes effective start date ({eff_dt.strftime('%Y-%m-%d')})."
                )
                results.append(RuleEvaluationResult(
                    rule_id="rule_policy_term_coverage",
                    rule_name="Policy Term Validity",
                    passed=passed,
                    severity="critical" if not passed else "info",
                    explanation=exp,
                    affected_fields=["effective_date", "expiration_date"]
                ))

        # 4. Positive Amounts Check
        amount_fields = ["requested_amount", "premium_amount", "total_amount", "settlement_amount", "total_charge"]
        for af in amount_fields:
            if af in field_map:
                fval = self._parse_float(field_map[af].normalized_value)
                if fval is not None:
                    passed = fval > 0.0
                    results.append(RuleEvaluationResult(
                        rule_id=f"rule_positive_amount_{af}",
                        rule_name=f"Positive Amount Validation ({af})",
                        passed=passed,
                        severity="high" if not passed else "info",
                        explanation=f"{af} value is {fval:.2f}." if passed else f"{af} is non-positive ({fval}).",
                        affected_fields=[af]
                    ))

        # 5. Core Identifier Required Check
        id_fields = ["claim_id", "policy_number", "invoice_number", "bill_number", "certificate_number"]
        found_id = any(
            fn in field_map and field_map[fn].state == "extracted" and field_map[fn].raw_value
            for fn in id_fields
        )
        results.append(RuleEvaluationResult(
            rule_id="rule_required_identifier",
            rule_name="Document Identifier Integrity",
            passed=found_id,
            severity="critical" if not found_id else "info",
            explanation="Tracking identifier found in document." if found_id else "No primary tracking identifier (Claim #, Policy #, or Invoice #) could be identified.",
            affected_fields=id_fields
        ))

        return results

rule_validator = RuleValidator()

