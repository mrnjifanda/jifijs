import { Request, Response, NextFunction } from 'express';
import { response, configs } from '../../../configs/app.config';
import authService from '../../../src/services/auth/auth.service';
import loginHistoryService from '../../../src/services/auth/login-history.service';
import tokenBlacklistService from '../../../utils/bases/blackList.service';
import cacheService from '../../../utils/helpers/cache.helper';

/**
 * Get access token from cookies or Authorization header
 * @param req - Express request
 * @returns Access token or undefined
 */
const getToken = (req: Request): string | undefined => {
  let token = (req as any).cookies?.access_token;
  if (!token) {
    const auth = req.header('Authorization');
    token = auth && auth.split(' ')[1];
  }

  return token;
};

/**
 * Get refresh token from cookies
 * @param req - Express request
 * @returns Refresh token or undefined
 */
const getRefreshToken = (req: Request): string | undefined => {
  return (req as any).cookies?.refresh_token;
};

/**
 * Get user from token
 * @param req - Express request
 * @returns User data or error
 */
const getUser = async (req: Request): Promise<{ error: boolean; message?: string; data?: any }> => {
  const token = getToken(req);

  if (!token) return { error: true, message: 'Authorization key not found' };

  let verified = authService.tokenVerify(token);
  if (!verified) {
    const refreshToken = getRefreshToken(req);
    if (refreshToken) {
      const refreshVerified = authService.tokenVerify(refreshToken);
      if (refreshVerified) {
        const newToken = authService.token({ id: (refreshVerified as any).id }, '1h');
        verified = authService.tokenVerify(newToken as string);
        if (verified) {
          (req as any).newAccessToken = newToken;
        } else {
          return { error: true, message: 'Failed to generate new token' };
        }
      } else {
        return { error: true, message: 'Refresh token expired' };
      }
    } else {
      return { error: true, message: 'Token expired and no refresh token available' };
    }
  }

  // Try to get user data from cache first (faster)
  const userId = (verified as any).id;
  const cacheKey = `user:auth:${userId}`;
  const cachedData = await cacheService.get(cacheKey);

  if (cachedData) {
    // Cache hit - return cached data with proper structure
    return {
      error: false,
      data: {
        user: cachedData.user,
        role: cachedData.auth.role,
        confirmed_at: cachedData.auth.confirmed_at,
      },
    };
  }

  // Cache miss - query database
  const user = await authService.findOne({ user: userId } as any, {
    select: 'role, confirmed_at',
    populate: [
      {
        path: 'user',
        select: 'last_name first_name username email',
      },
    ],
  });

  if (user.error || !user.data) return { error: true, message: 'User not found' };

  // Cache the result for future requests (1 hour TTL)
  const userAuthData = {
    user: (user.data as any).user,
    auth: {
      _id: (user.data as any)._id,
      role: (user.data as any).role,
      confirmed_at: (user.data as any).confirmed_at,
    },
  };
  await cacheService.set(cacheKey, userAuthData, { ttl: 3600 }); // 1 hour

  return { error: false, data: user.data };
};

/**
 * Middleware to check if user is authenticated
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const isLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUser(req);
    if (user.error) {
      if (user.message && user.message.includes('expired')) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
      }

      return response.unauthorized(res, next, user.message);
    }

    (req as any).auth = (user.data as any).user;
    (req as any).auth.role = (user.data as any).role;

    if ((req as any).newAccessToken) {
      const refreshToken = getRefreshToken(req);

      // Update token in login history collection
      if (refreshToken) {
        await loginHistoryService.updateToken(refreshToken, (req as any).newAccessToken);
      }

      res.cookie('access_token', (req as any).newAccessToken, {
        httpOnly: true,
        secure: configs.isProduction(),
        sameSite: configs.isProduction() ? 'strict' : 'lax',
        maxAge: 60 * 60 * 1000, // 1h
      });
    }

    next();
  } catch (error: any) {
    return response.unauthorized(res, next);
  }
};

/**
 * Middleware to check if user is admin
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auth = (req as any).auth;
    if (!auth || auth.role !== 'ADMIN') {
      return response.forbidden(res, next, 'You are only authorized to access the content');
    }

    next();
  } catch (error: any) {
    return response.forbidden(res, next, 'You are only authorized to access the content');
  }
};

/**
 * Middleware to check if user has one of the specified roles
 * @param allowedRoles - One or more authorized roles
 * @returns Middleware function
 *
 * @example
 * router.get('/admin', hasRole('ADMIN'), controller);
 * router.get('/staff', hasRole('ADMIN', 'TEACHER'), controller);
 * router.get('/content', hasRole('ADMIN', 'TEACHER', 'MODERATOR'), controller);
 */
const hasRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = (req as any).auth;
      if (!auth) {
        return response.unauthorized(res, next, 'Authentication required');
      }

      if (!auth.role) {
        return response.forbidden(res, next, 'No role assigned to user');
      }

      if (!allowedRoles.includes(auth.role)) {
        return response.forbidden(
          res,
          next,
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error: any) {
      return response.forbidden(res, next, 'Access denied');
    }
  };
};

/**
 * Logout middleware - clear cookies and cache
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get user from auth if available
    const auth = (req as any).auth;
    if (auth && auth._id) {
      // Invalidate cache for this user
      await cacheService.delete(`user:auth:${auth._id}`);
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return response.success(res, next, 'Logout successful') as any;
  } catch (error: any) {
    return response.internalError(res, next, error);
  }
};

/**
 * Middleware to check if token is blacklisted
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const checkTokenBlacklist = (req: Request, res: Response, next: NextFunction): void => {
  const token = getToken(req);

  if (token && tokenBlacklistService.isBlacklisted(token)) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.status(401).json({
      error: true,
      message: 'Token has been revoked',
    });
    return;
  }
  next();
};

export { isLogin, isAdmin, hasRole, logout, checkTokenBlacklist };
