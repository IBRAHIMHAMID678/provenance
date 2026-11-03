from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "Insurance Document Intelligence Lab"
    VERSION: str = "1.0.0"
    ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Storage paths on D: drive
    STORAGE_ROOT: Path = DATA_DIR
    UPLOADS_DIR: Path = DATA_DIR / "uploads"
    PROCESSED_DIR: Path = DATA_DIR / "processed"
    DATASETS_DIR: Path = DATA_DIR / "datasets"

    # Database
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'insurance_lab.db'}"

    # Ingestion constraints
    MAX_UPLOAD_SIZE_MB: int = 25
    MAX_PAGE_COUNT: int = 100
    ALLOWED_EXTENSIONS: List[str] = ["pdf"]

    # OCR Paths
    TESSERACT_PATH: str = "C:/Program Files/Tesseract-OCR/tesseract.exe"
    ENABLE_PADDLE_OCR: bool = True

    # LLM Providers
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEFAULT_LLM_MODEL: str = "mock-insurance-extractor-v1"
    DEFAULT_VISION_MODEL: str = "mock-vision-extractor-v1"

    # Cost accounting assumptions
    HUMAN_REVIEWER_HOURLY_RATE: float = 35.00
    CPU_HOUR_COST: float = 0.05
    GPU_HOUR_COST: float = 0.50
    MOCK_LLM_INPUT_TOKEN_PRICE_PER_M: float = 0.15
    MOCK_LLM_OUTPUT_TOKEN_PRICE_PER_M: float = 0.60

    # Hybrid router thresholds
    ROUTER_MIN_DIGITAL_CHAR_DENSITY: int = 200
    ROUTER_MAX_IMAGE_AREA_RATIO: float = 0.35
    ROUTER_MIN_OCR_CONFIDENCE: float = 0.80
    ROUTER_REVIEW_CONFIDENCE_THRESHOLD: float = 0.85

settings = Settings()

# Ensure critical data directories exist on disk
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
settings.DATASETS_DIR.mkdir(parents=True, exist_ok=True)

