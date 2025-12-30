/**
 * OpenAPI Documentation for Authentication routes
 * Corresponds to: routes/auth.route.ts
 */

import OpenAPIHelper from '../../utils/helpers/openapi.helper';
import { RouteDocumentation } from '../../src/types/openapi.types';

export const documentation: RouteDocumentation = OpenAPIHelper.createRouteDoc(
  // Paths
  OpenAPIHelper.mergePaths(
    // POST /auth/register
    OpenAPIHelper.POST('/auth/register', {
      tags: ['Authentication'],
      summary: 'Register a new user',
      description: 'Create a new user account with email and password',
      operationId: 'register',
      security: OpenAPIHelper.security.apiKey,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'password_confirm', 'first_name', 'last_name'],
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                password: {
                  type: 'string',
                  format: 'password',
                  example: 'PassWORD@2025',
                  description: 'Must contain: lowercase, uppercase, digit, special char (3-30 chars)',
                },
                password_confirm: { type: 'string', format: 'password', example: 'PassWORD@2025' },
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                username: { type: 'string', example: 'johndoe' },
              },
            },
          },
        },
      },
      responses: {
        '201': OpenAPIHelper.responses.Created,
        '400': OpenAPIHelper.responses.BadRequest,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // POST /auth/activate-account
    OpenAPIHelper.POST('/auth/activate-account', {
      tags: ['Authentication'],
      summary: 'Activate user account',
      description: 'Activate a user account using the OTP sent by email',
      operationId: 'activateAccount',
      security: OpenAPIHelper.security.apiKey,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'code'],
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                code: { type: 'string', example: '123456', description: '6-digit confirmation code' },
              },
            },
          },
        },
      },
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '400': OpenAPIHelper.responses.BadRequest,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // POST /auth/login
    OpenAPIHelper.POST('/auth/login', {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user with email and password, returns JWT tokens',
      operationId: 'login',
      security: OpenAPIHelper.security.apiKey,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                password: { type: 'string', format: 'password', example: 'PassWORD@2025' },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Login successful' },
                  data: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          first_name: { type: 'string' },
                          last_name: { type: 'string' },
                          role: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': OpenAPIHelper.responses.Unauthorized,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // POST /auth/verify-auth
    OpenAPIHelper.POST('/auth/verify-auth', {
      tags: ['Authentication'],
      summary: 'Verify authentication',
      description: 'Verify if the current JWT token is valid',
      operationId: 'verifyAuth',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
      },
    }),

    // POST /auth/refresh-token
    OpenAPIHelper.POST('/auth/refresh-token', {
      tags: ['Authentication'],
      summary: 'Refresh access token',
      description: 'Get a new access token using refresh token',
      operationId: 'refreshToken',
      security: OpenAPIHelper.security.apiKey,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'code'],
              properties: {
                email: { type: 'string', format: 'email' },
                code: { type: 'string', description: 'Refresh token code' },
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

    // POST /auth/forgot-password
    OpenAPIHelper.POST('/auth/forgot-password', {
      tags: ['Authentication'],
      summary: 'Request password reset',
      description: 'Send password reset OTP to user email',
      operationId: 'forgotPassword',
      security: OpenAPIHelper.security.apiKey,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
              },
            },
          },
        },
      },
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '404': OpenAPIHelper.responses.NotFound,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // POST /auth/verify-otp
    OpenAPIHelper.POST('/auth/verify-otp', {
      tags: ['Authentication'],
      summary: 'Verify OTP code',
      description: 'Verify OTP code for password reset',
      operationId: 'verifyOtp',
      security: OpenAPIHelper.security.apiKey,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'code'],
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                code: { type: 'string', example: '123456' },
              },
            },
          },
        },
      },
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '400': OpenAPIHelper.responses.BadRequest,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // PUT /auth/reset-password
    OpenAPIHelper.PUT('/auth/reset-password', {
      tags: ['Authentication'],
      summary: 'Reset password',
      description: 'Reset user password with verified OTP',
      operationId: 'resetPassword',
      security: OpenAPIHelper.security.apiKey,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'otp', 'password', 'password_confirm'],
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                otp: { type: 'string', example: '123456' },
                password: { type: 'string', format: 'password', example: 'NewPassWORD@2025' },
                password_confirm: { type: 'string', format: 'password', example: 'NewPassWORD@2025' },
              },
            },
          },
        },
      },
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '400': OpenAPIHelper.responses.BadRequest,
        '422': OpenAPIHelper.responses.ValidationError,
      },
    }),

    // GET /auth/its-not-me/:email
    {
      '/auth/its-not-me/{email}': {
        get: {
          tags: ['Authentication'],
          summary: 'Report unauthorized activity',
          description: 'Report unauthorized login attempt or account activity',
          operationId: 'itsNotMe',
          security: OpenAPIHelper.security.apiKey,
          parameters: [
            {
              name: 'email',
              in: 'path',
              required: true,
              description: 'User email address',
              schema: { type: 'string', format: 'email' },
            },
          ],
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '404': OpenAPIHelper.responses.NotFound,
          },
        },
      },
    }
  ),
  // Components (optional) - can add shared schemas here
  undefined,
  // Tags
  [{ name: 'Authentication', description: 'Authentication and authorization endpoints' }]
);
