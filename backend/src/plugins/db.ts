import { readFile } from "node:fs/promises";
import path from "node:path";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { Client, Pool } from "pg";
import { env } from "../config/env";

declare module "fastify" {
  interface FastifyInstance {
    db: Pool;
  }
}

async function initializeSchema(pool: Pool) {
  const client = await pool.connect();

  try {
    const initSqlPath = path.join(__dirname, "..", "db", "init.sql");
    const initSql = await readFile(initSqlPath, "utf8");
    await client.query(initSql);
  } finally {
    client.release();
  }
}

async function dbConnector(fastify: FastifyInstance) {
  const connectionString = env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment variables.");
  }

  const dbName = connectionString.split("/").pop()?.split("?")[0] || "schemaflow";

  try {
    const pool = new Pool({ connectionString });
    await initializeSchema(pool);

    fastify.decorate("db", pool);
    fastify.addHook("onClose", async () => {
      await pool.end();
    });

    fastify.log.info(`Database connected: ${dbName}`);
  } catch (error: any) {
    if (error.code === "3D000") {
      fastify.log.warn(`Database "${dbName}" not found. Creating it...`);

      const adminUri = connectionString.replace(`/${dbName}`, "/postgres");
      const adminClient = new Client({ connectionString: adminUri });

      await adminClient.connect();
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      await adminClient.end();

      const pool = new Pool({ connectionString });
      await initializeSchema(pool);

      fastify.decorate("db", pool);
      fastify.addHook("onClose", async () => {
        await pool.end();
      });

      fastify.log.info(`Database "${dbName}" created and initialized.`);
      return;
    }

    fastify.log.error(`Database connection failed: ${error.message}`);
    throw error;
  }
}

export default fp(dbConnector);
