import { Request, Response, NextFunction } from 'express';
import { Joi, response, Validation } from '../../configs/app.config';
import { id } from './app.validation';

/**
 * Validate file upload
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const upload = (req: Request, res: Response, next: NextFunction): void => {
  if (!(req as any).file) {
    return response.failed(res, next, 'No file uploaded');
  }

  if (req.body.metadata) {
    try {
      req.body.metadata = JSON.parse(req.body.metadata);
    } catch (error) {
      return response.failed(res, next, 'Metadata must be a valid JSON object');
    }
  }

  Validation(req.body, {
    metadata: Joi.object().optional(),
  }, res, next);
};

/**
 * Validate upload request body
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const uploadBody = (req: Request, res: Response, next: NextFunction): void => {

  if (req.body.metadata) {
    try {
      req.body.metadata = JSON.parse(req.body.metadata);
    } catch (error) {
      return response.failed(res, next, 'Metadata must be a valid JSON object');
    }
  }

  Validation(req.body, {
    metadata: Joi.object().optional(),
  }, res, next);
};

/**
 * Validate multiple files upload
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const uploadMulti = (req: Request, res: Response, next: NextFunction): void => {
  const files = (req as any).files;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return response.failed(res, next, 'No files uploaded');
  }

  if (files.length < 1) {
    return response.failed(res, next, 'At least one file is required');
  }

  if (req.body.metadata) {
    try {
      req.body.metadata = JSON.parse(req.body.metadata);
    } catch (error) {
      return response.failed(res, next, 'Metadata must be a valid JSON object');
    }
  }

  Validation(req.body, {
    metadata: Joi.object().optional(),
  }, res, next);
};

/**
 * Validate get stats query parameters
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const getStats = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.query, {
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')),
    uploader: Joi.string().length(24).hex().optional(),
    mimetype: Joi.string().optional(),
  }, res, next);
};

/**
 * Validate get file info query parameters
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const getFileInfo = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.query, {
    id: Joi.string().uuid().optional(),
    filename: Joi.string().optional(),
  }, res, next);
};

/**
 * Validate delete file data
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const deleteFile = (req: Request, res: Response, next: NextFunction): void => {
  Validation(req.body, {
    id: Joi.string().uuid().optional(),
    filename: Joi.string().optional(),
  }, res, next);
};

export { id, upload, uploadBody, uploadMulti, getStats, getFileInfo, deleteFile };
