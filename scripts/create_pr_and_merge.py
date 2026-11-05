import subprocess
import re
import urllib.request
import urllib.error
import json
import ssl

def get_token():
    proc = subprocess.run(
        ["git", "credential", "fill"],
        input=b"protocol=https\nhost=github.com\n",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    out = proc.stdout.decode()
    m = re.search(r"password=(.+)", out)
    if not m:
        raise RuntimeError("GitHub token not found in git credential manager")
    return m.group(1).strip()

def main():
    token = get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Provenance-Deployer"
    }

    print(">> Step 1: Creating Pull Request on GitHub...")
    url_pr = "https://api.github.com/repos/IBRAHIMHAMID678/provenance/pulls"
    data_pr = {
        "title": "feat(ui): enterprise UI/UX design system overhaul and codebase cleanup",
        "head": "feature/ui-ux-design-system-overhaul",
        "base": "main",
        "body": """## Enterprise UI/UX Design System Overhaul

### Summary of Enhancements:
- **Design System Primitives**: Created `frontend/src/components/ui/` (`Button`, `Badge`, `Card`, `Input`, `Select`, `StatCard`) adhering to the 8-axis law.
- **Color & Contrast Restoration**: Elevated palette from pitch-black neon cyan to institutional deep slate (`#080B11`) with electric sky accents (`#38BDF8`). Boosted secondary and muted typography contrast to meet WCAG AA standards.
- **Layout & Visual Hierarchy**: Redesigned Operations Overview KPI grid with micro-progress and trend telemetry; restructured the Human Review Station with operator productivity metrics and shift SLA indicators.
- **Fixed Extraction Lab Bug**: Deduplicated repeated document entries in `/lab` select list and added short ID tags.
- **Spatial Document Viewer**: Added direct PDF fallback viewer for documents without pre-rendered PNGs.
- **Codebase Cleanliness**: Purged empty `tools/tesseract` folder, untracked SQLite WAL files, and updated screenshot suite.
- **Verification**: Zero TypeScript build errors on Next.js 14, 25/25 pytest backend regression tests passing.
"""
    }

    try:
        req = urllib.request.Request(
            url_pr,
            data=json.dumps(data_pr).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        ssl_ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=ssl_ctx) as resp:
            res = json.loads(resp.read().decode())
            pr_num = res["number"]
            pr_url = res["html_url"]
            print(f"   Pull Request created successfully: #{pr_num}")
            print(f"   URL: {pr_url}")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        print(f"   PR Creation failed ({e.code}): {err_msg}")
        return

    print(f">> Step 2: Merging Pull Request #{pr_num} into main...")
    url_merge = f"https://api.github.com/repos/IBRAHIMHAMID678/provenance/pulls/{pr_num}/merge"
    data_merge = {
        "commit_title": f"Merge pull request #{pr_num} from IBRAHIMHAMID678/feature/ui-ux-design-system-overhaul",
        "commit_message": "Enterprise UI/UX design system overhaul, visual hierarchy elevation, and codebase cleanup.",
        "merge_method": "merge"
    }

    try:
        req_m = urllib.request.Request(
            url_merge,
            data=json.dumps(data_merge).encode("utf-8"),
            headers=headers,
            method="PUT"
        )
        ssl_ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(req_m, context=ssl_ctx) as resp_m:
            res_m = json.loads(resp_m.read().decode())
            print(f"   Pull Request #{pr_num} merged successfully!")
            print(f"   Merge Commit SHA: {res_m.get('sha')}")
            print(f"   Message: {res_m.get('message')}")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        print(f"   Merge failed ({e.code}): {err_msg}")

if __name__ == "__main__":
    main()
