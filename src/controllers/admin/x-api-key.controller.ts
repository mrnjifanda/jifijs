import { Request, Response, NextFunction } from 'express';
import BaseController from '../../../utils/bases/base.controller';
import xApiKeyService from '../../services/admin/x-api-key.service';

/**
 * X-API-Key Controller
 * Manages API key endpoints
 */
class XApiKeyController extends BaseController {
  private static instance: XApiKeyController;

  private constructor() {
    if (XApiKeyController.instance) {
      return XApiKeyController.instance;
    }
    super();
    XApiKeyController.instance = this;
  }

  /**
   * Get singleton instance
   * @returns XApiKeyController instance
   */
  static getInstance(): XApiKeyController {
    if (!XApiKeyController.instance) {
      XApiKeyController.instance = new XApiKeyController();
    }
    return XApiKeyController.instance;
  }

  /**
   * Find all API keys with pagination
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async find(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { page = 1, limit = 10, ...filters } = req.query;
    const keys = await xApiKeyService.paginate(filters, Number(page), Number(limit));

    if (keys.error) {
      return super.failed(res, 'Find all keys error', keys.data);
    }

    return super.success(res, 'All keys', keys.data);
  }

  /**
   * Create a new API key
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async create(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = req.body;
    const create = await xApiKeyService.create(data);

    if (create.error) {
      return super.failed(res, 'Creation error', create.data);
    }

    return super.success(res, 'Key created successfully', create.data);
  }

  /**
   * Update an API key
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async update(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { page = 1, limit = 10, ...filters } = req.query;
    const keys = await xApiKeyService.paginate(filters, Number(page), Number(limit));

    if (keys.error) {
      return super.failed(res, 'Find all keys error', keys.data);
    }

    return super.success(res, 'All keys', keys.data);
  }
}

export default XApiKeyController.getInstance();
