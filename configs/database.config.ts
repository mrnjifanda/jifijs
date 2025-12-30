import mongoose, { ConnectOptions } from 'mongoose';
import logger from '../utils/helpers/logger.helper';
import configs from './config';

/**
 * Database configuration and connection manager
 */
class DatabaseConfig {
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number = 3;

  /**
   * Connect to MongoDB database
   * @param database - MongoDB connection string
   * @returns Promise<boolean> - Success status
   */
  async connect(database: string): Promise<boolean> {
    const options: ConnectOptions = {
      maxPoolSize: parseInt(configs.getValue('DATABASE_MAX_POOL_SIZE', false)) || 10,
      minPoolSize: parseInt(configs.getValue('DATABASE_MIN_POOL_SIZE', false)) || 5,
      serverSelectionTimeoutMS: parseInt(configs.getValue('DATABASE_SERVER_TIMEOUT', false)) || 5000,
      socketTimeoutMS: parseInt(configs.getValue('DATABASE_SOCKET_TIMEOUT', false)) || 45000,
      connectTimeoutMS: parseInt(configs.getValue('DATABASE_CONNECT_TIMEOUT', false)) || 10000,
      heartbeatFrequencyMS: parseInt(configs.getValue('DATABASE_HEARTBEAT_FREQ', false)) || 10000,
      retryWrites: true,
      retryReads: true,
      bufferCommands: false,
    };

    while (this.connectionAttempts < this.maxRetries && !this.isConnected) {
      try {
        this.connectionAttempts++;
        await mongoose.connect(database, options);
        this.isConnected = true;
        logger.info('✅ Successfully connected to database');

        // Event listeners
        mongoose.connection.on('error', (error: Error) => {
          logger.error('❌ Database error:', error);
          this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('⚠️ Database disconnected');
          this.isConnected = false;
        });

        return true;
      } catch (error: any) {
        logger.error(
          `❌ Database connection attempt ${this.connectionAttempts} failed:`,
          error.message
        );

        if (this.connectionAttempts >= this.maxRetries) {
          logger.error('❌ Max connection attempts reached. Exiting...');
          process.exit(1);
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, this.connectionAttempts) * 1000)
        );
      }
    }

    return false;
  }

  /**
   * Disconnect from database
   * @returns Promise<boolean> - Success status
   */
  async disconnect(): Promise<boolean> {
    if (!this.isConnected) return true;

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('✅ Successfully disconnected from database');
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to disconnect:', error.message);
      return false;
    }
  }

  /**
   * Get database health check info
   * @returns Health check object
   */
  healthCheck(): { connected: boolean; readyState: number; attempts: number } {
    return {
      connected: this.isConnected,
      readyState: mongoose.connection.readyState,
      attempts: this.connectionAttempts,
    };
  }
}

const dbConfig = new DatabaseConfig();
export default dbConfig;
