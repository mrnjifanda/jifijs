import { Request, Response, NextFunction } from 'express';
import BaseController from '../../utils/bases/base.controller';
import { configs } from '../../configs/app.config';

/**
 * Index Controller
 * Handles root API endpoints
 */
class IndexController extends BaseController {
  private static instance: IndexController;

  private constructor() {
    if (IndexController.instance) {
      return IndexController.instance;
    }
    super();
    IndexController.instance = this;
  }

  /**
   * Get singleton instance
   * @returns IndexController instance
   */
  static getInstance(): IndexController {
    if (!IndexController.instance) {
      IndexController.instance = new IndexController();
    }
    return IndexController.instance;
  }

  /**
   * Welcome endpoint
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  welcome(_req: Request, res: Response, _next: NextFunction): void {
    return super.success(res, 'Welcome to API', configs.getAppInfo());
  }
}

export default IndexController.getInstance();
