import { Request, Response, NextFunction } from 'express';
import geoip from 'geoip-lite';
import userAgentParser from 'user-agent-parser';
import { response, configs, SUPPORTED_LANGUAGES } from '../../configs/app.config';
import xApiKeyService from '../../src/services/admin/x-api-key.service';

const NORMALIZED_SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES.map(
  (lang) => lang?.toLowerCase?.() || 'en'
).filter(Boolean);

/**
 * Get user language from request
 * @param req - Express request
 * @returns Language code
 */
const getLanguage = (req: Request): string => {
  const queryLang = (req.query.lang as string)?.trim();
  const headerLang = req.get('Accept-Language')?.split(',')[0]?.split('-')[0]?.trim();
  const defaultLang = (SUPPORTED_LANGUAGES[0] || 'en').toLowerCase();

  let userLanguage = queryLang || headerLang || defaultLang;

  if (
    !userLanguage ||
    typeof userLanguage !== 'string' ||
    userLanguage.length < 2 ||
    userLanguage.length > 10
  ) {
    return defaultLang;
  }

  userLanguage = userLanguage.toLowerCase();

  if (!NORMALIZED_SUPPORTED_LANGUAGES.includes(userLanguage)) {
    return defaultLang;
  }

  return userLanguage;
};

/**
 * Middleware to set user language
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const setLanguage = (req: Request, _res: Response, next: NextFunction): void => {
  (req as any).language = getLanguage(req);
  next();
};

/**
 * Middleware to set request details (IP, location, device)
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const setRequestDetails = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ip = (req as any).clientIp;
    (req as any).login_history = {
      ip,
      token: '',
      locations: geoip.lookup(ip),
      devices: userAgentParser(req.headers['user-agent'] || ''),
    };
  } catch (err: any) {
    console.log(err);
    (req as any).login_history = {
      ip: (req as any).clientIp,
      token: '',
    };
  }

  next();
};

/**
 * Middleware to validate X-API-Key header
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const xApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = req.header('x-api-key');

    if (!key) {
      return response.forbidden(res, next, 'Invalid KEY. Please check your key and try again.');
    }

    if (key !== configs.getXApiKey()) {
      const keys = await xApiKeyService.findOne(
        { keys: key, status: 'ACTIVE', deleted_at: null } as any,
        { select: 'keys, -_id' }
      );

      if (keys.error || !keys.data) {
        return response.forbidden(res, next, 'Invalid KEY. Please check your key and try again.');
      }
    }

    next();
  } catch (error: any) {
    return response.forbidden(res, next, 'Invalid KEY. Please check your key and try again.');
  }
};

/**
 * Security middleware to detect suspicious patterns
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(\$where|\$regex|\$ne)/i, // NoSQL injection
    /(union\s+select|drop\s+table)/i, // SQL injection
    /(<script|javascript:|data:)/i, // XSS
  ];

  const requestBody = JSON.stringify(req.body);
  const requestQuery = JSON.stringify(req.query);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestBody) || pattern.test(requestQuery)) {
      console.warn('Suspicious request detected:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        body: req.body,
      });

      return response.failed(res, next, 'Invalid request format', null);
    }
  }
  next();
};

export { xApiKey, setLanguage, getLanguage, setRequestDetails, securityMiddleware };
