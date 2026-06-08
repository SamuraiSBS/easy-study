$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$python = Join-Path $backend ".venv\Scripts\python.exe"
$stdoutLog = Join-Path $root "backend-local.log"
$stderrLog = Join-Path $root "backend-local.err.log"
$db = Join-Path $env:TEMP "easy_study_runtime.sqlite3"
$databaseUrl = "sqlite+aiosqlite:///" + $db.Replace("\", "/")

if (-not (Test-Path $python)) {
    throw "Backend venv not found: $python"
}

$env:DATABASE_URL = $databaseUrl
$env:AUTO_CREATE_DB = "true"
$env:DEV_TELEGRAM_USER_ID = "123456789"
$env:TELEGRAM_BOT_TOKEN = "local-disabled"
$env:FRONTEND_ORIGIN = "http://localhost:5173"
$env:FRONTEND_ORIGINS = "http://localhost:5173"

function Test-Backend {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/services" -UseBasicParsing -TimeoutSec 2
        return [int]$response.StatusCode
    } catch {
        return 0
    }
}

$status = Test-Backend
if ($status -eq 200) {
    Push-Location $backend
    try {
        & $python -m scripts.ensure_local_admin
    } finally {
        Pop-Location
    }
    Write-Host "Backend already running: http://localhost:8000/api"
    Write-Host "Admin user ready: 123456789"
    Write-Host "Admin page: http://localhost:5173/admin"
    exit 0
}

Push-Location $backend
try {
    & $python -c "import asyncio; import app.models; from app.database import create_db; asyncio.run(create_db())"
    & $python -m app.seed_data
    & $python -m scripts.ensure_local_admin
} finally {
    Pop-Location
}

$arguments = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "& {
        Set-Location '$backend'
        `$env:DATABASE_URL = '$databaseUrl'
        `$env:AUTO_CREATE_DB = 'true'
        `$env:DEV_TELEGRAM_USER_ID = '123456789'
        `$env:TELEGRAM_BOT_TOKEN = 'local-disabled'
        `$env:FRONTEND_ORIGIN = 'http://localhost:5173'
        `$env:FRONTEND_ORIGINS = 'http://localhost:5173'
        & '$python' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 1> '$stdoutLog' 2> '$stderrLog'
    }"
)

$process = Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -WindowStyle Hidden -PassThru

for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    if ((Test-Backend) -eq 200) {
        Write-Host "Backend started: http://localhost:8000/api"
        Write-Host "Admin user ready: 123456789"
        Write-Host "Admin page: http://localhost:5173/admin"
        Write-Host "PID: $($process.Id)"
        Write-Host "DEV_TELEGRAM_USER_ID: 123456789"
        exit 0
    }
}

Write-Host "Backend process started but health check did not return 200 yet."
Write-Host "PID: $($process.Id)"
Write-Host "Log: $stdoutLog"
Write-Host "Error log: $stderrLog"
exit 1
