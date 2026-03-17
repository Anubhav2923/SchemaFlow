import { buildApp } from './app';
import { env } from './config/env';

/**
 * server.ts — Entry Point
 * Only starts the server. All configuration lives in app.ts.
 */
async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    console.log(`\n🚀 SchemaForge API running on port ${env.PORT}`);
    console.log(`📡 Health: http://localhost:${env.PORT}/api/health`);
    console.log(`🛢️  DB Test: http://localhost:${env.PORT}/api/db-test\n`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
