import { BaseDocument } from './service.types';
import { DeviceInfo, LocationInfo } from './auth.types';

/**
 * HTTP method type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/**
 * Log action type
 */
export enum LogAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  EXPORT = 'EXPORT',
  OTHER = 'OTHER',
}

/**
 * Log level
 */
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

/**
 * Request information
 */
export interface RequestInfo {
  method: HttpMethod;
  url: string;
  path: string;
  query?: any;
  params?: any;
  body?: any;
  headers?: Record<string, string>;
  ip?: string;
  userAgent?: string;
}

/**
 * Response information
 */
export interface ResponseInfo {
  statusCode: number;
  statusMessage?: string;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Log document interface
 */
export interface ILog extends BaseDocument {
  correlation_id: string;
  user?: string;
  action: LogAction;
  entity?: string;
  entity_id?: string;
  request: RequestInfo;
  response: ResponseInfo;
  execution_time: number;
  timestamp: Date;
  device?: DeviceInfo;
  location?: LocationInfo;
  level: LogLevel;
  message?: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

/**
 * Log batch item
 */
export interface LogBatchItem {
  correlation_id: string;
  user?: string;
  action: LogAction;
  entity?: string;
  entity_id?: string;
  request: RequestInfo;
  response: ResponseInfo;
  execution_time: number;
  timestamp: Date;
  device?: DeviceInfo;
  location?: LocationInfo;
  level?: LogLevel;
  message?: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}
