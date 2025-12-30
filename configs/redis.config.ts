import Redis, { RedisOptions } from 'ioredis';
import configs from './config';
import logger from '../utils/helpers/logger.helper';

/**
 * Redis configuration and management class
 * Handles connection, reconnection, health checks and statistics
 */
class RedisConfig {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private stats = {
    connections: 0,
    errors: 0,
    commands: 0,
    lastError: null as { message: string; timestamp: string } | null,
    uptime: null as number | null,
  };

  /**
   * Creates a new Redis client with proper configuration
   * @returns Redis client instance or null if disabled/failed
   */
  createClient(): Redis | null {
    if (!configs.use('queue')) {
      logger.warn('⚠️ Redis disabled in configuration');
      return null;
    }

    try {
      const { base_name, ...configRedis } = configs.getRedis();
      const redisOptions: RedisOptions = {
        host: configRedis.host as string,
        port: Number(configRedis.port),
        password: configRedis.password,
        lazyConnect: false,
        keepAlive: 30000,
        commandTimeout: 5000,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        enableAutoPipelining: false,
        retryStrategy: (times: number) => this._getRetryDelay(times),
        reconnectOnError: (err: Error) => err.message.includes('READONLY'),
      };

      this.client = new Redis(redisOptions);
      this._setupEventHandlers();

      return this.client;
    } catch (error: any) {
      logger.error('❌ Redis client creation failed:', error.message);
      this.stats.errors++;
      this._updateErrorStats(error);
      return null;
    }
  }

  /**
   * Connects to Redis server
   */
  async connect(): Promise<boolean> {
    if (!this.client) {
      this.client = this.createClient();
    }

    if (!this.client) return false;

    try {
      if (!this.isConnected) {
        await this.client.connect();
        await this.client.ping();
        logger.info('✅ Redis authentication successful');
      }
      return true;
    } catch (error: any) {
      logger.error('❌ Redis connection failed:', error.message);
      return false;
    }
  }

  /**
   * Disconnects from Redis server gracefully
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        this.client.removeAllListeners();
        await this.client.quit();
        logger.info('✅ Redis disconnected gracefully');
      } catch (error: any) {
        logger.warn('⚠️ Redis force disconnect:', error.message);
        this.client.disconnect();
      }
    }
    this.isConnected = false;
  }

  /**
   * Performs health check on Redis connection
   */
  async healthCheck(): Promise<{
    status: string;
    connected: boolean;
    error?: string;
    latency?: string;
    readWrite?: boolean;
    info?: any;
    lastError?: any;
  }> {
    if (!this.client || !this.isConnected) {
      return {
        status: 'disconnected',
        connected: false,
        error: 'Redis client not connected',
      };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      const testKey = `health_check:${Date.now()}`;
      await this.client.setex(testKey, 5, 'test');
      const testValue = await this.client.get(testKey);
      await this.client.del(testKey);

      return {
        status: 'healthy',
        connected: true,
        latency: `${latency}ms`,
        readWrite: testValue === 'test',
        info: await this.getInfo(),
      };
    } catch (error: any) {
      this._updateErrorStats(error);
      return {
        status: 'error',
        connected: false,
        error: error.message,
        lastError: this.stats.lastError,
      };
    }
  }

  /**
   * Gets Redis server information
   */
  async getInfo(): Promise<Record<string, any> | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const [info, memory, stats] = await Promise.all([
        this.client.info(),
        this.client.info('memory'),
        this.client.info('stats'),
      ]);

      return {
        version: this._extractInfo(info, 'redis_version'),
        mode: this._extractInfo(info, 'redis_mode'),
        uptime: this._extractInfo(info, 'uptime_in_seconds'),
        connected_clients: this._extractInfo(info, 'connected_clients'),
        used_memory: this._extractInfo(memory, 'used_memory_human'),
        used_memory_peak: this._extractInfo(memory, 'used_memory_peak_human'),
        total_commands_processed: this._extractInfo(stats, 'total_commands_processed'),
        total_connections_received: this._extractInfo(stats, 'total_connections_received'),
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Gets current statistics
   */
  getStats() {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      uptime: this.stats.uptime ? Date.now() - this.stats.uptime : 0,
    };
  }

  /**
   * Safely executes a Redis command
   */
  async safeExecute(command: string, ...args: any[]): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      this.stats.commands++;
      return await (this.client as any)[command](...args);
    } catch (error: any) {
      this.stats.errors++;
      this.stats.lastError = {
        message: error.message,
        timestamp: new Date().toISOString(),
      };
      throw error;
    }
  }

  /**
   * Cleans up test keys from health checks
   */
  async cleanup(): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      const testKeys = await this.client.keys('health_check:*');
      if (testKeys.length > 0) {
        await this.client.del(...testKeys);
        logger.info(`🧹 Cleaned ${testKeys.length} test keys`);
      }
    } catch (error: any) {
      logger.warn('⚠️ Redis cleanup error:', error.message);
    }
  }

  /**
   * Determines retry delay for reconnection attempts
   * @private
   */
  private _getRetryDelay(times: number): number | null {
    if (times > this.maxReconnectAttempts) {
      logger.error('❌ Redis max reconnection attempts reached');
      return null;
    }

    const delay = Math.min(times * 50, 2000);
    logger.warn(`⚠️ Redis reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  }

  /**
   * Sets up event handlers for Redis client
   * @private
   */
  private _setupEventHandlers(): void {
    if (!this.client) return;

    this.client.removeAllListeners();

    this.client.on('connect', () => {
      this.reconnectAttempts = 0;
      this.stats.connections++;
      logger.warn('🔄 Redis connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.stats.uptime = Date.now();
      logger.info('✅ Redis connection ready');
    });

    this.client.on('error', (err: Error) => {
      this.isConnected = false;
      this._updateErrorStats(err);
      logger.error('❌ Redis error:', err.message);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('⚠️ Redis connection closed');
    });

    this.client.on('reconnecting', (ms: number) => {
      this.reconnectAttempts++;
      logger.warn(`🔄 Redis reconnecting in ${ms}ms (attempt ${this.reconnectAttempts})`);
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('📡 Redis connection ended');
    });
  }

  /**
   * Updates error statistics
   * @private
   */
  private _updateErrorStats(error: Error): void {
    this.stats.errors++;
    this.stats.lastError = {
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extracts specific information from Redis info string
   * @private
   */
  private _extractInfo(info: string, key: string): string {
    const regex = new RegExp(`${key}:(.+)`);
    const match = info.match(regex);
    return match ? match[1].trim() : 'N/A';
  }
}

const redisConfig = new RedisConfig();

/**
 * Factory function to create Redis client
 */
const redisClient = (): Redis | null => redisConfig.createClient();

const shutdown = () => redisConfig.disconnect();
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default redisClient;
export { redisConfig };
