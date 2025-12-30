import express, { Router, Response, NextFunction } from 'express';
import mongoose, { Model, Document } from 'mongoose';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import requestIp from 'request-ip';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import configs from './config';
import responseHandler from './response.config';

const router = express.Router();
const { Schema: MongooseSchema } = mongoose;
const SECRET_TOKEN = configs.getSecret();
const ROLES = ['USER', 'ADMIN'] as const;

export type Role = typeof ROLES[number];

/**
 * Password regex pattern
 * Requires: lowercase, uppercase, digit, special char, 3-30 chars
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+\-=!])[\w@#$%^&+\-=!]{3,30}$/;

/**
 * Allowed HTTP methods
 */
const ALLOWED_METHODS = configs.getLists('ALLOWED_METHODS');

/**
 * Supported languages
 */
const SUPPORTED_LANGUAGES = configs.getLists('ALLOWED_SUPPORTED_LANGUAGES');

/**
 * Schema creation options
 */
interface SchemaOptions {
  index?: Array<Record<string, any>>;
}

/**
 * Creates a Mongoose model with base fields (created_at, updated_at, deleted_at)
 * @param collection - Collection name
 * @param schema - Schema definition
 * @param args - Additional options (indexes, etc.)
 * @returns Mongoose model
 */
function BaseSchema<T extends Document = Document>(
  collection: string,
  schema: Record<string, any>,
  args: SchemaOptions | null = null
): Model<T> {
  const base = {
    created_at: {
      type: Date,
      required: false,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      required: false,
      default: null as Date | null,
    },
    deleted_at: {
      type: String,
      required: false,
      default: null as string | null,
    },
  };

  const collectionSchema = new MongooseSchema({ ...schema, ...base });

  // Add indexes if provided
  if (typeof args === 'object' && args?.index) {
    const indexes = args.index || [];
    indexes.forEach((index) => {
      collectionSchema.index(index);
    });
  }

  // Pre-save hook to update timestamp
  collectionSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
  });

  return mongoose.model<T>(collection, collectionSchema);
}

/**
 * Validation error detail
 */
interface ValidationErrorDetail {
  message: string;
  field: string;
}

/**
 * Joi validation middleware
 * @param data - Data to validate
 * @param rules - Joi validation rules
 * @param res - Express response object
 * @param next - Express next function
 * @returns void
 */
function Validation(
  data: any,
  rules: Record<string, Joi.Schema>,
  res: Response,
  next: NextFunction
): void {
  const schema = Joi.object(rules);
  const { error } = schema.validate(data);

  if (error) {
    const details = error.details;
    const errors: ValidationErrorDetail[] = [];

    details.forEach((detail) => {
      errors.push({
        message: detail.message,
        field: detail.context?.label || '',
      });
    });

    return responseHandler.validationError(res, null, errors);
  }

  next();
}

/**
 * Export all modules and utilities
 */
export {
  // Express
  express,
  router,
  Router,

  // Mongoose
  mongoose,
  MongooseSchema as Schema,
  BaseSchema,

  // Validation
  Joi,
  Validation,

  // Security
  bcrypt,
  jwt,
  SECRET_TOKEN,

  // HTTP utilities
  requestIp as request_ip,
  morgan,
  cookieParser as cookie_parser,

  // Node utilities
  fs,
  path,

  // Configuration
  configs,
  responseHandler as response,

  // Constants
  ROLES,
  PASSWORD_REGEX,
  ALLOWED_METHODS,
  SUPPORTED_LANGUAGES,
};

/**
 * Default export
 */
export default {
  express,
  router,
  mongoose,
  Schema: MongooseSchema,
  BaseSchema,
  Joi,
  Validation,
  bcrypt,
  jwt,
  SECRET_TOKEN,
  request_ip: requestIp,
  morgan,
  cookie_parser: cookieParser,
  fs,
  path,
  configs,
  response: responseHandler,
  ROLES,
  PASSWORD_REGEX,
  ALLOWED_METHODS,
  SUPPORTED_LANGUAGES,
};
