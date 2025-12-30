import BaseService from '../../../utils/bases/base.service';
import User from '../../models/auth/user.model';
import authService from '../auth/auth.service';
import loginHistoryService from '../auth/login-history.service';
import userService from '../app/user.service';
import { IUser, ServiceResponse, ServiceError } from '../../types';
import { Types } from 'mongoose';

/**
 * Enriched user data with auth information
 */
interface EnrichedUser {
  _id: Types.ObjectId;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  role: string | null;
  confirmed_at: Date | null;
  is_active: boolean;
  last_login: Date | null;
  active_sessions: number;
}

/**
 * User details with full auth and login history
 */
interface UserDetails extends Omit<EnrichedUser, 'last_login' | 'active_sessions'> {
  login_history: Array<{
    login_at: Date;
    ip: string;
    country: string;
    city: string;
    device: Record<string, any>;
  }>;
  password_changes_count: number;
  active_sessions: number;
}

/**
 * User creation data
 */
interface CreateUserData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  role?: string;
}

/**
 * User update data
 */
interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
}

/**
 * Advanced search filters
 */
interface AdvancedSearchFilters {
  query?: string;
  role?: string;
  status?: 'active' | 'inactive';
  date_from?: string | Date;
  date_to?: string | Date;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * User statistics
 */
interface UserStatistics {
  total_users: number;
  active_users: number;
  pending_users: number;
  deactivated_users: number;
  admin_users: number;
  new_users_this_week: number;
  logged_in_today: number;
  roles_distribution: Record<string, number>;
  growth_rate: string | number;
}

/**
 * Recent activity entry
 */
interface RecentActivity {
  user_id: Types.ObjectId;
  email: string;
  username: string;
  login_at: Date;
  ip: string;
  location: any;
  device: any;
}

/**
 * Pagination result for users
 */
interface UserPaginationResult {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  content: any[];
}

/**
 * Admin User Service
 * Manages administrative user operations with enriched data
 */
class AdminUserService extends BaseService<IUser> {
  private static instance: AdminUserService;

  private constructor() {
    if (AdminUserService.instance) {
      return AdminUserService.instance;
    }
    super(User);
    AdminUserService.instance = this;
  }

  /**
   * Get singleton instance
   * @returns AdminUserService instance
   */
  static getInstance(): AdminUserService {
    if (!AdminUserService.instance) {
      AdminUserService.instance = new AdminUserService();
    }
    return AdminUserService.instance;
  }

  /**
   * Enrich user data with authentication information
   * @param user - User document
   * @returns Enriched user data
   */
  async enrichUserWithAuth(user: IUser): Promise<EnrichedUser> {
    const authData = await authService.findOne(
      { user: user._id } as any,
      { select: 'role, confirmed_at, login_history' }
    );

    // Get login history from separate collection
    const loginHistory = await loginHistoryService.getByUser(user._id.toString(), 1);
    const lastLogin = !loginHistory.error && loginHistory.data && loginHistory.data.length > 0
      ? loginHistory.data[0].login_at
      : null;

    // Get session count
    const activeSessions = await loginHistoryService.count({ user: user._id } as any);

    return {
      ...user.toObject(),
      role: authData.data?.role || null,
      confirmed_at: authData.data?.confirmed_at || null,
      is_active: authData.data?.confirmed_at !== null,
      last_login: lastLogin,
      active_sessions: activeSessions,
    };
  }

  /**
   * Enrich multiple users with their authentication data
   * @param users - Array of user documents
   * @returns Enriched users array
   */
  async enrichUsersWithAuth(users: IUser[]): Promise<EnrichedUser[]> {
    return await Promise.all(users.map((user) => this.enrichUserWithAuth(user)));
  }

