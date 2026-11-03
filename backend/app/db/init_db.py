from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.models import Workspace, ValidationRule, SystemSetting

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Default Workspace
        default_ws = db.query(Workspace).filter_by(slug="default").first()
        if not default_ws:
            default_ws = Workspace(
                name="Default Operations Workspace",
                slug="default"
            )
            db.add(default_ws)

        # 2. Seed Standard Insurance Validation Rules
        rules = [
            ValidationRule(
                id="rule_invoice_reconciliation",
                name="Invoice Math Reconciliation",
                description="Verifies that Subtotal + Tax - Discount reconciles with Total within 0.02 tolerance.",
                target_document_type="insurance_invoice",
                severity="critical",
                is_enabled=True,
                rule_logic_type="math_reconciliation",
                parameters={"tolerance": 0.02}
            ),
            ValidationRule(
                id="rule_chronological_sanity",
                name="Incident vs Filing Date Sanity",
                description="Ensures incident date occurred on or before the claim filing date.",
                target_document_type="claim_form",
                severity="high",
                is_enabled=True,
                rule_logic_type="chronological",
                parameters={"earlier_field": "incident_date", "later_field": "filing_date"}
            ),
            ValidationRule(
                id="rule_policy_term_coverage",
                name="Incident Date within Policy Term",
                description="Checks that the incident occurred between policy effective date and expiration date.",
                target_document_type="claim_form",
                severity="critical",
                is_enabled=True,
                rule_logic_type="chronological",
                parameters={"start_field": "effective_date", "incident_field": "incident_date", "end_field": "expiration_date"}
            ),
            ValidationRule(
                id="rule_positive_monetary_amount",
                name="Positive Claim & Invoice Amounts",
                description="Validates that requested claim amounts and invoice totals are strictly greater than zero.",
                target_document_type="all",
                severity="high",
                is_enabled=True,
                rule_logic_type="math_bounds",
                parameters={"min_value": 0.01}
            ),
            ValidationRule(
                id="rule_required_policy_identifier",
                name="Required Policy or Claim Identifier",
                description="Flags documents where core tracking numbers (policy_number or claim_id) are completely unextracted.",
                target_document_type="all",
                severity="critical",
                is_enabled=True,
                rule_logic_type="required_field",
                parameters={"fields": ["policy_number", "claim_id", "invoice_number"]}
            )
        ]

        for r in rules:
            existing = db.query(ValidationRule).filter_by(id=r.id).first()
            if not existing:
                db.add(r)

        # 3. Seed Default System Settings
        default_settings = [
            SystemSetting(key="human_reviewer_hourly_rate", value={"amount": 35.0, "currency": "USD"}, category="cost"),
            SystemSetting(key="cpu_hour_cost", value={"amount": 0.05, "currency": "USD"}, category="cost"),
            SystemSetting(key="gpu_hour_cost", value={"amount": 0.50, "currency": "USD"}, category="cost"),
            SystemSetting(key="routing_thresholds", value={
                "min_digital_char_density": 200,
                "max_image_area_ratio": 0.35,
                "review_confidence_threshold": 0.85
            }, category="routing"),
            SystemSetting(key="active_llm_provider", value={"provider": "mock", "model": "mock-insurance-extractor-v1"}, category="llm")
        ]

        for s in default_settings:
            existing_s = db.query(SystemSetting).filter_by(key=s.key).first()
            if not existing_s:
                db.add(s)

        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized and seeded successfully.")

