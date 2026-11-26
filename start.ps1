# Starts ENGage: installs what is missing, builds the backend, runs both servers and opens the app.
# Stop it by closing the two windows it opens. Restarting the backend resets the demo data.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

foreach ($port in 3000, 5173) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        Write-Host "Port $port is already in use. Close the window that runs ENGage (or stop that program) and try again."
        exit 1
    }
}

foreach ($app in 'backend', 'frontend') {
    if (-not (Test-Path "$root\$app\node_modules")) { npm.cmd ci --prefix "$root\$app" }
}
npm.cmd run build --prefix "$root\backend"
if ($LASTEXITCODE -ne 0) { Write-Host 'The backend did not build.'; exit 1 }

Start-Process powershell -ArgumentList '-NoExit', '-Command', "npm.cmd run start --prefix '$root\backend'"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "npm.cmd run dev --prefix '$root\frontend'"
Start-Sleep -Seconds 6
Start-Process 'http://localhost:5173'
