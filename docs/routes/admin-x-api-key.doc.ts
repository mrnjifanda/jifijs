/**
 * OpenAPI Documentation for Admin X-API-Key Management routes
 * Corresponds to: routes/admin/x-api-key.route.ts
 */

import OpenAPIHelper from '../../utils/helpers/openapi.helper';
import { RouteDocumentation } from '../../src/types/openapi.types';

export const documentation: RouteDocumentation = OpenAPIHelper.createRouteDoc(
  // Paths
  OpenAPIHelper.mergePaths(
    // GET /admin/x-api-key/find
    OpenAPIHelper.GET('/admin/x-api-key/find', {
      tags: ['Admin - API Keys'],
      summary: 'Get current API key',
      description: 'Retrieve the current X-API-Key configuration',
      operationId: 'findApiKey',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': {
          description: 'API key retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  data: {
                    type: 'object',
                    properties: {
                      key: { type: 'string', example: 'xxxx-xxxx-xxxx-xxxx' },
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
        '403': OpenAPIHelper.responses.Forbidden,
        '404': OpenAPIHelper.responses.NotFound,
      },
    }),

    // POST /admin/x-api-key/create
    OpenAPIHelper.POST('/admin/x-api-key/create', {
      tags: ['Admin - API Keys'],
      summary: 'Create new API key',
      description: 'Generate a new X-API-Key for the application',
      operationId: 'createApiKey',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Optional description for the API key',
                  example: 'Production API key',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'API key created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'API key created successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      key: { type: 'string', example: 'new-generated-api-key' },
                      created_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
      },
    }),

    // PUT /admin/x-api-key/update
    OpenAPIHelper.PUT('/admin/x-api-key/update', {
      tags: ['Admin - API Keys'],
      summary: 'Update API key',
      description: 'Regenerate or update the X-API-Key',
      operationId: 'updateApiKey',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                regenerate: {
                  type: 'boolean',
                  description: 'Whether to regenerate a new key',
                  example: true,
                },
                description: {
                  type: 'string',
                  description: 'Update the description',
                  example: 'Updated API key description',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'API key updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'API key updated successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      key: { type: 'string', example: 'updated-api-key' },
                      updated_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
        '404': OpenAPIHelper.responses.NotFound,
      },
    })
  ),
  // Components (optional)
  undefined,
  // Tags
  [
    {
      name: 'Admin - API Keys',
      description: 'Admin endpoints for X-API-Key management and regeneration',
    },
  ]
);