  /**
   * Get user with detailed information
   * @param userId - User ID
   * @returns User details with auth and login history
   */
  async getUserWithDetails(userId: string): Promise<ServiceResponse<UserDetails>> {
    const user = await userService.findOne(
      { _id: userId, deleted_at: null } as any,
      { select: 'first_name, last_name, username, email, created_at, updated_at' }
    );

    if (user.error || !user.data) {
      return { error: true, message: 'User not found' };
    }

    const authData = await authService.findOne(
      { user: userId } as any,
      { select: 'role, confirmed_at, passwords' }
    );

    // Get login history from separate collection
    const loginHistoryResult = await loginHistoryService.getByUser(userId, 50); // Get last 50 logins
    const loginHistory = !loginHistoryResult.error && loginHistoryResult.data
      ? loginHistoryResult.data.map((entry: any) => ({
          login_at: entry.login_at,
          ip: entry.ip || 'Unknown',
          country: entry.locations?.country || 'Unknown',
          city: entry.locations?.city || 'Unknown',
          device: entry.devices || {},
        }))
      : [];

    // Get active sessions count
    const activeSessions = await loginHistoryService.count({ user: userId } as any);

    const userData: UserDetails = {
      ...user.data.toObject(),
      role: authData.data?.role || null,
      confirmed_at: authData.data?.confirmed_at || null,
      is_active: authData.data?.confirmed_at !== null,
      login_history: loginHistory,
      password_changes_count: authData.data?.passwords?.length || 0,
      active_sessions: activeSessions,
    };

    return { error: false, data: userData };
  }

  /**
   * List users with pagination and filters
   * @param filters - Query filters
   * @param page - Page number
   * @param limit - Items per page
   * @param sort - Sort order
   * @returns Paginated user list
   */
  async listUsersWithFilters(
    filters: any,
    page: number,
    limit: number,
    sort: string = '-created_at'
  ): Promise<ServiceResponse<any>> {
    const users = await userService.findWithPaginate(filters, page, limit, {
      sort,
      select: '-password, -__v, -deleted_at',
    });

    if (users.error || !users.data) {
      return users;
    }

    const enrichedUsers = await this.enrichUsersWithAuth(users.data.content);

    return {
      error: false,
      data: {
        ...users.data,
        content: enrichedUsers,
      },
    };
  }

  /**
   * Filter users by status
   * @param users - Users array
   * @param status - Status filter (active/inactive)
   * @returns Filtered users
   */
  filterUsersByStatus(users: EnrichedUser[], status?: string): EnrichedUser[] {
    if (!status) return users;

    if (status === 'active') {
      return users.filter((user) => user.is_active);
    } else if (status === 'inactive') {
      return users.filter((user) => !user.is_active);
    }

    return users;
  }

  /**
   * Filter users by role
   * @param users - Users array
   * @param role - Role filter
   * @returns Filtered users
   */
  filterUsersByRole(users: EnrichedUser[], role?: string): EnrichedUser[] {
    if (!role) return users;
    return users.filter((user) => user.role === role.toUpperCase());
  }

  /**
   * Create a new user with authentication
   * @param userData - User creation data
   * @returns Created user data
   */
  async createUserWithAuth(userData: CreateUserData): Promise<ServiceResponse<any>> {
    const { first_name, last_name, username, email, password, role = 'USER' } = userData;

    // Check existence
    const existingUser = await userService.findOne({
      $or: [{ email }, { username }],
      deleted_at: null,
    } as any);

    if (!existingUser.error && existingUser.data) {
      return { error: true, message: 'Email or username already exists' };
    }

    // Hash password
    const hashedPassword = await authService.hash(password);
    if (!hashedPassword) {
      return { error: true, message: 'Failed to process password' };
    }

    // Create user
    const newUser = await userService.create({
      first_name,
      last_name,
      username,
      email,
      password: hashedPassword,
    } as any);

    if (newUser.error) {
      return newUser;
    }

    // Create authentication
    await authService.create({
      user: newUser.data!._id,
      passwords: [hashedPassword],
      role: role.toUpperCase(),
      confirmed_at: new Date(),
    } as any);

    return {
      error: false,
      data: {
        id: newUser.data!._id,
        email: newUser.data!.email,
        role,
        password, // Return for email
      },
    };
  }

