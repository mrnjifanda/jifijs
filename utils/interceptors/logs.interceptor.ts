import { Request, Response, NextFunction } from 'express';
import { morgan, configs, fs, path } from '../../configs/app.config';
import logsService from '../../src/services/admin/logs.service';
import logger from '../helpers/logger.helper';
import crypto from 'crypto';

/**
 * Log entry interface
 */
interface LogEntry {
  id: string;
  timestamp: Date;
  ip: string;
  user_agent: string;
  user: any;
  method: string;
  hostname: string;
  url: string;
  route: string | null;
  status_code: number;
  action: string;
  entity: string;
  execution_time: number | null;
  request_size: number;
  response_size: number;
  details: {
    params: any;
    query: any;
    headers: any;
    body: any;
  };
  response_body: any;
  error: {
    code: number;
    message: string;
  } | null;
  session_id: string | null;
  correlation_id: string;
}

/**
 * File statistics interface
 */
interface FileStats {
  files_count?: number;
  total_size?: number;
  total_size_mb?: string;
  error?: string;
}

/**
 * Queue statistics interface
 */
interface QueueStats {
  queue_size: number;
  max_queue_size: number;
  is_processing: boolean;
  batch_size: number;
}

/**
 * System statistics interface
 */
interface SystemStats {
  queue: QueueStats;
  file: FileStats;
  database: number;
  uptime: number;
}

/**
 * Logs Interceptor
 * Handles request/response logging with batch processing
 */
