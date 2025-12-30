import { BaseDocument } from './service.types';
import { Types } from 'mongoose';

/**
 * Upload status enum
 */
export enum UploadStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  ARCHIVED = 'archived',
}

/**
 * Upload document interface
 */
export interface IUpload extends BaseDocument {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  uploader?: Types.ObjectId;
  uploadDate: Date;
  status: UploadStatus;
  metadata?: Record<string, any>;
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  destination?: string;
  filename?: string;
  maxSize?: number;
  allowedMimetypes?: string[];
}

/**
 * Uploaded file info
 */
export interface UploadedFileInfo {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}
