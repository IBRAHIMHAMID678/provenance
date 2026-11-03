Write-Host "================================================================="
Write-Host "INSURANCE DOCUMENT INTELLIGENCE LAB - SYSTEM VERIFICATION"
Write-Host "=================================================================`n"

$backendHealthy = $false
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get -TimeoutSec 5
    if ($res.status -eq "healthy") {
        $backendHealthy = $true
        Write-Host "[OK] Backend Service: HEALTHY (Version: $($res.version))"
        Write-Host "     Database Connected: $($res.database_connected)"
        Write-Host "     Storage Root:       $($res.storage_root)"
    }
} catch {
    Write-Host "[FAIL] Backend Service unreachable on http://localhost:8000/api/health"
}

$frontendHealthy = $false
try {
    $resUi = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 5
    if ($resUi.StatusCode -eq 200) {
        $frontendHealthy = $true
        Write-Host "[OK] Frontend Dashboard: AVAILABLE (HTTP 200 OK at http://localhost:3000)"
    }
} catch {
    Write-Host "[FAIL] Frontend unreachable on http://localhost:3000"
}

# Run OCR Diagnostics
Write-Host "`nProbing OCR Engines in Python Environment:"
cd "D:\PDF Extracter\backend"
python scripts/probe_engines.py

# Run Pytest verification
Write-Host "`nExecuting Regression Test Suite:"
pytest tests/ -q

Write-Host "`nSystem verification completed."
