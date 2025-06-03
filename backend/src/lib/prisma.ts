import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Extension with custom logging and error handlers
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

  // Add custom logging for queries in development
  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e: any) => {
      logger.debug(`Query: ${e.query}`);
      logger.debug(`Duration: ${e.duration}ms`);
    });
  }

  // Add error handling
  client.$use(async (params: any, next: any) => {
    try {
      return await next(params);
    } catch (error) {
      logger.error(`Prisma Error: ${params.model}.${params.action}`);
      logger.error(error);
      throw error;
    }
  });

  return client;
};

// Create or reuse prisma client
const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Shutting down Prisma Client.');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Shutting down Prisma Client.');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma; 