import {
  RouteDocumentation,
  OpenAPIPaths,
  OpenAPIOperation,
  OpenAPIComponents,
} from '../../src/types/openapi.types';

/**
 * Helper class to build OpenAPI documentation for routes
 */
class OpenAPIHelper {
  /**
   * Create a route documentation object
   * @param paths - OpenAPI paths
   * @param components - OpenAPI components (schemas, responses, etc.)
   * @param tags - Route tags
   * @returns Route documentation object
   */
  static createRouteDoc(
    paths: OpenAPIPaths,
    components?: OpenAPIComponents,
    tags?: Array<{ name: string; description?: string }>
  ): RouteDocumentation {
    return {
      paths,
      ...(components && { components }),
      ...(tags && { tags }),
    };
  }

  /**
   * Create a simple GET endpoint documentation
   * @param path - Endpoint path
   * @param operation - OpenAPI operation
   * @returns Paths object
   */
  static GET(path: string, operation: OpenAPIOperation): OpenAPIPaths {
    return { [path]: { get: operation } };
  }

  /**
   * Create a simple POST endpoint documentation
   * @param path - Endpoint path
   * @param operation - OpenAPI operation
   * @returns Paths object
   */
  static POST(path: string, operation: OpenAPIOperation): OpenAPIPaths {
    return { [path]: { post: operation } };
  }

  /**
   * Create a simple PUT endpoint documentation
   * @param path - Endpoint path
   * @param operation - OpenAPI operation
   * @returns Paths object
   */
  static PUT(path: string, operation: OpenAPIOperation): OpenAPIPaths {
    return { [path]: { put: operation } };
  }

  /**
   * Create a simple PATCH endpoint documentation
   * @param path - Endpoint path
   * @param operation - OpenAPI operation
   * @returns Paths object
   */
  static PATCH(path: string, operation: OpenAPIOperation): OpenAPIPaths {
    return { [path]: { patch: operation } };
  }

  /**
   * Create a simple DELETE endpoint documentation
   * @param path - Endpoint path
   * @param operation - OpenAPI operation
   * @returns Paths object
   */
  static DELETE(path: string, operation: OpenAPIOperation): OpenAPIPaths {
    return { [path]: { delete: operation } };
  }

  /**
   * Merge multiple paths objects
   * @param paths - Array of paths objects
   * @returns Merged paths object
   */
  static mergePaths(...paths: OpenAPIPaths[]): OpenAPIPaths {
    return Object.assign({}, ...paths);
  }

  /**
   * Common response references
   */
  static responses = {
    Success: { $ref: '#/components/responses/SuccessResponse' },
    Created: { $ref: '#/components/responses/CreatedResponse' },
    BadRequest: { $ref: '#/components/responses/BadRequestError' },
    Unauthorized: { $ref: '#/components/responses/UnauthorizedError' },
    Forbidden: { $ref: '#/components/responses/ForbiddenError' },
    NotFound: { $ref: '#/components/responses/NotFoundError' },
    ValidationError: { $ref: '#/components/responses/ValidationError' },
    ServerError: { $ref: '#/components/responses/ServerError' },
  };

  /**
   * Common security schemes
   */
  static security = {
    apiKey: [{ apiKeyAuth: [] }],
    bearer: [{ bearerAuth: [] }],
    both: [{ apiKeyAuth: [], bearerAuth: [] }],
    none: [],
  };
}

export default OpenAPIHelper;
