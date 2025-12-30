import { Model } from 'mongoose';
import { BaseSchema } from '../../../configs/app.config';
import { IUser } from '../../types';

/**
 * User schema definition
 */
const userSchema = {
  last_name: {
    type: String,
    required: false,
    default: null as string | null,
  },
  first_name: {
    type: String,
    required: false,
    default: null as string | null,
  },
  username: {
    type: String,
    required: false,
    default: null as string | null,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
};

/**
 * User model
 */
const User: Model<IUser> = BaseSchema<IUser>('users', userSchema);

export default User;
