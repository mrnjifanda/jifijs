/**
 * OpenAPI Documentation Builder
 * Scans all route documentation files and merges them into a single openapi.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { OpenAPIDocument, RouteDocumentation } from '../src/types/openapi.types';
import { configs } from '../configs/app.config';

/**
 * Base OpenAPI document structure
 */
const baseDocument: OpenAPIDocument = {
  openapi: '3.1.0',
  info: {
    title: 'API BASE',
    version: '1.0.0',
    description: "API de base pour la gestion de l'authentification et des logs.",
    license: {
      name: 'MIT',
      url: 'https://spdx.org/licenses/MIT.html',
    },
    contact: {
      name: 'Mr NJIFANDA',
      url: 'https://njifanda.com',
      email: 'contact@njifanda.com',
    },
  },
  servers: [
    {
      url: configs.getUrl() + configs.getPrefixRoutes(),
      description: `${configs.getName()} - API (mode: ${configs.isProduction() ? 'Production' : 'Development'})`,
    },
  ],
  paths: {},
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key required for all endpoints',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authenticated endpoints',
      },
    },
    responses: {
      SuccessResponse: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Operation successful' },
                data: { type: 'object' },
              },
            },
          },
        },
      },
      CreatedResponse: {
        description: 'Resource created successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Resource created' },
                data: { type: 'object' },
              },
            },
          },
        },
      },
      BadRequestError: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Bad request' },
              },
            },
          },
        },
      },
      UnauthorizedError: {
        description: 'Unauthorized - Invalid or missing authentication',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Unauthorized' },
              },
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Forbidden' },
              },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Resource not found' },
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Validation failed' },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Internal server error' },
              },
            },
          },
        },
      },
    },
  },
  security: [{ apiKeyAuth: [] }],
  tags: [],
};

/**
 * Find all route documentation files recursively
 */
function findDocFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findDocFiles(filePath, fileList);
    } else if (file.endsWith('.doc.ts') || file.endsWith('.doc.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Load and merge route documentation
 */
async function buildOpenAPIDocument(): Promise<void> {

  const document: OpenAPIDocument = JSON.parse(JSON.stringify(baseDocument));
  const docsDir = path.join(__dirname, 'routes');
  const docFiles = findDocFiles(docsDir);

  for (const docFile of docFiles) {
    try {
      const relativePath = path.relative(process.cwd(), docFile);
      const routeModule = await import(docFile);

      if (routeModule.documentation) {
        const doc: RouteDocumentation = routeModule.documentation;

        if (doc.paths) {
          document.paths = { ...document.paths, ...doc.paths };
        }

        if (doc.components) {
          if (doc.components.schemas) {
            document.components!.schemas = {
              ...document.components!.schemas,
              ...doc.components.schemas,
            };
          }
          if (doc.components.responses) {
            document.components!.responses = {
              ...document.components!.responses,
              ...doc.components.responses,
            };
          }
          if (doc.components.parameters) {
            document.components!.parameters = {
              ...document.components!.parameters,
              ...doc.components.parameters,
            };
          }
        }

        // Merge tags
        if (doc.tags) {
          const existingTags = document.tags || [];
          const newTags = doc.tags.filter(
            (tag) => !existingTags.some((t) => t.name === tag.name)
          );
          document.tags = [...existingTags, ...newTags];
        }
      } else {
        console.log(`   ⚠️  No documentation export found in ${relativePath}`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error loading ${docFile}:`, error.message);
    }
  }

  // Write to openapi.json
  const outputPath = path.join(__dirname, 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');

  console.log(`\n✅ OpenAPI document generated successfully!`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Paths: ${Object.keys(document.paths).length}`);
  console.log(`   Tags: ${document.tags?.length || 0}`);
  console.log(`   Schemas: ${Object.keys(document.components?.schemas || {}).length}`);
}

// Run the builder
buildOpenAPIDocument().catch((error) => {
  console.error('❌ Failed to build OpenAPI document:', error);
  process.exit(1);
});
