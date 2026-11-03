import shutil
from typing import Dict, Any
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import SystemSetting
from app.config import settings
from app.services.adapters import list_adapters_info

router = APIRouter(prefix="/settings", tags=["Settings & System Diagnostics"])

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    records = db.query(SystemSetting).all()
    results = {}
    for r in records:
        val = r.value
        # Mask secret values
        if r.is_secret:
            val = "********"
        results[r.key] = {
            "value": val,
            "category": r.category,
            "is_secret": r.is_secret,
            "updated_at": r.updated_at.isoformat()
        }
    return {"settings": results}

@router.put("")
def update_setting(
    key: str = Body(..., embed=True),
    value: Any = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter_by(key=key).first()
    if not setting:
        setting = SystemSetting(key=key, value=value)
        db.add(setting)
    else:
        setting.value = value
    db.commit()
    return {"message": f"Setting '{key}' updated successfully."}

@router.get("/system/status")
def get_system_status():
    # Disk space on D: drive
    total, used, free = shutil.disk_usage(str(settings.STORAGE_ROOT))
    free_gb = round(free / (1024 ** 3), 2)
    total_gb = round(total / (1024 ** 3), 2)

    return {
        "storage_drive": "D:",
        "storage_root": str(settings.STORAGE_ROOT),
        "disk_free_gb": free_gb,
        "disk_total_gb": total_gb,
        "storage_healthy": free_gb > 1.0,
        "adapters": list_adapters_info(),
        "python_version": "3.11.9",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION
    }

