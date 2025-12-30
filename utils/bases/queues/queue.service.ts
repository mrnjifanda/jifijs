import Queue, { Job, JobOptions, Queue as BullQueue, JobCounts } from 'bull';
import { configs } from '../../../configs/app.config';
import logger from '../../helpers/logger.helper';

/**
 * Queue statistics interface
 */
interface QueueStats {
  name: string;
  isActive: boolean;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  error?: string;
}


/**
 * Queue service for managing Bull queues with Redis
 * Implements singleton pattern for queue instances
 */
class QueueService {
  private static instances: Record<string, QueueService> = {};
  private queue: BullQueue;
  private name: string;

  /**
   * @param name - Queue name
   */
  constructor(name: string) {
    if (name in QueueService.instances) {
      return QueueService.instances[name];
    }

    this.name = name;
    this._initializeQueue();
    this._setupEventHandlers();

    QueueService.instances[name] = this;
  }

  /**
   * Get or create queue instance
   * @param name - Queue name
   * @returns QueueService instance
   */
  static getInstance(name: string): QueueService {
    if (!(name in QueueService.instances)) {
      QueueService.instances[name] = new QueueService(name);
    }
    return QueueService.instances[name];
  }

  /**
   * Initializes the Bull queue with Redis configuration
   * @private
   */
  private _initializeQueue(): void {
    const { base_name, retryDelayOnFailover, ...queueConfig } = configs.getRedis();

    this.queue = new Queue(`${base_name}_${this.name}`, {
      redis: {
        host: queueConfig.host as string,
        port: Number(queueConfig.port),
        password: queueConfig.password,
        connectTimeout: queueConfig.connectTimeout,
        family: queueConfig.family,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 60000,
      },
      settings: {
        lockDuration: 30000,
        stalledInterval: 30000,
        maxStalledCount: 1
      },
    });
  }

  /**
   * Sets up event handlers for the queue
   * @private
   */
  private _setupEventHandlers(): void {
    this.queue.on('error', (error: Error) => {
      logger.error(`❌ Bull Queue ${this.name} error:`, error.message);
    });

    this.queue.on('waiting', (jobId: string | number) => {
      logger.warn(`⏳ Job ${jobId} is waiting in queue ${this.name}`);
    });

    this.queue.on('active', (job: Job) => {
      logger.info(`🔄 Job ${job.id} started in queue ${this.name} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3})`);
    });

    this.queue.on('completed', (job: Job) => {
      logger.info(`✅ Job ${job.id} completed in queue ${this.name}`);
    });

    this.queue.on('failed', (job: Job, err: Error) => {
      const attemptsExhausted = job.attemptsMade >= (job.opts.attempts || 3);
      if (attemptsExhausted) {
        logger.error(`❌ Job ${job.id} PERMANENTLY FAILED in queue ${this.name} after ${job.attemptsMade} attempts:`, err.message);
      } else {
        logger.warn(`⚠️ Job ${job.id} failed in queue ${this.name} (will retry):`, err.message);
      }
    });

    this.queue.on('stalled', (job: Job) => {
      logger.warn(`⏸️ Job ${job.id} stalled in queue ${this.name}. Job will be reprocessed.`);
    });

    this.queue.on('removed', (job: Job) => {
      logger.info(`🗑️ Job ${job.id} removed from queue ${this.name}`);
    });
  }

  /**
   * Add job to queue
   * @param data - Job data
   * @param options - Job options
   * @returns Promise resolving to Job
   */
  add<T = any>(data: T, options: JobOptions = {}): Promise<Job<T>> {
    const jobOptions: JobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
      ...options,
    };

    return this.queue.add(data, jobOptions);
  }

  /**
   * Get Bull queue instance
   * @returns Bull Queue instance
   */
  getQueue(): BullQueue {
    return this.queue;
  }

  /**
   * Sets up job processor for the queue
   * @param processor - Job processing function
   * @returns Result from Bull queue process method
   */
  process<T = any>(processor: (job: Job<T>) => Promise<any>): void {
    this.queue.process(processor);
  }

  /**
   * Closes the queue connection gracefully
   * @returns Promise<void>
   */
  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      logger.info(`🔌 Queue ${this.name} closed`);
    }
  }

  /**
   * Cleans completed or failed jobs
   * @param grace - Grace period in milliseconds
   * @param status - Job status to clean ('completed', 'failed', 'active', etc.)
   * @returns Array of cleaned job IDs
   */
  async clean(grace: number = 0, status: string = 'completed'): Promise<Job[]> {
    return await this.queue.clean(grace, status as any);
  }

  /**
   * Gets job counts by status
   * @returns Object with job counts by status
   */
  async getJobCounts(): Promise<JobCounts> {
    return await this.queue.getJobCounts();
  }

  /**
   * Gets queue statistics
   * @returns Queue statistics
   */
  async getStats(): Promise<QueueStats> {
    try {
      const counts = await this.getJobCounts();
      return {
        name: this.name,
        ...counts,
        isActive: Boolean(this.queue),
      };
    } catch (error: any) {
      logger.error(`❌ Failed to get stats for queue ${this.name}:`, error.message);
      return {
        name: this.name,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        isActive: false,
        error: error.message,
      };
    }
  }

  /**
   * Closes all queue instances
   * @static
   * @returns Promise<void>
   */
  static async closeAll(): Promise<void> {
    logger.info('🛑 Closing all queue instances...');

    const closePromises = Object.values(QueueService.instances).map((instance) =>
      instance.close()
    );

    await Promise.all(closePromises);
    QueueService.instances = {};
  }
}

const handleShutdown = (signal: string) => {
  logger.info(`🛑 ${signal} received, closing all queues...`);
  QueueService.closeAll()
    .then(() => {
      if (signal === 'SIGINT') {
        process.exit(0);
      }
    })
    .catch((error: Error) => {
      logger.error('❌ Error during queue shutdown:', error.message);
      process.exit(1);
    });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default QueueService;
