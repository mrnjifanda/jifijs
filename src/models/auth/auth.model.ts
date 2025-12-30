import { Model } from 'mongoose';
import { BaseSchema, ROLES, Schema } from '../../../configs/app.config';
import { IAuth } from '../../types';

/**
 * Auth schema definition
 */
const authSchema = {
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  passwords: {
    type: [String],
    required: true,
    default: [] as string[],
  },
  confirmation_token: {
    type: String,
    required: false,
    default: null as string | null,
  },
  confirmed_at: {
    type: Date,
    required: false,
    default: null as Date | null,
  },
  remember_token: {
    type: String,
    required: false,
    default: null as string | null,
  },
  reset_password_token: {
    type: String,
    required: false,
    default: null as string | null,
  },
  reset_password_at: {
    type: Date,
    required: false,
    default: null as Date | null,
  },
  role: {
    type: String,
    enum: ROLES,
    required: false,
    default: ROLES[0],
  },
};

/**
 * Auth model
 */
const Auth: Model<IAuth> = BaseSchema<IAuth>('auth', authSchema);

export default Auth;
