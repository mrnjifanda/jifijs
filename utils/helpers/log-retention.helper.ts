import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { configs } from '../../configs/app.config';
import logger from './logger.helper';

const pipelineAsync = promisify(pipeline);

/**
 * Retention policies configuration
 */
interface RetentionPolicies {
  files: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  database: {
    critical_logs: number;
    error_logs: number;
    normal_logs: number;
  };
}

/**
 * Cleanup result
 */
interface CleanupResult {
  archived?: number;
  deleted: number;
  error?: string;
}

/**
 * Retention execution summary
 */
interface RetentionSummary {
  files: CleanupResult;
  database: CleanupResult;
  executed_at: string;
}

/**
 * Log Retention Manager
 * Manages log file and database retention policies
 */
class LogRetention {
  private retentionPolicies: RetentionPolicies;
  private logsDir: string;
  private archiveDir: string;

  constructor() {
    this.retentionPolicies = {
      files: {
        daily: parseInt(configs.getValue('LOG_RETENTION_DAILY', false)) || 7,
        weekly: parseInt(configs.getValue('LOG_RETENTION_WEEKLY', false)) || 30,
        monthly: parseInt(configs.getValue('LOG_RETENTION_MONTHLY', false)) || 90,
      },
      database: {
        critical_logs: parseInt(configs.getValue('DB_RETENTION_CRITICAL', false)) || 90,
        error_logs: parseInt(configs.getValue('DB_RETENTION_ERRORS', false)) || 30,
        normal_logs: parseInt(configs.getValue('DB_RETENTION_NORMAL', false)) || 7,
      },
    };

    this.logsDir = path.join(__dirname, '../../.logs');
    this.archiveDir = path.join(this.logsDir, 'archives');
  }

  /**
   * Initialize archive directory
   * @private
   */
  async initArchiveDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.archiveDir, { recursive: true });
    } catch (error: any) {
      logger.error('Erreur création répertoire archives:', error.message);
    }
  }

  /**
   * Clean up old log files
   * @returns Cleanup result
   */
  async cleanupFiles(): Promise<CleanupResult> {
    try {
      await this.initArchiveDirectory();

      const files = await fs.readdir(this.logsDir);
      const logFiles = files.filter((file) => file.endsWith('.log') && file !== 'archives');

      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const retentionMs = this.retentionPolicies.files.daily * oneDayMs;

      let archivedCount = 0;
      let deletedCount = 0;

      for (const file of logFiles) {
        const filePath = path.join(this.logsDir, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtime.getTime();

        if (fileAge > retentionMs) {
          // Archive files from the last week
          if (fileAge < 7 * oneDayMs) {
            await this.archiveFile(filePath, file);
            archivedCount++;
          } else {
            // Delete older files
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      logger.info(
        `Nettoyage des fichiers terminé: ${archivedCount} archivés, ${deletedCount} supprimés`
      );
      return { archived: archivedCount, deleted: deletedCount };
    } catch (error: any) {
      logger.error('Erreur nettoyage fichiers:', error.message);
      return { archived: 0, deleted: 0, error: error.message };
    }
  }

  /**
   * Archive a log file
   * @param filePath - Path to file to archive
   * @param filename - File name
   * @private
   */
  private async archiveFile(filePath: string, filename: string): Promise<void> {
    try {
      const archivePath = path.join(this.archiveDir, filename);
      await fs.rename(filePath, archivePath);

      // Optional compression (requires zlib)
      if (configs.getValue('LOG_COMPRESS_ARCHIVES', false) === 'true') {
        await this.compressFile(archivePath);
      }
    } catch (error: any) {
      logger.error(`Erreur archivage ${filename}:`, error.message);
    }
  }

  /**
   * Compress a file using gzip
   * @param filePath - Path to file to compress
   * @private
   */
  private async compressFile(filePath: string): Promise<void> {
    try {
      const gzip = zlib.createGzip();
      const source = createReadStream(filePath);
      const destination = createWriteStream(filePath + '.gz');

      await pipelineAsync(source, gzip, destination);
      await fs.unlink(filePath); // Delete original file

      logger.info(`Fichier compressé: ${path.basename(filePath)}.gz`);
    } catch (error: any) {
      logger.error('Erreur compression:', error.message);
    }
  }

  /**
   * Clean up old logs from database
   * @returns Cleanup result
   */
  async cleanupDatabase(): Promise<CleanupResult> {
    if (!configs.use('database')) return { deleted: 0 };

    try {
      // Import logs service dynamically to avoid circular dependencies
      const logModel = await import('../../src/models/log.model');
      const LogModel = logModel.default;

      const now = new Date();
      let totalDeleted = 0;

      // Clean normal logs
      const normalCutoff = new Date(
        now.getTime() - this.retentionPolicies.database.normal_logs * 24 * 60 * 60 * 1000
      );
      const normalResult = await LogModel.deleteMany({
        timestamp: { $lt: normalCutoff },
        status_code: { $lt: 400 },
      });
      totalDeleted += normalResult.deletedCount || 0;

      // Clean error logs (keep longer)
      const errorCutoff = new Date(
        now.getTime() - this.retentionPolicies.database.error_logs * 24 * 60 * 60 * 1000
      );
      const errorResult = await LogModel.deleteMany({
        timestamp: { $lt: errorCutoff },
        status_code: { $gte: 400, $lt: 500 },
      });
      totalDeleted += errorResult.deletedCount || 0;

      // Clean critical logs (keep even longer)
      const criticalCutoff = new Date(
        now.getTime() - this.retentionPolicies.database.critical_logs * 24 * 60 * 60 * 1000
      );
      const criticalResult = await LogModel.deleteMany({
        timestamp: { $lt: criticalCutoff },
        status_code: { $gte: 500 },
      });
      totalDeleted += criticalResult.deletedCount || 0;

      logger.info(
        `Nettoyage base de données terminé: ${totalDeleted} enregistrements supprimés`
      );
      return { deleted: totalDeleted };
    } catch (error: any) {
      logger.error('Erreur nettoyage base de données:', error.message);
      return { deleted: 0, error: error.message };
    }
  }

  /**
   * Execute retention policy
   * @returns Execution summary
   */
  async executeRetentionPolicy(): Promise<RetentionSummary> {
    logger.info('Démarrage de la politique de rétention...');

    const results = await Promise.all([this.cleanupFiles(), this.cleanupDatabase()]);

    const summary: RetentionSummary = {
      files: results[0],
      database: results[1],
      executed_at: new Date().toISOString(),
    };

    logger.info('Politique de rétention terminée:', summary);
    return summary;
  }

  /**
   * Schedule retention policy execution
   */
  scheduleRetentionPolicy(): void {
    const schedule = configs.getValue('LOG_RETENTION_SCHEDULE', false) || '0 2 * * *'; // 2am daily
    if (configs.getValue('LOG_RETENTION_ENABLED', false) === 'true') {
      try {
        // Try to use node-cron if available
        const cron = require('node-cron');
        cron.schedule(schedule, () => {
          this.executeRetentionPolicy();
        });
        logger.info(`Politique de rétention programmée: ${schedule}`);
      } catch (error) {
        // Fallback to setInterval if node-cron not available
        setInterval(
          () => {
            this.executeRetentionPolicy();
          },
          24 * 60 * 60 * 1000
        ); // 24h
        logger.info('Politique de rétention programmée avec setInterval (24h)');
      }
    }
  }
}

export default new LogRetention();
