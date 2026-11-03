from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class FieldDefinition(BaseModel):
    name: str
    display_name: str
    data_type: str  # string, decimal, date, currency, boolean, list
    is_critical: bool = False
    is_required: bool = False
    description: str = ""

class DocumentSchemaDefinition(BaseModel):
    category: str
    display_name: str
    description: str
    fields: List[FieldDefinition]

# 1. Insurance Claim Form
CLAIM_FORM_SCHEMA = DocumentSchemaDefinition(
    category="claim_form",
    display_name="Insurance Claim Form",
    description="Standard first notice of loss or property/auto/casualty claim submission form.",
    fields=[
        FieldDefinition(name="claim_id", display_name="Claim Number / ID", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="policy_number", display_name="Policy Number", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="claimant_name", display_name="Claimant Full Name", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="incident_date", display_name="Incident Date", data_type="date", is_critical=True, is_required=True),
        FieldDefinition(name="filing_date", display_name="Filing Date", data_type="date", is_critical=False, is_required=True),
        FieldDefinition(name="incident_location", display_name="Incident Location", data_type="string", is_critical=False),
        FieldDefinition(name="incident_description", display_name="Description of Loss", data_type="string", is_critical=False),
        FieldDefinition(name="damage_type", display_name="Damage Category", data_type="string", is_critical=False),
        FieldDefinition(name="requested_amount", display_name="Claim Amount Requested", data_type="decimal", is_critical=True, is_required=True),
        FieldDefinition(name="currency", display_name="Currency", data_type="currency", is_critical=False, is_required=True),
        FieldDefinition(name="claim_status", display_name="Claim Status", data_type="string", is_critical=False)
    ]
)

# 2. Policy Schedule
POLICY_SCHEDULE_SCHEMA = DocumentSchemaDefinition(
    category="policy_schedule",
    display_name="Insurance Policy Schedule",
    description="Policy specification outlining insurer, insured, effective periods, and coverages.",
    fields=[
        FieldDefinition(name="policy_number", display_name="Policy Number", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="insurer_name", display_name="Underwriting Insurer", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="policyholder_name", display_name="Policyholder Name", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="effective_date", display_name="Effective Start Date", data_type="date", is_critical=True, is_required=True),
        FieldDefinition(name="expiration_date", display_name="Expiration Date", data_type="date", is_critical=True, is_required=True),
        FieldDefinition(name="coverage_type", display_name="Coverage Type", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="premium_amount", display_name="Gross Premium Amount", data_type="decimal", is_critical=True, is_required=True),
        FieldDefinition(name="currency", display_name="Currency", data_type="currency", is_critical=False, is_required=True),
        FieldDefinition(name="deductible", display_name="Deductible / Excess", data_type="decimal", is_critical=False),
        FieldDefinition(name="coverage_limit", display_name="Coverage Limit", data_type="decimal", is_critical=True)
    ]
)

# 3. Insurance Invoice
INSURANCE_INVOICE_SCHEMA = DocumentSchemaDefinition(
    category="insurance_invoice",
    display_name="Insurance Invoice / Repair Bill",
    description="Itemized repair bill, vendor service invoice, or legal fee statement for a claim.",
    fields=[
        FieldDefinition(name="invoice_number", display_name="Invoice Number", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="invoice_date", display_name="Invoice Date", data_type="date", is_critical=True, is_required=True),
        FieldDefinition(name="due_date", display_name="Payment Due Date", data_type="date", is_critical=False),
        FieldDefinition(name="vendor_name", display_name="Vendor / Supplier Name", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="subtotal", display_name="Subtotal Amount", data_type="decimal", is_critical=True, is_required=True),
        FieldDefinition(name="tax_amount", display_name="Tax Amount", data_type="decimal", is_critical=False, is_required=True),
        FieldDefinition(name="discount_amount", display_name="Discount Amount", data_type="decimal", is_critical=False),
        FieldDefinition(name="total_amount", display_name="Total Payable Amount", data_type="decimal", is_critical=True, is_required=True),
        FieldDefinition(name="currency", display_name="Currency", data_type="currency", is_critical=False, is_required=True),
        FieldDefinition(name="line_items_count", display_name="Line Items Count", data_type="integer", is_critical=False)
    ]
)

