import BaseService from '../../../utils/bases/base.service';
import Auth from '../../models/auth/auth.model';
import userService from '../app/user.service';
import loginHistoryService from './login-history.service';
import { configs } from '../../../configs/app.config';
import {
  IAuth,
  IUser,
  LoginHistory,
  ServiceResponse,
  ServiceSuccess,
  ServiceError,
} from '../../types';

/**
 * OTP generation options
 */
interface OTPOptions {
  type: 'numeric' | 'alphabet';
  length: number;
}

/**
 * Login credentials
 */
interface LoginData {
  email: string;
  password: string;
}

/**
 * Cookie configuration
 */
interface CookieConfig {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    maxAge: number;
  };
}

/**
 * Login result with tokens and cookies
 */
interface LoginResult {
  token: string;
  refresh_token: string;
  user: {
    id: string;
    last_name: string;
    first_name: string;
    username: string;
    email: string;
    role: string | null;
  };
}

/**
 * Login response with cookies
 */
interface LoginResponse extends ServiceSuccess<LoginResult> {
  cookies: {
    token: CookieConfig;
    refresh_token: CookieConfig;
  };
}

/**
 * Register result
 */
interface RegisterResult {
  otp: string;
  user: IUser;
}

/**
 * Auth Service
 * Handles authentication, registration, password reset, and account activation
 */
class AuthService extends BaseService<IAuth> {
  private static instance: AuthService;

