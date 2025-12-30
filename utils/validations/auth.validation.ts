import { Request, Response, NextFunction } from 'express';
import { Joi, Validation, ROLES, PASSWORD_REGEX } from '../../configs/app.config';
import { email } from './app.validation';

/**
 * Validate user registration data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const register = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    last_name: Joi.string().min(2).max(50),
    first_name: Joi.string().min(2).max(50),
    username: Joi.string().alphanum().min(4).max(12),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(PASSWORD_REGEX).required(),
    password_confirm: Joi.string().required().valid(Joi.ref('password')),
    role: Joi.string().valid(...ROLES).default(ROLES[0]).uppercase()
  }, res, next);
};

/**
 * Validate account activation data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const activate_account = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    email: Joi.string().email().required(),
    code: Joi.string().required(),
  }, res, next);
};

/**
 * Validate login credentials
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const login = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    email: Joi.string().email().required(),
    password: Joi.string().pattern(PASSWORD_REGEX).required(),
  }, res, next);
};

/**
 * Validate password reset data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const reset_password = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    code: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(PASSWORD_REGEX).required(),
    password_confirm: Joi.string().required().valid(Joi.ref('password')),
  }, res, next);
};

export { register, activate_account, login, email, reset_password };
