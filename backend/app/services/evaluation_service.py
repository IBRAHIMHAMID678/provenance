import re
import numpy as np
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class FieldEvaluationMetric(BaseModel):
    field_name: str
    total_evaluated: int
    exact_matches: int
    normalized_matches: int
    missing_count: int
    hallucinated_count: int
    accuracy_exact: float
    accuracy_normalized: float

class EvaluationSummary(BaseModel):
    method_id: str
    total_documents: int
    total_fields: int
    total_correct_fields: int
    exact_accuracy: float
    normalized_accuracy: float
    critical_field_accuracy: float
    document_level_accuracy: float
    completeness: float
    hallucination_rate: float
    human_review_rate: float
    p50_latency_ms: float
    p90_latency_ms: float
    p95_latency_ms: float
    total_machine_cost: float
    total_human_review_cost: float
    cost_per_document: float
    cost_per_correct_field: float
    field_breakdown: Dict[str, Any]

class EvaluationEngine:
    @staticmethod
    def _normalize(val: Optional[str]) -> str:
        if not val:
            return ""
        v = str(val).lower().strip()
        # Remove currency symbols and formatting commas
        v = re.sub(r"[$,]", "", v)
        # Normalize whitespace
        v = re.sub(r"\s+", " ", v)
        return v

    def evaluate_run(
        self,
        method_id: str,
        predictions_by_doc: Dict[str, Dict[str, Any]],  # doc_id -> {field_name: extracted_val}
        ground_truth_by_doc: Dict[str, Dict[str, Any]], # doc_id -> {field_name: expected_val}
        critical_fields: List[str],
        latencies_ms: List[float],
        machine_cost: float,
        human_review_time_seconds: float = 0.0,
        reviewed_docs_count: int = 0
    ) -> EvaluationSummary:
        total_docs = len(ground_truth_by_doc)
        if total_docs == 0:
            return EvaluationSummary(
                method_id=method_id,
                total_documents=0,
                total_fields=0,
                total_correct_fields=0,
                exact_accuracy=0.0,
                normalized_accuracy=0.0,
                critical_field_accuracy=0.0,
                document_level_accuracy=0.0,
                completeness=0.0,
                hallucination_rate=0.0,
                human_review_rate=0.0,
                p50_latency_ms=0.0,
                p90_latency_ms=0.0,
                p95_latency_ms=0.0,
                total_machine_cost=0.0,
                total_human_review_cost=0.0,
                cost_per_document=0.0,
                cost_per_correct_field=0.0,
                field_breakdown={}
            )

        total_fields_eval = 0
        total_exact = 0
        total_normalized = 0
        total_critical_eval = 0
        total_critical_correct = 0
        docs_perfect = 0
        hallucinated_fields = 0

        field_stats: Dict[str, Dict[str, int]] = {}

        for doc_id, expected_fields in ground_truth_by_doc.items():
            pred_fields = predictions_by_doc.get(doc_id, {})
            all_doc_fields_correct = True

            for fname, exp_val in expected_fields.items():
                total_fields_eval += 1
                if fname not in field_stats:
                    field_stats[fname] = {"total": 0, "exact": 0, "normalized": 0, "missing": 0}
                field_stats[fname]["total"] += 1

                pred_val = pred_fields.get(fname)
                is_crit = fname in critical_fields
                if is_crit:
                    total_critical_eval += 1

                if pred_val is None or str(pred_val).strip() == "":
                    field_stats[fname]["missing"] += 1
                    all_doc_fields_correct = False
                    continue

                # Exact match
                is_exact = str(pred_val).strip() == str(exp_val).strip()
                if is_exact:
                    total_exact += 1
                    field_stats[fname]["exact"] += 1

                # Normalized match
                is_norm = self._normalize(pred_val) == self._normalize(exp_val)
                if is_norm:
                    total_normalized += 1
                    field_stats[fname]["normalized"] += 1
                    if is_crit:
                        total_critical_correct += 1
                else:
                    all_doc_fields_correct = False
                    hallucinated_fields += 1

            if all_doc_fields_correct:
                docs_perfect += 1

        # Accuracy computations
        total_missing = sum(s["missing"] for s in field_stats.values())
        total_extracted = total_fields_eval - total_missing
        exact_acc = round(total_exact / total_fields_eval, 4) if total_fields_eval > 0 else 0.0
        norm_acc = round(total_normalized / total_fields_eval, 4) if total_fields_eval > 0 else 0.0
        crit_acc = round(total_critical_correct / total_critical_eval, 4) if total_critical_eval > 0 else 0.0
        doc_acc = round(docs_perfect / total_docs, 4) if total_docs > 0 else 0.0
        completeness = round(total_extracted / total_fields_eval, 4) if total_fields_eval > 0 else 0.0
        hallucination_rate = round(hallucinated_fields / total_fields_eval, 4) if total_fields_eval > 0 else 0.0
        review_rate = round(reviewed_docs_count / total_docs, 4) if total_docs > 0 else 0.0

        # Latency statistics
        if latencies_ms:
            p50 = float(np.percentile(latencies_ms, 50))
            p90 = float(np.percentile(latencies_ms, 90))
            p95 = float(np.percentile(latencies_ms, 95))
        else:
            p50 = p90 = p95 = 0.0

        # Cost accounting calculations
        from app.services.cost_accounting import cost_accounting_engine
        human_cost = cost_accounting_engine.calculate_human_review_cost(human_review_time_seconds)
        total_loaded_cost = machine_cost + human_cost
        cost_per_doc = round(total_loaded_cost / total_docs, 4) if total_docs > 0 else 0.0

        # Cost per Correct Field ($/CF)
        # Total attributable cost / Total correct fields. Protected against division by zero.
        if total_normalized > 0:
            cost_per_correct_field = round(total_loaded_cost / total_normalized, 5)
        else:
            cost_per_correct_field = float("inf")

        # Field breakdown summary
        breakdown = {}
        for fname, s in field_stats.items():
            tot = s["total"]
            breakdown[fname] = {
                "total": tot,
                "exact_acc": round(s["exact"] / tot, 3) if tot > 0 else 0.0,
                "norm_acc": round(s["normalized"] / tot, 3) if tot > 0 else 0.0,
                "missing": s["missing"]
            }

        return EvaluationSummary(
            method_id=method_id,
            total_documents=total_docs,
            total_fields=total_fields_eval,
            total_correct_fields=total_normalized,
            exact_accuracy=exact_acc,
            normalized_accuracy=norm_acc,
            critical_field_accuracy=crit_acc,
            document_level_accuracy=doc_acc,
            completeness=completeness,
            hallucination_rate=hallucination_rate,
            human_review_rate=review_rate,
            p50_latency_ms=round(p50, 1),
            p90_latency_ms=round(p90, 1),
            p95_latency_ms=round(p95, 1),
            total_machine_cost=round(machine_cost, 4),
            total_human_review_cost=round(human_cost, 4),
            cost_per_document=cost_per_doc,
            cost_per_correct_field=cost_per_correct_field,
            field_breakdown=breakdown
        )

evaluation_engine = EvaluationEngine()

