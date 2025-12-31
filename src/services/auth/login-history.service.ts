import BaseService from '../../../utils/bases/base.service';
import LoginHistory from '../../models/auth/login-history.model';
import { ILoginHistory, DeviceInfo, LocationInfo } from '../../types';
import logger from '../../../utils/helpers/logger.helper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResult<T> = T | any;

/**
 * Create login history data
 */
interface CreateLoginHistoryData {
  auth: string;
  user: string;
  ip: string;
  token: string;
  refresh_token: string;
  devices?: DeviceInfo;
  locations?: LocationInfo;
  user_agent?: string;
}

/**
 * Login History Service
 * Manages user login history with automatic TTL (90 days)
 */
class LoginHistoryService extends BaseService<ILoginHistory> {
  private static instance: LoginHistoryService;

  private constructor() {
    if (LoginHistoryService.instance) {
      return LoginHistoryService.instance;
    }
    super(LoginHistory);
    LoginHistoryService.instance = this;
  }

  /**
   * Get singleton instance
   * @returns LoginHistoryService instance
   */
  static getInstance(): LoginHistoryService {
    if (!LoginHistoryService.instance) {
      LoginHistoryService.instance = new LoginHistoryService();
    }
    return LoginHistoryService.instance;
  }

  /**
   * Create a new login history entry
   * @param data - Login history data
   * @returns Created login history or error
   */
  async createLoginHistory(data: CreateLoginHistoryData) {
    try {
      const loginHistory = await this.create({
        auth: data.auth,
        user: data.user,
        ip: data.ip,
        token: data.token,
        refresh_token: data.refresh_token,
        login_at: new Date(),
        devices: data.devices,
        locations: data.locations,
        user_agent: data.user_agent,
      } as any);

      if (loginHistory.error) {
        console.log("loginHistory: ", loginHistory);
        logger.error('Failed to create login history:', loginHistory.message);
        return { error: true, message: 'Failed to save login history' };
      }

      return { error: false, data: loginHistory.data };
    } catch (error: any) {
      logger.error('Error creating login history:', error.message);
      return { error: true, message: error.message };
    }
  }

  /**
   * Get login history for a user
   * @param userId - User ID
   * @param limit - Maximum number of records to return
   * @returns Login history entries
   */
  async getByUser(userId: string, limit: number = 10): Promise<QueryResult<ILoginHistory>> {
    return await this.find(
      { user: userId } as any,
      {
        sort: { login_at: -1 },
        limit,
        select: 'ip login_at locations devices user_agent',
      }
    );
  }

  /**
   * Get login history for an auth document
   * @param authId - Auth ID
   * @param limit - Maximum number of records to return
   * @returns Login history entries
   */
  async getByAuth(authId: string, limit: number = 10): Promise<QueryResult<ILoginHistory>> {
    return await this.find(
      { auth: authId } as any,
      {
        sort: { login_at: -1 },
        limit,
        select: 'ip login_at locations devices user_agent',
      }
    );
  }

  /**
   * Find login history by refresh token
   * @param refreshToken - Refresh token
   * @returns Login history entry or null
   */
  async findByRefreshToken(refreshToken: string): Promise<QueryResult<ILoginHistory>> {
    return await this.findOne(
      { refresh_token: refreshToken } as any,
      {
        select: 'auth user ip token refresh_token login_at devices locations',
      }
    );
  }

  /**
   * Update token in login history
   * @param refreshToken - Refresh token to find the entry
   * @param newToken - New access token
   * @returns Update result
   */
  async updateToken(refreshToken: string, newToken: string): Promise<QueryResult<ILoginHistory>> {
    try {
      const result = await this.update(
        { refresh_token: refreshToken } as any,
        { token: newToken } as any
      );

      if (result.error) {
        logger.error('Failed to update login history token:', result.message);
      }

      return result;
    } catch (error: any) {
      logger.error('Error updating login history token:', error.message);
      return { error: true, message: error.message };
    }
  }

  /**
   * Delete all login history for a user (logout from all devices)
   * @param userId - User ID
   * @returns Delete result
   */
  async deleteAllByUser(userId: string): Promise<QueryResult<ILoginHistory>> {
    try {
      const result = await this.deleteMany({ user: userId } as any);

      if (result.error) {
        logger.error('Failed to delete login history:', result.message);
      }

      return result;
    } catch (error: any) {
      logger.error('Error deleting login history:', error.message);
      return { error: true, message: error.message };
    }
  }

  /**
   * Delete specific login history by refresh token (single device logout)
   * @param refreshToken - Refresh token
   * @returns Delete result
   */
  async deleteByRefreshToken(refreshToken: string): Promise<QueryResult<ILoginHistory>> {
    try {
      const result = await this.delete({ refresh_token: refreshToken } as any);

      if (result.error) {
        logger.error('Failed to delete login history by token:', result.message);
      }

      return result;
    } catch (error: any) {
      logger.error('Error deleting login history by token:', error.message);
      return { error: true, message: error.message };
    }
  }

  /**
   * Get statistics about login history
   * @param userId - User ID
   * @returns Login statistics
   */
  async getLoginStats(userId: string) {
    try {
      const pipeline = [
        { $match: { user: userId } },
        {
          $group: {
            _id: null as null,
            total_logins: { $sum: 1 },
            unique_ips: { $addToSet: '$ip' },
            last_login: { $max: '$login_at' },
            first_login: { $min: '$login_at' },
          },
        },
        {
          $project: {
            _id: 0,
            total_logins: 1,
            unique_ip_count: { $size: '$unique_ips' },
            last_login: 1,
            first_login: 1,
          },
        },
      ];

      const result = await this.aggregate(pipeline as any);

      if (result.error || !result.data || result.data.length === 0) {
        return {
          error: false,
          data: {
            total_logins: 0,
            unique_ip_count: 0,
            last_login: null,
            first_login: null,
          },
        };
      }

      return { error: false, data: result.data[0] };
    } catch (error: any) {
      logger.error('Error getting login stats:', error.message);
      return { error: true, message: error.message };
    }
  }

  /**
   * Clean up old login history (manual cleanup, TTL handles automatic cleanup)
   * @param olderThanDays - Delete records older than this many days (default: 90)
   * @returns Delete result
   */
  async cleanup(olderThanDays: number = 90): Promise<QueryResult<ILoginHistory>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.deleteMany({
        login_at: { $lt: cutoffDate },
      } as any);

      logger.info(
        `Cleaned up ${result.deletedCount || 0} login history records older than ${olderThanDays} days`
      );

      return result;
    } catch (error: any) {
      logger.error('Error cleaning up login history:', error.message);
      return { error: true, message: error.message };
    }
  }
}

export default LoginHistoryService.getInstance();
