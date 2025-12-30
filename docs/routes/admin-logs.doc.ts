/**
 * OpenAPI Documentation for Admin Logs routes
 * Corresponds to: routes/admin/logs.route.ts
 */

import OpenAPIHelper from '../../utils/helpers/openapi.helper';
import { RouteDocumentation } from '../../src/types/openapi.types';

export const documentation: RouteDocumentation = OpenAPIHelper.createRouteDoc(
  // Paths
  OpenAPIHelper.mergePaths(
    // GET /admin/logs/queue/:service
    {
      '/admin/logs/queue/{service}': {
        get: {
          tags: ['Admin - Logs'],
          summary: 'Get queue information for a service',
          description: 'Retrieve queue status and pending jobs for a specific service',
          operationId: 'getLogsQueue',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'service',
              in: 'path',
              required: true,
              description: 'Service name (e.g., mail, sms)',
              schema: { type: 'string', example: 'mail' },
            },
          ],
          responses: {
            '200': OpenAPIHelper.responses.Success,
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
          },
        },
      },
    },

    // GET /admin/logs/statistics
    OpenAPIHelper.GET('/admin/logs/statistics', {
      tags: ['Admin - Logs'],
      summary: 'Get logs statistics',
      description: 'Retrieve comprehensive statistics about system logs',
      operationId: 'getLogsStatistics',
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
      ],
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
      },
    }),

    // GET /admin/logs
    OpenAPIHelper.GET('/admin/logs', {
      tags: ['Admin - Logs'],
      summary: 'List all logs',
      description: 'Retrieve all system logs with pagination and filters',
      operationId: 'getAllLogs',
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
        {
          name: 'method',
          in: 'query',
          description: 'HTTP method filter',
          required: false,
          schema: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
        },
        {
          name: 'status_code',
          in: 'query',
          description: 'HTTP status code filter',
          required: false,
          schema: { type: 'integer' },
        },
        {
          name: 'start_date',
          in: 'query',
          description: 'Start date filter',
          required: false,
          schema: { type: 'string', format: 'date-time' },
        },
        {
          name: 'end_date',
          in: 'query',
          description: 'End date filter',
          required: false,
          schema: { type: 'string', format: 'date-time' },
        },
      ],
      responses: {
        '200': OpenAPIHelper.responses.Success,
        '401': OpenAPIHelper.responses.Unauthorized,
        '403': OpenAPIHelper.responses.Forbidden,
      },
    }),

    // GET /admin/logs/errors
    OpenAPIHelper.GET('/admin/logs/errors', {
      tags: ['Admin - Logs'],
      summary: 'List error logs',
      description: 'Retrieve all logs with status code >= 400',
      operationId: 'getErrorLogs',
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

    // GET /admin/logs/user/:userId
    {
      '/admin/logs/user/{userId}': {
        get: {
          tags: ['Admin - Logs'],
          summary: 'Get user activity logs',
          description: 'Retrieve all logs for a specific user',
          operationId: 'getUserActivityLogs',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              description: 'User ID',
              schema: { type: 'string' },
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
            '404': OpenAPIHelper.responses.NotFound,
          },
        },
      },
    },

    // GET /admin/logs/:id
    {
      '/admin/logs/{id}': {
        get: {
          tags: ['Admin - Logs'],
          summary: 'Get log by ID',
          description: 'Retrieve detailed information about a specific log entry',
          operationId: 'getLogById',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Log entry ID',
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

    // POST /admin/logs/cleanup
    OpenAPIHelper.POST('/admin/logs/cleanup', {
      tags: ['Admin - Logs'],
      summary: 'Cleanup old logs',
      description: 'Delete logs older than specified days or based on filters',
      operationId: 'cleanupLogs',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                days: {
                  type: 'integer',
                  description: 'Delete logs older than X days',
                  example: 30,
                },
                status_code: {
                  type: 'integer',
                  description: 'Delete logs with specific status code',
                  example: 404,
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
        '422': OpenAPIHelper.responses.ValidationError,
      },
    })
  ),
  // Components (optional)
  undefined,
  // Tags
  [{ name: 'Admin - Logs', description: 'Admin endpoints for logs management and analytics' }]
);
