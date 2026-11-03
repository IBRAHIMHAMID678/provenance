import hashlib
import os
import shutil
from pathlib import Path
from typing import Tuple, Optional
from app.config import settings

class StorageService:
    def __init__(self, root_dir: Optional[Path] = None):
        self.root_dir = root_dir or settings.STORAGE_ROOT
        self.uploads_dir = self.root_dir / "uploads"
        self.processed_dir = self.root_dir / "processed"
        self.datasets_dir = self.root_dir / "datasets"
        
        # Ensure subdirectories exist
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        self.datasets_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def compute_sha256(data: bytes) -> str:
        hasher = hashlib.sha256()
        hasher.update(data)
        return hasher.hexdigest()

    def save_upload(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str, int]:
        checksum = self.compute_sha256(file_bytes)
        file_size = len(file_bytes)
        
        # Sanitize extension
        ext = os.path.splitext(original_filename)[1].lower()
        if not ext:
            ext = ".pdf"
            
        stored_filename = f"{checksum}{ext}"
        target_path = self.uploads_dir / stored_filename
        
        # Write bytes safely
        with open(target_path, "wb") as f:
            f.write(file_bytes)
            
        return str(target_path), checksum, file_size

    def get_file_bytes(self, storage_path: str) -> bytes:
        path = Path(storage_path)
        if not path.is_file():
            raise FileNotFoundError(f"File not found on storage: {storage_path}")
        with open(path, "rb") as f:
            return f.read()

    def save_rendered_page(self, doc_id: str, page_number: int, image_bytes: bytes) -> str:
        doc_pages_dir = self.processed_dir / doc_id / "pages"
        doc_pages_dir.mkdir(parents=True, exist_ok=True)
        target_path = doc_pages_dir / f"page_{page_number}.png"
        with open(target_path, "wb") as f:
            f.write(image_bytes)
        return str(target_path)

    def delete_document_files(self, doc_id: str, storage_path: str) -> bool:
        try:
            # Delete primary file if no other record references it
            p = Path(storage_path)
            if p.is_file():
                p.unlink(missing_ok=True)
            # Delete processed folder
            proc_dir = self.processed_dir / doc_id
            if proc_dir.is_dir():
                shutil.rmtree(proc_dir, ignore_errors=True)
            return True
        except Exception:
            return False

storage_service = StorageService()

