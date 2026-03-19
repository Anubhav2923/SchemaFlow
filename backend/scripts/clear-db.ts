import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRE_DATABASE_URI,
});

async function clearDatabase() {
  const client = await pool.connect();
  try {
    console.log('\n--- ⚠️ Database Cleanup Started ⚠️ ---');
    
    // 1. Get all base tables in the 'public' schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'pg_stat_statements';
    `);

    const tableNames = tablesRes.rows
        .map(row => `"${row.table_name}"`)
        .filter(name => name !== '"_prisma_migrations"'); // Avoid clearing migrations if using any

    if (tableNames.length === 0) {
      console.log('No tables found in the database. Nothing to clear.');
      return;
    }

    console.log(`Found ${tableNames.length} tables to truncate: ${tableNames.join(', ')}`);
    
    /**
     * TRUNCATE vs DROP:
     * - TRUNCATE TABLE: Removes all data from the tables but keeps the structure.
     *   Using CASCADE ensures related data in other tables is also removed.
     *   RESTART IDENTITY resets serial/auto-incrementing values.
     */
    const truncateQuery = `TRUNCATE TABLE ${tableNames.join(', ')} RESTART IDENTITY CASCADE;`;
    
    console.log('Clearing all tables data (TRUNCATE with CASCADE)...');
    await client.query(truncateQuery);
    
    console.log('\n✅ Success: All database data has been removed.\n');
  } catch (error: any) {
    console.error('\n❌ Error clearing database:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ensure the user knows what they are doing if they run this
console.log('You are about to delete EVERYTHING from all tables in the public schema.');
console.log('This action is IRREVERSIBLE.');

clearDatabase().then(() => {
    process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
