#!/bin/bash

# Exit on any error
set -e

# Print commands before executing
set -x

echo "Starting PromptLab with Docker..."

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "docker-compose is not installed. Please install Docker and docker-compose first."
    exit 1
fi

# Check if .env files exist, create them if they don't
if [ ! -f ./backend/.env ]; then
    echo "Creating backend/.env from example file..."
    cp ./backend/.env.example ./backend/.env
    echo "Please update backend/.env with your specific configuration."
fi

if [ ! -f ./frontend/.env ]; then
    echo "Creating frontend/.env from example file..."
    cp ./frontend/.env.example ./frontend/.env
    echo "Please update frontend/.env with your specific configuration."
fi

# Build and start all services in detached mode
docker-compose up -d --build

# Wait for services to start properly
echo "Waiting for services to start..."
sleep 10

# Run database migrations if needed
echo "Running database migrations..."
docker-compose exec backend npm run migrate

# Seed initial data if needed
echo "Seeding initial data..."
docker-compose exec backend npm run seed

echo "PromptLab is now running!"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001/api" 