  /**
   * Update user with safety checks
   * @param userId - User ID
   * @param updateData - Update data
   * @returns Update result
   */
  async updateUserSafely(
    userId: string,
    updateData: UpdateUserData
  ): Promise<ServiceResponse<any>> {
    const { username, email } = updateData;

    // Check username
    if (username) {
      const existingUser = await userService.findOne({
        username,
        _id: { $ne: userId },
        deleted_at: null,
      } as any);
      if (!existingUser.error && existingUser.data) {
        return { error: true, message: 'Username already taken' };
      }
    }

    // Check email
    if (email) {
      const existingEmail = await userService.findOne({
        email,
        _id: { $ne: userId },
        deleted_at: null,
      } as any);
      if (!existingEmail.error && existingEmail.data) {
        return { error: true, message: 'Email already taken' };
      }
    }

    // Clean data
    const cleanData: any = {};
    if (updateData.first_name !== undefined) cleanData.first_name = updateData.first_name;
    if (updateData.last_name !== undefined) cleanData.last_name = updateData.last_name;
    if (username !== undefined) cleanData.username = username;
    if (email !== undefined) cleanData.email = email;

    if (Object.keys(cleanData).length === 0) {
      return { error: true, message: 'No data provided for update' };
    }

    return await userService.update({ _id: userId } as any, cleanData);
  }

  /**
   * Reset user password
   * @param userId - User ID
   * @param newPassword - New password
   * @returns Reset result
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<ServiceResponse<null>> {
    const hashedPassword = await authService.hash(newPassword);
    if (!hashedPassword) {
      return { error: true, message: 'Failed to process new password' };
    }

    // Update password
    await userService.update({ _id: userId } as any, { password: hashedPassword } as any);

    // Update history and disconnect
    await authService.update(
      { user: userId } as any,
      {
        $push: { passwords: hashedPassword },
        login_history: [],
      } as any
    );

    return { error: false, data: null };
  }

  /**
   * Deactivate user with safety checks
   * @param userId - User ID to deactivate
   * @param adminId - Admin ID performing the action
   * @returns Deactivation result
   */
  async deactivateUserSafely(
    userId: string,
    adminId: string
  ): Promise<ServiceResponse<IUser> | ServiceError> {
    if (userId === adminId) {
      return { error: true, message: 'Cannot deactivate your own account', statusCode: 403 };
    }

    const user = await userService.findOne({ _id: userId, deleted_at: null } as any);
    if (user.error || !user.data) {
      return { error: true, message: 'User not found', statusCode: 404 };
    }

    const result = await userService.softDelete({ _id: userId } as any);
    if (result.error) {
      return result;
    }

    // Disconnect all sessions
    await authService.update({ user: userId } as any, { login_history: [] } as any);

    return { error: false, data: user.data };
  }

