/**
 * OpenAPI Documentation for User Profile routes
 * Corresponds to: routes/app/user.route.ts
 */

import OpenAPIHelper from '../../utils/helpers/openapi.helper';
import { RouteDocumentation } from '../../src/types/openapi.types';

export const documentation: RouteDocumentation = OpenAPIHelper.createRouteDoc(
  // Paths
  OpenAPIHelper.mergePaths(
    // GET /app/user/profile
    OpenAPIHelper.GET('/app/user/profile', {
      tags: ['User'],
      summary: 'Get user profile',
      description: 'Retrieve current authenticated user profile information',
      operationId: 'getUserProfile',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': {
          description: 'Profile retrieved successfully',
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
                      email: { type: 'string', format: 'email' },
                      first_name: { type: 'string' },
                      last_name: { type: 'string' },
                      username: { type: 'string' },
                      role: { type: 'string', enum: ['USER', 'ADMIN'] },
                      created_at: { type: 'string', format: 'date-time' },
                      updated_at: { type: 'string', format: 'date-time' },
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

    // PUT /app/user/profile
    OpenAPIHelper.PUT('/app/user/profile', {
      tags: ['User'],
      summary: 'Update user profile',
      description: 'Update current user profile information',
      operationId: 'updateUserProfile',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                username: { type: 'string', example: 'johndoe' },
                email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
              },
            },
          },
        },
      },
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // PUT /app/user/change-password
    OpenAPIHelper.PUT('/app/user/change-password', {
      tags: ['User'],
      summary: 'Change password',
      description: 'Change current user password',
      operationId: 'changePassword',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['current_password', 'new_password', 'new_password_confirm'],
              properties: {
                current_password: {
                  type: 'string',
                  format: 'password',
                  example: 'CurrentPassWORD@2025',
                },
                new_password: {
                  type: 'string',
                  format: 'password',
                  example: 'NewPassWORD@2025',
                  description: 'Must contain: lowercase, uppercase, digit, special char (3-30 chars)',
                },
                new_password_confirm: {
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
        '400': OpenAPIHelper.responses.BadRequest,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // GET /app/user/login-history
    OpenAPIHelper.GET('/app/user/login-history', {
      tags: ['User'],
      summary: 'Get login history',
      description: 'Retrieve login history for current user',
      operationId: 'getLoginHistory',
      security: OpenAPIHelper.security.both,
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'Number of records to retrieve',
          required: false,
          schema: { type: 'integer', example: 10 },
        },
      ],
      responses: {
        '200': {
          description: 'Login history retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        login_at: { type: 'string', format: 'date-time' },
                        ip_address: { type: 'string', example: '192.168.1.1' },
                        user_agent: { type: 'string' },
                        location: { type: 'string', example: 'Paris, France' },
                      },
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

    // POST /app/user/logout-other-devices
    OpenAPIHelper.POST('/app/user/logout-other-devices', {
      tags: ['User'],
      summary: 'Logout from other devices',
      description: 'Logout from all other devices except the current one',
      operationId: 'logoutOtherDevices',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
      },
    }),

    // DELETE /app/user/account
    OpenAPIHelper.DELETE('/app/user/account', {
      tags: ['User'],
      summary: 'Delete account',
      description: 'Delete (deactivate) current user account',
      operationId: 'deleteAccount',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password'],
              properties: {
                password: {
                  type: 'string',
                  format: 'password',
                  description: 'Current password for confirmation',
                  example: 'PassWORD@2025',
                },
                reason: {
                  type: 'string',
                  description: 'Optional reason for account deletion',
                  example: 'No longer need the service',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '400': OpenAPIHelper.responses.BadRequest,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // GET /app/user/account/stats
    OpenAPIHelper.GET('/app/user/account/stats', {
      tags: ['User'],
      summary: 'Get account statistics',
      description: 'Retrieve statistics and metrics for current user account',
      operationId: 'getAccountStats',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': {
          description: 'Account statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  data: {
                    type: 'object',
                    properties: {
                      total_logins: { type: 'integer', example: 150 },
                      last_login: { type: 'string', format: 'date-time' },
                      account_age_days: { type: 'integer', example: 365 },
                      uploads_count: { type: 'integer', example: 25 },
                      storage_used: { type: 'integer', example: 52428800 },
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

    // GET /app/user/account/export
    OpenAPIHelper.GET('/app/user/account/export', {
      tags: ['User'],
      summary: 'Export user data',
      description: 'Export all user data in JSON format (GDPR compliance)',
      operationId: 'exportUserData',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': {
          description: 'User data export',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  data: {
                    type: 'object',
                    properties: {
                      profile: { type: 'object' },
                      login_history: { type: 'array', items: { type: 'object' } },
                      uploads: { type: 'array', items: { type: 'object' } },
                      activities: { type: 'array', items: { type: 'object' } },
                      exported_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': OpenAPIHelper.responses.Unauthorized,
      },
    })
  ),
  // Components (optional)
  undefined,
  // Tags
  [{ name: 'User', description: 'User profile management and account operations' }]
);
