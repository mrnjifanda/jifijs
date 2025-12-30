/**
 * OpenAPI Documentation for Admin User Management routes
 * Corresponds to: routes/admin/user.route.ts
 */

import OpenAPIHelper from '../../utils/helpers/openapi.helper';
import { RouteDocumentation } from '../../src/types/openapi.types';

export const documentation: RouteDocumentation = OpenAPIHelper.createRouteDoc(
  // Paths
  OpenAPIHelper.mergePaths(
    // GET /admin/users
    OpenAPIHelper.GET('/admin/users', {
      tags: ['Admin - Users'],
      summary: 'List all users',
      description: 'Retrieve all users with pagination',
      operationId: 'getAllUsers',
      security: OpenAPIHelper.security.both,
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          required: false,
          schema: { type: 'integer', example: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          required: false,
          schema: { type: 'integer', example: 10 },
        },
      ],
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
      },
    }),

    // GET /admin/users/search
    OpenAPIHelper.GET('/admin/users/search', {
      tags: ['Admin - Users'],
      summary: 'Search users',
      description: 'Search users by email, username, or name',
      operationId: 'searchUsers',
      security: OpenAPIHelper.security.both,
      parameters: [
        {
          name: 'q',
          in: 'query',
          description: 'Search query',
          required: true,
          schema: { type: 'string', example: 'john' },
        },
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          required: false,
          schema: { type: 'integer', example: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          required: false,
          schema: { type: 'integer', example: 10 },
        },
      ],
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
      },
    }),

    // GET /admin/users/stats
    OpenAPIHelper.GET('/admin/users/stats', {
      tags: ['Admin - Users'],
      summary: 'Get user statistics',
      description: 'Retrieve comprehensive user statistics and metrics',
      operationId: 'getUserStats',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
      },
    }),

    // GET /admin/users/activity
    OpenAPIHelper.GET('/admin/users/activity', {
      tags: ['Admin - Users'],
      summary: 'Get recent user activity',
      description: 'Retrieve recent user activities and actions',
      operationId: 'getRecentActivity',
      security: OpenAPIHelper.security.both,
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'Number of activities to retrieve',
          required: false,
          schema: { type: 'integer', example: 20 },
        },
      ],
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
      },
    }),

    // GET /admin/users/export
    OpenAPIHelper.GET('/admin/users/export', {
      tags: ['Admin - Users'],
      summary: 'Export users data',
      description: 'Export users data in CSV or Excel format',
      operationId: 'exportUsers',
      security: OpenAPIHelper.security.both,
      parameters: [
        {
          name: 'format',
          in: 'query',
          description: 'Export format',
          required: false,
          schema: { type: 'string', enum: ['csv', 'excel'], example: 'csv' },
        },
      ],
      responses: {
        '200': {
          description: 'File download',
          content: {
            'text/csv': { schema: { type: 'string', format: 'binary' } },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
      },
    }),

    // POST /admin/users/create
    OpenAPIHelper.POST('/admin/users/create', {
      tags: ['Admin - Users'],
      summary: 'Create a new user',
      description: 'Admin creates a new user account',
      operationId: 'createUser',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'role'],
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                password: { type: 'string', format: 'password', example: 'PassWORD@2025' },
                password_confirm: { type: 'string', format: 'password', example: 'PassWORD@2025' },
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                username: { type: 'string', example: 'johndoe' },
                role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
              },
            },
          },
        },
      },
      responses: {
        '201': OpenAPIHelper.responses.Created,
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // GET /admin/users/find/:id
    {
      '/admin/users/find/{id}': {
        get: {
          tags: ['Admin - Users'],
          summary: 'Get user by ID',
          description: 'Retrieve detailed user information',
          operationId: 'getUserById',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID (MongoDB ObjectId)',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
          },
        },
      },
    },

    // PUT /admin/users/update/:id
    {
      '/admin/users/update/{id}': {
        put: {
          tags: ['Admin - Users'],
          summary: 'Update user',
          description: 'Update user information',
          operationId: 'updateUser',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    first_name: { type: 'string' },
                    last_name: { type: 'string' },
                    username: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
            '422': OpenAPIHelper.responses.ValidationError,
          },
        },
      },
    },

    // DELETE /admin/users/delete/:id
    {
      '/admin/users/delete/{id}': {
        delete: {
          tags: ['Admin - Users'],
          summary: 'Deactivate user (soft delete)',
          description: 'Soft delete user account (can be reactivated)',
          operationId: 'deactivateUser',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
          },
        },
      },
    },

    // DELETE /admin/users/delete/:id/permanent
    {
      '/admin/users/delete/{id}/permanent': {
        delete: {
          tags: ['Admin - Users'],
          summary: 'Permanently delete user',
          description: 'Permanently delete user account (irreversible)',
          operationId: 'permanentlyDeleteUser',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
          },
        },
      },
    },

    // PUT /admin/users/reactivate/:id
    {
      '/admin/users/reactivate/{id}': {
        put: {
          tags: ['Admin - Users'],
          summary: 'Reactivate user',
          description: 'Reactivate a deactivated user account',
          operationId: 'reactivateUser',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
          },
        },
      },
    },

    // PUT /admin/users/role/:id
    {
      '/admin/users/role/{id}': {
        put: {
          tags: ['Admin - Users'],
          summary: 'Update user role',
          description: 'Change user role (USER/ADMIN)',
          operationId: 'updateUserRole',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'ADMIN' },
                  },
                },
              },
            },
          },
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
            '422': OpenAPIHelper.responses.ValidationError,
          },
        },
      },
    },

    // PUT /admin/users/reset-password/:id
    {
      '/admin/users/reset-password/{id}': {
        put: {
          tags: ['Admin - Users'],
          summary: 'Reset user password',
          description: 'Admin resets a user password',
          operationId: 'resetUserPassword',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['password', 'password_confirm'],
                  properties: {
                    password: { type: 'string', format: 'password', example: 'NewPassWORD@2025' },
                    password_confirm: {
                      type: 'string',
                      format: 'password',
                      example: 'NewPassWORD@2025',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
            '422': OpenAPIHelper.responses.ValidationError,
          },
        },
      },
    },

    // POST /admin/users/force-logout/:id
    {
      '/admin/users/force-logout/{id}': {
        post: {
          tags: ['Admin - Users'],
          summary: 'Force logout user',
          description: 'Force user logout by invalidating all tokens',
          operationId: 'forceLogoutUser',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
          },
        },
      },
    },

    // POST /admin/users/send-email/:id
    {
      '/admin/users/send-email/{id}': {
        post: {
          tags: ['Admin - Users'],
          summary: 'Send email to user',
          description: 'Send a custom email to a specific user',
          operationId: 'sendEmailToUser',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['subject', 'message'],
                  properties: {
                    subject: { type: 'string', example: 'Important notification' },
                    message: { type: 'string', example: 'Your account has been updated.' },
                  },
                },
              },
            },
          },
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
            '422': OpenAPIHelper.responses.ValidationError,
          },
        },
      },
    },

    // POST /admin/users/bulk-email
    OpenAPIHelper.POST('/admin/users/bulk-email', {
      tags: ['Admin - Users'],
      summary: 'Send bulk email',
      description: 'Send email to multiple users',
      operationId: 'sendBulkEmail',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['user_ids', 'subject', 'message'],
              properties: {
                user_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
                },
                subject: { type: 'string', example: 'System announcement' },
                message: { type: 'string', example: 'Important system update notification.' },
              },
            },
          },
        },
      },
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    })
  ),
  // Components (optional)
  undefined,
  // Tags
  [{ name: 'Admin - Users', description: 'Admin endpoints for comprehensive user management' }]
);
