import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { Job } from 'bull';
import { configs } from '../../configs/app.config';
import templateConfig from '../../configs/template.config';
import QueueService from './queues/queue.service';
import logger from '../helpers/logger.helper';
import { EmailTemplateData } from '../../src/types';

/**
 * Mail sender information
 */
interface MailSender {
  name: string;
  email: string;
}

/**
 * Mail service result
 */
interface MailResult {
  error: boolean;
  message?: string;
}

/**
 * Mail job data structure
 */
interface MailJobData {
  type: 'mail';
  data: {
    receivers: string | string[];
    subject: string;
    content: string;
    html: EmailTemplateData | null;
    sender: MailSender | null;
    attachments: any[];
  };
}

/**
 * Mail service for sending emails via SMTP
 * Supports both direct sending and queue-based sending
 * Singleton pattern
 */
class MailService {
  private static instance: MailService;
  private isMailActive: boolean = false;
  private settings: any;
  private transport: Transporter | null = null;
  private userQueue: boolean;
  private templateConfig: typeof templateConfig;
  private queue: QueueService;

  constructor(userQueue: boolean, settings: any, templateCfg: typeof templateConfig) {
    if (MailService.instance) {
      return MailService.instance;
    }

    this.settings = settings;

    if (Object.keys(this.settings).length !== 0) {
      this.isMailActive = true;
    }

    this.userQueue = userQueue;
    this.templateConfig = templateCfg;
    this.queue = QueueService.getInstance('mailQueue');

    if (this.userQueue && this.isMailActive) {
      this.queue.getQueue().isReady().then(async () => {
        this.processQueue();
        await this.resumePendingJobs();
      });
    }

    MailService.instance = this;
  }

  /**
   * Get singleton instance
   * @param userQueue - Whether to use queue
   * @param settings - Mail settings
   * @param templateCfg - Template configuration
   * @returns MailService instance
   */
  static getInstance(
    userQueue: boolean = configs.use('queue'),
    settings: any = configs.getMailSettings(),
    templateCfg: typeof templateConfig = templateConfig
  ): MailService {
    if (!MailService.instance) {
      MailService.instance = new MailService(userQueue, settings, templateCfg);
    }
    return MailService.instance;
  }

  /**
   * Get or create nodemailer transporter
   * @returns Nodemailer transporter
   */
  private transporter(): Transporter {
    if (!this.transport) {
      this.transport = nodemailer.createTransport(this.settings);
    }
    return this.transport;
  }

