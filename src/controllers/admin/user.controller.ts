import { Request, Response, NextFunction } from 'express';
import BaseController from '../../../utils/bases/base.controller';
import adminUserService from '../../services/admin/admin-user.service';
import userService from '../../services/app/user.service';
import authService from '../../services/auth/auth.service';

/**
 * Admin User Controller
 * Handles administrative user management endpoints
 */
class AdminUserController extends BaseController {
  private static instance: AdminUserController;

  private constructor() {
    if (AdminUserController.instance) {
      return AdminUserController.instance;
    }
    super();
    AdminUserController.instance = this;
  }

  /**
   * Get singleton instance
   * @returns AdminUserController instance
   */
  static getInstance(): AdminUserController {
    if (!AdminUserController.instance) {
      AdminUserController.instance = new AdminUserController();
    }
    return AdminUserController.instance;
  }

  /**
   * Get all users with filters
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getAllUsers(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status, role, sort = '-created_at' } = req.query;

      const filters: any = { deleted_at: null };

      if (search) {
        filters.$or = [
          { first_name: new RegExp(search as string, 'i') },
          { last_name: new RegExp(search as string, 'i') },
          { email: new RegExp(search as string, 'i') },
          { username: new RegExp(search as string, 'i') },
        ];
      }

      const result = await adminUserService.listUsersWithFilters(
        filters,
        Number(page),
        Number(limit),
        sort as string
      );

      if (result.error) {
        return super.failed(res, 'Failed to retrieve users');
      }

      let filteredUsers = result.data.content;
      filteredUsers = adminUserService.filterUsersByStatus(filteredUsers, status as string);
      filteredUsers = adminUserService.filterUsersByRole(filteredUsers, role as string);

      return super.success(res, 'Users retrieved successfully', {
        ...result.data,
        content: filteredUsers,
      });
    } catch (error: any) {
      return super.failed(res, 'Failed to retrieve users');
    }
  }

  /**
   * Get user by ID with details
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getUserById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await adminUserService.getUserWithDetails(id);

      if (result.error) {
        return super.failed(res, result.message!, null, (result as any).statusCode || 404);
      }

      return super.success(res, 'User retrieved successfully', result.data);
    } catch (error: any) {
      return super.failed(res, 'Failed to retrieve user');
    }
  }

  /**
   * Create a new user
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async createUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const result = await adminUserService.createUserWithAuth(req.body);

      if (result.error) {
        return super.failed(res, result.message!);
      }

      authService
        .mail()
        .sendWithQueue(
          req.body.email,
          'Account Created by Administrator',
          'auth/admin-created-account',
          {
            user: { email: req.body.email, first_name: req.body.first_name },
            temporary_password: result.data.password,
            role: result.data.role,
          }
        );

      return super.success(
        res,
        'User created successfully',
        {
          id: result.data.id,
          email: result.data.email,
          role: result.data.role,
        },
        201
      );
    } catch (error: any) {
      return super.failed(res, 'Failed to create user');
    }
  }

  /**
   * Update user information
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async updateUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await adminUserService.updateUserSafely(id, req.body);

      if (result.error) {
        return super.failed(res, result.message!);
      }

      return super.success(res, 'User updated successfully');
    } catch (error: any) {
      return super.failed(res, 'Failed to update user');
    }
  }

  /**
   * Update user role
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async updateUserRole(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = super.getAuth(req, '_id');

      const user = await userService.findOne({ _id: id, deleted_at: null } as any);
      if (user.error || !user.data) {
        return super.failed(res, 'User not found', null, 404);
      }

      if (id === adminId) {
        return super.failed(res, 'Cannot modify your own role', null, 403);
      }

      const result = await authService.update({ user: id } as any, {
        role: role.toUpperCase(),
      } as any);

      if (result.error) {
        return super.failed(res, 'Failed to update user role');
      }

      authService
        .mail()
        .sendWithQueue(user.data.email, 'Account Role Updated', 'auth/role-updated', {
          user: user.data,
          new_role: role,
        });

      return super.success(res, `User role updated to ${role} successfully`);
    } catch (error: any) {
      return super.failed(res, 'Failed to update user role');
    }
  }

  /**
   * Reset user password
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async resetUserPassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      const user = await userService.findOne({ _id: id, deleted_at: null } as any);
      if (user.error || !user.data) {
        return super.failed(res, 'User not found', null, 404);
      }

      const result = await adminUserService.resetUserPassword(id, new_password);
      if (result.error) {
        return super.failed(res, result.message!);
      }

      authService
        .mail()
        .sendWithQueue(
          user.data.email,
          'Password Reset by Administrator',
          'auth/admin-password-reset',
          { user: user.data, temporary_password: new_password }
        );

      return super.success(res, 'User password reset successfully');
    } catch (error: any) {
      return super.failed(res, 'Failed to reset user password');
    }
  }

  /**
   * Deactivate a user
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async deactivateUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = super.getAuth(req, '_id');

      const result = await adminUserService.deactivateUserSafely(id, adminId);

      if (result.error) {
        return super.failed(res, result.message!, null, (result as any).statusCode);
      }

      authService
        .mail()
        .sendWithQueue(result.data!.email, 'Account Deactivated', 'auth/account-deactivated', {
          user: result.data,
        });

      return super.success(res, 'User deactivated successfully');
    } catch (error: any) {
      return super.failed(res, 'Failed to deactivate user');
    }
  }

  /**
   * Reactivate a deactivated user
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async reactivateUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await userService.findOne({ _id: id, deleted_at: { $ne: null } } as any);
      if (user.error || !user.data) {
        return super.failed(res, 'Deactivated user not found', null, 404);
      }

      const result = await userService.update({ _id: id } as any, { deleted_at: null } as any);
      if (result.error) {
        return super.failed(res, 'Failed to reactivate user');
      }

      authService
        .mail()
        .sendWithQueue(user.data.email, 'Account Reactivated', 'auth/account-reactivated', {
          user: user.data,
        });

      return super.success(res, 'User reactivated successfully');
    } catch (error: any) {
      return super.failed(res, 'Failed to reactivate user');
    }
  }

  /**
   * Force logout user from all devices
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async forceLogoutUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await userService.findOne({ _id: id, deleted_at: null } as any);
      if (user.error || !user.data) {
        return super.failed(res, 'User not found', null, 404);
      }

      const result = await authService.update({ user: id } as any, { login_history: [] } as any);
      if (result.error) {
        return super.failed(res, 'Failed to logout user');
      }

      authService
        .mail()
        .sendWithQueue(user.data.email, 'Security Notice - Forced Logout', 'auth/forced-logout', {
          user: user.data,
        });

      return super.success(res, 'User logged out from all devices successfully');
    } catch (error: any) {
      return super.failed(res, 'Failed to logout user');
    }
  }

  /**
   * Permanently delete a user
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async permanentlyDeleteUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = super.getAuth(req, '_id');

      if (id === adminId) {
        return super.failed(res, 'Cannot delete your own account', null, 403);
      }

      const user = await userService.findOne({ _id: id } as any);
      if (user.error || !user.data) {
        return super.failed(res, 'User not found', null, 404);
      }

      await authService.delete({ user: id } as any);
      const result = await userService.delete({ _id: id } as any);

      if (result.error) {
        return super.failed(res, 'Failed to delete user');
      }

      return super.success(res, 'User permanently deleted');
    } catch (error: any) {
      return super.failed(res, 'Failed to delete user');
    }
  }

  /**
   * Get user statistics
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getUserStats(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const result = await adminUserService.getUserStatistics();

      if (result.error) {
        return super.failed(res, 'Failed to retrieve user statistics');
      }

      return super.success(res, 'User statistics retrieved successfully', result.data);
    } catch (error: any) {
      return super.failed(res, 'Failed to retrieve user statistics');
    }
  }

  /**
   * Search users with advanced filters
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async searchUsers(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const result = await adminUserService.advancedSearch(req.query as any);

      if (result.error) {
        return super.failed(res, 'Search failed');
      }

      return super.success(res, 'Search completed successfully', result.data);
    } catch (error: any) {
      return super.failed(res, 'Search failed');
    }
  }

  /**
   * Export users data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async exportUsers(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { format = 'json', status, role } = req.query;

      const users = await userService.find({ deleted_at: null } as any);
      if (users.error) {
        return super.failed(res, 'Failed to export users');
      }

      let enrichedUsers = await adminUserService.enrichUsersWithAuth(users.data!);
      enrichedUsers = adminUserService.filterUsersByStatus(enrichedUsers, status as string);
      enrichedUsers = adminUserService.filterUsersByRole(enrichedUsers, role as string);

      const exportData = enrichedUsers.map((u) => ({
        id: u._id,
        first_name: u.first_name,
        last_name: u.last_name,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.is_active ? 'active' : 'inactive',
        created_at: u.created_at,
        last_login: u.last_login,
      }));

      if (format === 'csv') {
        const csv = adminUserService.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        return res.send(csv) as any;
      }

      return super.success(res, 'Users exported successfully', exportData);
    } catch (error: any) {
      return super.failed(res, 'Failed to export users');
    }
  }

  /**
   * Send email to a specific user
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async sendEmailToUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { subject, message, template } = req.body;

      const user = await userService.findOne({ _id: id, deleted_at: null } as any);
      if (user.error || !user.data) {
        return super.failed(res, 'User not found', null, 404);
      }

      authService
        .mail()
        .sendWithQueue(user.data.email, subject, template || 'admin/custom-message', {
          user: user.data,
          message,
        });

      return super.success(res, 'Email sent successfully');
    } catch (error: any) {
      return super.failed(res, 'Failed to send email');
    }
  }

  /**
   * Send bulk email to multiple users
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async sendBulkEmail(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { user_ids, subject, message, template } = req.body;

      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return super.failed(res, 'User IDs must be a non-empty array');
      }

      const users = await userService.find({
        _id: { $in: user_ids },
        deleted_at: null,
      } as any);

      if (users.error || !users.data || users.data.length === 0) {
        return super.failed(res, 'No valid users found');
      }

      users.data!.forEach((user) => {
        authService
          .mail()
          .sendWithQueue(user.email, subject, template || 'admin/bulk-message', {
            user,
            message,
          });
      });

      return super.success(res, `Email sent to ${users.data.length} users`);
    } catch (error: any) {
      return super.failed(res, 'Failed to send bulk email');
    }
  }

  /**
   * Get recent user activity
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getRecentActivity(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { limit = 20 } = req.query;
      const result = await adminUserService.getRecentActivity(Number(limit));

      if (result.error) {
        return super.failed(res, 'Failed to retrieve recent activity');
      }

      return super.success(res, 'Recent activity retrieved successfully', result.data);
    } catch (error: any) {
      return super.failed(res, 'Failed to retrieve recent activity');
    }
  }
}

export default AdminUserController.getInstance();
