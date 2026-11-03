import sys
from pathlib import Path
import uvicorn

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.config import settings

if __name__ == "__main__":
    print(f"Starting {settings.APP_NAME} v{settings.VERSION} on {settings.HOST}:{settings.PORT}")
    print(f"Storage Root: {settings.STORAGE_ROOT}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False
    )

