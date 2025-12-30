import { Model } from 'mongoose';
import { BaseSchema, Schema } from '../../../configs/app.config';
import { IXApiKey, XApiKeyStatus } from '../../types';

/**
 * X-API-Key schema definition
 */
const xApiKeySchema = {
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  keys: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: [XApiKeyStatus.ACTIVE, XApiKeyStatus.INACTIVE],
    required: false,
    default: XApiKeyStatus.INACTIVE,
  },
};

/**
 * X-API-Key model
 */
const XApiKey: Model<IXApiKey> = BaseSchema<IXApiKey>('x_api_keys', xApiKeySchema);

export default XApiKey;
