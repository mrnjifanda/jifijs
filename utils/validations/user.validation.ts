import { Request, Response, NextFunction } from 'express';
import { Joi, Validation, ROLES, PASSWORD_REGEX } from '../../configs/app.config';

/**
 * Validate profile update data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const updateProfile = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    first_name: Joi.string().min(2).max(50).optional(),
    last_name: Joi.string().min(2).max(50).optional(),
    username: Joi.string().alphanum().min(4).max(12).optional(),
  }, res, next);
};

/**
 * Validate password change data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const changePassword = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    current_password: Joi.string().required(),
    new_password: Joi.string().pattern(PASSWORD_REGEX).required(),
    password_confirm: Joi.string().required().valid(Joi.ref('new_password')),
  }, res, next);
};

/**
 * Validate account deletion data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const deleteAccount = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    password: Joi.string().required(),
  }, res, next);
};

/**
 * Validate user creation data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const createUser = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    username: Joi.string().alphanum().min(4).max(12).required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(PASSWORD_REGEX).required(),
    role: Joi.string().valid(...ROLES).uppercase().optional(),
  }, res, next);
};

/**
 * Validate user update data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const updateUser = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    first_name: Joi.string().min(2).max(50).optional(),
    last_name: Joi.string().min(2).max(50).optional(),
    username: Joi.string().alphanum().min(4).max(12).optional(),
    email: Joi.string().email().optional(),
  }, res, next);
};

/**
 * Validate role update data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const updateUserRole = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    role: Joi.string().valid(...ROLES).uppercase().required(),
  }, res, next );
};

/**
 * Validate password reset by admin
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const resetPassword = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    new_password: Joi.string().pattern(PASSWORD_REGEX).required(),
  }, res, next);
};

/**
 * Validate email sending data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const sendEmail = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    subject: Joi.string().min(3).max(200).required(),
    message: Joi.string().min(10).max(5000).required(),
    template: Joi.string().optional(),
  }, res, next);
};

/**
 * Validate bulk email sending data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const sendBulkEmail = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.body, {
    user_ids: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).required(),
    subject: Joi.string().min(3).max(200).required(),
    message: Joi.string().min(10).max(5000).required(),
    template: Joi.string().optional(),
  }, res, next);
};

/**
 * Validate MongoDB ObjectId parameter
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const mongoId = (req: Request, res: Response, next: NextFunction): void => {
  return Validation(req.params, {
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }, res, next);
};

export {
  updateProfile,
  changePassword,
  deleteAccount,
  createUser,
  updateUser,
  updateUserRole,
  resetPassword,
  sendEmail,
  sendBulkEmail,
  mongoId,
};
