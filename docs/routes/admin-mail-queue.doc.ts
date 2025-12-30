/**
 * OpenAPI Documentation for Admin Mail Queue routes
 * Corresponds to: routes/admin/mail-queue.route.ts
 */

import OpenAPIHelper from '../../utils/helpers/openapi.helper';
import { RouteDocumentation } from '../../src/types/openapi.types';

export const documentation: RouteDocumentation = OpenAPIHelper.createRouteDoc(
  // Paths
  OpenAPIHelper.mergePaths(
    // GET /admin/mail-queue/stats
    OpenAPIHelper.GET('/admin/mail-queue/stats', {
      tags: ['Admin - Mail Queue'],
      summary: 'Get mail queue statistics',
      description: 'Retrieve comprehensive statistics about the mail queue including waiting, active, completed, and failed jobs',
      operationId: 'getMailQueueStats',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': {
          description: 'Queue statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Mail queue statistics retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      waiting: { type: 'integer', description: 'Number of jobs waiting to be processed', example: 5 },
                      active: { type: 'integer', description: 'Number of jobs currently being processed', example: 1 },
                      delayed: { type: 'integer', description: 'Number of delayed jobs', example: 0 },
                      completed: { type: 'integer', description: 'Number of completed jobs', example: 150 },
                      failed: { type: 'integer', description: 'Number of failed jobs', example: 3 },
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

    // GET /admin/mail-queue/failed
    OpenAPIHelper.GET('/admin/mail-queue/failed', {
      tags: ['Admin - Mail Queue'],
      summary: 'Get all failed mail jobs',
      description: 'Retrieve detailed information about all failed email jobs in the queue',
      operationId: 'getFailedMailJobs',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': {
          description: 'Failed jobs retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Found 3 failed mail jobs' },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: '123' },
                        data: {
                          type: 'object',
                          properties: {
                            type: { type: 'string', example: 'mail' },
                            data: {
                              type: 'object',
                              properties: {
                                receivers: { type: 'string', example: 'user@example.com' },
                                subject: { type: 'string', example: 'Welcome to our platform' },
                                content: { type: 'string', example: 'auth/activation' },
                              },
                            },
                          },
                        },
                        failedReason: { type: 'string', example: 'SMTP_UNREACHABLE: ECONNREFUSED: connect ECONNREFUSED 127.0.0.1:1025' },
                        attemptsMade: { type: 'integer', example: 3 },
                        timestamp: { type: 'integer', example: 1234567890 },
                        processedOn: { type: 'integer', example: 1234567900 },
                        finishedOn: { type: 'integer', example: 1234567910 },
                      },
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

    // POST /admin/mail-queue/retry/:jobId
    {
      '/admin/mail-queue/retry/{jobId}': {
        post: {
          tags: ['Admin - Mail Queue'],
          summary: 'Retry a specific failed job',
          description: 'Queue a specific failed mail job for retry. The job will be reprocessed with the same data.',
          operationId: 'retryMailJob',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'jobId',
              in: 'path',
              required: true,
              description: 'ID of the job to retry',
              schema: { type: 'string', example: '123' },
            },
          ],
          responses: {
            '200': {
              description: 'Job queued for retry successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Job 123 queued for retry' },
                      data: {
                        type: 'object',
                        properties: {
                          jobId: { type: 'string', example: '123' },
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
        },
      },
    },

    // POST /admin/mail-queue/retry-all
    OpenAPIHelper.POST('/admin/mail-queue/retry-all', {
      tags: ['Admin - Mail Queue'],
      summary: 'Retry all failed jobs',
      description: 'Queue all failed mail jobs for retry. Useful when SMTP server becomes available after an outage.',
      operationId: 'retryAllMailJobs',
      security: OpenAPIHelper.security.both,
      responses: {
        '200': {
          description: 'All failed jobs queued for retry',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Retried 3 failed mail jobs' },
                  data: {
                    type: 'object',
                    properties: {
                      retriedCount: { type: 'integer', example: 3 },
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

    // DELETE /admin/mail-queue/failed/:jobId
    {
      '/admin/mail-queue/failed/{jobId}': {
        delete: {
          tags: ['Admin - Mail Queue'],
          summary: 'Remove a failed job',
          description: 'Permanently remove a specific failed job from the queue. This action cannot be undone.',
          operationId: 'removeMailJob',
          security: OpenAPIHelper.security.both,
          parameters: [
            {
              name: 'jobId',
              in: 'path',
              required: true,
              description: 'ID of the job to remove',
              schema: { type: 'string', example: '123' },
            },
          ],
          responses: {
            '200': {
              description: 'Job removed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Job 123 removed successfully' },
                    },
                  },
                },
              },
            },
            '401': OpenAPIHelper.responses.Unauthorized,
            '403': OpenAPIHelper.responses.Forbidden,
            '404': OpenAPIHelper.responses.NotFound,
          },
        },
      },
    },

    // POST /admin/mail-queue/clean
    OpenAPIHelper.POST('/admin/mail-queue/clean', {
      tags: ['Admin - Mail Queue'],
      summary: 'Clean old jobs',
      description: 'Remove old completed and failed jobs from the queue to free up Redis memory. Completed jobs older than 24h and failed jobs older than 7 days will be removed by default.',
      operationId: 'cleanMailQueue',
      security: OpenAPIHelper.security.both,
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                completed: {
                  type: 'boolean',
                  description: 'Clean completed jobs (default: true)',
                  example: true,
                },
                failed: {
                  type: 'boolean',
                  description: 'Clean failed jobs (default: true)',
                  example: true,
                },
              },
            },
            examples: {
              cleanAll: {
                summary: 'Clean both completed and failed jobs',
                value: {
                  completed: true,
                  failed: true,
                },
              },
              cleanCompletedOnly: {
                summary: 'Clean only completed jobs',
                value: {
                  completed: true,
                  failed: false,
                },
              },
              cleanFailedOnly: {
                summary: 'Clean only failed jobs',
                value: {
                  completed: false,
                  failed: true,
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Queue cleaned successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Queue cleaned successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      completed: { type: 'integer', description: 'Number of completed jobs removed', example: 150 },
                      failed: { type: 'integer', description: 'Number of failed jobs removed', example: 3 },
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
    })
  ),

  // Components (schemas)
  {
    schemas: {
      MailQueueStats: {
        type: 'object',
        properties: {
          waiting: { type: 'integer', description: 'Jobs waiting to be processed' },
          active: { type: 'integer', description: 'Jobs currently being processed' },
          delayed: { type: 'integer', description: 'Jobs scheduled for later' },
          completed: { type: 'integer', description: 'Successfully completed jobs' },
          failed: { type: 'integer', description: 'Failed jobs' },
        },
      },
      FailedMailJob: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Job ID' },
          data: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'mail' },
              data: {
                type: 'object',
                properties: {
                  receivers: { type: 'string', description: 'Email recipient(s)' },
                  subject: { type: 'string', description: 'Email subject' },
                  content: { type: 'string', description: 'Template path or content' },
                },
              },
            },
          },
          failedReason: { type: 'string', description: 'Reason for failure' },
          attemptsMade: { type: 'integer', description: 'Number of attempts made' },
          timestamp: { type: 'integer', description: 'Job creation timestamp' },
          processedOn: { type: 'integer', description: 'Last processing timestamp' },
          finishedOn: { type: 'integer', description: 'Job completion timestamp' },
        },
      },
    },
  },

  // Tags
  [
    {
      name: 'Admin - Mail Queue',
      description: 'Admin endpoints for managing the email queue. Monitor queue health, retry failed jobs, and perform maintenance tasks.',
    },
  ]
);
