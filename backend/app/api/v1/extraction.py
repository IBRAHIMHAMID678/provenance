from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Document
from app.services.adapters import get_adapter, list_adapters_info
from app.schemas.insurance_schemas import get_schema

router = APIRouter(prefix="/extraction", tags=["Extraction Lab"])

@router.get("/methods")
def list_methods():
    return {"methods": list_adapters_info()}

@router.post("/run")
def run_extraction_method(
    document_id: str = Body(..., embed=True),
    method_id: str = Body(..., embed=True),
    schema_override: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter_by(id=document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    adapter = get_adapter(method_id)
    schema_name = schema_override or doc.document_type
    schema = get_schema(schema_name)

    result = adapter.extract(doc.id, doc.storage_path, schema)
    return result.model_dump()

