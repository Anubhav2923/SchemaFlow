import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbConnector from './plugins/db';
import { healthRoutes } from './modules/health/health.routes';
import { errorMiddleware } from './middlewares/error.middleware';

/**
 * buildApp
 * Factory function that assembles and configures the Fastify instance.
 * Separating this from server.ts makes it easy to test without starting a real server.
 */
export async function buildApp() {
  const app = Fastify({ logger: true });

  // ─── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors);
  await app.register(dbConnector);

  // ─── Global Error Handler ────────────────────────────────────────────────────
  app.setErrorHandler(errorMiddleware);

  // ─── Routes ─────────────────────────────────────────────────────────────────
  // Prefix all routes with /api for a clean REST convention
  await app.register(healthRoutes, { prefix: '/api' });

  // Future modules go here, e.g.:
  // await app.register(userRoutes,         { prefix: '/api/users' });
  // await app.register(projectRoutes,      { prefix: '/api/projects' });
  // await app.register(tableRoutes,        { prefix: '/api/tables' });
  // await app.register(columnRoutes,       { prefix: '/api/columns' });
  // await app.register(relationshipRoutes, { prefix: '/api/relationships' });
  // await app.register(migrationRoutes,    { prefix: '/api/migrations' });

  return app;
}
