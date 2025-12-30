import BaseService from '../../../utils/bases/base.service';
import xApiKey from '../../models/auth/x-api-key.model';
import { IXApiKey } from '../../types';

/**
 * X-API-Key Service
 * Manages API key operations
 * Extends BaseService with IXApiKey document type
 */
class XApiKeyService extends BaseService<IXApiKey> {
  private static instance: XApiKeyService;

  private constructor() {
    if (XApiKeyService.instance) {
      return XApiKeyService.instance;
    }
    super(xApiKey);
    XApiKeyService.instance = this;
  }

  /**
   * Get singleton instance
   * @returns XApiKeyService instance
   */
  static getInstance(): XApiKeyService {
    if (!XApiKeyService.instance) {
      XApiKeyService.instance = new XApiKeyService();
    }
    return XApiKeyService.instance;
  }
}

export default XApiKeyService.getInstance();