  /**
   * Get user statistics
   * @returns User statistics
   */
  async getUserStatistics(): Promise<ServiceResponse<UserStatistics>> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      deactivatedUsers,
      activeUsers,
      pendingUsers,
      adminUsers,
      newUsersThisWeek,
      loggedInToday,
      roleStats,
    ] = await Promise.all([
      userService.count({ deleted_at: null } as any),
      userService.count({ deleted_at: { $ne: null } } as any),
      authService.count({ confirmed_at: { $ne: null } } as any),
      authService.count({ confirmed_at: null } as any),
      authService.count({ role: 'ADMIN' } as any),
      userService.count({ created_at: { $gte: oneWeekAgo }, deleted_at: null } as any),
      authService.count({ 'login_history.login_at': { $gte: today } } as any),
      authService.getModel().aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    return {
      error: false,
      data: {
        total_users: totalUsers,
        active_users: activeUsers,
        pending_users: pendingUsers,
        deactivated_users: deactivatedUsers,
        admin_users: adminUsers,
        new_users_this_week: newUsersThisWeek,
        logged_in_today: loggedInToday,
        roles_distribution: roleStats.reduce(
          (acc: Record<string, number>, role: any) => {
            acc[role._id || 'undefined'] = role.count;
            return acc;
          },
          {}
        ),
        growth_rate: totalUsers > 0 ? ((newUsersThisWeek / totalUsers) * 100).toFixed(2) : 0,
      },
    };
  }

  /**
   * Advanced user search with filters and pagination
   * @param filters - Search filters
   * @returns Paginated search results
   */
  async advancedSearch(
    filters: AdvancedSearchFilters
  ): Promise<ServiceResponse<UserPaginationResult>> {
    const {
      query,
      role,
      status,
      date_from,
      date_to,
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = filters;

    const pipeline: any[] = [];

    // Join with auth
    pipeline.push({
      $lookup: {
        from: 'auths',
        localField: '_id',
        foreignField: 'user',
        as: 'auth',
      },
    });

    pipeline.push({ $unwind: { path: '$auth', preserveNullAndEmptyArrays: true } });

    // Filters
    const matchFilters: any = { deleted_at: null };

    if (query) {
      matchFilters.$or = [
        { first_name: new RegExp(query, 'i') },
        { last_name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { username: new RegExp(query, 'i') },
      ];
    }

    if (role) {
      matchFilters['auth.role'] = role.toUpperCase();
    }

    if (status === 'active') {
      matchFilters['auth.confirmed_at'] = { $ne: null };
    } else if (status === 'inactive') {
      matchFilters['auth.confirmed_at'] = null;
    }

    if (date_from || date_to) {
      matchFilters.created_at = {};
      if (date_from) matchFilters.created_at.$gte = new Date(date_from);
      if (date_to) matchFilters.created_at.$lte = new Date(date_to);
    }

    pipeline.push({ $match: matchFilters });

    // Projection
    pipeline.push({
      $project: {
        first_name: 1,
        last_name: 1,
        username: 1,
        email: 1,
        created_at: 1,
        role: '$auth.role',
        confirmed_at: '$auth.confirmed_at',
        is_active: { $ne: ['$auth.confirmed_at', null] },
        active_sessions: { $size: { $ifNull: ['$auth.login_history', []] } },
        last_login: { $arrayElemAt: ['$auth.login_history.login_at', -1] },
      },
    });

    // Sort
    const sortField = sort_by || 'created_at';
    const sortDirection = sort_order === 'asc' ? 1 : -1;
    pipeline.push({ $sort: { [sortField]: sortDirection } });

    // Pagination
    const skip = (page - 1) * limit;

    const results = await userService.getModel().aggregate([
      ...pipeline,
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: parseInt(limit.toString()) }],
          count: [{ $count: 'total' }],
        },
      },
    ]);

    const users = results[0].data;
    const total = results[0].count[0]?.total || 0;

    return {
      error: false,
      data: {
        pagination: {
          total,
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          totalPages: Math.ceil(total / limit),
        },
        content: users,
      },
    };
  }

  /**
   * Get recent user activity
   * @param limit - Number of activities to return
   * @returns Recent login activities
   */
  async getRecentActivity(limit: number = 20): Promise<ServiceResponse<RecentActivity[]>> {
    const recentLogins = await authService.getModel().aggregate([
      { $unwind: '$login_history' },
      { $sort: { 'login_history.login_at': -1 } },
      { $limit: parseInt(limit.toString()) },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user_info',
        },
      },
      { $unwind: '$user_info' },
      {
        $project: {
          user_id: '$user',
          email: '$user_info.email',
          username: '$user_info.username',
          login_at: '$login_history.login_at',
          ip: '$login_history.ip',
          location: '$login_history.locations',
          device: '$login_history.devices',
        },
      },
    ]);

    return { error: false, data: recentLogins };
  }

  /**
   * Convert data to CSV format
   * @param data - Array of objects to convert
   * @returns CSV string
   */
  convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        return `"${value !== null && value !== undefined ? value : ''}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

export default AdminUserService.getInstance();
