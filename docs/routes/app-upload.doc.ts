/**
 * OpenAPI Documentation for Upload routes
 * Corresponds to: routes/app/upload.route.ts
 */

import OpenAPIHelper from '../../utils/helpers/openapi.helper';
import { RouteDocumentation } from '../../src/types/openapi.types';

export const documentation: RouteDocumentation = OpenAPIHelper.createRouteDoc(
  // Paths
  OpenAPIHelper.mergePaths(
    // POST /app/upload/upload
    OpenAPIHelper.POST('/app/upload/upload', {
      tags: ['Upload'],
      summary: 'Upload single file',
      description: 'Upload a single file to the server',
      operationId: 'uploadFile',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'File to upload',
                },
                metadata: {
                  type: 'object',
                  description: 'Optional metadata for the file',
                  properties: {
                    description: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'File uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'File uploaded successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      filename: { type: 'string', example: 'file-1234567890.jpg' },
                      originalname: { type: 'string', example: 'photo.jpg' },
                      mimetype: { type: 'string', example: 'image/jpeg' },
                      size: { type: 'integer', example: 102400 },
                      path: { type: 'string', example: '/uploads/file-1234567890.jpg' },
                      uploaded_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': OpenAPIHelper.responses.BadRequest,
        '401': OpenAPIHelper.responses.Unauthorized,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // POST /app/upload/upload-multi
    OpenAPIHelper.POST('/app/upload/upload-multi', {
      tags: ['Upload'],
      summary: 'Upload multiple files',
      description: 'Upload multiple files at once',
      operationId: 'uploadMultipleFiles',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['files'],
              properties: {
                files: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                  description: 'Array of files to upload',
                },
                metadata: {
                  type: 'object',
                  description: 'Optional metadata for all files',
                  properties: {
                    description: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Files uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Files uploaded successfully' },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        filename: { type: 'string' },
                        originalname: { type: 'string' },
                        mimetype: { type: 'string' },
                        size: { type: 'integer' },
                        path: { type: 'string' },
                        uploaded_at: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '400': OpenAPIHelper.responses.BadRequest,
        '401': OpenAPIHelper.responses.Unauthorized,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // GET /app/upload/stats
    OpenAPIHelper.GET('/app/upload/stats', {
      tags: ['Upload'],
      summary: 'Get upload statistics',
      description: 'Retrieve statistics about uploaded files',
      operationId: 'getUploadStats',
      security: OpenAPIHelper.security.both,
      parameters: [
        {
          name: 'start_date',
          in: 'query',
          description: 'Start date for statistics (ISO 8601)',
          required: false,
          schema: { type: 'string', format: 'date-time' },
        },
        {
          name: 'end_date',
          in: 'query',
          description: 'End date for statistics (ISO 8601)',
          required: false,
          schema: { type: 'string', format: 'date-time' },
        },
        {
          name: 'user_id',
          in: 'query',
          description: 'Filter by specific user',
          required: false,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  data: {
                    type: 'object',
                    properties: {
                      total_files: { type: 'integer', example: 150 },
                      total_size: { type: 'integer', example: 52428800 },
                      files_by_type: {
                        type: 'object',
                        additionalProperties: { type: 'integer' },
                        example: { 'image/jpeg': 50, 'application/pdf': 30 },
                      },
                      uploads_today: { type: 'integer', example: 5 },
                    },
                  },
                },
              },
            },
          },
        },
        '401': OpenAPIHelper.responses.Unauthorized,
      },
    }),

    // POST /app/upload/delete
    OpenAPIHelper.POST('/app/upload/delete', {
      tags: ['Upload'],
      summary: 'Delete uploaded file',
      description: 'Delete a previously uploaded file',
      operationId: 'deleteUploadedFile',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['file_id'],
              properties: {
                file_id: {
                  type: 'string',
                  description: 'File ID to delete',
                  example: '507f1f77bcf86cd799439011',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '404': OpenAPIHelper.responses.NotFound,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // GET /app/upload/info
    OpenAPIHelper.GET('/app/upload/info', {
      tags: ['Upload'],
      summary: 'Get file information',
      description: 'Retrieve detailed information about an uploaded file',
      operationId: 'getFileInfo',
      security: OpenAPIHelper.security.both,
      parameters: [
        {
          name: 'file_id',
          in: 'query',
          required: true,
          description: 'File ID',
          schema: { type: 'string', example: '507f1f77bcf86cd799439011' },
        },
      ],
      responses: {
        '200': {
          description: 'File information retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      filename: { type: 'string' },
                      originalname: { type: 'string' },
                      mimetype: { type: 'string' },
                      size: { type: 'integer' },
                      path: { type: 'string' },
                      uploader: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          name: { type: 'string' },
                        },
                      },
                      metadata: { type: 'object' },
                      uploaded_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': OpenAPIHelper.responses.Unauthorized,
        '404': OpenAPIHelper.responses.NotFound,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    })
  ),
  // Components (optional)
  undefined,
  // Tags
  [{ name: 'Upload', description: 'File upload and management endpoints' }]
);
