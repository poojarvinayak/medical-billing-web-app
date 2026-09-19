<#
start-dev.ps1
Simple helper to start MongoDB (service), backend, and frontend on Windows.
Run this from the project root in PowerShell:

    .\start-dev.ps1

#>

Write-Host "Starting local dev services..."

try {
    $svc = Get-Service -Name MongoDB -ErrorAction Stop
    if ($svc.Status -ne 'Running') {
        Write-Host "Starting MongoDB service..."
        Start-Service -Name MongoDB
        Start-Sleep -Seconds 2
    } else {
        Write-Host "MongoDB service already running."
    }
} catch {
    Write-Warning "MongoDB service not found or could not be started. Please ensure MongoDB is installed and running."
}

# Try initiating replica set (no-op if already initialized)
$mongosh = "C:\Users\$env:USERNAME\AppData\Local\Programs\mongosh\mongosh.exe"
if (Test-Path $mongosh) {
    try {
        & $mongosh --eval 'rs.initiate()' | Out-Null
        Write-Host "Replica set initiation attempted (harmless if already configured)."
    } catch {
        Write-Host "Replica set initiation skipped or failed: $_"
    }
} else {
    Write-Host "mongosh not found at $mongosh - skipping replica set initiation."
}

Write-Host "Starting backend (runs in background)..."
Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList '--prefix','backend','run','dev'

Write-Host "Waiting for backend to become ready..."
$backendReady = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
        $health = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:5000/api/health" -TimeoutSec 1
        if ($health.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {
        Wait-Event -Timeout 1 | Out-Null
    }
}

if (-not $backendReady) {
    throw "Backend did not become ready within 30 seconds. Check the backend terminal for startup errors."
}

Write-Host "Starting frontend (runs in background, bound to 127.0.0.1)..."
Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList '--prefix','frontend','run','dev'

Write-Host "Done. Backend: http://127.0.0.1:5000  Frontend: http://127.0.0.1:5173"
Write-Host "If you see permission errors starting services, run PowerShell as Administrator."
