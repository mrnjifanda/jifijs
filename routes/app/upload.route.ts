import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { Router, Request, Response, NextFunction } from 'express';
import uploadController from '../../src/controllers/app/upload.controller';
import * as validation from '../../utils/validations/upload.validation';
import { response } from '../../configs/app.config';

const router = Router();

const uploadPath = path.join(__dirname, '../../public/upload/');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadPath);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const sanitizedFieldname = file.fieldname.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, sanitizedFieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter to validate mime types
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allowed mime types (images, documents, videos)
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'application/zip',
    'application/x-rar-compressed',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10, // Maximum 10 files for multi-upload
  },
});

// Multer error handler middleware
const handleMulterError = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return response.failed(res, next, 'File size exceeds the limit of 10MB', 400);
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return response.failed(res, next, 'Too many files. Maximum 10 files allowed', 400);
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return response.failed(res, next, 'Unexpected field in file upload', 400);
    }

    return response.failed(res, next, `Upload error: ${err.message}`, 400);
  }

  if (err) {
    return response.failed(res, next, err.message || 'An error occurred during file upload', 400);
  }

  next();
};

router.post(
  '/upload',
  upload.single('file'),
  handleMulterError,
  validation.upload,
  uploadController.upload
);

router.post(
  '/upload-multi',
  upload.array('files'),
  handleMulterError,
  validation.uploadMulti,
  uploadController.uploadMulti
);

router.get('/stats', validation.getStats, uploadController.getStats);
router.post('/delete', validation.deleteFile, uploadController.deleteFile);
router.get('/info', validation.getFileInfo, uploadController.getFileInfo);

export default router;
