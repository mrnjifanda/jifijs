/**
 * OpenAPI Documentation for Index routes
 * Corresponds to: routes/index.route.ts
 */

import OpenAPIHelper from '../../utils/helpers/openapi.helper';
import { RouteDocumentation } from '../../src/types/openapi.types';

export const documentation: RouteDocumentation = OpenAPIHelper.createRouteDoc(
  // Paths
  OpenAPIHelper.GET('/welcome/start', {
    tags: ['Index'],
    summary: 'Welcome endpoint',
    description: 'Returns a welcome message to verify API is running',
    operationId: 'getWelcome',
    security: OpenAPIHelper.security.apiKey,
    responses: {
      '200': OpenAPIHelper.responses.Success,
      '401': OpenAPIHelper.responses.Unauthorized,
    },
  }),
  // Components (optional)
  undefined,
  // Tags
  [{ name: 'Index', description: 'Welcome and health check endpoints' }]
);
