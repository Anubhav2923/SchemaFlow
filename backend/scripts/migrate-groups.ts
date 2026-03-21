import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRE_DATABASE_URI || 'postgresql://postgres:postgres@localhost:5432/schemaforge',
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('--- Database Migration: Adding Groups ---');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT '#6366f11a',
          x DOUBLE PRECISION NOT NULL DEFAULT 0,
          y DOUBLE PRECISION NOT NULL DEFAULT 0,
          width DOUBLE PRECISION NOT NULL DEFAULT 400,
          height DOUBLE PRECISION NOT NULL DEFAULT 300,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE tables ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
      ALTER TABLE tables ADD COLUMN IF NOT EXISTS x DOUBLE PRECISION;
      ALTER TABLE tables ADD COLUMN IF NOT EXISTS y DOUBLE PRECISION;
    `);

    console.log('✅ Success: Tables "groups" created and "tables.group_id" added.');
  } catch (err: any) {
    console.error('❌ Migration Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
