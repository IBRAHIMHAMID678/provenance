$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "D:\PDF Extracter\docs\screenshots"
$tempDir = "D:\edge_temp"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$docId = "8d0ae591-ae4b-4712-a10f-b6e2e9df4b4b"

$pages = @(
    @{ Name = "01_overview.png"; Url = "http://localhost:3000/" },
    @{ Name = "02_documents.png"; Url = "http://localhost:3000/documents" },
    @{ Name = "03_document_detail.png"; Url = "http://localhost:3000/documents/$docId" },
    @{ Name = "04_queue.png"; Url = "http://localhost:3000/queue" },
    @{ Name = "05_human_review.png"; Url = "http://localhost:3000/review" },
    @{ Name = "06_extraction_lab.png"; Url = "http://localhost:3000/lab" },
    @{ Name = "07_experiments.png"; Url = "http://localhost:3000/experiments" },
    @{ Name = "08_evaluation.png"; Url = "http://localhost:3000/evaluation" },
    @{ Name = "09_cost_analysis.png"; Url = "http://localhost:3000/cost" },
    @{ Name = "10_datasets.png"; Url = "http://localhost:3000/datasets" },
    @{ Name = "11_security.png"; Url = "http://localhost:3000/security" },
    @{ Name = "12_settings.png"; Url = "http://localhost:3000/settings" }
)

Write-Host "================================================================="
Write-Host "CAPTURING FULL SUITE OF UI SCREENSHOTS VIA HEADLESS BROWSER"
Write-Host "=================================================================`n"

foreach ($p in $pages) {
    $tempShot = "D:\temp_$($p.Name)"
    $destShot = "$outDir\$($p.Name)"
    $args = "--headless --disable-gpu --window-size=1440,900 --user-data-dir=$tempDir --screenshot=$tempShot $($p.Url)"
    
    Write-Host ">> Rendering: $($p.Url) -> $($p.Name)"
    Start-Process -FilePath $edge -ArgumentList $args -Wait
    
    if (Test-Path $tempShot) {
        Move-Item -Path $tempShot -Destination $destShot -Force
        $item = Get-Item $destShot
        Write-Host "   Saved: $($p.Name) ($($item.Length) bytes)"
    } else {
        Write-Host "   FAILED to render: $($p.Name)"
    }
}

Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "`nAll screenshots captured successfully in $outDir"