# 4. Medical Expense Bill
MEDICAL_EXPENSE_BILL_SCHEMA = DocumentSchemaDefinition(
    category="medical_expense_bill",
    display_name="Medical Expense Bill",
    description="Hospital, clinic, or practitioner billing statement for personal injury claims.",
    fields=[
        FieldDefinition(name="bill_number", display_name="Billing Reference", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="patient_name", display_name="Patient Name", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="provider_name", display_name="Healthcare Provider", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="service_date", display_name="Date of Service", data_type="date", is_critical=True, is_required=True),
        FieldDefinition(name="procedure_code", display_name="CPT / Diagnosis Code", data_type="string", is_critical=False),
        FieldDefinition(name="procedure_description", display_name="Procedure Description", data_type="string", is_critical=False),
        FieldDefinition(name="total_charge", display_name="Total Charge", data_type="decimal", is_critical=True, is_required=True),
        FieldDefinition(name="currency", display_name="Currency", data_type="currency", is_critical=False, is_required=True)
    ]
)

# 5. Settlement Agreement
SETTLEMENT_AGREEMENT_SCHEMA = DocumentSchemaDefinition(
    category="settlement_agreement",
    display_name="Claim Settlement Agreement",
    description="Legal release of liability and approved settlement compensation statement.",
    fields=[
        FieldDefinition(name="settlement_id", display_name="Settlement Agreement ID", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="claim_reference", display_name="Referenced Claim ID", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="releasor_name", display_name="Releasor (Claimant)", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="releasee_name", display_name="Releasee (Insured/Insurer)", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="settlement_amount", display_name="Approved Settlement Amount", data_type="decimal", is_critical=True, is_required=True),
        FieldDefinition(name="currency", display_name="Currency", data_type="currency", is_critical=False, is_required=True),
        FieldDefinition(name="execution_date", display_name="Execution Date", data_type="date", is_critical=False, is_required=True)
    ]
)

# 6. Insurance Certificate
INSURANCE_CERTIFICATE_SCHEMA = DocumentSchemaDefinition(
    category="insurance_certificate",
    display_name="Certificate of Insurance",
    description="Evidence of insurance coverage provided to commercial partners or lenders.",
    fields=[
        FieldDefinition(name="certificate_number", display_name="Certificate Number", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="insured_party", display_name="Insured Entity", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="certificate_holder", display_name="Certificate Holder", data_type="string", is_critical=False),
        FieldDefinition(name="policy_number", display_name="Underlying Policy", data_type="string", is_critical=True, is_required=True),
        FieldDefinition(name="liability_limit", display_name="Aggregate Liability Limit", data_type="decimal", is_critical=True),
        FieldDefinition(name="issue_date", display_name="Issue Date", data_type="date", is_critical=False, is_required=True)
    ]
)

# Registry of schemas
SCHEMA_REGISTRY: Dict[str, DocumentSchemaDefinition] = {
    "claim_form": CLAIM_FORM_SCHEMA,
    "policy_schedule": POLICY_SCHEDULE_SCHEMA,
    "insurance_invoice": INSURANCE_INVOICE_SCHEMA,
    "medical_expense_bill": MEDICAL_EXPENSE_BILL_SCHEMA,
    "settlement_agreement": SETTLEMENT_AGREEMENT_SCHEMA,
    "insurance_certificate": INSURANCE_CERTIFICATE_SCHEMA
}

def get_schema(category: str) -> DocumentSchemaDefinition:
    return SCHEMA_REGISTRY.get(category, CLAIM_FORM_SCHEMA)

