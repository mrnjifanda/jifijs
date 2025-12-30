/**
 * OpenAPI 3.1.0 Type Definitions
 * For modular route documentation
 */

/**
 * HTTP Methods
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head';

/**
 * Parameter location
 */
export type ParameterLocation = 'query' | 'path' | 'header' | 'cookie';

/**
 * OpenAPI Parameter
 */
export interface OpenAPIParameter {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  schema: {
    type: string;
    format?: string;
    enum?: string[];
    example?: any;
  };
}

/**
 * OpenAPI Request Body
 */
export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content: {
    [mediaType: string]: {
      schema: {
        $ref?: string;
        type?: string;
        properties?: Record<string, any>;
        required?: string[];
        example?: any;
      };
    };
  };
}

/**
 * OpenAPI Response
 */
export interface OpenAPIResponse {
  description: string;
  content?: {
    [mediaType: string]: {
      schema: {
        $ref?: string;
        type?: string;
        properties?: Record<string, any>;
        example?: any;
      };
    };
  };
}

/**
 * OpenAPI Operation (single endpoint)
 */
export interface OpenAPIOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: {
    [statusCode: string]: OpenAPIResponse | { $ref: string };
  };
  security?: Array<Record<string, string[]>>;
}

/**
 * OpenAPI Path Item (all methods for a path)
 */
export interface OpenAPIPathItem {
  [method: string]: OpenAPIOperation;
}

/**
 * OpenAPI Paths (all routes)
 */
export interface OpenAPIPaths {
  [path: string]: OpenAPIPathItem;
}

/**
 * OpenAPI Schema Component
 */
export interface OpenAPISchema {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  example?: any;
  items?: any;
  $ref?: string;
}

/**
 * OpenAPI Components
 */
export interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchema>;
  responses?: Record<string, OpenAPIResponse>;
  parameters?: Record<string, OpenAPIParameter>;
  securitySchemes?: Record<string, any>;
}

/**
 * Route Documentation Export
 * This is what each route file should export
 */
export interface RouteDocumentation {
  paths: OpenAPIPaths;
  components?: OpenAPIComponents;
  tags?: Array<{ name: string; description?: string }>;
}

/**
 * Complete OpenAPI Document
 */
export interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers: Array<{
    url: string;
    description?: string;
  }>;
  tags?: Array<{ name: string; description?: string }>;
  paths: OpenAPIPaths;
  components?: OpenAPIComponents;
  security?: Array<Record<string, string[]>>;
}
