# PromptLab

PromptLab is a comprehensive platform for managing AI prompts with version control, collaboration features, and testing capabilities. Think of it as GitHub for prompt engineering.

## 🌟 Features

- **Repository Management**: Organize prompts in repositories with detailed information
- **Version Control**: Track changes to prompts over time with commit messages
- **Merge Requests**: Collaborate on prompts with formal review processes
- **Prompt Playground**: Test prompts with various parameters and models
- **Execution Logs**: Keep track of prompt executions and performance metrics
- **Social Layer**: Stars, follows, comments, and notifications
- **Organizations**: Team-based collaboration and management
- **Comprehensive Search**: Find prompts, users, and organizations

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose (recommended)
- Node.js (v16+) for local development without Docker
- PostgreSQL for local development without Docker
- npm or yarn for local development without Docker

### Quick Start with Docker

The fastest way to get PromptLab running is using Docker:

#### On Windows:

```powershell
# Clone the repository
git clone https://github.com/yourusername/promptlab.git
cd promptlab

# Start the application using the PowerShell script
.\docker-start.ps1
```

#### On Linux/macOS:

```bash
# Clone the repository
git clone https://github.com/yourusername/promptlab.git
cd promptlab

# Make the startup script executable
chmod +x docker-start.sh

# Start the application
./docker-start.sh
```

This will:
1. Create necessary environment files if they don't exist
2. Build and start all Docker containers
3. Run database migrations and seed initial data
4. Provide URLs for accessing the application

After running these commands, access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

### Manual Installation (without Docker)

For detailed instructions on setting up PromptLab without Docker, see [SETUP.md](SETUP.md).

## 📂 Project Structure

```
promptlab/
├── backend/              # Backend codebase
│   ├── controllers/      # API controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Middleware functions
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── index.js          # Entry point
│
├── frontend/             # Frontend codebase
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React context providers
│   │   ├── services/     # API client services
│   │   ├── utils/        # Utility functions
│   │   └── App.tsx       # Main application component
│   └── public/           # Static assets
│
├── docker/               # Docker-related files
│   └── prompt-lab-db.sql # Database initialization script
│
├── docker-compose.yml    # Docker Compose configuration
├── docker-start.sh       # Startup script for Linux/macOS
├── docker-start.ps1      # Startup script for Windows
└── SETUP.md              # Detailed setup documentation
```

## 🖥️ Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- TypeScript
- JWT authentication
- Prisma ORM

### Frontend
- React with TypeScript
- Material UI component library
- React Router for navigation
- Context API for state management
- Axios for API requests

## 🌐 API Endpoints

PromptLab provides a comprehensive RESTful API:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/accounts/*`
- **Repositories**: `/api/repositories/*`
- **Prompts**: `/api/prompts/*`
- **Organizations**: `/api/organizations/*`
- **Merge Requests**: `/api/merge-requests/*`
- **Execution**: `/api/execution/*`
- **Search**: `/api/search/*`
- **Notifications**: `/api/notifications/*`

For detailed API documentation, see the API docs at `/api/docs` when running the application.

## 🐞 Troubleshooting

If you encounter issues with Docker startup:

1. Check if Docker and docker-compose are installed and running
2. Verify that ports 3000, 3001, and 5432 are not in use
3. Check the container logs:
   ```bash
   docker-compose logs
   ```

For more detailed troubleshooting, see [SETUP.md](SETUP.md).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

- Email: your.email@example.com
- Twitter: [@yourusername](https://twitter.com/yourusername)
- Project Link: [https://github.com/yourusername/promptlab](https://github.com/yourusername/promptlab)