  private constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }
    super(Auth);
    AuthService.instance = this;
  }

  /**
   * Get singleton instance
   * @returns AuthService instance
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Invalidate user auth cache
   * Should be called when user data changes (password, role, etc.)
   * @param userId - User ID
   * @private
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      await this.cacheDelete(`user:auth:${userId}`);
    } catch (error: any) {
      // Log but don't fail the operation if cache invalidation fails
      console.error('Failed to invalidate user cache:', error.message);
    }
  }

  /**
   * Generate OTP code
   * @param token - OTP configuration
   * @returns Generated OTP string
   */
  generateOTP(token: OTPOptions = { type: 'numeric', length: 6 }): string {
    const keys = {
      numeric: '0123456789',
      alphabet: 'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN',
    };

    const database = keys[token.type] ?? keys.alphabet;
    let result = '';

    for (let i = 0; i < token.length; i++) {
      result += database.charAt(Math.floor(Math.random() * database.length));
    }

    return result;
  }

  /**
   * Authenticate user and generate tokens
   * @param data - Login credentials
   * @param active - Whether to check account activation
   * @param login_history - Login history data
   * @returns Login result with tokens and cookies
   */
  async login(
    data: LoginData,
    active: boolean = false,
    login_history: Partial<LoginHistory> = {}
  ): Promise<ServiceResponse<LoginResult> | LoginResponse> {
    if (!data || !data.email || !data.password) {
      return { error: true, message: 'Email and password are required' };
    }

    const find_user = await userService.findOne(
      { email: new RegExp(data.email, 'i') },
      { select: 'last_name, first_name, username, email, password' }
    );

    if (find_user.error || !find_user.data) {
      return { error: true, message: 'This account not found' };
    }

    const user = find_user.data;
    const verify_password = await this.hashCompare(data.password, user.password);
    if (!verify_password) {
      return { error: true, message: 'Password does not match' };
    }

    const find_auth = await super.findOne(
      { user: user._id },
      { select: 'confirmed_at, role' }
    );
    const auth = find_auth.data;

    if (active) {
      if (find_auth.error || auth?.confirmed_at === null) {
        return { error: true, message: 'Account is not yet activated' };
      }
    }

    const token = super.token({ id: user._id.toString() }, '1h') as string;
    const refresh_token = super.token({ id: user._id.toString() }, '7d') as string;

    // Save login history to separate collection
    await loginHistoryService.createLoginHistory({
      auth: auth!._id.toString(),
      user: user._id.toString(),
      ip: login_history.ip || '',
      token,
      refresh_token,
      devices: login_history.devices,
      locations: login_history.locations,
      user_agent: (login_history as any).user_agent,
    });

    // Cache user + auth data for fast authentication (1 hour TTL, same as access token)
    const userAuthData = {
      user: {
        _id: user._id,
        last_name: user.last_name,
        first_name: user.first_name,
        username: user.username,
        email: user.email,
      },
      auth: {
        _id: auth!._id,
        role: auth?.role ?? null,
        confirmed_at: auth?.confirmed_at ?? null,
      },
    };
    await this.cacheSet(`user:auth:${user._id.toString()}`, userAuthData, 3600); // 1 hour

    super.mail().sendWithQueue(data.email, 'New login to your account', 'auth/login', { user });

    return {
      error: false,
      data: {
        token,
        refresh_token,
        user: {
          id: user._id.toString(),
          last_name: user.last_name,
          first_name: user.first_name,
          username: user.username,
          email: user.email,
          role: auth?.role ?? null,
        },
      },
      cookies: {
        token: {
          name: 'access_token',
          value: token,
          options: {
            httpOnly: true,
            secure: configs.isProduction(),
            sameSite: configs.isProduction() ? 'strict' : 'lax',
            path: '/',
            maxAge: 60 * 60 * 1000, // 1h
          },
        },
        refresh_token: {
          name: 'refresh_token',
          value: refresh_token,
          options: {
            httpOnly: true,
            secure: configs.isProduction(),
            sameSite: configs.isProduction() ? 'strict' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7j
          },
        },
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * @param email - User email
   * @param token - Refresh token
   * @param active - Whether to check account activation
   * @returns New access token
   */
  async refresh_token(
    email: string,
    token: string,
    active: boolean = false
  ): Promise<ServiceResponse<string>> {
    const find_user = await userService.findOne(
      { email: new RegExp(email, 'i') },
      { select: '_id' }
    );

    if (find_user.error || !find_user.data) {
      return { error: true, message: 'This account not found' };
    }

    const user = find_user.data;
    const find_auth = await super.findOne(
      { user: user._id },
      { select: 'confirmed_at, role' }
    );
    const auth = find_auth.data;

    if (active) {
      if (find_auth.error || auth?.confirmed_at === null) {
        return { error: true, message: 'Account is not yet activated' };
      }
    }

    const verification = super.tokenVerify(token) as any;
    if (!verification || verification.id !== user._id.toString()) {
      return { error: true, message: 'Incorrect refresh token' };
    }

    const new_token = super.token({ id: user._id.toString() }, '1h') as string;

    // Update token in login history collection
    await loginHistoryService.updateToken(token, new_token);

    return { error: false, data: new_token };
  }

  /**
   * Register new user account
   * @param data - Registration data
   * @param token - OTP configuration
   * @returns Registration result with OTP
   */
  async register(
    data: any,
    token: OTPOptions = { type: 'numeric', length: 6 }
  ): Promise<ServiceResponse<RegisterResult>> {
    const findUser = await userService.findOne({ email: new RegExp(data.email, 'i') });
    if (findUser.error || findUser.data) {
      return { error: true, message: 'This email is already in use' };
    }

    const password = await super.hash(data.password);
    if (!password) {
      return { error: true, message: 'Password hashing failed' };
    }

    const { role, last_name, first_name, username, email } = data;

    const user = await userService.create({ last_name, first_name, username, email, password });
    if (user.error) {
      return user as ServiceError;
    }

    const confirmation_token = this.generateOTP(token);
    const auth = await super.create({
      user: user.data!._id,
      passwords: [password as string],
      confirmation_token,
      role,
    } as any);

    if (auth.error) {
      return auth as ServiceError;
    }

    super
      .mail()
      .sendWithQueue(email, 'OTP verification', 'auth/register-otp', { otp: confirmation_token });

    return {
      error: false,
      data: { otp: confirmation_token, user: user.data! },
    };
  }

  /**
   * Activate user account with OTP
   * @param data - Activation data (email and code)
   * @returns Activation result
   */
  async activateAccount(data: { email: string; code: string }): Promise<ServiceResponse<null>> {
    const response: ServiceError = { error: true, message: 'This account not found' };

    const find_auth = await super.findOne(
      { confirmation_token: data.code },
      {
        select: 'confirmation_token, confirmed_at',
        populate: { path: 'user', select: 'email username' },
      }
    );

    if (
      find_auth.error ||
      !find_auth.data ||
      !(find_auth.data as any).user ||
      !(find_auth.data as any).user.email
    ) {
      return response;
    }

    const auth = find_auth.data as any;

    if (data.email.toLowerCase() !== auth.user.email.toLowerCase()) {
      return response;
    }

    auth.confirmation_token = null;
    auth.confirmed_at = new Date();
    await auth.save();

    super
      .mail()
      .sendWithQueue(data.email, 'Account activation successful', 'auth/activation', {
        user: auth.user,
      });

    return { error: false, data: null, message: 'Account activated successfully' };
  }

  /**
   * Send password reset email
   * @param email - User email
   * @returns Result of password reset request
   */
  async forgotPassword(email: string): Promise<ServiceResponse<null>> {
    const findUser = await userService.findOne({ email: new RegExp(email, 'i') }, { select: '_id' });

    if (findUser.error || !findUser.data) {
      return { error: true, message: 'This email is not registered' };
    }

    const reset_password_token = this.generateOTP({ type: 'numeric', length: 10 });
    const update = await super.update({ user: findUser.data._id }, { reset_password_token } as any);

    if (update.error) {
      return { error: true, message: 'An error occurred, please try again later!!!' };
    }

    super.mail().sendWithQueue(email, 'Reset password', 'auth/forgot-password', {
      token: reset_password_token,
    });

    return { error: false, data: null, message: 'Reset password link sent to your email address' };
  }

  /**
   * Verify OTP for password reset
   * @param email - User email
   * @param code - Reset password token/OTP
   * @returns Verification result with auth data
   */
  async verifyOtp(email: string, code: string): Promise<ServiceResponse<any>> {
    const errorResponse: ServiceError = { error: true, message: 'Email or code not valide' };

    try {
      const find_auth = await super.findOne(
        { reset_password_token: code },
        {
          select: 'passwords, confirmed_at, reset_password_token, reset_password_at',
          populate: { path: 'user', select: 'email password' },
        }
      );

      const auth = find_auth.data as any;
      if (find_auth.error || auth?.confirmed_at === null) {
        return errorResponse;
      }

      if (!auth.user.email || auth.user.email.toLowerCase() !== email.toLowerCase()) {
        return errorResponse;
      }

      return { error: false, message: 'OTP verification successful', data: auth };
    } catch (error) {
      return errorResponse;
    }
  }

  /**
   * Reset user password
   * @param code - Reset password token/OTP
   * @param email - User email
   * @param password - New password
   * @returns Password reset result
   */
  async resetPassword(
    code: string,
    email: string,
    password: string
  ): Promise<ServiceResponse<null>> {
    const verify = await this.verifyOtp(email, code);
    if (verify.error) {
      return verify;
    }

    const auth = verify.data;
    const hash = await super.hash(password);
    if (!hash) {
      return { error: true, message: 'Invalid password' };
    }

    const user = auth.user;
    auth.passwords.push(hash);
    auth.reset_password_token = null;
    auth.reset_password_at = new Date();
    user.password = hash;

    await auth.save();
    await user.save();

    // Invalidate cache after password change (forces re-authentication)
    await this.invalidateUserCache(user._id.toString());

    // Delete all login history (logout from all devices)
    await loginHistoryService.deleteAllByUser(user._id.toString());

    return { error: false, data: null, message: 'Password reset successfully' };
  }

  /**
   * Security feature - "It's Not Me" logout from all devices
   * @param email - User email
   * @returns Security action result
   */
  async itsNotMe(email: string): Promise<ServiceResponse<null>> {
    try {
      const findUser = await userService.findOne(
        { email: new RegExp(email, 'i') },
        { select: '_id, first_name, last_name, email' }
      );

      if (findUser.error || !findUser.data) {
        return { error: true, message: 'This account not found' };
      }

      const user = findUser.data;
      const updateAuth = await super.update(
        { user: user._id },
        {
          reset_password_token: null,
          remember_token: null,
        } as any
      );

      if (updateAuth.error) {
        return { error: true, message: 'Failed to secure account' };
      }

      // Invalidate cache (forces re-authentication)
      await this.invalidateUserCache(user._id.toString());

      // Delete all login history (logout from all devices)
      await loginHistoryService.deleteAllByUser(user._id.toString());

      super.mail().sendWithQueue(email, 'Security Alert - Account Access', 'auth/security-alert', {
        user,
        alertDate: new Date(),
      });

      return { error: false, data: null, message: 'Account secured successfully' };
    } catch (error) {
      return { error: true, message: 'An error occurred while securing the account' };
    }
  }
}

export default AuthService.getInstance();
