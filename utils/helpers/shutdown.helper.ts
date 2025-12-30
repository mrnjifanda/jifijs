import { Server } from 'http';
import db from '../../configs/database.config';
import rateLimitConfig from '../../configs/ratelimit.config';
import logger from './logger.helper';

/**
 * Performs graceful shutdown of the application
 * @param signal - The signal received (SIGTERM, SIGINT, etc.)
 * @param app - HTTP server instance
 */
export const gracefulShutdown = async (signal: string, app: Server): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  app.close(async () => {
    logger.info('HTTP server closed');
    try {
      await db.disconnect();
      rateLimitConfig.cleanup();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error: any) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

export default { gracefulShutdown };
