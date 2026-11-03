from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.services.adapters import list_adapters_info
from app.config import settings

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])

@router.get("")
def health_check(db: Session = Depends(get_db)):
    db_healthy = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_healthy = False

    return {
        "status": "healthy" if db_healthy else "degraded",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "database_connected": db_healthy,
        "storage_root": str(settings.STORAGE_ROOT)
    }

@router.get("/dependencies")
def dependencies_status():
    return {
        "engines": list_adapters_info(),
        "storage_writable": settings.STORAGE_ROOT.exists()
    }

