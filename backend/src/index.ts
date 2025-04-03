import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import logger from './utils/logger';
import accountRoutes from './routes/account.routes';
import organizationRoutes from './routes/organization.routes';
import repositoryRoutes from './routes/repository.routes';
import promptRoutes from './routes/prompt.routes';
import promptVersionRoutes from './routes/promptVersion.routes';
import mergeRequestRoutes from './routes/mergeRequest.routes';
import promptRunRoutes from './routes/promptRun.routes';
import socialRoutes from './routes/social.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/versions', promptVersionRoutes);
app.use('/api/merge-requests', mergeRequestRoutes);
app.use('/api/runs', promptRunRoutes);
app.use('/api/social', socialRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start the server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synced');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start the server:', error);
    process.exit(1);
  }
};

startServer(); 