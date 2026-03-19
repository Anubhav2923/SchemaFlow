CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    user_id TEXT NOT NULL,
    owner_username TEXT NOT NULL DEFAULT 'user',
    slug TEXT NOT NULL DEFAULT '',
    database_type TEXT NOT NULL DEFAULT 'postgresql',
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS owner_username TEXT NOT NULL DEFAULT 'user';

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT '';

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS database_type TEXT NOT NULL DEFAULT 'postgresql';

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

WITH normalized_projects AS (
    SELECT
        id,
        owner_username,
        NULLIF(
            regexp_replace(
                regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'),
                '(^-|-$)',
                '',
                'g'
            ),
            ''
        ) AS base_slug,
        row_number() OVER (
            PARTITION BY owner_username,
            NULLIF(
                regexp_replace(
                    regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'),
                    '(^-|-$)',
                    '',
                    'g'
                ),
                ''
            )
            ORDER BY created_at ASC, id ASC
        ) AS slug_rank
    FROM projects
)
UPDATE projects p
SET slug = CASE
    WHEN normalized_projects.base_slug IS NULL THEN substr(replace(p.id::text, '-', ''), 1, 12)
    WHEN normalized_projects.slug_rank = 1 THEN normalized_projects.base_slug
    ELSE normalized_projects.base_slug || '-' || substr(replace(p.id::text, '-', ''), 1, 8)
END
FROM normalized_projects
WHERE p.id = normalized_projects.id AND (p.slug IS NULL OR p.slug = '');

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    is_nullable BOOLEAN NOT NULL DEFAULT TRUE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_unique BOOLEAN NOT NULL DEFAULT FALSE,
    default_value TEXT,
    position INT NOT NULL DEFAULT 0,
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    source_column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    target_table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    target_column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    on_delete TEXT NOT NULL DEFAULT 'NO ACTION',
    on_update TEXT NOT NULL DEFAULT 'NO ACTION',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT relationships_source_target_unique UNIQUE (
        source_column_id,
        target_column_id
    )
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_username ON projects(owner_username);
CREATE INDEX IF NOT EXISTS idx_projects_favorite ON projects(is_favorite);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(is_archived);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_owner_username_slug ON projects(owner_username, slug);
CREATE INDEX IF NOT EXISTS idx_tables_project_id ON tables(project_id);
CREATE INDEX IF NOT EXISTS idx_columns_table_id ON columns(table_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source_table_id ON relationships(source_table_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target_table_id ON relationships(target_table_id);
