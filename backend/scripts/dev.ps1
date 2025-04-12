# Dev environment for Windows with mock database

Write-Host "Starting PromptLab API in dev mode with mock database..." -ForegroundColor Cyan

# Set environment variables
$env:NODE_ENV = "development"
$env:DB_USE_MOCK = "true"

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Green
npx prisma generate

# Start the application
Write-Host "Starting application..." -ForegroundColor Green
npx nodemon src/index.ts 