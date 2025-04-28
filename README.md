# PromptLab

PromptLab is a comprehensive prompt management system for AI applications.

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- Git

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/PromptLab.git
   cd PromptLab
   ```

2. Make the start script executable (Linux/Mac only):
   ```
   chmod +x start.sh
   ```

## Running the Application

### Using the provided scripts

#### On Windows:
```
.\start.ps1
```

#### On Linux/Mac:
```
./start.sh
```

These scripts will:
- Stop any existing containers
- Build and start the application containers
- Display backend logs to help with debugging

### Manually (alternative method)

1. Start the application with Docker Compose:
   ```
   docker-compose up -d --build
   ```

2. View logs (optional):
   ```
   docker-compose logs -f
   ```

3. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - API Documentation: http://localhost:3001/api-docs

## Default Users

The application comes with two pre-configured users:

1. Admin User:
   - Username: admin
   - Password: admin123
   - Email: admin@promptlab.com

2. Test User:
   - Username: testuser
   - Password: test123
   - Email: test@promptlab.com

## Stopping the Application

```
docker-compose down
```

## Development

### Frontend

The frontend is a React application located in the `frontend` directory.

- To install dependencies: `cd frontend && npm install`
- To run in development mode: `cd frontend && npm start`

### Backend

The backend is a Node.js/Express application located in the `backend` directory.

- To install dependencies: `cd backend && npm install`
- To run in development mode: `cd backend && npm run dev`
- To run database migrations: `cd backend && npm run migrate:dev`
- To seed the database: `cd backend && npm run db:seed`

## Technologies Used

- **Frontend**: React, Material-UI, Axios
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Containerization**: Docker, Docker Compose

## API Documentation

The API documentation is available at http://localhost:3001/api-docs when the application is running.

## License

MIT
