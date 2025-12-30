import { Request, Response, NextFunction } from 'express';
import BaseController from '../../../utils/bases/base.controller';
import logsService from '../../services/admin/logs.service';
import { logsInterceptor } from '../../../utils/interceptors/logs.interceptor';
import QueueService from '../../../utils/bases/queues/queue.service';

/**
 * Log Controller
 * Handles log management and queue monitoring
 */
class LogController extends BaseController {
  private static instance: LogController;

  private constructor() {
    if (LogController.instance) {
      return LogController.instance;
    }
    super();
    LogController.instance = this;
  }

  /**
   * Get singleton instance
   * @returns LogController instance
   */
  static getInstance(): LogController {
    if (!LogController.instance) {
      LogController.instance = new LogController();
    }
    return LogController.instance;
  }

  /**
   * Get queue statistics
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async queue(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { service } = req.params;

      const availableQueues: Record<string, string> = {
        mail: 'mailQueue',
        upload: 'uploadQueue',
        // ...
      };

      if (!service || !(service in availableQueues)) {
        return super.failed(res, `Unknown queue service: ${service}`);
      }

      if (service === 'all') {
        const results: Record<string, any> = {};
        const errors: Record<string, string> = {};

        await Promise.all(
          Object.entries(availableQueues).map(async ([key, queueName]) => {
            try {
              const stats = await QueueService.getInstance(queueName).getStats();
              results[key] = stats;
            } catch (err: any) {
              errors[key] = err.message || err.toString();
            }
          })
        );

        return super.success(res, 'Statuts de toutes les queues', {
          results,
          errors: Object.keys(errors).length ? errors : undefined,
        });
      }

      try {
        const queueName = availableQueues[service];
        const stats = await QueueService.getInstance(queueName).getStats();
        return super.success(res, `Status queue for ${service}`, stats);
      } catch (err: any) {
        return super.failed(
          res,
          `Error obtaining queue status: ${service}`,
          err.message || err.toString()
        );
      }
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Get all logs with filters and pagination
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async all(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        start_date,
        end_date,
        status_code,
        method,
        action,
        entity,
        user,
        ip,
        ...otherFilters
      } = req.query;

      // Build filters
      const filters: any = { ...otherFilters };

      if (start_date || end_date) {
        filters.timestamp = {};
        if (start_date) filters.timestamp.$gte = new Date(start_date as string);
        if (end_date) filters.timestamp.$lte = new Date(end_date as string);
      }

      if (status_code) filters.status_code = parseInt(status_code as string);
      if (method) filters.method = (method as string).toUpperCase();
      if (action) filters.action = action;
      if (entity) filters.entity = entity;
      if (user) filters.user = user;
      if (ip) filters.ip = ip;

      const logs = await logsService.findWithPaginate(filters, Number(page), Number(limit), {
        path: 'user',
        select: 'email name',
      });

      if (logs.error) {
        return super.failed(res, 'Error fetching logs', logs.message);
      }

      return super.success(res, 'Logs retrieved successfully', logs.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Get log statistics
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async statistics(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { start_date, end_date } = req.query;

      const filters: any = {};
      if (start_date || end_date) {
        filters.timestamp = {};
        if (start_date) filters.timestamp.$gte = new Date(start_date as string);
        if (end_date) filters.timestamp.$lte = new Date(end_date as string);
      }

      const stats = await logsService.getStatistics(filters);
      const topEndpoints = await logsService.getTopEndpoints(10, filters);
      const systemStats = await logsInterceptor.getStats();

      if (stats.error || topEndpoints.error) {
        return super.failed(res, 'Error getting statistics');
      }

      return super.success(res, 'Statistics retrieved successfully', {
        general: stats.data,
        top_endpoints: topEndpoints.data,
        system: systemStats,
      });
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Get error logs
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async errors(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 50, start_date, end_date } = req.query;

      const filters: any = {};
      if (start_date || end_date) {
        filters.timestamp = {};
        if (start_date) filters.timestamp.$gte = new Date(start_date as string);
        if (end_date) filters.timestamp.$lte = new Date(end_date as string);
      }

      const errorLogs = await logsService.findWithPaginate(
        { ...filters, status_code: { $gte: 400 } },
        Number(page),
        Number(limit),
        { path: 'user', select: 'email name' }
      );

      if (errorLogs.error) {
        return super.failed(res, 'Error fetching error logs');
      }

      return super.success(res, 'Error logs retrieved successfully', errorLogs.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Find log by ID
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async findById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const log = await logsService.findOne({ $or: [{ _id: id }, { id: id }] } as any, {
        populate: { path: 'user', select: 'email name' },
      });

      if (log.error || !log.data) {
        return super.notFound(res, 'Log not found');
      }

      return super.success(res, 'Log retrieved successfully', log.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Get user activity logs
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async userActivity(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const activity = await logsService.paginate(
        { user: userId } as any,
        Number(page),
        Number(limit)
      );

      if (activity.error) {
        return super.failed(res, 'Error fetching user activity');
      }

      return super.success(res, 'User activity retrieved successfully', activity.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Cleanup old logs
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async cleanup(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { days = 30 } = req.body;

      const deletedCount = await logsInterceptor.cleanup(parseInt(days.toString()));

      return super.success(res, `Cleanup completed, ${deletedCount} files removed`);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }
}

export default LogController.getInstance();
