# PowerShell script to start PromptLab with Docker

Write-Host "Starting PromptLab with Docker..." -ForegroundColor Green

# Check if docker-compose is installed
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "docker-compose is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env files exist, create them if they don't
if (-not (Test-Path -Path ".\backend\.env")) {
    Write-Host "Creating backend\.env from example file..." -ForegroundColor Yellow
    Copy-Item -Path ".\backend\.env.example" -Destination ".\backend\.env"
    Write-Host "Please update backend\.env with your specific configuration." -ForegroundColor Yellow
}

if (-not (Test-Path -Path ".\frontend\.env")) {
    Write-Host "Creating frontend\.env from example file..." -ForegroundColor Yellow
    Copy-Item -Path ".\frontend\.env.example" -Destination ".\frontend\.env"
    Write-Host "Please update frontend\.env with your specific configuration." -ForegroundColor Yellow
}

# Build and start all services in detached mode
Write-Host "Building and starting Docker containers..." -ForegroundColor Cyan
docker-compose up -d --build

# Wait for services to start properly
Write-Host "Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Run database migrations if needed
Write-Host "Running database migrations..." -ForegroundColor Cyan
docker-compose exec backend npm run migrate

# Seed initial data if needed
Write-Host "Seeding initial data..." -ForegroundColor Cyan
docker-compose exec backend npm run seed

Write-Host "`nPromptLab is now running!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "- Backend API: http://localhost:3001/api" -ForegroundColor Green 