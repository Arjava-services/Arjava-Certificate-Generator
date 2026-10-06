# PowerShell script to launch backend and Cloudflare tunnel
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Arjava Certificate Generator - Backend & Tunnel Runner" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Stop any old processes on port 8000
Write-Host "`n[1/4] Checking port 8000..." -ForegroundColor Yellow
$conn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "  Found process on port 8000 (PID: $($conn.OwningProcess)). Stopping..." -ForegroundColor DarkYellow
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Also stop any existing cloudflared quick tunnels
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Start FastAPI Backend in background
Write-Host "[2/4] Starting FastAPI backend on port 8000..." -ForegroundColor Yellow
$backendDir = Join-Path $PSScriptRoot "backend"
$pythonExe = Join-Path $backendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "Error: Virtual environment python not found at $pythonExe" -ForegroundColor Red
    pause
    exit 1
}

$backendProc = Start-Process -FilePath $pythonExe `
    -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" `
    -WorkingDirectory $backendDir `
    -PassThru

Write-Host "  Backend started (PID: $($backendProc.Id))" -ForegroundColor Green

# 3. Wait for backend health check
Write-Host "[3/4] Verifying backend health..." -ForegroundColor Yellow
$healthy = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq "healthy") {
            $healthy = $true
            break
        }
    } catch {
        # Waiting for server to boot
    }
}

if (-not $healthy) {
    Write-Host "  Warning: Health check didn't respond within 15s, but continuing..." -ForegroundColor Yellow
} else {
    Write-Host "  Backend health check: OK (Certificate Generator v1.0.0)" -ForegroundColor Green
}

# 4. Start Cloudflare Tunnel and capture URL
Write-Host "[4/4] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
$cloudflaredExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflaredExe)) {
    $cloudflaredCmd = Get-Command "cloudflared" -ErrorAction SilentlyContinue
    if ($cloudflaredCmd) {
        $cloudflaredExe = $cloudflaredCmd.Source
    } else {
        Write-Host "Error: cloudflared.exe not found at $cloudflaredExe or in PATH" -ForegroundColor Red
        pause
        exit 1
    }
}

$logFile = Join-Path $PSScriptRoot "tunnel.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force }

$tunnelProc = Start-Process -FilePath $cloudflaredExe `
    -ArgumentList "tunnel --url http://127.0.0.1:8000" `
    -RedirectStandardError $logFile `
    -PassThru

$tunnelUrl = ""
Write-Host "  Waiting for public tunnel URL from Cloudflare..." -NoNewline
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
    if (Test-Path $logFile) {
        $logContent = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        if ($logContent -match 'https://([a-zA-Z0-9-]+\.trycloudflare\.com)') {
            $tunnelUrl = $matches[0]
            break
        }
    }
}
Write-Host ""

if ($tunnelUrl) {
    Set-Clipboard -Value $tunnelUrl
    Set-Content -Path (Join-Path $PSScriptRoot "active-tunnel-url.txt") -Value $tunnelUrl

    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Live Tunnel URL:" -ForegroundColor Green
    Write-Host "  $tunnelUrl" -ForegroundColor Cyan -BackgroundColor Black
    Write-Host "  (Copied to your clipboard automatically!)" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "`nNEXT STEPS:" -ForegroundColor White
    Write-Host "1. Open your web app: https://certificategenerator-ceb1a.web.app/" -ForegroundColor Yellow
    Write-Host "2. Click 'API Offline' / Server button in the top navigation bar" -ForegroundColor Yellow
    Write-Host "3. Paste the URL ($tunnelUrl) into the box (Ctrl+V)" -ForegroundColor Yellow
    Write-Host "4. Click 'Test' -> then 'Save & Apply'" -ForegroundColor Yellow
    Write-Host "`nKeep this window OPEN while using the web app." -ForegroundColor White
    Write-Host "Press Ctrl+C or close this window when done to stop services." -ForegroundColor Gray
} else {
    Write-Host "`nCould not automatically parse tunnel URL. Check tunnel.log for details." -ForegroundColor Red
}

# Keep script running to monitor processes
try {
    Wait-Process -Id $tunnelProc.Id
} finally {
    Write-Host "`nStopping backend and tunnel..." -ForegroundColor Yellow
    Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $tunnelProc.Id -Force -ErrorAction SilentlyContinue
}
