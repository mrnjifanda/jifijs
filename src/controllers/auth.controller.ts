import { Request, Response, NextFunction } from 'express';
import BaseController from '../../utils/bases/base.controller';
import authService from '../services/auth/auth.service';
import { configs } from '../../configs/app.config';

/**
 * Auth Controller
 * Handles authentication and user registration endpoints
 */
class AuthController extends BaseController {
  private static instance: AuthController;

  private constructor() {
    if (AuthController.instance) {
      return AuthController.instance;
    }
    super();
    AuthController.instance = this;
  }

  /**
   * Get singleton instance
   * @returns AuthController instance
   */
  static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  /**
   * Register a new user
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async register(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const response = await authService.register(req.body);
    if (response.error) {
      return super.failed(res, response.message!);
    }

    const data = response.data!;
    return super.success(
      res,
      'User created successfully',
      { otp: data.otp, email: data.user.email },
      201
    );
  }

  /**
   * Activate user account with OTP
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async activate_account(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await authService.activateAccount(req.body);
    if (data.error) {
      return super.failed(res, data.message!);
    }

    return super.success(res, 'Account successfully activated');
  }

  /**
   * User login
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async login(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = await authService.login(req.body, true, (req as any).login_history);

    if (data.error) {
      return super.failed(
        res,
        'The username and password you entered do not match any accounts on record'
      );
    }

    if ('cookies' in data && data.cookies) {
      const cookies = data.cookies;
      res.cookie(cookies.token.name, cookies.token.value, cookies.token.options);
      res.cookie(
        cookies.refresh_token.name,
        cookies.refresh_token.value,
        cookies.refresh_token.options
      );
    }

    return super.success(res, 'Connection completed successfully', data.data);
  }

  /**
   * Check if user is authenticated
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async isLogin(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const auth = (req as any).auth;
    return super.success(res, 'Authenticated User', {
      email: auth.email,
      role: auth.role,
    });
  }

  /**
   * Refresh access token
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async refresh_token(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const refresh = await authService.refresh_token(req.body.email, req.body.code, true);

    if (refresh.error) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return super.unauthorized(res, refresh.message || 'Invalid token');
    }

    res.cookie('access_token', refresh.data, {
      httpOnly: true,
      secure: configs.isProduction(),
      sameSite: configs.isProduction() ? 'strict' : 'lax',
      maxAge: 60 * 60 * 1000, // 1h
    });

    return super.success(res, 'Token refresh successful', { token: refresh.data });
  }

  /**
   * Send password reset email
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async forgot_password(req: Request, res: Response, _next: NextFunction): Promise<void> {
    authService.forgotPassword(req.body.email);
    super.success(
      res,
      'Instructions to reset your password have been sent to you by email.',
      null,
      202
    );
  }

  /**
   * Verify OTP for password reset
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async verify_otp(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { email, code } = req.body;
    const data = await authService.verifyOtp(email, code);

    if (data.error) {
      return super.failed(res, data.message!);
    }

    return super.success(res, data.message!);
  }

  /**
   * Reset user password
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async resetPassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { code, email, password } = req.body;
    const data = await authService.resetPassword(code, email, password);

    if (data.error) {
      return super.failed(res, data.message!);
    }

    return super.success(res, 'Password reset successfully');
  }

  /**
   * Security feature - logout from all devices
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async itsNotMe(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { email } = req.params;

    if (!email) {
      return super.failed(res, 'Email parameter is required');
    }

    const response = await authService.itsNotMe(email);
    if (response.error) {
      return super.failed(res, response.message!);
    }

    return super.success(
      res,
      'Security alert sent successfully. All active sessions have been terminated.'
    );
  }
}

export default AuthController.getInstance();
