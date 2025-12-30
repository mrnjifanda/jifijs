import { Model } from 'mongoose';
import { BaseSchema, Schema } from '../../../configs/app.config';
import { ILoginHistory } from '../../types';

/**
 * Login history schema definition with TTL (Time-To-Live)
 * Automatically deletes records older than 90 days
 */
const loginHistorySchema = {
  auth: {
    type: Schema.Types.ObjectId,
    ref: 'auth',
    required: true,
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true,
  },
  ip: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  refresh_token: {
    type: String,
    required: true,
    index: true,
  },
  login_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
  locations: {
    country: { type: String, required: false },
    city: { type: String, required: false },
    region: { type: String, required: false },
    timezone: { type: String, required: false },
    ll: { type: [Number], required: false },
  },
  devices: {
    browser: {
      name: { type: String, required: false },
      version: { type: String, required: false },
      major: { type: String, required: false },
    },
    os: {
      name: { type: String, required: false },
      version: { type: String, required: false },
    },
    platform: { type: String, required: false },
    source: { type: String, required: false },
  },
  user_agent: {
    type: String,
    required: false,
  },
};

/**
 * Create the login history model
 */
const LoginHistory: Model<ILoginHistory> = BaseSchema<ILoginHistory>(
  'login_histories',
  loginHistorySchema
);

// Create indexes for efficient queries
LoginHistory.schema.index({ auth: 1, login_at: -1 });
LoginHistory.schema.index({ user: 1, login_at: -1 });
LoginHistory.schema.index({ refresh_token: 1 });

// Create TTL index (MongoDB will auto-delete expired documents after 90 days)
LoginHistory.schema.index({ login_at: 1 }, { expireAfterSeconds: 7776000 });

export default LoginHistory;
