-- Script to clear all data from all tables in the 'public' schema
-- WARNING: This is IRREVERSIBLE. Use with caution.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Iterate through all tables in the public schema
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename != 'pg_stat_statements'
    ) LOOP
        -- Execute TRUNCATE on each table with CASCADE to clear related data
        -- and RESTART IDENTITY to reset IDs (if applicable)
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
    END LOOP;
END $$;
