import redisClient from '../../configs/redis.config';
import logger from './logger.helper';
import { configs } from '../../configs/app.config';

/**
 * Cache configuration options
 */
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: string;
}

/**
 * Cache Service
 * Provides Redis-based caching with fallback to in-memory cache
 */
class CacheService {
  private static instance: CacheService;
  private redis: any = null;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();
  private useRedis: boolean = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: '0%',
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    if (CacheService.instance) {
      return CacheService.instance;
    }

    this.initialize();
    CacheService.instance = this;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Initialize cache service
   * @private
   */
  private initialize(): void {
    if (configs.use('queue')) {
      try {
        this.redis = redisClient();
        this.useRedis = this.redis !== null;

        if (this.useRedis) {
          logger.info('✅ Cache service using Redis');
        } else {
          logger.warn('⚠️ Cache service falling back to in-memory cache');
          this.startMemoryCleanup();
        }
      } catch (error: any) {
        logger.error('❌ Redis initialization failed, using in-memory cache:', error.message);
        this.useRedis = false;
        this.startMemoryCleanup();
      }
    } else {
      logger.info('ℹ️ Cache service using in-memory cache (Redis disabled)');
      this.startMemoryCleanup();
    }
  }

  /**
   * Start memory cache cleanup interval
   * @private
   */
  private startMemoryCleanup(): void {
    // Clean expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemoryCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired entries from memory cache
   * @private
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires && entry.expires < now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`🧹 Cleaned ${cleaned} expired entries from memory cache`);
    }
  }

  /**
   * Build cache key with prefix
   * @private
   */
  private buildKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || 'cache';
    return `${finalPrefix}:${key}`;
  }

  /**
   * Calculate hit rate
   * @private
   */
  private calculateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) {
      this.stats.hitRate = '0%';
    } else {
      this.stats.hitRate = ((this.stats.hits / total) * 100).toFixed(2) + '%';
    }
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @param options - Cache options
   * @returns Cached value or null
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const finalKey = this.buildKey(key, options.prefix);

    try {
      let value: string | null = null;

      if (this.useRedis && this.redis) {
        value = await this.redis.get(finalKey);
      } else {
        const entry = this.memoryCache.get(finalKey);
        if (entry) {
          if (!entry.expires || entry.expires > Date.now()) {
            value = entry.value;
          } else {
            this.memoryCache.delete(finalKey);
          }
        }
      }

      if (value !== null) {
        this.stats.hits++;
        this.calculateHitRate();
        return typeof value === 'string' ? JSON.parse(value) : value;
      }

      this.stats.misses++;
      this.calculateHitRate();
      return null;
    } catch (error: any) {
      this.stats.errors++;
      logger.error(`Cache GET error for key ${finalKey}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Cache options
   * @returns Success status
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    const finalKey = this.buildKey(key, options.prefix);
    const ttl = options.ttl || 3600; // Default 1 hour
    const serialized = JSON.stringify(value);

    try {
      if (this.useRedis && this.redis) {
        await this.redis.setex(finalKey, ttl, serialized);
      } else {
        const expires = Date.now() + ttl * 1000;
        this.memoryCache.set(finalKey, { value: serialized, expires });
      }

      this.stats.sets++;
      return true;
    } catch (error: any) {
      this.stats.errors++;
      logger.error(`Cache SET error for key ${finalKey}:`, error.message);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param key - Cache key
   * @param options - Cache options
   * @returns Success status
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const finalKey = this.buildKey(key, options.prefix);

    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(finalKey);
      } else {
        this.memoryCache.delete(finalKey);
      }

      this.stats.deletes++;
      return true;
    } catch (error: any) {
      this.stats.errors++;
      logger.error(`Cache DELETE error for key ${finalKey}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   * @param pattern - Key pattern (e.g., 'user:*')
   * @param options - Cache options
   * @returns Number of deleted keys
   */
  async deletePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    const finalPattern = this.buildKey(pattern, options.prefix);

    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(finalPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          this.stats.deletes += keys.length;
          return keys.length;
        }
        return 0;
      } else {
        const regex = new RegExp('^' + finalPattern.replace('*', '.*') + '$');
        let deleted = 0;

        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            deleted++;
          }
        }

        this.stats.deletes += deleted;
        return deleted;
      }
    } catch (error: any) {
      this.stats.errors++;
      logger.error(`Cache DELETE PATTERN error for pattern ${finalPattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   * @param key - Cache key
   * @param options - Cache options
   * @returns True if exists
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const finalKey = this.buildKey(key, options.prefix);

    try {
      if (this.useRedis && this.redis) {
        const result = await this.redis.exists(finalKey);
        return result === 1;
      } else {
        const entry = this.memoryCache.get(finalKey);
        if (entry) {
          if (!entry.expires || entry.expires > Date.now()) {
            return true;
          }
          this.memoryCache.delete(finalKey);
        }
        return false;
      }
    } catch (error: any) {
      this.stats.errors++;
      logger.error(`Cache EXISTS error for key ${finalKey}:`, error.message);
      return false;
    }
  }

  /**
   * Get or set value (cache-aside pattern)
   * @param key - Cache key
   * @param fetcher - Function to fetch value if not in cache
   * @param options - Cache options
   * @returns Cached or fetched value
   */
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    // Try to get from cache
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    try {
      const value = await fetcher();
      if (value !== null && value !== undefined) {
        await this.set(key, value, options);
      }
      return value;
    } catch (error: any) {
      logger.error(`Cache getOrSet error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Clear all cache entries
   * WARNING: Only clears entries with the specified prefix
   * @param prefix - Cache prefix to clear (default: 'cache')
   * @returns Success status
   */
  async clear(prefix: string = 'cache'): Promise<boolean> {
    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(`${prefix}:*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          logger.info(`🧹 Cleared ${keys.length} cache entries with prefix ${prefix}`);
        }
      } else {
        const regex = new RegExp(`^${prefix}:`);
        let cleared = 0;

        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            cleared++;
          }
        }

        logger.info(`🧹 Cleared ${cleared} memory cache entries with prefix ${prefix}`);
      }

      return true;
    } catch (error: any) {
      this.stats.errors++;
      logger.error(`Cache CLEAR error:`, error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): CacheStats & { backend: string; size?: number } {
    return {
      ...this.stats,
      backend: this.useRedis ? 'redis' : 'memory',
      size: this.useRedis ? undefined : this.memoryCache.size,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: '0%',
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.useRedis && this.redis) {
      try {
        await this.redis.quit();
        logger.info('✅ Cache service shutdown complete');
      } catch (error: any) {
        logger.error('❌ Cache service shutdown error:', error.message);
      }
    }

    this.memoryCache.clear();
  }
}

export default CacheService.getInstance();
