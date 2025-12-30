import { Request, Response, NextFunction } from 'express';
import { Joi, Validation } from '../../configs/app.config';

/**
 * Validate pagination parameters
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const pagination = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.query, {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }, res, next);
};

/**
 * Validate email in request body
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const email = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    email: Joi.string().email().required(),
  }, res, next);
};

/**
 * Validate MongoDB ObjectId in params
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const id = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.params, {
    id: Joi.string().length(24).hex().required(),
  }, res, next);
};

/**
 * Validate userId in params
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const userId = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.params, {
    userId: Joi.string().length(24).hex().required(),
  }, res, next);
};

export { pagination, email, id, userId };
