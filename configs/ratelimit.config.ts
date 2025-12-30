import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import os from 'os';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import configs from './config';
import redisClient from './redis.config';
import response from './response.config';
import logger from '../utils/helpers/logger.helper';

/**
 * Rate limiting configuration class
 * Supports both Redis and memory-based rate limiting
 */
class RateLimitConfig {
  private skipPath: string[] = ['/health', '/status'];
  private redisClient: ReturnType<typeof redisClient> | null = null;
  private memoryStore: Map<string, any> = new Map();
  private stats = { requests: 0, blocked: 0, errors: 0 };

  private cpuCount: number = os.cpus().length;
  private baseWindow: number = parseInt(configs.getValue('RATE_LIMIT_WINDOW_MS', false)) || 60000;
  private lastSystemCheck: number = 0;
  private cachedSystemLoad: number = 0;

  /**
   * Initialize rate limiting middleware
   */
  init(): RateLimitRequestHandler | null {
    if (!configs.use('ratelimit')) {
      logger.warn('⚠️ Rate limiting disabled');
      return null;
    }

    if (configs.use('queue')) {
      try {
        this.redisClient = redisClient();
        if (this.redisClient) {
          logger.info('✅ Rate limiting with Redis storage');
          return this.createRedisRateLimit();
        }
      } catch (error: any) {
        logger.error('❌ Redis rate limit setup failed:', error);
      }
    }

    logger.warn('⚠️ Rate limiting with memory storage (fallback)');
    return this.createMemoryRateLimit();
  }

  /**
   * Create Redis-backed rate limiter
   * @private
   */
  private createRedisRateLimit(): RateLimitRequestHandler {
    const store = new RedisStore({
      // @ts-ignore - Rate limit redis types compatibility
      sendCommand: (...args: any[]) => this.redisClient?.call(...args),
    });

    return rateLimit({
      store,
      windowMs: this.getWindowMs(),
      max: this.getMaxRequests(),
      message: {
        error: true,
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(this.getWindowMs() / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => this.generateKey(req),
      skip: (req: Request) => this.shouldSkip(req),
      handler: (_req: Request, res: Response, next: NextFunction) => {
        this.stats.blocked++;
        response.failed(
          res,
          next,
          'Too many requests, please try again later.',
          {
            retryAfter: Math.ceil(this.getWindowMs() / 1000),
            limit: this.getMaxRequests(),
            windowMs: this.getWindowMs(),
          },
          429
        );
      },
    });
  }

  /**
   * Create memory-backed rate limiter
   * @private
   */
  private createMemoryRateLimit(): RateLimitRequestHandler {
    return rateLimit({
      windowMs: this.getWindowMs(),
      max: this.getMaxRequests(),
      message: {
        error: true,
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(this.getWindowMs() / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => this.generateKey(req),
      skip: (req: Request) => this.shouldSkip(req),
      handler: (_req: Request, res: Response, next: NextFunction) => {
        this.stats.blocked++;
        response.failed(
          res,
          next,
          'Too many requests, please try again later.',
          {
            retryAfter: Math.ceil(this.getWindowMs() / 1000),
            limit: this.getMaxRequests(),
            windowMs: this.getWindowMs(),
          },
          429
        );
      },
    });
  }

  /**
   * Generate unique key for rate limiting
   * @private
   */
  private generateKey(req: Request): string {
    const ip = req.clientIp || req.ip;
    const userId = (req as any)?.auth?._id || 'anonymous';

    const fingerprint = [
      req.get('Accept-Language'),
      req.get('Accept-Encoding'),
      req.get('Connection'),
    ]
      .filter(Boolean)
      .join('|');

    const hash = crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 8);

    return `ratelimit:${ip}:${userId}:${hash}`;
  }

  /**
   * Check if request should skip rate limiting
   * @private
   */
  private shouldSkip(req: Request): boolean {
    if (this.skipPath.includes(req.path)) return true;

    const skipIps = configs.getLists('RATE_LIMIT_SKIP_IPS') || [];
    const clientIp = req.clientIp || req.ip;

    return skipIps.includes(clientIp || '');
  }

  /**
   * Calculate window duration based on system load
   * @private
   */
  private getWindowMs(): number {
    const now = Date.now();
    if (now - this.lastSystemCheck > 10000) {
      const loadAvg = os.loadavg()[0];
      this.cachedSystemLoad = loadAvg / this.cpuCount;
      this.lastSystemCheck = now;
    }

    const systemLoad = this.cachedSystemLoad;
    if (systemLoad > 0.8) {
      return Math.max(this.baseWindow * 0.5, 30000);
    } else if (systemLoad > 0.6) {
      return this.baseWindow * 0.7;
    }

    return this.baseWindow;
  }

  /**
   * Calculate max requests based on system load
   * @private
   */
  private getMaxRequests(): number {
    const baseMax = parseInt(configs.getValue('RATE_LIMIT_MAX_REQUESTS', false)) || 100;
    const memoryUsage = process.memoryUsage();
    const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;

    // Reduce requests if memory is saturated
    if (memoryPercent > 0.9) {
      return Math.max(Math.floor(baseMax * 0.3), 10);
    } else if (memoryPercent > 0.7) {
      return Math.floor(baseMax * 0.6);
    }

    return baseMax;
  }

  /**
   * Statistics middleware
   */
  statsMiddleware() {
    return (_req: Request, res: Response, next: NextFunction) => {
      this.stats.requests++;

      res.on('finish', () => {
        if (res.statusCode >= 500) {
          this.stats.errors++;
        }
      });

      next();
    };
  }

  /**
   * Get rate limiting statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeConnections: this.memoryStore.size,
      systemLoad: os.loadavg()[0] / os.cpus().length,
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      redisConnected: (this.redisClient as any)?.status === 'ready',
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
    this.memoryStore.clear();
  }
}

export default new RateLimitConfig();
