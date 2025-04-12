# PromptLab

A professional platform for managing, testing, and analyzing AI prompts.

## Project Structure

The application is divided into two main parts:

- **Frontend**: React application with TypeScript
- **Backend**: Node.js Express API with TypeScript and Prisma ORM

## Getting Started

### Prerequisites

- Node.js (>= 16.x)
- npm or yarn
- PostgreSQL database

### Installation and Setup

#### Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables - copy the example file and modify as needed
cp .env.example .env

# Run database migrations
npm run migrate

# Start the development server
npm run dev
```

#### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables - copy the example file and modify as needed
cp .env.example .env

# Start the development server
npm start
```

## Docker Setup

The application can also be run using Docker:

```bash
# Build and start all services
docker-compose up -d

# To rebuild the services
docker-compose up -d --build
```

## Features

- User authentication and authorization
- Repository management for AI prompts
- Prompt testing and execution
- Analytics and performance tracking
- Organization-level access control

## Development

### Backend Structure

- `src/controllers/`: Request handlers and business logic
- `src/routes/`: API route definitions
- `src/middleware/`: Express middleware
- `src/services/`: Business logic and services
- `src/utils/`: Helper functions and utilities
- `prisma/`: Database schema and migrations

### Frontend Structure

- `src/components/`: Reusable UI components
- `src/pages/`: Page-level components
- `src/features/`: Feature-specific components and logic
- `src/contexts/`: React context providers
- `src/services/`: API service functions

## API Documentation

The API documentation is available at `/api-docs` when the backend server is running.

## License

[MIT](LICENSE)
