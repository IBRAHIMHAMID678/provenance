import sqlite3
import os

db_path = os.path.join("backend", "data", "insurance_lab.db")
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    columns_to_add = [
        ("extracted_fields", "evidence_located", "BOOLEAN DEFAULT 1"),
        ("extracted_fields", "confidence_signals", "TEXT DEFAULT '{}'"),
        ("field_evidence", "is_located", "BOOLEAN DEFAULT 1"),
        ("field_evidence", "quads", "TEXT"),
        ("evaluation_results", "mismatch_rate", "FLOAT DEFAULT 0.0"),
        ("evaluation_results", "cost_basis", "VARCHAR(30) DEFAULT 'modeled'")
    ]
    for table, col, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            print(f"Added {col} to {table}")
        except Exception as e:
            print(f"{col} on {table}: {e}")
    conn.commit()
    conn.close()
    print("Migration complete.")
else:
    print(f"{db_path} not found.")
