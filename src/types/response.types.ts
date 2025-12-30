import { Response, NextFunction } from 'express';

/**
 * API response status
 */
export enum ResponseStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  status_code: number;
  status: ResponseStatus;
  message: string;
  data?: T;
}

/**
 * Response handler interface
 */
export interface IResponseHandler {
  success<T = any>(
    res: Response,
    next: NextFunction | null,
    message: string,
    data?: T | null,
    statusCode?: number,
    status?: string
  ): void;
  failed<T = any>(
    res: Response,
    next: NextFunction | null,
    message: string,
    data?: T | null,
    statusCode?: number,
    status?: string
  ): void;
  unauthorized(res: Response, next: NextFunction | null, message?: string): void;
  forbidden(res: Response, next: NextFunction | null, message?: string): void;
  notFound<T = any>(res: Response, next: NextFunction | null, message: string, data?: T | null): void;
  validationError<T = any>(res: Response, next: NextFunction | null, data?: T | null): void;
  unprocessable<T = any>(res: Response, next: NextFunction | null, data?: T | null): void;
  internalError(res: Response, next: NextFunction | null, error: Error | any): void;
}

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