class LogsInterceptor {
  private queue: LogEntry[] = [];
  private isProcessing: boolean = false;
  private maxQueueSize: number = 1000;
  private batchSize: number = 10;
  private processInterval: number = 5000;
  private logsDir: string;
  private sensitiveFields: string[] = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'set-cookie',
  ];

  constructor() {
    this.logsDir = path.join(__dirname, '../../.logs');
    this.ensureLogsDirectory();
    this.startBatchProcessor();
  }

  /**
   * Ensure logs directory exists
   * @private
   */
  private ensureLogsDirectory(): void {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
        logger.info('📁 Logs directory created');
      }
    } catch (error: any) {
      logger.error('❌ Failed to create logs directory:', error.message);
    }
  }

  /**
   * Determine action type from URL path
   * @param word - URL path segment
   * @returns Action type
   * @private
   */
  private getActions(word: string): string {
    const actions: Record<string, string[]> = {
      create: ['add', 'create', 'upload', 'post', 'register', 'signup', 'insert'],
      read: ['get', 'fetch', 'find', 'search', 'list', 'show', 'view'],
      update: ['update', 'modify', 'edit', 'patch', 'put', 'change'],
      delete: ['delete', 'del', 'remove', 'destroy', 'clear'],
      auth: ['login', 'logout', 'signin', 'signout', 'authenticate'],
      subscribe: ['subscribe', 'follow', 'join'],
      unsubscribe: ['unsubscribe', 'unfollow', 'leave'],
    };

    const normalizedWord = word.toLowerCase();

    for (const [actionType, keywords] of Object.entries(actions)) {
      const found = keywords.some(
        (keyword) => normalizedWord.includes(keyword) || normalizedWord.startsWith(keyword)
      );
      if (found) return actionType;
    }

    return 'unknown';
  }

  /**
   * Extract entity from URL
   * @param url - Request URL
   * @returns Entity name
   * @private
   */
  private getEntity(url: string): string {
    try {
      const cleanUrl = url.split('?')[0];
      const segments = cleanUrl.split('/').filter(Boolean);

      if (segments.length >= 2) {
        const filteredSegments = segments.filter(
          (segment) => !['api', 'v1', 'v2', 'v3'].includes(segment.toLowerCase())
        );

        if (filteredSegments.length > 0) {
          return filteredSegments[0];
        }
      }

      return 'unknown';
    } catch (error: any) {
      return 'error';
    }
  }

  /**
   * Sanitize sensitive data from objects
   * @param data - Data to sanitize
   * @returns Sanitized data
   * @private
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = JSON.parse(JSON.stringify(data));

    const sanitizeObject = (obj: any): void => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          if (this.sensitiveFields.some((field) => lowerKey.includes(field))) {
            obj[key] = '***HIDDEN***';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Generate unique log ID
   * @returns Hex string ID
   * @private
   */
  private generateLogId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Middleware to capture response body
   * @param req - Express request
   * @param res - Express response
   * @param next - Next function
   */
  captureResponseBody = (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture request start time
    (req as any).startTime = Date.now();
    (req as any).logId = this.generateLogId();

    res.send = function (body: any) {
      try {
        (res as any).response_body = typeof body === 'string' ? JSON.parse(body) : body;
      } catch {
        (res as any).response_body = { raw: body };
      }
      return originalSend.call(this, body);
    };

    res.json = function (body: any) {
      (res as any).response_body = body;
      return originalJson.call(this, body);
    };

    next();
  };

  /**
   * Create log entry from request/response
   * @param req - Express request
   * @param res - Express response
   * @returns Log entry object
   * @private
   */
  private createLogEntry(req: Request, res: Response): LogEntry {
    const endTime = Date.now();
    const executionTime = (req as any).startTime ? endTime - (req as any).startTime : null;
    const url = req.originalUrl || req.url;

    return {
      id: (req as any).logId,
      timestamp: new Date(),
      ip: (req as any).clientIp || req.ip || 'unknown',
      user_agent: req.get('User-Agent') || 'unknown',
      user: (req as any).auth?._id || (req as any).user?._id || null,
      method: req.method.toUpperCase(),
      hostname: req.hostname,
      url: url,
      route: req.route?.path || null,
      status_code: res.statusCode,
      action: this.getActions(req.path),
      entity: this.getEntity(url),
      execution_time: executionTime,
      request_size: parseInt(req.get('content-length') || '0'),
      response_size: parseInt(res.get('content-length') || '0'),
      details: {
        params: this.sanitizeData(req.params) || {},
        query: this.sanitizeData(req.query) || {},
        headers: this.sanitizeData(req.headers) || {},
        body: this.sanitizeData(req.body) || {},
      },
      response_body: this.sanitizeData((res as any).response_body) || {},
      error:
        res.statusCode >= 400
          ? {
              code: res.statusCode,
              message: res.statusMessage || 'Unknown error',
            }
          : null,
      session_id: (req as any).sessionID || null,
      correlation_id: req.get('X-Correlation-ID') || (req as any).logId,
    };
  }

  /**
   * Add log entry to queue
   * @param logEntry - Log entry to add
   * @private
   */
  private addToQueue(logEntry: LogEntry): void {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
      logger.warn('⚠️ Log queue overflow, removing oldest entry');
    }

    this.queue.push(logEntry);
  }

  /**
   * Save log entry to file
   * @param logEntry - Log entry to save
   * @returns Success status
   * @private
   */
  private async saveToFile(logEntry: LogEntry): Promise<boolean> {
    try {
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `${dateStr}.log`;
      const filepath = path.join(this.logsDir, filename);

      const logLine = JSON.stringify(logEntry) + '\n';

      await fs.promises.appendFile(filepath, logLine, 'utf8');
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to save log to file:', error.message);
      return false;
    }
  }

  /**
   * Save log entry to database
   * @param logEntry - Log entry to save
   * @returns Success status
   * @private
   */
  private async saveToDatabase(logEntry: LogEntry): Promise<boolean> {
    if (!configs.use('database')) return false;

    try {
      const result = await logsService.create(logEntry as any);
      return !result.error;
    } catch (error: any) {
      logger.error('❌ Failed to save log to database:', error.message);
      return false;
    }
  }

  /**
   * Process batch of log entries
   * @private
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      const promises = batch.map(async (logEntry) => {
        const results = await Promise.allSettled([
          this.saveToFile(logEntry),
          this.saveToDatabase(logEntry),
        ]);

        const fileSuccess = results[0].status === 'fulfilled' && results[0].value;
        const dbSuccess = results[1].status === 'fulfilled' && results[1].value;

        if (!fileSuccess && !dbSuccess) {
          logger.error('❌ Failed to save log entry:', logEntry.id);
        }

        return { file: fileSuccess, db: dbSuccess };
      });

      await Promise.all(promises);
    } catch (error: any) {
      logger.error('❌ Batch processing error:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start batch processor interval
   * @private
   */
  private startBatchProcessor(): void {
    setInterval(() => {
      this.processBatch();
    }, this.processInterval);

    logger.info('🔄 Log batch processor started');
  }

  /**
   * Get Morgan log interceptor
   * @returns Morgan middleware
   */
  getLogInterceptor(): any {
    return morgan((tokens: any, req: Request, res: Response) => {
      setImmediate(() => {
        try {
          const logEntry = this.createLogEntry(req, res);
          this.addToQueue(logEntry);
        } catch (error: any) {
          logger.error('❌ Log interceptor error:', error.message);
        }
      });

      return [
        (req as any).logId,
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res) + 'ms',
      ].join(' | ');
    });
  }

  /**
   * Get system statistics
   * @returns System stats or null
   */
  async getStats(): Promise<SystemStats | null> {
    try {
      const queueStats: QueueStats = {
        queue_size: this.queue.length,
        max_queue_size: this.maxQueueSize,
        is_processing: this.isProcessing,
        batch_size: this.batchSize,
      };

      const fileStats = await this.getFileStats();
      const dbStats = configs.use('database') ? await logsService.count({} as any) : 0;

      return {
        queue: queueStats,
        file: fileStats,
        database: dbStats,
        uptime: process.uptime(),
      };
    } catch (error: any) {
      logger.error('❌ Failed to get stats:', error.message);
      return null;
    }
  }

  /**
   * Get file statistics
   * @returns File stats
   * @private
   */
  private async getFileStats(): Promise<FileStats> {
    try {
      const files = await fs.promises.readdir(this.logsDir);
      const logFiles = files.filter((file) => file.endsWith('.log'));

      let totalSize = 0;
      for (const file of logFiles) {
        const stats = await fs.promises.stat(path.join(this.logsDir, file));
        totalSize += stats.size;
      }

      return {
        files_count: logFiles.length,
        total_size: totalSize,
        total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Cleanup old log files
   * @param olderThanDays - Delete files older than this many days
   * @returns Number of files deleted
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    try {
      const files = await fs.promises.readdir(this.logsDir);
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

      let deletedCount = 0;
      for (const file of files) {
        if (!file.endsWith('.log')) continue;

        const filepath = path.join(this.logsDir, file);
        const stats = await fs.promises.stat(filepath);

        if (stats.mtime < cutoffDate) {
          await fs.promises.unlink(filepath);
          deletedCount++;
        }
      }

      // Cleanup database logs if configured
      if (configs.use('database')) {
        const dbCutoffDate = new Date(cutoffDate);
        const LogModel = (await import('../../src/models/log.model')).default;
        await LogModel.deleteMany({
          created_at: { $lt: dbCutoffDate },
        });
      }

      logger.info(`🧹 Cleaned up ${deletedCount} old log files`);
      return deletedCount;
    } catch (error: any) {
      logger.error('❌ Cleanup failed:', error.message);
      return 0;
    }
  }

  /**
   * Graceful shutdown - process remaining logs
   */
  async gracefulShutdown(): Promise<void> {
    logger.info('📊 Processing remaining logs before shutdown...');
    while (this.queue.length > 0) {
      await this.processBatch();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info('✅ All logs processed, ready for shutdown');
  }
}

const logsInterceptor = new LogsInterceptor();

process.on('SIGTERM', () => logsInterceptor.gracefulShutdown());
process.on('SIGINT', () => logsInterceptor.gracefulShutdown());

export { logsInterceptor };
export const logInterceptor = logsInterceptor.getLogInterceptor();
export const captureResponseBody = logsInterceptor.captureResponseBody;
