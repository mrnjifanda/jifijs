import {
  response,
  configs,
  ALLOWED_METHODS,
  path,
  request_ip,
  express,
  morgan,
  cookie_parser,
} from './configs/app.config';
import helmet from 'helmet';
import cors from 'cors';
import { Express, Request, Response, NextFunction } from 'express';
import { Server } from 'http';

import routes from './routes';
import db from './configs/database.config';
import setupSwagger from './docs/swagger';
import rateLimitConfig from './configs/ratelimit.config';
import logger from './utils/helpers/logger.helper';
import { setRequestDetails, setLanguage } from './utils/middlewares/app.middleware';
import { gracefulShutdown } from './utils/helpers/shutdown.helper';
import {
  logInterceptor,
  captureResponseBody,
  logsInterceptor,
} from './utils/interceptors/logs.interceptor';

const app: Express = express();

/**
 * Configures basic security and parsing middleware
 * @private
 */
function setupBasicMiddleware(): void {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      credentials: true,
      origin: configs.getLists('ALLOWED_ORIGINS'),
      optionsSuccessStatus: 200,
      exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
    })
  );

  const maxSize = configs.getValue('MAX_REQUEST_SIZE', false) || '1mb';
  app.use(cookie_parser(configs.getValue('COOKIE_SECRET')));
  app.use(
    express.json({
      limit: maxSize,
      strict: true,
      type: 'application/json',
    })
  );
  app.use(
    express.urlencoded({
      limit: maxSize,
      extended: false,
      parameterLimit: 20,
    })
  );
  app.use(
    express.static(path.join(__dirname, 'public'), {
      maxAge: configs.isProduction() ? '1d' : '0',
      etag: true,
      lastModified: true,
    })
  );
}

/**
 * Configures request context middleware (IP, language, device info)
 * @private
 */
function setupRequestContext(): void {
  app.use(request_ip.mw());
  app.use(setRequestDetails);
  app.use(setLanguage);
}

/**
 * Configures logging and monitoring middleware
 * @private
 */
function setupLoggingMiddleware(): void {
  app.use(captureResponseBody);
  app.use(logInterceptor);
  app.use(morgan('combined'));
}

/**
 * Configures rate limiting if enabled
 * @private
 */
function setupRateLimit(): void {
  const rateLimitMiddleware = rateLimitConfig.init();
  if (rateLimitMiddleware) {
    app.use(rateLimitMiddleware);
    logger.info('✅ Rate limiting enabled');
  }
}

/**
 * Sets up application routes
 * @private
 */
function setupRoutes(): void {
  const routePrefix = configs.getPrefixRoutes();

  routes.forEach((route) => {
    try {
      const middlewares = route.middlewares || [];
      const routePath = route.route || route.path;
      const fullPath = routePrefix + route.path;

      app.use(fullPath, middlewares, require(`./routes${routePath}.route`).default);
    } catch (error: any) {
      const errorMsg = `Failed to load route ${route.path}: ${error.message}`;
      logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  });
}

/**
 * Sets up error handling middleware
 * @private
 */
function setupErrorHandlers(): void {
  // Cookie/Parsing error handler
  app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    if (
      error.type === 'entity.parse.failed' ||
      error.message.includes('cookie') ||
      error.message.includes('invalid signature')
    ) {
      logger.warn(`Cookie/Parsing error: ${error.message}`, {
        url: req.originalUrl,
        method: req.method,
        ip: (req as any).clientIp || req.ip,
        userAgent: req.get('User-Agent'),
      });

      const cookieOptions = {
        httpOnly: true,
        secure: configs.isProduction(),
        sameSite: 'lax' as const,
      };

      try {
        if ((req as any).cookies && (req as any).cookies.access_token) {
          res.clearCookie('access_token', cookieOptions);
        }
        if ((req as any).cookies && (req as any).cookies.refresh_token) {
          res.clearCookie('refresh_token', cookieOptions);
        }
      } catch (e: any) {
        logger.warn('Failed to clear auth cookies during parse error', e.message);
      }

      return response.failed(res, next, 'Invalid request format', null, 400);
    }
    next(error);
  });

  // METHODS NOT ALLOWED MIDDLEWARE
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!ALLOWED_METHODS.includes(req.method)) {
      return response.failed(res, next, `${req.method} method not allowed.`, null, 405);
    }
    next();
  });

  // NOT FOUND ROUTE MIDDLEWARE
  app.use((req: Request, res: Response, next: NextFunction) => {
    return response.notFound(res, next, 'Endpoint not found, please verify your request !!!', {
      protocol: req.protocol,
      method: req.method.toUpperCase(),
      host: req.get('host'),
      url: req.originalUrl,
    });
  });

  // INTERNAL SERVER ERROR
  app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    if (!configs.isProduction()) {
      logger.error('Internal server error:', error);
    } else {
      logger.error('Internal server error:', {
        message: error.message,
        stack: error.stack?.split('\n')[0], // First line only
        url: req.originalUrl,
        method: req.method,
      });
    }

    return response.internalError(res, next, error);
  });
}

/**
 * Handles graceful shutdown for a given signal
 * @param signal - Process signal name
 * @param server - HTTP server instance
 */
async function handleGracefulShutdown(signal: string, server: Server): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    await logsInterceptor.gracefulShutdown();
    gracefulShutdown(signal, server);
  } catch (error: any) {
    logger.error(`❌ Error during graceful shutdown:`, error.message);
    process.exit(1);
  }
}

/**
 * Sets up process event handlers for graceful shutdown
 * @param server - HTTP server instance
 * @private
 */
function setupProcessHandlers(server: Server): void {
  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM', server));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT', server));

  process.on('uncaughtException', async (error: Error) => {
    logger.error('Uncaught Exception:', error);
    await handleGracefulShutdown('uncaughtException', server);
  });

  process.on('unhandledRejection', async (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await handleGracefulShutdown('unhandledRejection', server);
  });
}

/**
 * Initializes the application
 * @private
 */
function initializeApp(): void {
  if (configs.use('database')) {
    db.connect(configs.getDatabase());
  }

  setupBasicMiddleware();
  setupLoggingMiddleware();
  setupRequestContext();
  setupRateLimit();
  setupRoutes();

  setupSwagger(app);

  setupErrorHandlers();
}

try {
  initializeApp();
} catch (error: any) {
  logger.error('❌ Failed to initialize application:', error.message);
  process.exit(1);
}

let server: Server | null = null;
if (typeof require !== 'undefined' && require.main === module) {
  server = app.listen(configs.getPort(), () => {
    logger.info('========================== APPLICATION RUN ==========================');
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔧 Queue enabled: ${configs.use('queue') ? 'Yes' : 'No'}`);
    logger.info(`💾 Database enabled: ${configs.use('database') ? 'Yes' : 'No'}`);
    logger.info(`🚀 Application running on: ${configs.getUrl()}`);
    logger.info(`📚 API documentation running on: ${configs.getUrl()}/api-docs`);
    logger.info('=====================================================================');
  });

  setupProcessHandlers(server);
}

export { app, server };
