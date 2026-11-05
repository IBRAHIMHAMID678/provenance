"""
Independent Ground Truth Repository
Contains pre-verified, deterministic reference data for benchmarking.
This module does NOT render PDFs; it is consumed as the independent source of truth.
"""

from typing import Dict, Any, List

# 45 Verified Reference Documents across >= 12 field sets
REFERENCE_DOCUMENTS: List[Dict[str, Any]] = [
    # --- BATCH 1: Standard Claim Forms (Layout: table_grid & two_column) ---
    {
        "id": "GT-DOC-01",
        "doc_type": "claim_form",
        "layout": "table_grid",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-10001",
            "policy_number": "POL-550101",
            "claimant_name": "Eleanor Vance",
            "insurer_name": "Apex Global Insurance",
            "incident_date": "2026-01-14",
            "filing_date": "2026-01-18",
            "requested_amount": "4500.00",
            "currency": "USD",
            "incident_location": "1042 Harbor Blvd, Suite 4",
            "damage_type": "Water Damage",
            "claim_status": "Under Review",
            "coverage_type": "Commercial Property"
        }
    },
    {
        "id": "GT-DOC-02",
        "doc_type": "claim_form",
        "layout": "two_column",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-10002",
            "policy_number": "POL-550102",
            "claimant_name": "Marcus Sterling",
            "insurer_name": "Sentinel Casualty Co.",
            "incident_date": "2026-01-20",
            "filing_date": "2026-01-25",
            "requested_amount": "12850.50",
            "currency": "USD",
            "incident_location": "770 Industrial Way",
            "damage_type": "Structural Collision",
            "claim_status": "Pending Inspection",
            "coverage_type": "Fleet Auto"
        }
    },
    {
        "id": "GT-DOC-03",
        "doc_type": "claim_form",
        "layout": "alternate_labels",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-10003",
            "policy_number": "POL-550103",
            "claimant_name": "Sophia Al-Mansoor",
            "insurer_name": "Meridian Mutual Group",
            "incident_date": "2026-02-01",
            "filing_date": "2026-02-04",
            "requested_amount": "3200.00",
            "currency": "USD",
            "incident_location": "12 Perimeter Center",
            "damage_type": "Electrical Surge",
            "claim_status": "Approved",
            "coverage_type": "Equipment Breakdown"
        }
    },
    {
        "id": "GT-DOC-04",
        "doc_type": "claim_form",
        "layout": "paragraph_narrative",
        "pages": 1,
        "is_scan": False,
        "split": "val",
        "ground_truth": {
            "claim_id": "CLM-2026-10004",
            "policy_number": "POL-550104",
            "claimant_name": "David K. Chen",
            "insurer_name": "Harbor Indemnity",
            "incident_date": "2026-02-10",
            "filing_date": "2026-02-14",
            "requested_amount": "7600.00",
            "currency": "USD",
            "incident_location": "88 Maritime Court",
            "damage_type": "Roof Damage / Windstorm",
            "claim_status": "Under Review",
            "coverage_type": "Commercial Property"
        }
    },
    {
        "id": "GT-DOC-05",
        "doc_type": "claim_form",
        "layout": "boxed_header",
        "pages": 1,
        "is_scan": False,
        "split": "train",
        "ground_truth": {
            "claim_id": "CLM-2026-10005",
            "policy_number": "POL-550105",
            "claimant_name": "Elena Rostova",
            "insurer_name": "Apex Global Insurance",
            "incident_date": "2026-02-15",
            "filing_date": "2026-02-19",
            "requested_amount": "9420.00",
            "currency": "USD",
            "incident_location": "500 Logistics Park",
            "damage_type": "Cargo Spoilage",
            "claim_status": "Submitted",
            "coverage_type": "Inland Marine"
        }
    },

    # --- BATCH 2: Invoices (Layout: line_items_detailed, dense_key_value) ---
    {
        "id": "GT-DOC-06",
        "doc_type": "insurance_invoice",
        "layout": "line_items_detailed",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "invoice_number": "INV-2026-2001",
            "invoice_date": "2026-02-05",
            "vendor_name": "Precision Auto Collision Center",
            "subtotal": "3200.00",
            "tax_amount": "256.00",
            "discount_amount": "50.00",
            "total_amount": "3406.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-07",
        "doc_type": "insurance_invoice",
        "layout": "dense_key_value",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "invoice_number": "INV-2026-2002",
            "invoice_date": "2026-02-12",
            "vendor_name": "Metropolitan Health Services",
            "subtotal": "1850.00",
            "tax_amount": "148.00",
            "discount_amount": "0.00",
            "total_amount": "1998.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-08",
        "doc_type": "insurance_invoice",
        "layout": "table_grid",
        "pages": 1,
        "is_scan": False,
        "split": "val",
        "ground_truth": {
            "invoice_number": "INV-2026-2003",
            "invoice_date": "2026-02-18",
            "vendor_name": "Apex Bio-Clean Restoration",
            "subtotal": "5400.00",
            "tax_amount": "432.00",
            "discount_amount": "100.00",
            "total_amount": "5732.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-09",
        "doc_type": "insurance_invoice",
        "layout": "alternate_labels",
        "pages": 1,
        "is_scan": False,
        "split": "train",
        "ground_truth": {
            "invoice_number": "INV-2026-2004",
            "invoice_date": "2026-02-22",
            "vendor_name": "OmniRepair Technologies",
            "subtotal": "2100.00",
            "tax_amount": "168.00",
            "discount_amount": "25.00",
            "total_amount": "2243.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-10",
        "doc_type": "insurance_invoice",
        "layout": "two_column",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "invoice_number": "INV-2026-2005",
            "invoice_date": "2026-02-28",
            "vendor_name": "Vanguard Engineering Corp",
            "subtotal": "4800.00",
            "tax_amount": "384.00",
            "discount_amount": "75.00",
            "total_amount": "5109.00",
            "currency": "USD"
        }
    },

    # --- BATCH 3: Policy Schedules ---
    {
        "id": "GT-DOC-11",
        "doc_type": "policy_schedule",
        "layout": "table_grid",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "policy_number": "POL-700101",
            "insurer_name": "Apex Global Insurance",
            "policyholder_name": "Arthur Pendelton",
            "effective_date": "2026-01-01",
            "expiration_date": "2027-01-01",
            "coverage_type": "Commercial Property All-Risk",
            "premium_amount": "2400.00",
            "coverage_limit": "1000000.00",
            "deductible": "1000.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-12",
        "doc_type": "policy_schedule",
        "layout": "two_column",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "policy_number": "POL-700102",
            "insurer_name": "Sentinel Casualty Co.",
            "policyholder_name": "Elena Rostova",
            "effective_date": "2026-02-01",
            "expiration_date": "2027-02-01",
            "coverage_type": "General Liability Umbrella",
            "premium_amount": "3850.00",
            "coverage_limit": "2000000.00",
            "deductible": "2500.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-13",
        "doc_type": "policy_schedule",
        "layout": "alternate_labels",
        "pages": 1,
        "is_scan": False,
        "split": "val",
        "ground_truth": {
            "policy_number": "POL-700103",
            "insurer_name": "Meridian Mutual Group",
            "policyholder_name": "Marcus Vance",
            "effective_date": "2026-03-01",
            "expiration_date": "2027-03-01",
            "coverage_type": "Inland Marine Transport",
            "premium_amount": "1950.00",
            "coverage_limit": "500000.00",
            "deductible": "500.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-14",
        "doc_type": "policy_schedule",
        "layout": "boxed_header",
        "pages": 1,
        "is_scan": False,
        "split": "train",
        "ground_truth": {
            "policy_number": "POL-700104",
            "insurer_name": "Harbor Indemnity",
            "policyholder_name": "Sophia Al-Mansoor",
            "effective_date": "2026-04-01",
            "expiration_date": "2027-04-01",
            "coverage_type": "Cyber Liability & Security",
            "premium_amount": "4200.00",
            "coverage_limit": "3000000.00",
            "deductible": "5000.00",
            "currency": "USD"
        }
    },

    # --- BATCH 4: Multi-Page Documents (>= 10 documents with fields split across pages 1, 2, and 3) ---
    {
        "id": "GT-DOC-15",
        "doc_type": "claim_form",
        "layout": "table_grid",
        "pages": 2,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-30001",
            "policy_number": "POL-880001",
            "claimant_name": "Jonathan Archer",
            "insurer_name": "Apex Global Insurance",
            "incident_date": "2026-01-11",
            "filing_date": "2026-01-15",
            "requested_amount": "14500.00",  # On page 2
            "currency": "USD",
            "incident_location": "Sector 9 Terminal",
            "damage_type": "Hail and Windstorm",  # On page 2
            "claim_status": "Formal Review",
            "coverage_type": "Commercial Property"
        }
    },
    {
        "id": "GT-DOC-16",
        "doc_type": "claim_form",
        "layout": "two_column",
        "pages": 2,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-30002",
            "policy_number": "POL-880002",
            "claimant_name": "Beverly Crusher",
            "insurer_name": "Sentinel Casualty Co.",
            "incident_date": "2026-01-22",
            "filing_date": "2026-01-27",
            "requested_amount": "8200.00",  # On page 2
            "currency": "USD",
            "incident_location": "Medical Facility Wing C",
            "damage_type": "Laboratory Contamination",
            "claim_status": "Escalated",
            "coverage_type": "General Liability"
        }
    },
    {
        "id": "GT-DOC-17",
        "doc_type": "claim_form",
        "layout": "alternate_labels",
        "pages": 3,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-30003",
            "policy_number": "POL-880003",
            "claimant_name": "Jean-Luc Picard",
            "insurer_name": "Meridian Mutual Group",
            "incident_date": "2026-02-02",  # On page 1
            "filing_date": "2026-02-06",
            "requested_amount": "28500.00", # On page 3
            "currency": "USD",
            "incident_location": "Chateau Winery Estate",
            "damage_type": "Severe Frost Loss",  # On page 2
            "claim_status": "Under Investigation",
            "coverage_type": "Agricultural All-Risk"
        }
    },
    {
        "id": "GT-DOC-18",
        "doc_type": "claim_form",
        "layout": "paragraph_narrative",
        "pages": 2,
        "is_scan": False,
        "split": "val",
        "ground_truth": {
            "claim_id": "CLM-2026-30004",
            "policy_number": "POL-880004",
            "claimant_name": "Geordi LaForge",
            "insurer_name": "Harbor Indemnity",
            "incident_date": "2026-02-11",
            "filing_date": "2026-02-15",
            "requested_amount": "19400.00",  # On page 2
            "currency": "USD",
            "incident_location": "Warp Core Engineering Bay",
            "damage_type": "Coolant Manifold Fracture",
            "claim_status": "Pending Quote",
            "coverage_type": "Machinery Breakdown"
        }
    },
    {
        "id": "GT-DOC-19",
        "doc_type": "insurance_invoice",
        "layout": "line_items_detailed",
        "pages": 2,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "invoice_number": "INV-2026-3005",
            "invoice_date": "2026-02-14",
            "vendor_name": "Precision Auto Collision Center",
            "subtotal": "6800.00",
            "tax_amount": "544.00",  # On page 2
            "discount_amount": "150.00",
            "total_amount": "7194.00",  # On page 2
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-20",
        "doc_type": "insurance_invoice",
        "layout": "table_grid",
        "pages": 3,
        "is_scan": False,
        "split": "val",
        "ground_truth": {
            "invoice_number": "INV-2026-3006",
            "invoice_date": "2026-02-20",
            "vendor_name": "Metropolitan Health Services",
            "subtotal": "11200.00",
            "tax_amount": "896.00",
            "discount_amount": "200.00",
            "total_amount": "11896.00", # On page 3
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-21",
        "doc_type": "policy_schedule",
        "layout": "two_column",
        "pages": 2,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "policy_number": "POL-880007",
            "insurer_name": "Sentinel Casualty Co.",
            "policyholder_name": "Deanna Troi",
            "effective_date": "2026-01-01",
            "expiration_date": "2027-01-01",
            "coverage_type": "Professional Liability",
            "premium_amount": "5600.00",  # On page 2
            "coverage_limit": "2000000.00", # On page 2
            "deductible": "2000.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-22",
        "doc_type": "policy_schedule",
        "layout": "dense_key_value",
        "pages": 3,
        "is_scan": False,
        "split": "train",
        "ground_truth": {
            "policy_number": "POL-880008",
            "insurer_name": "Meridian Mutual Group",
            "policyholder_name": "William Riker",
            "effective_date": "2026-02-15",
            "expiration_date": "2027-02-15",
            "coverage_type": "Aviation Hull & Liability",
            "premium_amount": "12500.00", # On page 3
            "coverage_limit": "5000000.00", # On page 3
            "deductible": "10000.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-23",
        "doc_type": "claim_form",
        "layout": "boxed_header",
        "pages": 2,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-30009",
            "policy_number": "POL-880009",
            "claimant_name": "Worf Son of Mogh",
            "insurer_name": "Harbor Indemnity",
            "incident_date": "2026-02-18",
            "filing_date": "2026-02-21",
            "requested_amount": "16750.00", # On page 2
            "currency": "USD",
            "incident_location": "Tactical Operations Range",
            "damage_type": "Perimeter Barrier Rupture",
            "claim_status": "Pending Adjudication",
            "coverage_type": "Defense Facilities Property"
        }
    },
    {
        "id": "GT-DOC-24",
        "doc_type": "insurance_invoice",
        "layout": "dense_key_value",
        "pages": 2,
        "is_scan": False,
        "split": "train",
        "ground_truth": {
            "invoice_number": "INV-2026-3010",
            "invoice_date": "2026-02-25",
            "vendor_name": "Apex Bio-Clean Restoration",
            "subtotal": "3950.00",
            "tax_amount": "316.00",
            "discount_amount": "0.00",
            "total_amount": "4266.00", # On page 2
            "currency": "USD"
        }
    },

    # --- BATCH 5: Degraded Scans (>= 8 rasterized scans with skew, low DPI, background artifact) ---
    {
        "id": "GT-DOC-25",
        "doc_type": "claim_form",
        "layout": "table_grid",
        "pages": 1,
        "is_scan": True,
        "skew_deg": 1.8,
        "dpi": 130,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-40001",
            "policy_number": "POL-990001",
            "claimant_name": "Benjamin Sisko",
            "insurer_name": "Apex Global Insurance",
            "incident_date": "2026-01-05",
            "filing_date": "2026-01-09",
            "requested_amount": "8900.00",
            "currency": "USD",
            "incident_location": "Promenade Upper Deck",
            "damage_type": "Plasma Conduit Leak",
            "claim_status": "Under Investigation",
            "coverage_type": "Commercial Property"
        }
    },
    {
        "id": "GT-DOC-26",
        "doc_type": "claim_form",
        "layout": "two_column",
        "pages": 1,
        "is_scan": True,
        "skew_deg": -2.2,
        "dpi": 120,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-40002",
            "policy_number": "POL-990002",
            "claimant_name": "Kira Nerys",
            "insurer_name": "Sentinel Casualty Co.",
            "incident_date": "2026-01-16",
            "filing_date": "2026-01-20",
            "requested_amount": "5400.00",
            "currency": "USD",
            "incident_location": "Habitat Ring Level 4",
            "damage_type": "Structural Hatch Blast",
            "claim_status": "Completed",
            "coverage_type": "Habitational All-Risk"
        }
    },
    {
        "id": "GT-DOC-27",
        "doc_type": "claim_form",
        "layout": "alternate_labels",
        "pages": 1,
        "is_scan": True,
        "skew_deg": 2.5,
        "dpi": 140,
        "split": "val",
        "ground_truth": {
            "claim_id": "CLM-2026-40003",
            "policy_number": "POL-990003",
            "claimant_name": "Odo Constable",
            "insurer_name": "Meridian Mutual Group",
            "incident_date": "2026-02-03",
            "filing_date": "2026-02-07",
            "requested_amount": "3100.00",
            "currency": "USD",
            "incident_location": "Security Central Office",
            "damage_type": "Containment Unit Rupture",
            "claim_status": "Approved",
            "coverage_type": "Security Operations"
        }
    },
    {
        "id": "GT-DOC-28",
        "doc_type": "insurance_invoice",
        "layout": "line_items_detailed",
        "pages": 1,
        "is_scan": True,
        "skew_deg": -1.5,
        "dpi": 130,
        "split": "test",
        "ground_truth": {
            "invoice_number": "INV-2026-4004",
            "invoice_date": "2026-02-15",
            "vendor_name": "Precision Auto Collision Center",
            "subtotal": "4200.00",
            "tax_amount": "336.00",
            "discount_amount": "50.00",
            "total_amount": "4486.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-29",
        "doc_type": "insurance_invoice",
        "layout": "table_grid",
        "pages": 1,
        "is_scan": True,
        "skew_deg": 2.8,
        "dpi": 110,
        "split": "test",
        "ground_truth": {
            "invoice_number": "INV-2026-4005",
            "invoice_date": "2026-02-21",
            "vendor_name": "Metropolitan Health Services",
            "subtotal": "2900.00",
            "tax_amount": "232.00",
            "discount_amount": "0.00",
            "total_amount": "3132.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-30",
        "doc_type": "insurance_invoice",
        "layout": "dense_key_value",
        "pages": 1,
        "is_scan": True,
        "skew_deg": -2.0,
        "dpi": 125,
        "split": "val",
        "ground_truth": {
            "invoice_number": "INV-2026-4006",
            "invoice_date": "2026-02-26",
            "vendor_name": "Apex Bio-Clean Restoration",
            "subtotal": "6100.00",
            "tax_amount": "488.00",
            "discount_amount": "100.00",
            "total_amount": "6488.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-31",
        "doc_type": "policy_schedule",
        "layout": "two_column",
        "pages": 1,
        "is_scan": True,
        "skew_deg": 1.2,
        "dpi": 135,
        "split": "test",
        "ground_truth": {
            "policy_number": "POL-990007",
            "insurer_name": "Harbor Indemnity",
            "policyholder_name": "Julian Bashir",
            "effective_date": "2026-01-01",
            "expiration_date": "2027-01-01",
            "coverage_type": "Medical Malpractice & Clinic All-Risk",
            "premium_amount": "4950.00",
            "coverage_limit": "2500000.00",
            "deductible": "1500.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-32",
        "doc_type": "policy_schedule",
        "layout": "boxed_header",
        "pages": 1,
        "is_scan": True,
        "skew_deg": -2.6,
        "dpi": 115,
        "split": "train",
        "ground_truth": {
            "policy_number": "POL-990008",
            "insurer_name": "Apex Global Insurance",
            "policyholder_name": "Jadzia Dax",
            "effective_date": "2026-03-01",
            "expiration_date": "2027-03-01",
            "coverage_type": "Scientific Field Apparatus",
            "premium_amount": "3400.00",
            "coverage_limit": "1500000.00",
            "deductible": "1000.00",
            "currency": "USD"
        }
    },

    # --- BATCH 6: Additional Diverse Documents (Documents 33 to 45) ---
    {
        "id": "GT-DOC-33",
        "doc_type": "claim_form",
        "layout": "noisy_background",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-50001",
            "policy_number": "POL-660001",
            "claimant_name": "Kathryn Janeway",
            "insurer_name": "Sentinel Casualty Co.",
            "incident_date": "2026-01-08",
            "filing_date": "2026-01-12",
            "requested_amount": "21000.00",
            "currency": "USD",
            "incident_location": "Delta Quadrant Outpost",
            "damage_type": "Atmospheric Re-entry Stress",
            "claim_status": "Escalated",
            "coverage_type": "Deep Space Vessel Hull"
        }
    },
    {
        "id": "GT-DOC-34",
        "doc_type": "claim_form",
        "layout": "paragraph_narrative",
        "pages": 1,
        "is_scan": False,
        "split": "val",
        "ground_truth": {
            "claim_id": "CLM-2026-50002",
            "policy_number": "POL-660002",
            "claimant_name": "Chakotay Commander",
            "insurer_name": "Meridian Mutual Group",
            "incident_date": "2026-01-19",
            "filing_date": "2026-01-23",
            "requested_amount": "6700.00",
            "currency": "USD",
            "incident_location": "Planetary Excursion Zone B",
            "damage_type": "Shuttlecraft Gear Collapse",
            "claim_status": "Approved",
            "coverage_type": "Exploration Transport"
        }
    },
    {
        "id": "GT-DOC-35",
        "doc_type": "insurance_invoice",
        "layout": "noisy_background",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "invoice_number": "INV-2026-5003",
            "invoice_date": "2026-02-08",
            "vendor_name": "OmniRepair Technologies",
            "subtotal": "5100.00",
            "tax_amount": "408.00",
            "discount_amount": "80.00",
            "total_amount": "5428.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-36",
        "doc_type": "policy_schedule",
        "layout": "noisy_background",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "policy_number": "POL-660004",
            "insurer_name": "Apex Global Insurance",
            "policyholder_name": "Tuvok Lieutenant",
            "effective_date": "2026-01-01",
            "expiration_date": "2027-01-01",
            "coverage_type": "Security Operations & Armory",
            "premium_amount": "3100.00",
            "coverage_limit": "1200000.00",
            "deductible": "1000.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-37",
        "doc_type": "claim_form",
        "layout": "dense_key_value",
        "pages": 1,
        "is_scan": False,
        "split": "train",
        "ground_truth": {
            "claim_id": "CLM-2026-50005",
            "policy_number": "POL-660005",
            "claimant_name": "Tom Paris",
            "insurer_name": "Harbor Indemnity",
            "incident_date": "2026-02-14",
            "filing_date": "2026-02-17",
            "requested_amount": "11500.00",
            "currency": "USD",
            "incident_location": "Flight Simulation Deck",
            "damage_type": "Avionics Display Overload",
            "claim_status": "Under Review",
            "coverage_type": "Aviation All-Risk"
        }
    },
    {
        "id": "GT-DOC-38",
        "doc_type": "insurance_invoice",
        "layout": "boxed_header",
        "pages": 1,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "invoice_number": "INV-2026-5006",
            "invoice_date": "2026-02-24",
            "vendor_name": "Vanguard Engineering Corp",
            "subtotal": "7300.00",
            "tax_amount": "584.00",
            "discount_amount": "120.00",
            "total_amount": "7764.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-39",
        "doc_type": "policy_schedule",
        "layout": "table_grid",
        "pages": 1,
        "is_scan": False,
        "split": "val",
        "ground_truth": {
            "policy_number": "POL-660007",
            "insurer_name": "Sentinel Casualty Co.",
            "policyholder_name": "B'Elanna Torres",
            "effective_date": "2026-02-01",
            "expiration_date": "2027-02-01",
            "coverage_type": "Engineering Fabrication Works",
            "premium_amount": "4600.00",
            "coverage_limit": "2200000.00",
            "deductible": "2000.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-40",
        "doc_type": "claim_form",
        "layout": "table_grid",
        "pages": 2,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-50008",
            "policy_number": "POL-660008",
            "claimant_name": "Harry Kim",
            "insurer_name": "Meridian Mutual Group",
            "incident_date": "2026-02-20",
            "filing_date": "2026-02-23",
            "requested_amount": "8950.00",  # On page 2
            "currency": "USD",
            "incident_location": "Astrometrics Sensor Grid",
            "damage_type": "Optical Array Deflection",
            "claim_status": "Submitted",
            "coverage_type": "Sensor Instrumentation"
        }
    },
    {
        "id": "GT-DOC-41",
        "doc_type": "insurance_invoice",
        "layout": "two_column",
        "pages": 2,
        "is_scan": False,
        "split": "test",
        "ground_truth": {
            "invoice_number": "INV-2026-5009",
            "invoice_date": "2026-02-27",
            "vendor_name": "Precision Auto Collision Center",
            "subtotal": "5900.00",
            "tax_amount": "472.00",  # On page 2
            "discount_amount": "50.00",
            "total_amount": "6322.00",  # On page 2
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-42",
        "doc_type": "policy_schedule",
        "layout": "alternate_labels",
        "pages": 2,
        "is_scan": False,
        "split": "val",
        "ground_truth": {
            "policy_number": "POL-660010",
            "insurer_name": "Apex Global Insurance",
            "policyholder_name": "Seven of Nine",
            "effective_date": "2026-01-15",
            "expiration_date": "2027-01-15",
            "coverage_type": "Cybernetic Systems Liability",
            "premium_amount": "6200.00",  # On page 2
            "coverage_limit": "3500000.00", # On page 2
            "deductible": "3000.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-43",
        "doc_type": "claim_form",
        "layout": "two_column",
        "pages": 1,
        "is_scan": True,
        "skew_deg": 1.5,
        "dpi": 130,
        "split": "test",
        "ground_truth": {
            "claim_id": "CLM-2026-60001",
            "policy_number": "POL-770001",
            "claimant_name": "The Doctor Hologram",
            "insurer_name": "Sentinel Casualty Co.",
            "incident_date": "2026-01-25",
            "filing_date": "2026-01-29",
            "requested_amount": "14200.00",
            "currency": "USD",
            "incident_location": "Sickbay Primary Emitter",
            "damage_type": "Holo-Emitter Overload",
            "claim_status": "Under Review",
            "coverage_type": "Medical Holographic Hardware"
        }
    },
    {
        "id": "GT-DOC-44",
        "doc_type": "insurance_invoice",
        "layout": "table_grid",
        "pages": 1,
        "is_scan": True,
        "skew_deg": -1.8,
        "dpi": 120,
        "split": "train",
        "ground_truth": {
            "invoice_number": "INV-2026-6002",
            "invoice_date": "2026-02-16",
            "vendor_name": "Metropolitan Health Services",
            "subtotal": "3800.00",
            "tax_amount": "304.00",
            "discount_amount": "0.00",
            "total_amount": "4104.00",
            "currency": "USD"
        }
    },
    {
        "id": "GT-DOC-45",
        "doc_type": "policy_schedule",
        "layout": "dense_key_value",
        "pages": 1,
        "is_scan": True,
        "skew_deg": 2.2,
        "dpi": 125,
        "split": "test",
        "ground_truth": {
            "policy_number": "POL-770003",
            "insurer_name": "Harbor Indemnity",
            "policyholder_name": "Neelix Talaxian",
            "effective_date": "2026-03-01",
            "expiration_date": "2027-03-01",
            "coverage_type": "Culinary Operations Commercial",
            "premium_amount": "1800.00",
            "coverage_limit": "600000.00",
            "deductible": "500.00",
            "currency": "USD"
        }
    }
]

def get_ground_truth_by_id(doc_id: str) -> Dict[str, Any]:
    for doc in REFERENCE_DOCUMENTS:
        if doc["id"] == doc_id:
            return doc["ground_truth"]
    raise KeyError(f"No ground truth specification found for {doc_id}")

def get_all_ground_truth_specs() -> List[Dict[str, Any]]:
    return REFERENCE_DOCUMENTS

