import { Request, Response, NextFunction } from 'express';
import BaseController from '../../../utils/bases/base.controller';
import mailService from '../../../utils/bases/mail.service';

/**
 * Mail Queue Controller
 * Handles mail queue management and monitoring
 */
class MailQueueController extends BaseController {

  private static instance: MailQueueController;

  private constructor() {
    if (MailQueueController.instance) {
      return MailQueueController.instance;
    }
    super();
    MailQueueController.instance = this;
  }

  /**
   * Get singleton instance
   * @returns MailQueueController instance
   */
  static getInstance(): MailQueueController {
    if (!MailQueueController.instance) {
      MailQueueController.instance = new MailQueueController();
    }
    return MailQueueController.instance;
  }

  async stats (_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await mailService.getQueueStats();

      if (!stats) {
        return super.success(res, 'Queue is not enabled');
      }

      super.success(res, 'Mail queue statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  };

  async failedJobs (_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const failedJobs = await mailService.getFailedJobs();
      return super.success(res, `Found ${failedJobs.length} failed mail jobs`, failedJobs);
    } catch (error) {
      next(error);
    }
  };

  async retryJob (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;

      const job = await mailService.retryFailedJob(jobId);

      if (!job) {
        return super.notFound(res, 'Job not found');
      }

      return super.success(res, `Job ${jobId} queued for retry`, { jobId: job.id });
    } catch (error) {
      next(error);
    }
  };

  async retryAllJobs (_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const retriedCount = await mailService.retryAllFailedJobs();
      return super.success(res, `Retried ${retriedCount} failed mail jobs`, { retriedCount });
    } catch (error) {
      next(error);
    }
  };

  async removeJob (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const { jobId } = req.params;
      const removed = await mailService.removeFailedJob(jobId);
      if (!removed) {
        return super.notFound(res, 'Job not found');
      }

      return super.success(res, `Job ${jobId} removed successfully`);
    } catch (error) {
      next(error);
    }
  };

  async cleanJobs (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { completed, failed } = req.body;

      const results: any = {};

      if (completed !== false) {
        const completedJobs = await mailService.cleanCompletedJobs();
        results.completed = completedJobs?.length || 0;
      }

      if (failed !== false) {
        const failedJobs = await mailService.cleanFailedJobs();
        results.failed = failedJobs?.length || 0;
      }

      super.success(res, 'Queue cleaned successfully', results);
    } catch (error) {
      next(error);
    }
  };
}

const mailQueueController = MailQueueController.getInstance();
export default mailQueueController;
