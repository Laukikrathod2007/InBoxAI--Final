# InBoxIQ Setup & Run Script
# This script installs Python dependencies, initializes the database, and starts the InBoxIQ server + worker.

Write-Host "Starting InBoxIQ Local Setup..." -ForegroundColor Cyan

# 1. Check for Python
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python is not installed or not in PATH." -ForegroundColor Red
    exit
}

# 2. Install Dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Gray
python -m pip install -r requirements.txt

# 3. Create Environment File if missing
if (-not (Test-Path ".env")) {
    Write-Host "Creating default .env file..." -ForegroundColor Gray
    $envContent = "DATABASE_URL=sqlite:///./inboxiq.db`nPOLLING_INTERVAL_SECONDS=60`nOLLAMA_BASE_URL=http://localhost:11434"
    Set-Content -Path ".env" -Value $envContent -Encoding Utf8
}

# 4. Check for Frontend Dist
if (-not (Test-Path "frontend/dist")) {
    Write-Host "Warning: 'frontend/dist' not found. Dashboard will not load." -ForegroundColor Yellow
    Write-Host "Run: 'cd frontend; npm install; npm run build' to generate the UI." -ForegroundColor Gray
}

# 5. Launch Application
Write-Host "Launching InBoxIQ AI Work OS..." -ForegroundColor Green
Write-Host "Dashboard: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Worker will check Gmail every 60 seconds." -ForegroundColor Cyan

python run_app.py
