import os
import random
from typing import Dict, Any, List, Optional
import fitz
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.services.ground_truth import REFERENCE_DOCUMENTS, get_ground_truth_by_id

class SyntheticDocumentGenerator:
    """
    Renders realistic synthetic insurance documents strictly by consuming
    verified ground truth specifications from ground_truth.py.
    """

    @classmethod
    def render_from_spec(cls, spec: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        """
        Renders a PDF strictly following the given reference specification.
        """
        gt = spec["ground_truth"]
        doc_type = spec["doc_type"]
        layout = spec.get("layout", "table_grid")
        pages = spec.get("pages", 1)
        is_scan = spec.get("is_scan", False)
        skew_deg = spec.get("skew_deg", 1.5)
        dpi = spec.get("dpi", 130)

        # Temporary clean PDF path before rasterization/scan degradation if needed
        clean_pdf_path = output_path if not is_scan else output_path + ".clean.pdf"
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        doc = SimpleDocTemplate(
            clean_pdf_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'DocTitle', parent=styles['Heading1'], fontSize=16, leading=20, textColor=colors.HexColor("#0F172A")
        )
        subtitle_style = ParagraphStyle(
            'SubTitle', parent=styles['Normal'], fontSize=9, leading=12, textColor=colors.HexColor("#64748B")
        )
        body_style = ParagraphStyle(
            'Body', parent=styles['Normal'], fontSize=9, leading=13, textColor=colors.HexColor("#1E293B")
        )

        elements = []

        # --- PAGE 1 CONTENT ---
        if doc_type == "claim_form":
            elements.append(Paragraph(f"<b>FIRST NOTICE OF LOSS / CLAIM REPORT</b>", title_style))
            elements.append(Paragraph(f"<i>Underwriting Insurer: {gt.get('insurer_name', 'Apex Global Insurance')}</i>", subtitle_style))
            elements.append(Spacer(1, 12))

            if layout in ("table_grid", "noisy_background"):
                data = [
                    ["Claim ID:", gt.get("claim_id", ""), "Policy Number:", gt.get("policy_number", "")],
                    ["Claimant Name:", gt.get("claimant_name", ""), "Insurer Name:", gt.get("insurer_name", "")],
                    ["Incident Date:", gt.get("incident_date", ""), "Filing Date:", gt.get("filing_date", "")],
                    ["Incident Location:", gt.get("incident_location", "Main Logistics Yard"), "Coverage:", gt.get("coverage_type", "Commercial Property")]
                ]
                # If single page, keep requested_amount on page 1
                if pages == 1:
                    data.append(["Requested Amount:", f"${float(gt.get('requested_amount', 0)):,.2f}", "Currency:", gt.get("currency", "USD")])
                    data.append(["Claim Status:", gt.get("claim_status", "Active"), "Damage Category:", gt.get("damage_type", "Structural")])

                t = Table(data, colWidths=[120, 150, 120, 150])
                bg_color = colors.HexColor("#F1F5F9") if layout != "noisy_background" else colors.HexColor("#E2E8F0")
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), bg_color),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('PADDING', (0, 0), (-1, -1), 5),
                ]))
                elements.append(t)

            elif layout == "two_column":
                data = [
                    ["Claim Reference:", gt.get("claim_id", ""), "Policy ID:", gt.get("policy_number", "")],
                    ["Insured Claimant:", gt.get("claimant_name", ""), "Primary Insurer:", gt.get("insurer_name", "")],
                    ["Loss Incident Date:", gt.get("incident_date", ""), "Date Reported:", gt.get("filing_date", "")]
                ]
                if pages == 1:
                    data.append(["Claimed Amount:", f"${float(gt.get('requested_amount', 0)):,.2f}", "Currency Code:", gt.get("currency", "USD")])
                    data.append(["Status:", gt.get("claim_status", "Open"), "Loss Category:", gt.get("damage_type", "Impact")])

                t = Table(data, colWidths=[130, 140, 130, 140])
                t.setStyle(TableStyle([
                    ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#94A3B8")),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('PADDING', (0, 0), (-1, -1), 6)
                ]))
                elements.append(t)

            elif layout == "alternate_labels":
                data = [
                    ["Reference Number:", gt.get("claim_id", ""), "Policy Contract #:", gt.get("policy_number", "")],
                    ["Named Insured:", gt.get("claimant_name", ""), "Underwriter:", gt.get("insurer_name", "")],
                    ["Date of Loss:", gt.get("incident_date", ""), "Notification Date:", gt.get("filing_date", "")]
                ]
                if pages == 1:
                    data.append(["Total Indemnity Claimed:", f"${float(gt.get('requested_amount', 0)):,.2f}", "Currency:", gt.get("currency", "USD")])
                    data.append(["Adjudication State:", gt.get("claim_status", "Pending"), "Classification:", gt.get("damage_type", "Water")])

                t = Table(data, colWidths=[140, 130, 140, 130])
                t.setStyle(TableStyle([
                    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#475569")),
                    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('PADDING', (0, 0), (-1, -1), 5)
                ]))
                elements.append(t)

            elif layout == "paragraph_narrative":
                narrative_p1 = (
                    f"FORMAL LOSS REPORT: This document certifies that under Policy Number {gt.get('policy_number')}, "
                    f"a claim designated as Claim ID {gt.get('claim_id')} has been filed by claimant {gt.get('claimant_name')}. "
                    f"The incident occurred on {gt.get('incident_date')} at {gt.get('incident_location', 'Premises')}, "
                    f"and notice was submitted on {gt.get('filing_date')} to {gt.get('insurer_name')}."
                )
                elements.append(Paragraph(narrative_p1, body_style))
                elements.append(Spacer(1, 10))
                if pages == 1:
                    narrative_p1_end = (
                        f"Financial reconciliation confirms a Total Claimed Amount of ${float(gt.get('requested_amount', 0)):,.2f} {gt.get('currency', 'USD')}. "
                        f"The claim status is currently {gt.get('claim_status')} regarding damage category: {gt.get('damage_type')}."
                    )
                    elements.append(Paragraph(narrative_p1_end, body_style))

            else:  # boxed_header or dense_key_value
                data = [
                    ["CLAIM REFERENCE ID", gt.get("claim_id", ""), "POLICY NUMBER", gt.get("policy_number", "")],
                    ["CLAIMANT FULL NAME", gt.get("claimant_name", ""), "INSURER NAME", gt.get("insurer_name", "")],
                    ["INCIDENT LOSS DATE", gt.get("incident_date", ""), "FILING DATE", gt.get("filing_date", "")]
                ]
                if pages == 1:
                    data.append(["CLAIMED AMOUNT", f"${float(gt.get('requested_amount', 0)):,.2f}", "CURRENCY", gt.get("currency", "USD")])
                    data.append(["STATUS", gt.get("claim_status", ""), "DAMAGE TYPE", gt.get("damage_type", "")])

                t = Table(data, colWidths=[130, 140, 130, 140])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#64748B")),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('PADDING', (0, 0), (-1, -1), 5)
                ]))
                elements.append(t)

        elif doc_type == "insurance_invoice":
            elements.append(Paragraph(f"<b>COMMERCIAL REPAIR INVOICE</b>", title_style))
            elements.append(Paragraph(f"<i>Vendor Service Provider: {gt.get('vendor_name')}</i>", subtitle_style))
            elements.append(Spacer(1, 12))

            header_data = [
                ["Invoice Number:", gt.get("invoice_number", ""), "Invoice Date:", gt.get("invoice_date", "")],
                ["Vendor Name:", gt.get("vendor_name", ""), "Currency:", gt.get("currency", "USD")]
            ]
            t_hdr = Table(header_data, colWidths=[120, 150, 120, 150])
            t_hdr.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('PADDING', (0, 0), (-1, -1), 5)
            ]))
            elements.append(t_hdr)
            elements.append(Spacer(1, 15))

            if pages == 1:
                fin_data = [
                    ["Subtotal Amount:", f"${float(gt.get('subtotal', 0)):,.2f}"],
                    ["Tax Amount:", f"${float(gt.get('tax_amount', 0)):,.2f}"],
                    ["Discount Amount:", f"-${float(gt.get('discount_amount', 0)):,.2f}"],
                    ["Total Amount Due:", f"${float(gt.get('total_amount', 0)):,.2f}"]
                ]
                t_fin = Table(fin_data, colWidths=[180, 150])
                t_fin.setStyle(TableStyle([
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#F1F5F9")),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#94A3B8")),
                    ('PADDING', (0, 0), (-1, -1), 6)
                ]))
                elements.append(t_fin)

        else:  # policy_schedule
            elements.append(Paragraph(f"<b>POLICY COVERAGE DECLARATIONS</b>", title_style))
            elements.append(Paragraph(f"<i>Underwritten by {gt.get('insurer_name')}</i>", subtitle_style))
            elements.append(Spacer(1, 12))

            pol_data = [
                ["Policy Number:", gt.get("policy_number", ""), "Underwriting Insurer:", gt.get("insurer_name", "")],
                ["Named Policyholder:", gt.get("policyholder_name", ""), "Coverage Type:", gt.get("coverage_type", "")],
                ["Effective Date:", gt.get("effective_date", ""), "Expiration Date:", gt.get("expiration_date", "")]
            ]
            if pages == 1:
                pol_data.append(["Gross Premium Amount:", f"${float(gt.get('premium_amount', 0)):,.2f}", "Currency:", gt.get("currency", "USD")])
                pol_data.append(["Limit of Liability:", f"${float(gt.get('coverage_limit', 0)):,.2f}", "Deductible Excess:", f"${float(gt.get('deductible', 0)):,.2f}"])

            t_pol = Table(pol_data, colWidths=[130, 140, 130, 140])
            t_pol.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('PADDING', (0, 0), (-1, -1), 5)
            ]))
            elements.append(t_pol)

        # --- MULTI-PAGE SPLIT HANDLING (Pages 2 & 3) ---
        if pages >= 2:
            elements.append(PageBreak())
            elements.append(Paragraph(f"<b>SCHEDULE ADDENDUM & SETTLEMENT TERMS (PAGE 2)</b>", title_style))
            elements.append(Spacer(1, 15))

            if doc_type == "claim_form":
                data_p2 = [
                    ["Damage Category / Classification:", gt.get("damage_type", "Structural Property Loss")],
                    ["Incident Location Specifics:", gt.get("incident_location", "Main Logistics Yard")]
                ]
                if pages == 2:
                    data_p2.append(["Total Requested Amount:", f"${float(gt.get('requested_amount', 0)):,.2f}"])
                    data_p2.append(["Currency Code:", gt.get("currency", "USD")])
                    data_p2.append(["Claim Status:", gt.get("claim_status", "Under Investigation")])

                t_p2 = Table(data_p2, colWidths=[200, 260])
                t_p2.setStyle(TableStyle([
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('PADDING', (0, 0), (-1, -1), 6)
                ]))
                elements.append(t_p2)

            elif doc_type == "insurance_invoice":
                fin_data_p2 = [
                    ["Subtotal Amount:", f"${float(gt.get('subtotal', 0)):,.2f}"],
                    ["Tax Amount:", f"${float(gt.get('tax_amount', 0)):,.2f}"],
                    ["Discount Amount:", f"-${float(gt.get('discount_amount', 0)):,.2f}"]
                ]
                if pages == 2:
                    fin_data_p2.append(["Total Amount Due:", f"${float(gt.get('total_amount', 0)):,.2f}"])

                t_p2 = Table(fin_data_p2, colWidths=[200, 200])
                t_p2.setStyle(TableStyle([
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#94A3B8")),
                    ('PADDING', (0, 0), (-1, -1), 6)
                ]))
                elements.append(t_p2)

            else:  # policy_schedule
                pol_data_p2 = [
                    ["Gross Premium Amount:", f"${float(gt.get('premium_amount', 0)):,.2f}"],
                    ["Currency:", gt.get("currency", "USD")]
                ]
                if pages == 2:
                    pol_data_p2.append(["Limit of Liability:", f"${float(gt.get('coverage_limit', 0)):,.2f}"])
                    pol_data_p2.append(["Deductible Excess:", f"${float(gt.get('deductible', 0)):,.2f}"])

                t_p2 = Table(pol_data_p2, colWidths=[200, 200])
                t_p2.setStyle(TableStyle([
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ('PADDING', (0, 0), (-1, -1), 6)
                ]))
                elements.append(t_p2)

        if pages >= 3:
            elements.append(PageBreak())
            elements.append(Paragraph(f"<b>FINAL INDEMNIFICATION APPROVAL (PAGE 3)</b>", title_style))
            elements.append(Spacer(1, 15))

            if doc_type == "claim_form":
                data_p3 = [
                    ["Final Authorized Requested Amount:", f"${float(gt.get('requested_amount', 0)):,.2f}"],
                    ["Settlement Currency:", gt.get("currency", "USD")],
                    ["Claim Status Determination:", gt.get("claim_status", "Approved")]
                ]
                t_p3 = Table(data_p3, colWidths=[220, 240])
                t_p3.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#64748B")),
                    ('PADDING', (0, 0), (-1, -1), 6)
                ]))
                elements.append(t_p3)

            elif doc_type == "insurance_invoice":
                fin_data_p3 = [
                    ["Final Audited Total Amount Due:", f"${float(gt.get('total_amount', 0)):,.2f}"],
                    ["Payment Currency:", gt.get("currency", "USD")]
                ]
                t_p3 = Table(fin_data_p3, colWidths=[220, 200])
                t_p3.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#64748B")),
                    ('PADDING', (0, 0), (-1, -1), 6)
                ]))
                elements.append(t_p3)

            else:
                pol_data_p3 = [
                    ["Aggregate Limit of Liability:", f"${float(gt.get('coverage_limit', 0)):,.2f}"],
                    ["Applicable Deductible Excess:", f"${float(gt.get('deductible', 0)):,.2f}"]
                ]
                t_p3 = Table(pol_data_p3, colWidths=[220, 200])
                t_p3.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#64748B")),
                    ('PADDING', (0, 0), (-1, -1), 6)
                ]))
                elements.append(t_p3)

        doc.build(elements)

        # --- DEGRADED SCAN RASTERIZATION & SKEW (if requested) ---
        if is_scan:
            cls._apply_scan_degradation(clean_pdf_path, output_path, skew_deg=skew_deg, dpi=dpi)
            if os.path.exists(clean_pdf_path) and clean_pdf_path != output_path:
                try:
                    os.remove(clean_pdf_path)
                except Exception:
                    pass

        return gt

    @classmethod
    def _apply_scan_degradation(cls, src_pdf: str, dst_pdf: str, skew_deg: float = 1.5, dpi: int = 120):
        """
        Simulates physical scanning degradation: renders to low-DPI pixmap, applies rotation/skew,
        and re-saves as an image-based PDF.
        """
        import io
        from PIL import Image

        doc = fitz.open(src_pdf)
        out_doc = fitz.open()

        for page in doc:
            pix = page.get_pixmap(dpi=dpi)
            rect = page.rect
            new_page = out_doc.new_page(width=rect.width, height=rect.height)
            
            # Apply exact sub-degree skew and degradation via PIL
            pil_img = Image.open(io.BytesIO(pix.tobytes("png")))
            if abs(skew_deg) > 0.05:
                pil_img = pil_img.rotate(skew_deg, expand=False, fillcolor="white")

            img_buf = io.BytesIO()
            pil_img.save(img_buf, format="PNG")
            new_page.insert_image(rect, stream=img_buf.getvalue(), rotate=0)

        doc.close()
        out_doc.save(dst_pdf)
        out_doc.close()

    # Legacy helper wrappers for existing test suites
    @classmethod
    def generate_claim_form(cls, output_path: str, seed: int = 100) -> Dict[str, Any]:
        clean_candidates = [d for d in REFERENCE_DOCUMENTS if d["doc_type"] == "claim_form" and not d.get("is_scan") and d.get("pages", 1) == 1 and d.get("layout") in ("table_grid", "two_column")]
        if not clean_candidates:
            clean_candidates = [d for d in REFERENCE_DOCUMENTS if d["doc_type"] == "claim_form" and not d.get("is_scan") and d.get("pages", 1) == 1]
        spec = clean_candidates[seed % len(clean_candidates)]
        return cls.render_from_spec(spec, output_path)

    @classmethod
    def generate_invoice(cls, output_path: str, seed: int = 200) -> Dict[str, Any]:
        clean_candidates = [d for d in REFERENCE_DOCUMENTS if d["doc_type"] == "insurance_invoice" and not d.get("is_scan") and d.get("pages", 1) == 1 and d.get("layout") in ("table_grid", "two_column")]
        if not clean_candidates:
            clean_candidates = [d for d in REFERENCE_DOCUMENTS if d["doc_type"] == "insurance_invoice" and not d.get("is_scan") and d.get("pages", 1) == 1]
        spec = clean_candidates[seed % len(clean_candidates)]
        return cls.render_from_spec(spec, output_path)

    @classmethod
    def generate_policy_schedule(cls, output_path: str, seed: int = 300) -> Dict[str, Any]:
        clean_candidates = [d for d in REFERENCE_DOCUMENTS if d["doc_type"] == "policy_schedule" and not d.get("is_scan") and d.get("pages", 1) == 1 and d.get("layout") in ("table_grid", "two_column")]
        if not clean_candidates:
            clean_candidates = [d for d in REFERENCE_DOCUMENTS if d["doc_type"] == "policy_schedule" and not d.get("is_scan") and d.get("pages", 1) == 1]
        spec = clean_candidates[seed % len(clean_candidates)]
        return cls.render_from_spec(spec, output_path)

synthetic_generator = SyntheticDocumentGenerator()
