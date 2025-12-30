import BaseService from '../../../utils/bases/base.service';
import Upload from '../../models/upload.model';
import { IUpload, ServiceResponse } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploaded file data from multer
 */
interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  path: string;
  size: number;
}

/**
 * Upload statistics
 */
interface UploadStatistics {
  total_files: number;
  total_size: number;
  mimetype_stats: Record<string, number>;
}

/**
 * Upload filters for statistics
 */
interface UploadFilters {
  start_date?: string | Date;
  end_date?: string | Date;
  uploader?: string;
  mimetype?: string;
}

/**
 * File query parameters
 */
interface FileQuery {
  id?: string;
  filename?: string;
}

/**
 * Upload Service
 * Manages file upload operations and statistics
 */
class UploadService extends BaseService<IUpload> {
  private static instance: UploadService;

  private constructor() {
    if (UploadService.instance) {
      return UploadService.instance;
    }
    super(Upload);
    UploadService.instance = this;
  }

  /**
   * Get singleton instance
   * @returns UploadService instance
   */
  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * Upload a single file
   * @param file - Uploaded file data
   * @param userId - User ID of uploader
   * @param metadata - Additional metadata
   * @returns Created upload record
   */
  async upload(
    file: UploadedFile,
    userId?: string,
    metadata: Record<string, any> = {}
  ): Promise<ServiceResponse<IUpload>> {
    try {
      const payload = {
        id: uuidv4(),
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        uploader: userId || null,
        metadata,
      };
      const created = await this.model.create(payload as any);
      return { error: false, data: created };
    } catch (error: any) {
      return { error: true, message: error.message };
    }
  }

  /**
   * Upload multiple files
   * @param files - Array of uploaded file data
   * @param userId - User ID of uploader
   * @param metadata - Additional metadata
   * @returns Created upload records
   */
  async uploadMulti(
    files: UploadedFile[],
    userId?: string,
    metadata: Record<string, any> = {}
  ): Promise<ServiceResponse<IUpload[]>> {
    try {
      const payload = files.map((file) => ({
        id: uuidv4(),
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        uploader: userId || null,
        metadata,
      }));
      const created = await this.model.insertMany(payload as any);
      return { error: false, data: created as IUpload[] };
    } catch (error: any) {
      return { error: true, message: error.message };
    }
  }

  /**
   * Get upload statistics
   * @param filters - Filters for statistics
   * @returns Upload statistics
   */
  async getStats(filters: UploadFilters = {}): Promise<ServiceResponse<UploadStatistics>> {
    try {
      const match: any = {};
      if (filters.start_date || filters.end_date) {
        match.uploadDate = {};
        if (filters.start_date) match.uploadDate.$gte = new Date(filters.start_date);
        if (filters.end_date) match.uploadDate.$lte = new Date(filters.end_date);
      }
      if (filters.uploader) match.uploader = filters.uploader;
      if (filters.mimetype) match.mimetype = filters.mimetype;

      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: null as null,
            total_files: { $sum: 1 },
            total_size: { $sum: '$size' },
            mimetype_count: { $push: '$mimetype' },
          },
        },
        {
          $project: {
            total_files: 1,
            total_size: 1,
            mimetype_stats: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: ['$mimetype_count'] },
                  as: 'mt',
                  in: {
                    k: '$$mt',
                    v: {
                      $size: {
                        $filter: { input: '$mimetype_count', cond: { $eq: ['$$this', '$$mt'] } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ];

      const stats = await this.model.aggregate(pipeline);
      return { error: false, data: stats[0] || ({} as UploadStatistics) };
    } catch (error: any) {
      return { error: true, message: error.message };
    }
  }

  /**
   * Delete a file (soft delete by setting status)
   * @param query - File identifier (id or filename)
   * @returns Deleted file record
   */
  async deleteFile(query: FileQuery): Promise<ServiceResponse<IUpload>> {
    try {
      const searchQuery: any = {};
      if (query.id) searchQuery.id = query.id;
      if (query.filename) searchQuery.filename = query.filename;
      if (!query.id && !query.filename) {
        throw new Error('Please provide id or filename');
      }
      const file = await this.model.findOneAndUpdate(
        searchQuery,
        { status: 'deleted' } as any,
        { new: true }
      );
      if (!file) {
        return { error: true, message: 'File not found' };
      }
      return { error: false, data: file };
    } catch (error: any) {
      return { error: true, message: error.message };
    }
  }

  /**
   * Get file information
   * @param query - File identifier (id or filename)
   * @returns File record
   */
  async getFileInfo(query: FileQuery): Promise<ServiceResponse<IUpload>> {
    try {
      const searchQuery: any = {};
      if (query.id) searchQuery.id = query.id;
      if (query.filename) searchQuery.filename = query.filename;
      if (!query.id && !query.filename) {
        throw new Error('Please provide id or filename');
      }
      const file = await this.model.findOne(searchQuery);
      if (!file) {
        return { error: true, message: 'File not found' };
      }
      return { error: false, data: file };
    } catch (error: any) {
      return { error: true, message: error.message };
    }
  }
}

export default UploadService.getInstance();