  /**
   * Check if error is a connection error that should not be retried
   * @param error - Error object
   * @returns true if error is a permanent connection failure
   */
  private isConnectionError(error: any): boolean {
    const connectionErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'EHOSTUNREACH',
      'ENETUNREACH'
    ];
    return connectionErrors.some(code => error.code === code || error.message?.includes(code));
  }

  /**
   * Send mail using nodemailer
   * @param receivers - Email recipients
   * @param subject - Email subject
   * @param content - Email content or template path
   * @param html - Template data
   * @param sender - Sender information
   * @param attachments - Email attachments
   * @returns Mail result
   */
  private async mail(
    receivers: string | string[],
    subject: string,
    content: string,
    html: EmailTemplateData | null = null,
    sender: MailSender | null = null,
    attachments: any[] = []
  ): Promise<MailResult> {
    if (!this.isMailActive) {
      throw new Error('Please enable mail service in .env file');
    }

    try {
      const mailOptions: SendMailOptions = {
        from: `"${sender?.name}" <${sender?.email}>`,
        to: receivers,
        subject: subject,
      };

      if (html) {
        const template = await this.templateConfig.render(content, html);
        mailOptions.html = template;
      } else {
        mailOptions.text = content;
      }

      if (attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      await this.transporter().sendMail(mailOptions);
      return { error: false };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const errorCode = error.code || 'UNKNOWN';

      if (this.isConnectionError(error)) {
        logger.error(`❌ SMTP connection error [${errorCode}]:`, errorMessage);
      } else {
        logger.error(`❌ Mail sending error [${errorCode}]:`, errorMessage);
      }

      return { error: true, message: `${errorCode}: ${errorMessage}` };
    }
  }

  /**
   * Send email immediately
   * @param receivers - Email recipients
   * @param subject - Email subject
   * @param content - Email content or template path
   * @param html - Template data
   * @param sender - Sender information
   * @param attachments - Email attachments
   * @returns Mail result
   */
  send(
    receivers: string | string[],
    subject: string,
    content: string,
    html: EmailTemplateData | null = null,
    sender: MailSender | null = null,
    attachments: any[] = []
  ): Promise<MailResult> {
    const user =
      sender || {
        email: this.settings.senderEmail,
        name: this.settings.senderName,
      };
    return this.mail(receivers, subject, content, html, user, attachments);
  }

  /**
   * Send email via queue or immediately
   * @param receivers - Email recipients
   * @param subject - Email subject
   * @param content - Email content or template path
   * @param html - Template data
   * @param sender - Sender information
   * @param attachments - Email attachments
   * @returns Promise<Job> if queued, void otherwise
   */
  async sendWithQueue(
    receivers: string | string[],
    subject: string,
    content: string,
    html: EmailTemplateData | null = null,
    sender: MailSender | null = null,
    attachments: any[] = []
  ): Promise<Job | MailResult | void> {
    if (this.userQueue) {
      const job = await this.queue.add<MailJobData>({
        type: 'mail',
        data: { receivers, subject, content, html, sender, attachments },
      });
      logger.info(`📧 Mail job ${job.id} queued for: ${receivers}`);
      return job;
    } else {
      return this.send(receivers, subject, content, html, sender, attachments);
    }
  }

  /**
   * Resume pending jobs on server restart
   * @private
   */
  private async resumePendingJobs(): Promise<void> {
    try {
      const stats = await this.queue.getJobCounts();
      const totalPending = stats.waiting + stats.delayed + stats.active;

      if (totalPending > 0) {
        logger.info(`📬 Found ${totalPending} pending mail jobs (waiting: ${stats.waiting}, delayed: ${stats.delayed}, active: ${stats.active})`);
        logger.info('🔄 Queue processor will automatically process pending jobs');
      }

      // Check for stalled jobs and log them
      if (stats.active > 0) {
        const activeJobs = await this.queue.getQueue().getActive();
        logger.warn(`⚠️ Found ${activeJobs.length} active jobs from previous session. They will be marked as stalled and retried.`);
      }

      // Optionally log failed jobs
      if (stats.failed > 0) {
        logger.warn(`❌ Found ${stats.failed} failed mail jobs. Use mailService.getFailedJobs() to view them.`);
      }
    } catch (error: any) {
      logger.error('❌ Error checking pending jobs:', error.message);
    }
  }

  /**
   * Process mail queue jobs
   * @private
   */
  private processQueue(): void {

    this.queue.process<MailJobData>(async (job: Job<MailJobData>) => {
      logger.info(`📧 Processing mail job ${job.id} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3})`);
      const { type, data } = job.data;

      if (type === 'mail') {
        const { receivers, subject, content, html, sender, attachments } = data;

        logger.info(`📤 Sending mail to: ${receivers}`);

        const result = await this.send(receivers, subject, content, html, sender, attachments);

        if (result.error) {
          const isLastAttempt = (job.attemptsMade + 1) >= (job.opts.attempts || 3);
          const isConnError = result.message && this.isConnectionError({ message: result.message });

          if (isConnError) {
            if (isLastAttempt) {
              logger.error(`❌ SMTP server unreachable after ${job.attemptsMade + 1} attempts. Job ${job.id} marked as failed permanently.`);
              throw new Error(`SMTP_UNREACHABLE: ${result.message}`);
            } else {
              logger.warn(`⚠️ SMTP connection failed (attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3}). Will retry...`);
              throw new Error(result.message);
            }
          } else {
            logger.error(`❌ Mail sending error: ${result.message}`);
            throw new Error(result.message || 'Mail sending failed');
          }
        }

        logger.info(`✅ Mail sent successfully to: ${receivers}`);
        return result;
      } else {
        throw new Error(`Unknown job type: ${type}`);
      }
    });

    logger.info('📧 Mail queue processor started');
  }

  /**
   * Get queue statistics
   * @returns Queue stats or null if queue not enabled
   */
  async getQueueStats() {
    if (!this.userQueue) return null;
    return await this.queue.getJobCounts();
  }

  /**
   * Clean completed jobs older than specified time
   * @param olderThan - Time in milliseconds (default: 24h)
   * @returns Cleaned jobs or null
   */
  async cleanCompletedJobs(olderThan: number = 24 * 60 * 60 * 1000) {
    if (!this.userQueue) return null;
    return await this.queue.clean(olderThan, 'completed');
  }

  /**
   * Clean failed jobs older than specified time
   * @param olderThan - Time in milliseconds (default: 7 days)
   * @returns Cleaned jobs or null
   */
  async cleanFailedJobs(olderThan: number = 7 * 24 * 60 * 60 * 1000) {
    if (!this.userQueue) return null;
    return await this.queue.clean(olderThan, 'failed');
  }

  /**
   * Get failed mail jobs
   * @returns Array of failed jobs
   */
  async getFailedJobs() {
    if (!this.userQueue) return [];
    const failedJobs = await this.queue.getQueue().getFailed();
    return failedJobs.map(job => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    }));
  }

  /**
   * Retry a specific failed job by ID
   * @param jobId - Job ID to retry
   * @returns Job instance or null
   */
  async retryFailedJob(jobId: string | number) {
    if (!this.userQueue) return null;
    const job = await this.queue.getQueue().getJob(jobId);
    if (job) {
      await job.retry();
      logger.info(`🔄 Retrying mail job ${jobId}`);
      return job;
    }
    return null;
  }

  /**
   * Retry all failed jobs
   * @returns Number of jobs retried
   */
  async retryAllFailedJobs() {
    if (!this.userQueue) return 0;
    try {
      const failedJobs = await this.queue.getQueue().getFailed();
      let retriedCount = 0;

      for (const job of failedJobs) {
        try {
          await job.retry();
          retriedCount++;
          logger.info(`🔄 Retried mail job ${job.id}`);
        } catch (error: any) {
          logger.error(`❌ Failed to retry job ${job.id}:`, error.message);
        }
      }

      logger.info(`✅ Retried ${retriedCount} out of ${failedJobs.length} failed mail jobs`);
      return retriedCount;
    } catch (error: any) {
      logger.error('❌ Error retrying failed jobs:', error.message);
      return 0;
    }
  }

  /**
   * Remove a specific failed job by ID
   * @param jobId - Job ID to remove
   * @returns true if removed, false otherwise
   */
  async removeFailedJob(jobId: string | number) {
    if (!this.userQueue) return false;
    const job = await this.queue.getQueue().getJob(jobId);
    if (job) {
      await job.remove();
      logger.info(`🗑️ Removed mail job ${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * Shutdown mail service gracefully
   * @returns Promise<void>
   */
  async shutdown(): Promise<void> {
    if (this.userQueue && this.queue) {
      await this.queue.close();
      logger.info('📧 Mail service queue closed');
    }
    if (this.transport) {
      this.transport.close();
      logger.info('📧 Mail transporter closed');
    }
  }
}

const mailService = MailService.getInstance(
  configs.use('queue'),
  configs.getMailSettings(),
  templateConfig
);

process.on('SIGTERM', () => mailService.shutdown());
process.on('SIGINT', () => mailService.shutdown());

export default mailService;
