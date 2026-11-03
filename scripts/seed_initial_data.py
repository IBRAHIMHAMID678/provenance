import sys
import os
from pathlib import Path

# Setup paths
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.api.v1.datasets import generate_synthetic_dataset
from app.api.v1.security import run_security_audit
from app.api.v1.experiments import create_experiment, execute_experiment_run

def seed():
    print("Initializing database...")
    init_db()
    db = SessionLocal()
    try:
        print("Generating initial synthetic benchmark dataset...")
        ds_res = generate_synthetic_dataset(dataset_name="Insurance Benchmark Gold V1", count=6, db=db)
        print(f"Created: {ds_res['message']}")

        print("Executing baseline security audit vectors...")
        sec_res = run_security_audit(db=db)
        print(f"Security: {sec_res['message']}")

        print("Creating baseline benchmark experiment...")
        exp_res = create_experiment(
            name="Hybrid Router vs Native Extraction Benchmark",
            description="Comparing cost per correct field between PyMuPDF Native and Adaptive Hybrid Router",
            configuration={"methods": ["native_pymupdf", "hybrid", "llm"]},
            db=db
        )
        print(f"Created experiment: {exp_res['name']}")

        print("Executing benchmark experiment run...")
        run_res = execute_experiment_run(experiment_id=exp_res["id"], dataset_id=ds_res["dataset_id"], db=db)
        print(f"Completed experiment run across {len(run_res['evaluations'])} engine configurations.")

    finally:
        db.close()

    print("\nInitial data seeding complete! Database is fully populated with real benchmark observations.")

if __name__ == "__main__":
    seed()

