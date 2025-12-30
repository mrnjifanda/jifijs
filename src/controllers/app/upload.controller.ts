import { Request, Response, NextFunction } from 'express';
import BaseController from '../../../utils/bases/base.controller';
import uploadService from '../../services/admin/upload.service';

/**
 * Upload Controller
 * Handles file upload operations
 */
class UploadController extends BaseController {
  private static instance: UploadController;

  private constructor() {
    if (UploadController.instance) {
      return UploadController.instance;
    }
    super();
    UploadController.instance = this;
  }

  /**
   * Get singleton instance
   * @returns UploadController instance
   */
  static getInstance(): UploadController {
    if (!UploadController.instance) {
      UploadController.instance = new UploadController();
    }
    return UploadController.instance;
  }

  /**
   * Upload a single file
   * @param req - Express request with file
   * @param res - Express response
   * @param next - Express next function
   */
  async upload(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const file = (req as any).file;
      const user = (req as any).auth ? (req as any).auth._id : undefined;
      const ret = await uploadService.upload(file, user, req.body.metadata || {});

      if (ret.error) {
        return super.failed(res, 'Upload file failed', ret.message);
      }

      return super.success(res, 'File uploaded', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Upload multiple files
   * @param req - Express request with files
   * @param res - Express response
   * @param next - Express next function
   */
  async uploadMulti(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const files = (req as any).files;
      const user = (req as any).auth ? (req as any).auth._id : undefined;
      const ret = await uploadService.uploadMulti(files, user, req.body.metadata || {});

      if (ret.error) {
        return super.failed(res, 'Upload files failed', ret.message);
      }

      return super.success(res, 'Files uploaded', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Get upload statistics
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const ret = await uploadService.getStats(req.query as any);

      if (ret.error) {
        return super.failed(res, 'Get stats failed', ret.message);
      }

      return super.success(res, 'Stats retrieved', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Delete a file
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async deleteFile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const ret = await uploadService.deleteFile({
        id: req.body.id,
        filename: req.body.filename
      });

      if (ret.error) {
        return super.failed(res, 'Delete file failed', ret.message);
      }

      return super.success(res, 'File deleted', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Get file information
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getFileInfo(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const ret = await uploadService.getFileInfo({
        id: req.query.id as string,
        filename: req.query.filename as string
      });

      if (ret.error) {
        return super.failed(res, 'Get file info failed', ret.message);
      }

      return super.success(res, 'File info', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }
}

export default UploadController.getInstance();
