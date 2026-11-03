import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.adapters import list_adapters_info

def probe():
    for a in list_adapters_info():
        status = "ONLINE " if a["is_available"] else "OFFLINE"
        print(f"  - [{status}] {a['display_name']:<42} ({a['method_id']}): {a['status_message']}")

if __name__ == "__main__":
    probe()
