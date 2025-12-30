import { Model } from 'mongoose';
import { Schema, BaseSchema } from '../../configs/app.config';
import { ILog, HttpMethod } from '../types';

/**
 * Log model
 */
const Log: Model<ILog> = BaseSchema<ILog>(
  'logs',
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: {
      type: String,
      required: false,
      index: true,
    },
    user_agent: {
      type: String,
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: false,
      index: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as HttpMethod[],
    },
    hostname: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: true,
      index: true,
    },
    route: {
      type: String,
      required: false,
    },
    status_code: {
      type: Number,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'read', 'update', 'delete', 'auth', 'subscribe', 'unsubscribe', 'unknown'],
      index: true,
    },
    entity: {
      type: String,
      required: false,
      index: true,
    },
    details: {
      params: { type: Schema.Types.Mixed, default: {} },
      query: { type: Schema.Types.Mixed, default: {} },
      headers: { type: Schema.Types.Mixed, default: {} },
      body: { type: Schema.Types.Mixed, default: {} },
    },
    request_body: {
      type: Object,
      require: true,
      default: {},
    },
    response_body: {
      type: Schema.Types.Mixed,
      default: {},
    },
    execution_time: {
      type: Number,
      required: false,
    },
    request_size: {
      type: Number,
      default: 0,
    },
    error: {
      code: Number,
      message: String,
    },
    session_id: {
      type: String,
      required: false,
      index: true,
    },
    correlation_id: {
      type: String,
      required: false,
      index: true,
    },
  },
  {
    index: [
      { timestamp: -1, status_code: 1 },
      { user: 1, timestamp: -1 },
      { action: 1, entity: 1 },
      { ip: 1, timestamp: -1 },
    ],
  }
);

export default Log;
