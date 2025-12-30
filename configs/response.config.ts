import { Response, NextFunction } from 'express';
import { IResponseHandler } from '../src/types';
import logger from '../utils/helpers/logger.helper';

/**
 * Generic response formatter
 * @private
 */
function response<T = any>(
  res: Response,
  _next: NextFunction | null,
  message: string,
  status_code: number,
  status: string,
  data: T | null = null
): void {
  const format = {
    status_code,
    status: status.toUpperCase(),
    message: message,
    ...(data !== null && { data }),
  };

  res.status(status_code).json(format);
}

/**
 * Send success response
 */
function success<T = any>(
  res: Response,
  next: NextFunction | null,
  message: string,
  data: T | null = null,
  status_code: number = 200,
  status: string = 'success'
): void {
  return response(res, next, message, status_code, status, data);
}

/**
 * Send failed response
 */
function failed<T = any>(
  res: Response,
  next: NextFunction | null,
  message: string,
  data: T | null = null,
  status_code: number = 400,
  status: string = 'failed'
): void {
  return response(res, next, message, status_code, status, data);
}

/**
 * Send validation error response (422)
 */
function unprocessable<T = any>(
  res: Response,
  next: NextFunction | null,
  data: T | null = null
): void {
  return failed(res, next, 'There are errors in the request', data, 422);
}

/**
 * Send internal server error response (500)
 */
function internalError(
  res: Response,
  next: NextFunction | null,
  error: Error | any
): void {
  const message = error.message || 'Internal Server Error';
  const code = error.status || 500;
  logger.error(error);
  return failed(res, next, message, null, code);
}

/**
 * Send not found response (404)
 */
function notFound<T = any>(
  res: Response,
  next: NextFunction | null,
  message: string,
  data: T | null = null
): void {
  return failed(res, next, message, data, 404);
}

/**
 * Send forbidden response (403)
 */
function forbidden(
  res: Response,
  next: NextFunction | null,
  message: string = 'Access to this page is prohibited !!!'
): void {
  return failed(res, next, message, null, 403);
}

/**
 * Send unauthorized response (401)
 */
function unauthorized(
  res: Response,
  next: NextFunction | null,
  message: string = 'This page requires a login, please login!!!'
): void {
  return failed(res, next, message, null, 401);
}

/**
 * Response handler object implementing IResponseHandler
 */
const responseHandler: IResponseHandler = {
  success,
  failed,
  unauthorized,
  forbidden,
  notFound,
  validationError: unprocessable,
  unprocessable,
  internalError,
};

export default responseHandler;

export {
  response,
  success,
  failed,
  unprocessable,
  unauthorized,
  notFound,
  internalError,
  forbidden,
  responseHandler,
};
