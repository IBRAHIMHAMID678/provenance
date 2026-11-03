import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.main import app
from app.db.init_db import init_db
from app.services.synthetic_generator import synthetic_generator

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()

@pytest.fixture(scope="session")
def client():
    return TestClient(app)

@pytest.fixture(scope="session")
def sample_claim_pdf(tmp_path_factory):
    fn = tmp_path_factory.mktemp("sample") / "claim_test.pdf"
    gt = synthetic_generator.generate_claim_form(str(fn), seed=42)
    return str(fn), gt

@pytest.fixture(scope="session")
def sample_invoice_pdf(tmp_path_factory):
    fn = tmp_path_factory.mktemp("sample") / "invoice_test.pdf"
    gt = synthetic_generator.generate_invoice(str(fn), seed=42)
    return str(fn), gt

