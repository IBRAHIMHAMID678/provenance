from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.init_db import init_db

# Routers
from app.api.v1.health import router as health_router
from app.api.v1.documents import router as documents_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.extraction import router as extraction_router
from app.api.v1.review import router as review_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.experiments import router as experiments_router
from app.api.v1.evaluation import router as evaluation_router
from app.api.v1.cost import router as cost_router
from app.api.v1.security import router as security_router
from app.api.v1.settings import router as settings_router
from app.api.v1.export import router as export_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Enterprise Document Extraction, Evaluation, and Cost-Optimization Engine for Insurance Documents.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup lifecycle
@app.on_event("startup")
def on_startup():
    init_db()

# Register API Routers under both /api and /api/v1 for backwards and forward compatibility
for pfx in ["/api", "/api/v1"]:
    app.include_router(health_router, prefix=pfx)
    app.include_router(documents_router, prefix=pfx)
    app.include_router(jobs_router, prefix=pfx)
    app.include_router(extraction_router, prefix=pfx)
    app.include_router(review_router, prefix=pfx)
    app.include_router(datasets_router, prefix=pfx)
    app.include_router(experiments_router, prefix=pfx)
    app.include_router(evaluation_router, prefix=pfx)
    app.include_router(cost_router, prefix=pfx)
    app.include_router(security_router, prefix=pfx)
    app.include_router(settings_router, prefix=pfx)
    app.include_router(export_router, prefix=pfx)

@app.get("/")
def root():
    return {
        "product": settings.APP_NAME,
        "tagline": "Extract less blindly. Verify more intelligently.",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

