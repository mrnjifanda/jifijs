import { Request, Response, NextFunction } from 'express';
import BaseController from '../../../utils/bases/base.controller';
import userService from '../../services/app/user.service';
import authService from '../../services/auth/auth.service';

/**
 * User Controller
 * Handles user profile and account management endpoints
 */
class UserController extends BaseController {
  private static instance: UserController;

  private constructor() {
    if (UserController.instance) {
      return UserController.instance;
    }
    super();
    UserController.instance = this;
  }

  /**
   * Get singleton instance
   * @returns UserController instance
   */
  static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  /**
   * Get user profile
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = super.getAuth(req, '_id');
      const findAuth = await authService.findOne({ user: userId, deleted_at: null } as any, {
        select: 'user, role, confirmed_at, login_history, login_at',
        populate: { path: 'user', select: 'first_name last_name username email created_at' },
      });

      if (findAuth.error || !findAuth.data) {
        return super.failed(res, 'User not found');
      }

      const auth: any = findAuth.data;
      const user = auth.user;

      return super.success(res, 'Profile retrieved successfully', {
        ...user.toObject(),
        role: auth?.role || null,
        confirmed_at: auth?.confirmed_at || null,
        last_login:
          auth?.login_history?.length > 0
            ? auth.login_history[auth.login_history.length - 1].login_at
            : null,
        active_sessions: auth?.login_history?.length || 0,
      });
    } catch (error: any) {
      return super.failed(res, 'Failed to retrieve profile');
    }
  }

  /**
   * Update user profile
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async updateProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = super.getAuth(req, '_id');
      const { first_name, last_name, username } = req.body;

      if (username) {
        const existingUser = await userService.findOne({
          username: username,
          _id: { $ne: userId },
          deleted_at: null,
        } as any);

        if (!existingUser.error && existingUser.data) {
          return super.failed(res, 'Username already taken');
        }
      }

      const updateData: any = {};
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (username !== undefined) updateData.username = username;

      if (Object.keys(updateData).length === 0) {
        return super.failed(res, 'No data provided for update');
      }

      const result = await userService.update({ _id: userId } as any, updateData);
      if (result.error) {
        return super.failed(res, 'Failed to update profile');
      }

      return super.success(res, 'Profile updated successfully');
    } catch (error: any) {
      return super.failed(res, 'Failed to update profile');
    }
  }

  /**
   * Change user password
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async changePassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = super.getAuth(req, '_id');
      const { current_password, new_password } = req.body;

      const findUser = await userService.findOne({ _id: userId } as any, {
        select: 'password, email',
      });

      if (findUser.error || !findUser.data) {
        return super.failed(res, 'User not found');
      }

      const user = findUser.data;
      const isValidPassword = await authService.hashCompare(current_password, user.password);

      if (!isValidPassword) {
        return super.failed(res, 'Current password is incorrect');
      }

      const hashedPassword = await authService.hash(new_password);
      if (!hashedPassword) {
        return super.failed(res, 'Failed to process new password');
      }

      user.password = hashedPassword;
      await user.save();

      await authService.update(
        { user: userId } as any,
        {
          $push: { passwords: hashedPassword },
          login_history: [], // Disconnect all devices
        } as any
      );

      authService.mail().sendWithQueue(user.email, 'Password Changed Successfully', 'auth/password-changed', { user: user });

      return super.success(res, 'Password changed successfully. Please login again.');
    } catch (error: any) {
      return super.failed(res, 'Failed to change password');
    }
  }

  /**
   * Get login history
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getLoginHistory(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = super.getAuth(req, '_id');
      const { page = 1, limit = 10 } = req.query;

      const authData = await authService.findOne({ user: userId } as any, {
        select: 'login_history',
      });

      if (authData.error || !authData.data) {
        return super.failed(res, 'Login history not found');
      }

      const loginHistory = (authData.data as any).login_history
        .sort((a: any, b: any) => new Date(b.login_at).getTime() - new Date(a.login_at).getTime())
        .slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit))
        .map((entry: any) => ({
          login_at: entry.login_at,
          ip: entry.ip || 'Unknown',
          country: entry.locations?.country || 'Unknown',
          city: entry.locations?.city || 'Unknown',
          device: entry.devices || {},
          is_current: entry.token === (req as any).token,
        }));

      const total = (authData.data as any).login_history.length;

      return super.success(res, 'Login history retrieved successfully', {
        pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string) },
        content: loginHistory,
      });
    } catch (error: any) {
      return super.failed(res, 'Failed to retrieve login history');
    }
  }

  /**
   * Logout from other devices
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async logoutOtherDevices(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = super.getAuth(req, '_id');
      const currentToken = (req as any).token;

      const authData = await authService.findOne({ user: userId } as any, {
        select: 'login_history',
      });

      if (authData.error || !authData.data) {
        return super.failed(res, 'Auth data not found');
      }

      const currentSession = (authData.data as any).login_history.find(
        (session: any) => session.token === currentToken
      );

      if (!currentSession) {
        return super.failed(res, 'Current session not found');
      }

      await authService.update({ user: userId } as any, { login_history: [currentSession] } as any);

      return super.success(res, 'Successfully logged out from other devices');
    } catch (error: any) {
      return super.failed(res, 'Failed to logout other devices');
    }
  }

  /**
   * Delete user account (soft delete)
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async deleteAccount(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = super.getAuth(req, '_id');
      const { password } = req.body;

      const findUser = await userService.findOne({ _id: userId } as any, {
        select: 'password, email',
      });

      if (findUser.error || !findUser.data) {
        return super.failed(res, 'User not found');
      }

      const isValidPassword = await authService.hashCompare(password, findUser.data.password);
      if (!isValidPassword) {
        return super.failed(res, 'Invalid password');
      }

      await userService.softDelete({ _id: userId } as any);
      await authService.update({ user: userId } as any, { login_history: [] } as any);

      authService
        .mail()
        .sendWithQueue(findUser.data.email, 'Account Deleted', 'auth/account-deleted', {
          user: findUser.data,
        });

      return super.success(res, 'Account deleted successfully');
    } catch (error: any) {
      return super.failed(res, 'Failed to delete account');
    }
  }

  /**
   * Get account statistics
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getAccountStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = super.getAuth(req, '_id');

      const [user, auth] = await Promise.all([
        userService.findOne({ _id: userId } as any, { select: 'created_at, updated_at' }),
        authService.findOne({ user: userId } as any, {
          select: 'login_history, passwords, confirmed_at',
        }),
      ]);

      if (user.error || auth.error) {
        return super.failed(res, 'Failed to retrieve account stats');
      }

      const stats = {
        account_created: user.data!.created_at,
        last_profile_update: user.data!.updated_at,
        total_logins: (auth.data as any)?.login_history?.length || 0,
        active_sessions: (auth.data as any)?.login_history?.length || 0,
        password_changes: (auth.data as any)?.passwords?.length || 0,
        account_verified: (auth.data as any)?.confirmed_at !== null,
        last_login:
          (auth.data as any)?.login_history?.length > 0
            ? (auth.data as any).login_history[(auth.data as any).login_history.length - 1]
                .login_at
            : null,
      };

      return super.success(res, 'Account stats retrieved successfully', stats);
    } catch (error: any) {
      return super.failed(res, 'Failed to retrieve account stats');
    }
  }

  /**
   * Export personal data (GDPR)
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async exportData(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = super.getAuth(req, '_id');

      const [user, auth] = await Promise.all([
        userService.findOne({ _id: userId } as any),
        authService.findOne({ user: userId } as any),
      ]);

      if (user.error || auth.error) {
        return super.failed(res, 'Failed to export data');
      }

      const exportData = {
        personal_information: {
          first_name: user.data!.first_name,
          last_name: user.data!.last_name,
          username: user.data!.username,
          email: user.data!.email,
          created_at: user.data!.created_at,
          updated_at: user.data!.updated_at,
        },
        account_information: {
          role: (auth.data as any).role,
          confirmed_at: (auth.data as any).confirmed_at,
          total_password_changes: (auth.data as any).passwords?.length || 0,
        },
        login_history:
          (auth.data as any).login_history?.map((entry: any) => ({
            login_at: entry.login_at,
            ip: entry.ip,
            location: entry.locations,
            device: entry.devices,
          })) || [],
      };

      return super.success(res, 'Data exported successfully', exportData);
    } catch (error: any) {
      return super.failed(res, 'Failed to export data');
    }
  }
}

export default UserController.getInstance();
