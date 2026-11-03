import random
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, List
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class SyntheticDocumentGenerator:
    CLAIMANTS = ["Arthur Pendelton", "Elena Rostova", "Marcus Vance", "Sophia Al-Mansoor", "David K. Chen"]
    INSURERS = ["Apex Global Insurance", "Sentinel Casualty Co.", "Meridian Mutual Group", "Harbor Indemnity"]
    VENDORS = ["Precision Auto Collision Center", "Metropolitan Health Services", "Apex Bio-Clean Restoration"]
    PROCEDURES = [
        ("Diagnostic Cervical Spine CT", "72125", 850.00),
        ("Orthopedic Specialist Consultation", "99204", 320.00),
        ("Post-Trauma Physical Therapy Session", "97110", 175.00)
    ]

    @classmethod
    def generate_claim_form(cls, output_path: str, seed: int = 100) -> Dict[str, Any]:
        random.seed(seed)
        claim_id = f"CLM-2026-{random.randint(10000, 99999)}"
        policy_num = f"POL-{random.randint(500000, 999999)}"
        claimant = random.choice(cls.CLAIMANTS)
        insurer = random.choice(cls.INSURERS)
        
        inc_date = (datetime(2026, 1, 1) + timedelta(days=random.randint(10, 60))).strftime("%Y-%m-%d")
        filing_date = (datetime.strptime(inc_date, "%Y-%m-%d") + timedelta(days=random.randint(2, 10))).strftime("%Y-%m-%d")
        amount = round(random.uniform(2500.0, 18500.0), 2)

        doc = SimpleDocTemplate(output_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle', parent=styles['Heading1'], fontSize=18, leading=22, textColor=colors.HexColor("#1A202C")
        )
        notice_style = ParagraphStyle(
            'Notice', parent=styles['Normal'], fontSize=8, leading=10, textColor=colors.HexColor("#718096")
        )

        elements = [
            Paragraph("<b>INSURANCE CLAIM FORM</b>", title_style),
            Paragraph("<i>[SYNTHETIC TEST DOCUMENT - GENERATED FOR INTELLIGENCE LAB BENCHMARK]</i>", notice_style),
            Spacer(1, 15)
        ]

        data = [
            ["Claim ID / Reference:", claim_id, "Policy Number:", policy_num],
            ["Claimant Full Name:", claimant, "Underwriting Insurer:", insurer],
            ["Date of Loss / Incident:", inc_date, "Claim Filing Date:", filing_date],
            ["Incident Location:", "402 Industrial Pkwy, Sector 4", "Damage Category:", "Property / Structural Impact"],
            ["Total Claimed Amount:", f"${amount:,.2f}", "Currency:", "USD"],
            ["Claim Status:", "Under Investigation", "Investigator ID:", "ADJ-8821"]
        ]

        t = Table(data, colWidths=[130, 140, 130, 140])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F7FAFC")),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#2D3748")),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))

        narrative = (
            f"STATEMENT OF LOSS: On {inc_date}, severe structural damage was sustained at the insured premises. "
            f"The claimant, {claimant}, reported direct impact requiring emergency stabilization and restorative repairs. "
            f"Total estimated restorative indemnification requested is ${amount:,.2f} USD under policy {policy_num}."
        )
        elements.append(Paragraph("<b>Loss Description & Circumstances:</b>", styles['Heading3']))
        elements.append(Paragraph(narrative, styles['Normal']))

        doc.build(elements)

        ground_truth = {
            "claim_id": claim_id,
            "policy_number": policy_num,
            "claimant_name": claimant,
            "incident_date": inc_date,
            "filing_date": filing_date,
            "requested_amount": f"{amount:.2f}",
            "currency": "USD",
            "claim_status": "Under Investigation"
        }
        return ground_truth

    @classmethod
    def generate_invoice(cls, output_path: str, seed: int = 200) -> Dict[str, Any]:
        random.seed(seed)
        inv_num = f"INV-2026-{random.randint(1000, 9999)}"
        vendor = random.choice(cls.VENDORS)
        inv_date = (datetime(2026, 2, 1) + timedelta(days=random.randint(1, 20))).strftime("%Y-%m-%d")
        due_date = (datetime.strptime(inv_date, "%Y-%m-%d") + timedelta(days=30)).strftime("%Y-%m-%d")

        subtotal = round(random.uniform(1200.0, 6500.0), 2)
        tax = round(subtotal * 0.08, 2)
        discount = 50.00
        total = round(subtotal + tax - discount, 2)

        doc = SimpleDocTemplate(output_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()

        elements = [
            Paragraph("<b>REPAIR & SERVICE INVOICE</b>", styles['Heading1']),
            Paragraph("<i>[SYNTHETIC TEST DOCUMENT - RECONCILIATION VERIFICATION]</i>", styles['Normal']),
            Spacer(1, 15)
        ]

        header_data = [
            ["Invoice Number:", inv_num, "Invoice Date:", inv_date],
            ["Vendor Name:", vendor, "Due Date:", due_date],
            ["Bill To:", "Apex Global Claims Operations", "Currency:", "USD"]
        ]
        t_header = Table(header_data, colWidths=[120, 150, 120, 150])
        t_header.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5)
        ]))
        elements.append(t_header)
        elements.append(Spacer(1, 20))

        # Financial breakdown table
        financial_data = [
            ["Subtotal Amount:", f"${subtotal:,.2f}"],
            ["Tax Amount (8%):", f"${tax:,.2f}"],
            ["Discount Amount:", f"-${discount:,.2f}"],
            ["Total Amount Due:", f"${total:,.2f}"]
        ]
        t_fin = Table(financial_data, colWidths=[200, 150])
        t_fin.setStyle(TableStyle([
            ('FONTNAME', (-1, -1), (-1, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#EDF2F7")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#A0AEC0")),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6)
        ]))
        elements.append(t_fin)
        doc.build(elements)

        return {
            "invoice_number": inv_num,
            "invoice_date": inv_date,
            "vendor_name": vendor,
            "subtotal": f"{subtotal:.2f}",
            "tax_amount": f"{tax:.2f}",
            "discount_amount": f"{discount:.2f}",
            "total_amount": f"{total:.2f}",
            "currency": "USD"
        }

    @classmethod
    def generate_policy_schedule(cls, output_path: str, seed: int = 300) -> Dict[str, Any]:
        random.seed(seed)
        pol_num = f"POL-{random.randint(700000, 899999)}"
        insurer = random.choice(cls.INSURERS)
        policyholder = random.choice(cls.CLAIMANTS)
        eff_date = "2026-01-01"
        exp_date = "2027-01-01"
        premium = round(random.uniform(1400.0, 4800.0), 2)
        limit = 1000000.00
        deductible = 1000.00

        doc = SimpleDocTemplate(output_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()

        elements = [
            Paragraph("<b>INSURANCE POLICY SCHEDULE</b>", styles['Heading1']),
            Paragraph("<i>[SYNTHETIC TEST DOCUMENT - GOLD EVALUATION PARTITION]</i>", styles['Normal']),
            Spacer(1, 15)
        ]

        data = [
            ["Policy Number:", pol_num, "Underwriting Insurer:", insurer],
            ["Named Policyholder:", policyholder, "Coverage Type:", "Commercial Property All-Risk"],
            ["Effective Date:", eff_date, "Expiration Date:", exp_date],
            ["Gross Premium Amount:", f"${premium:,.2f}", "Currency:", "USD"],
            ["Deductible Excess:", f"${deductible:,.2f}", "Limit of Liability:", f"${limit:,.2f}"]
        ]
        t = Table(data, colWidths=[130, 140, 130, 140])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6)
        ]))
        elements.append(t)
        doc.build(elements)

        return {
            "policy_number": pol_num,
            "insurer_name": insurer,
            "policyholder_name": policyholder,
            "effective_date": eff_date,
            "expiration_date": exp_date,
            "coverage_type": "Commercial Property All-Risk",
            "premium_amount": f"{premium:.2f}",
            "coverage_limit": f"{limit:.2f}",
            "deductible": f"{deductible:.2f}",
            "currency": "USD"
        }

synthetic_generator = SyntheticDocumentGenerator()

