import { Request, Response } from 'express';
import { response } from '../../configs/app.config';

/**
 * Base controller class providing standardized response methods
 * All controllers should extend this class
 */
class BaseController {

  /**
   * Send success response
   * @param res - Express response object
   * @param message - Success message
   * @param data - Optional response data
   * @param status_code - HTTP status code (default: 200)
   * @param status - Response status (default: 'success')
   */
  success<T = any>(
    res: Response,
    message: string,
    data: T | null = null,
    status_code: number = 200,
    status: string = 'success'
  ): void {
    return response.success(res, null, message, data, status_code, status);
  }

  /**
   * Send failed response
   * @param res - Express response object
   * @param message - Error message
   * @param data - Optional error data
   * @param status_code - HTTP status code (default: 400)
   * @param status - Response status (default: 'failed')
   */
  failed<T = any>(
    res: Response,
    message: string,
    data: T | null = null,
    status_code: number = 400,
    status: string = 'failed'
  ): void {
    return response.failed(res, null, message, data, status_code, status);
  }

  /**
   * Send unprocessable entity response (422)
   * @param res - Express response object
   * @param data - Validation errors
   */
  unprocessable<T = any>(res: Response, data: T | null = null): void {
    return response.unprocessable(res, null, data);
  }

  /**
   * Send unauthorized response (401)
   * @param res - Express response object
   * @param message - Unauthorized message
   */
  unauthorized(res: Response, message?: string): void {
    return response.unauthorized(res, null, message);
  }

  /**
   * Send not found response (404)
   * @param res - Express response object
   * @param message - Not found message
   * @param data - Optional error data
   */
  notFound<T = any>(res: Response, message: string, data: T | null = null): void {
    return response.notFound(res, null, message, data);
  }

  /**
   * Send internal server error response (500)
   * @param res - Express response object
   * @param error - Error object or any error data
   */
  internalError(res: Response, error: Error | any): void {
    return response.internalError(res, null, error);
  }

  /**
   * Get authenticated user data from request
   * @param req - Express request object
   * @param key - Optional specific key to retrieve
   * @returns Authentication data or specific key value
   */
  getAuth(req: Request, key?: string): any {
    const auth = (req as any).auth;

    if (key && auth && key in auth) {
      return auth[key];
    }

    return auth;
  }
}

export default BaseController;
