<#
stop-dev.ps1
Stop the backend and frontend dev servers started by npm run dev.
Run this from the project root in PowerShell:

    .\stop-dev.ps1

Or use the npm shortcut:

    npm run stop
#>

Write-Host "Stopping development servers..."

$ports = 5000, 5173, 5174, 5175, 5176
$connections = @()
foreach ($port in $ports) {
    $connections += Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
}

$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
if (-not $processIds) {
    Write-Host "No dev server processes found on the expected ports."
    exit 0
}

foreach ($procId in $processIds) {
    try {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Host "Stopped process $procId"
    } catch {
        Write-Warning "Could not stop process ${procId}: $($_)"
    }
}

Write-Host "Stop complete. If the backend or frontend is still running, close the terminal window where they were started."
