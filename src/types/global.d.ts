import { Request as ExpressRequest } from 'express';
import { Document, Model } from 'mongoose';

/**
 * Extend Express Request interface with custom properties
 */
declare global {
  namespace Express {
    interface Request {
      clientIp?: string;
      language?: string;
      requestDetails?: {
        ip: string;
        userAgent: string;
        device?: {
          browser?: string;
          os?: string;
          platform?: string;
          source?: string;
        };
        location?: {
          country?: string;
          city?: string;
          region?: string;
          timezone?: string;
          ll?: number[];
        };
      };
      startTime?: number;
      authUser?: {
        id: string;
        email?: string;
        role?: string;
      };
    }

    interface Response {
      locals: {
        responseBody?: any;
        [key: string]: any;
      };
    }
  }
}

/**
 * Environment variables type
 */
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'DEVELOPMENT' | 'PRODUCTION' | 'TEST';
    APP_MODE?: 'DEVELOPMENT' | 'PRODUCTION' | 'TEST';
    APP_NAME: string;
    APP_PORT: string;
    APP_URL: string;
    APP_URL_FRONTEND?: string;
    APP_PREFIX_ROUTES?: string;
    APP_VERSION?: string;

    DATABASE_URL?: string;
    USE_DATABASE?: 'yes' | 'no';

    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;
    REDIS_QUEUE?: string;
    USE_QUEUE?: 'yes' | 'no';

    SECRET_TOKEN: string;
    COOKIE_SECRET?: string;
    X_API_KEY?: string;

    MAIL_HOST?: string;
    MAIL_HOST_DEV?: string;
    MAIL_PORT?: string;
    MAIL_PORT_DEV?: string;
    MAIL_USER?: string;
    MAIL_USER_DEV?: string;
    MAIL_PASSWORD?: string;
    MAIL_PASSWORD_DEV?: string;
    MAIL_SENDER_NAME?: string;
    MAIL_SENDER_NAME_DEV?: string;
    MAIL_SENDER_EMAIL?: string;
    MAIL_SENDER_EMAIL_DEV?: string;
    MAIL_SECURE?: string;
    MAIL_SECURE_DEV?: string;
    MAIL_SERVICE?: string;
    MAIL_SERVICE_DEV?: string;
    USE_MAIL?: 'yes' | 'no';

    USER_LASTNAME?: string;
    USER_FIRSTNAME?: string;
    USER_USERNAME?: string;
    USER_EMAIL?: string;
    USER_PASSWORD?: string;

    ALLOWED_ORIGINS?: string;
    MAX_REQUEST_SIZE?: string;
  }
}

export {};
