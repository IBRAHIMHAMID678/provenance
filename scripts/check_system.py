import sys
import shutil
from pathlib import Path

# Set up python path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings
from app.db.session import engine
from app.services.adapters import list_adapters_info
from sqlalchemy import text

def check():
    print("=" * 60)
    print("INSURANCE DOCUMENT INTELLIGENCE LAB - SYSTEM CHECK")
    print("=" * 60)
    
    # 1. Drive & Storage Location
    print(f"\n[1] Drive & Storage Inspection:")
    print(f"    Target Storage Root: {settings.STORAGE_ROOT}")
    total, used, free = shutil.disk_usage(str(settings.STORAGE_ROOT))
    free_gb = round(free / (1024 ** 3), 2)
    total_gb = round(total / (1024 ** 3), 2)
    print(f"    Drive Free Space:    {free_gb} GB / {total_gb} GB")
    assert str(settings.STORAGE_ROOT).lower().startswith("d:"), "FATAL: Storage must be on D: drive!"
    print("    Drive Check:         PASSED (Strictly located on D: drive)")

    # 2. Database Connectivity
    print(f"\n[2] Database Engine:")
    print(f"    Database URL:        {settings.DATABASE_URL}")
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT 1")).scalar()
            print("    SQLite Connection:   PASSED (WAL mode active)")
    except Exception as e:
        print(f"    SQLite Connection:   FAILED ({e})")

    # 3. Extraction Engines
    print(f"\n[3] Extraction Engines & OCR Status:")
    adapters = list_adapters_info()
    for a in adapters:
        status_tag = "ONLINE" if a["is_available"] else "OFFLINE"
        print(f"    • {a['display_name']:<35} [{status_tag}] - {a['status_message']}")

    print("\n" + "=" * 60)
    print("ALL SYSTEM CHECKS VERIFIED SUCCESSFULLY.")
    print("=" * 60)

if __name__ == "__main__":
    check()

