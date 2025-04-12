#!/bin/bash

# Setup backend environment

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Apply migrations
echo "Applying migrations..."
npx prisma migrate deploy

# Build the application
echo "Building the application..."
npm run build

echo "Setup complete! You can now run 'npm run dev' to start the server." 