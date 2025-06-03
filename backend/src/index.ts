import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger';
import prisma from './lib/prisma';
import accountRoutes from './routes/account.routes';
import repositoryRoutes from './routes/repository.routes';
import promptRoutes from './routes/prompt.routes';
import promptExecutionRoutes from './routes/prompt-execution.routes';
import organizationRoutes from './routes/organization.routes';
import accountController from './controllers/account.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/prompt-execution', promptExecutionRoutes);
app.use('/api/organizations', organizationRoutes);

// Image serving route
app.get('/api/images/:imageId', accountController.getImage);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined,
  });
});

// Start the server
const startServer = async () => {
  try {
    // Verify Prisma connection
    await prisma.$connect();
    logger.info('Database connection has been established successfully.');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Unable to start the server:', error);
    process.exit(1);
  }
};

// startServer(); 
export default app;