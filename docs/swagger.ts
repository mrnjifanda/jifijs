import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './openapi.json';

/**
 * Setup Swagger UI documentation
 * @param app - Express application instance
 */
export default function setupSwagger(app: Express): void {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );
}
