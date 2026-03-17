import fp from 'fastify-plugin';
import { Client, Pool } from 'pg';
import { FastifyInstance } from 'fastify';
import { env } from '../config/env';

async function dbConnector(fastify: FastifyInstance) {
  const connectionString = env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables.');
  }

  const dbName = connectionString.split('/').pop()?.split('?')[0] || 'schemaforge';

  try {
    const pool = new Pool({ connectionString });
    // Verify connection is live
    const client = await pool.connect();
    client.release();

    fastify.decorate('db', pool);
    fastify.log.info(`🐘 Database connected: ${dbName}`);
  } catch (err: any) {
    // Auto-create the database if it doesn't exist
    if (err.code === '3D000') {
      fastify.log.warn(`⚠️  Database "${dbName}" not found. Creating it...`);

      const adminUri = connectionString.replace(`/${dbName}`, '/postgres');
      const adminClient = new Client({ connectionString: adminUri });

      await adminClient.connect();
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      await adminClient.end();

      fastify.log.info(`✅ Database "${dbName}" created.`);

      const pool = new Pool({ connectionString });
      fastify.decorate('db', pool);
    } else {
      fastify.log.error(`❌ Database connection failed: ${err.message}`);
      throw err;
    }
  }
}

export default fp(dbConnector);
