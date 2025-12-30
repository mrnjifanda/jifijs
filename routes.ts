/**
 * Routes configuration
 * NOTE: If you want to put a global middleware, that is to say that applies to all routes,
 * you must directly place it on the path '/' and automatically, it will be applied everywhere.
 */

import { RequestHandler } from 'express';
import { xApiKey } from './utils/middlewares/app.middleware';
import { isLogin, isAdmin } from './utils/middlewares/auth/auth.middleware';

/**
 * Route configuration interface
 */
interface RouteConfig {
  path: string;
  route?: string;
  middlewares?: RequestHandler[];
}

const routes: RouteConfig[] = [
  { path: '/welcome', route: '/index', middlewares: [xApiKey] },
  { path: '/auth', middlewares: [xApiKey] },

  { path: '/app/user', middlewares: [xApiKey, isLogin] },
  { path: '/app/upload', middlewares: [xApiKey, isLogin] },

  { path: '/admin/users', route: '/admin/user', middlewares: [xApiKey, isLogin, isAdmin] },
  { path: '/admin/x-api-key', middlewares: [xApiKey, isLogin, isAdmin] },
  { path: '/admin/logs', middlewares: [xApiKey, isLogin, isAdmin] },
  { path: '/admin/mail-queue', middlewares: [xApiKey, isLogin, isAdmin] },
];

export default routes;
