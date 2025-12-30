import { Request, Response, NextFunction } from 'express';
import { Joi, Validation } from '../../configs/app.config';
import { id, userId } from './app.validation';

/**
 * Validate date filters
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const dateFilters = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.query, {
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')),
  }, res, next);
};

/**
 * Validate log filters with pagination
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const logFilters = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.query, {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')),
    status_code: Joi.number().integer().min(100).max(599),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'),
    action: Joi.string().valid(
      'create',
      'read',
      'update',
      'delete',
      'auth',
      'subscribe',
      'unsubscribe',
      'unknown'
    ),
    entity: Joi.string(),
    user: Joi.string(),
    ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).allow(''),
  }, res, next);
};

/**
 * Validate statistics query parameters
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const statistics = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.query, {
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')),
  }, res, next);
};

/**
 * Validate queue service parameter
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const queue = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.params, {
    service: Joi.string().valid('mail').required(),
  }, res, next);
};

/**
 * Validate cleanup parameters
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const cleanup = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.body, {
    days: Joi.number().integer().min(1).default(30),
  }, res, next);
};

export { dateFilters, logFilters, statistics, queue, cleanup, id, userId };
