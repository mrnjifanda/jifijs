import { Model } from 'mongoose';
import { Schema, BaseSchema } from '../../configs/app.config';
import { IUpload } from '../types';

/**
 * Upload model
 */
const Upload: Model<IUpload> = BaseSchema<IUpload>('uploads', {
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  filename: {
    type: String,
    required: true,
    index: true,
  },
  originalname: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploader: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: false,
    index: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'deleted', 'archived'],
    default: 'active',
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
});

export default Upload;
