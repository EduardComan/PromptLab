# Setup backend environment

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Green
npx prisma generate

# Start PostgreSQL container
Write-Host "Starting PostgreSQL container..." -ForegroundColor Green
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Green
Start-Sleep -Seconds 5

# Apply migrations
Write-Host "Applying migrations..." -ForegroundColor Green
npx prisma migrate deploy

# Build the application
Write-Host "Building the application..." -ForegroundColor Green
npm run build

Write-Host "Setup complete! You can now run 'npm run dev' to start the server." -ForegroundColor Green 