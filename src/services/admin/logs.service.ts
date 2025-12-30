import BaseService from '../../../utils/bases/base.service';
import Log from '../../models/log.model';
import { ILog, ServiceResponse } from '../../types';
import { FilterQuery, PipelineStage } from 'mongoose';

/**
 * Log statistics result
 */
interface LogStatistics {
  total_requests: number;
  avg_response_time: number;
  total_errors: number;
  error_rate: number;
  methods_count: Record<string, number>;
}

/**
 * Top endpoint information
 */
interface TopEndpoint {
  endpoint: string;
  count: number;
  avg_response_time: number;
  error_rate: number;
}

/**
 * Logs Service
 * Manages application logs with analytics capabilities
 */
class LogsService extends BaseService<ILog> {
  private static instance: LogsService;

  private constructor() {
    if (LogsService.instance) {
      return LogsService.instance;
    }
    super(Log);
    LogsService.instance = this;
  }

  /**
   * Get singleton instance
   * @returns LogsService instance
   */
  static getInstance(): LogsService {
    if (!LogsService.instance) {
      LogsService.instance = new LogsService();
    }
    return LogsService.instance;
  }

  /**
   * Get log statistics with aggregation
   * @param filters - MongoDB filters
   * @returns Statistics data
   */
  async getStatistics(filters: FilterQuery<ILog> = {}): Promise<ServiceResponse<LogStatistics>> {
    try {
      const pipeline = [
        { $match: filters },
        {
          $group: {
            _id: null,
            total_requests: { $sum: 1 },
            avg_response_time: { $avg: '$execution_time' },
            total_errors: {
              $sum: { $cond: [{ $gte: ['$status_code', 400] }, 1, 0] },
            },
            methods: { $push: '$method' },
            status_codes: { $push: '$status_code' },
            actions: { $push: '$action' },
            entities: { $push: '$entity' },
          },
        },
        {
          $project: {
            total_requests: 1,
            avg_response_time: { $round: ['$avg_response_time', 2] },
            total_errors: 1,
            error_rate: {
              $round: [
                { $multiply: [{ $divide: ['$total_errors', '$total_requests'] }, 100] },
                2,
              ],
            },
            methods_count: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: ['$methods'] },
                  as: 'method',
                  in: {
                    k: '$$method',
                    v: {
                      $size: {
                        $filter: {
                          input: '$methods',
                          cond: { $eq: ['$$this', '$$method'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ];

      const result = await this.model.aggregate(pipeline);
      return {
        error: false,
        data: result[0] || ({} as LogStatistics),
      };
    } catch (error: any) {
      return {
        error: true,
        message: error.message,
      };
    }
  }

  /**
   * Get top endpoints by request count
   * @param limit - Number of endpoints to return
   * @param filters - MongoDB filters
   * @returns Top endpoints data
   */
  async getTopEndpoints(
    limit: number = 10,
    filters: FilterQuery<ILog> = {}
  ): Promise<ServiceResponse<TopEndpoint[]>> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: filters },
        {
          $group: {
            _id: { url: '$url', method: '$method' },
            count: { $sum: 1 },
            avg_response_time: { $avg: '$execution_time' },
            error_count: {
              $sum: { $cond: [{ $gte: ['$status_code', 400] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            endpoint: { $concat: ['$_id.method', ' ', '$_id.url'] },
            count: 1,
            avg_response_time: { $round: ['$avg_response_time', 2] },
            error_rate: {
              $round: [{ $multiply: [{ $divide: ['$error_count', '$count'] }, 100] }, 2],
            },
          },
        },
        { $sort: { count: -1 as const } },
        { $limit: limit },
      ];

      const result = await this.model.aggregate(pipeline);
      return {
        error: false,
        data: result as TopEndpoint[],
      };
    } catch (error: any) {
      return {
        error: true,
        message: error.message,
      };
    }
  }

  /**
   * Get error logs
   * @param limit - Number of logs to return
   * @param filters - Additional filters
   * @returns Error logs
   */
  async getErrorLogs(
    limit: number = 50,
    filters: FilterQuery<ILog> = {}
  ): Promise<ServiceResponse<ILog[]>> {
    const errorFilters: FilterQuery<ILog> = {
      ...filters,
      status_code: { $gte: 400 },
    };

    return await this.find(errorFilters, {
      select: 'timestamp, method, url, status_code, error, user, ip, execution_time',
      populate: { path: 'user', select: 'email name' },
      limit,
    });
  }

  /**
   * Get user activity logs
   * @param userId - User ID
   * @param limit - Number of logs to return
   * @returns User activity logs
   */
  async getUserActivity(userId: string, limit: number = 20): Promise<ServiceResponse<ILog[]>> {
    return await this.find(
      { user: userId as any },
      { select: 'timestamp, method, url, status_code, action, entity, execution_time', limit }
    );
  }
}

export default LogsService.getInstance();
