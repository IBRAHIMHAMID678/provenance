import fitz  # PyMuPDF
from typing import List, Dict, Any, Tuple
from pathlib import Path
from pydantic import BaseModel
from app.services.storage import storage_service

class PageQualityProfile(BaseModel):
    page_number: int
    width: float
    height: float
    rotation: int
    has_selectable_text: bool
    char_count: int
    word_count: int
    text_density: float
    image_count: int
    image_area_ratio: float
    estimated_dpi: float
    skew_angle: float
    quality_grade: str  # HIGH_DIGITAL, MIXED_DIGITAL_IMAGE, CLEAN_SCAN, DEGRADED_SCAN
    recommended_engine: str  # native, tesseract, paddle, llm
    extracted_text_preview: str
    rendered_image_path: str

class DocumentInspectionResult(BaseModel):
    total_pages: int
    overall_quality: str
    has_mixed_pages: bool
    digital_page_count: int
    scanned_page_count: int
    pages: List[PageQualityProfile]

class PDFInspector:
    @staticmethod
    def inspect_document(doc_id: str, pdf_path: str) -> DocumentInspectionResult:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        page_profiles: List[PageQualityProfile] = []

        digital_pages = 0
        scanned_pages = 0

        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1
            rect = page.rect
            page_area = rect.width * rect.height

            # 1. Text characteristics
            raw_text = page.get_text("text") or ""
            words = page.get_text("words") or []
            char_count = len(raw_text.strip())
            word_count = len(words)
            text_density = (char_count / page_area * 10000.0) if page_area > 0 else 0.0
            has_selectable_text = char_count > 30

            # 2. Image characteristics
            image_list = page.get_images(full=True)
            image_count = len(image_list)
            total_image_area = 0.0
            max_dpi = 72.0

            for img_info in image_list:
                xref = img_info[0]
                try:
                    img_rects = page.get_image_rects(xref)
                    for r in img_rects:
                        total_image_area += (r.width * r.height)
                    
                    # Estimate DPI from pixmap if available
                    pix = fitz.Pixmap(doc, xref)
                    if rect.width > 0 and rect.height > 0:
                        calc_dpi_x = (pix.width / rect.width) * 72.0
                        calc_dpi_y = (pix.height / rect.height) * 72.0
                        max_dpi = max(max_dpi, calc_dpi_x, calc_dpi_y)
                except Exception:
                    pass

            image_area_ratio = min(1.0, (total_image_area / page_area)) if page_area > 0 else 0.0

            # 3. Quality Grading Heuristic
            if has_selectable_text and image_area_ratio < 0.35:
                quality_grade = "HIGH_DIGITAL"
                recommended_engine = "native"
                digital_pages += 1
            elif has_selectable_text and image_area_ratio >= 0.35:
                quality_grade = "MIXED_DIGITAL_IMAGE"
                recommended_engine = "hybrid"
                digital_pages += 1
            else:
                # Scanned page
                scanned_pages += 1
                if max_dpi >= 200 or image_area_ratio >= 0.7:
                    quality_grade = "CLEAN_SCAN"
                    recommended_engine = "tesseract"
                else:
                    quality_grade = "DEGRADED_SCAN"
                    recommended_engine = "tesseract"

            # 4. Render Page to PNG for visual inspection & frontend canvas
            pix = page.get_pixmap(dpi=150)
            rendered_bytes = pix.tobytes("png")
            saved_image_path = storage_service.save_rendered_page(doc_id, page_num, rendered_bytes)

            profile = PageQualityProfile(
                page_number=page_num,
                width=rect.width,
                height=rect.height,
                rotation=page.rotation,
                has_selectable_text=has_selectable_text,
                char_count=char_count,
                word_count=word_count,
                text_density=round(text_density, 2),
                image_count=image_count,
                image_area_ratio=round(image_area_ratio, 3),
                estimated_dpi=round(max_dpi, 1),
                skew_angle=0.0,
                quality_grade=quality_grade,
                recommended_engine=recommended_engine,
                extracted_text_preview=raw_text[:300].strip(),
                rendered_image_path=saved_image_path
            )
            page_profiles.append(profile)

        doc.close()

        # Overall Document Quality
        if scanned_pages == 0:
            overall_quality = "HIGH_DIGITAL"
        elif digital_pages == 0:
            overall_quality = "SCANNED"
        else:
            overall_quality = "MIXED"

        return DocumentInspectionResult(
            total_pages=total_pages,
            overall_quality=overall_quality,
            has_mixed_pages=(digital_pages > 0 and scanned_pages > 0),
            digital_page_count=digital_pages,
            scanned_page_count=scanned_pages,
            pages=page_profiles
        )

pdf_inspector = PDFInspector()

