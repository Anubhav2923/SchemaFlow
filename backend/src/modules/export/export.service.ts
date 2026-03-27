import type { FastifyInstance } from "fastify";

export type ExportFormat =
  | "postgresql"
  | "mongoose"
  | "prisma"
  | "drizzle"
  | "typeorm"
  | "sequelize"
  | "laravel";

type ProjectRow = {
  id: string;
  name: string;
  database_type: string;
  schema_metadata: unknown;
};

export type TableRow = {
  id: string;
  name: string;
};

export type ColumnRow = {
  id: string;
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary: boolean;
  is_unique: boolean;
  default_value: string | null;
  position: number;
  table_id: string;
};

export type RelationshipRow = {
  id: string;
  source_table_id: string;
  source_table_name: string;
  source_column_id: string;
  source_column_name: string;
  target_table_id: string;
  target_table_name: string;
  target_column_id: string;
  target_column_name: string;
  on_delete: string;
  on_update: string;
};

type SchemaEnumType = {
  name: string;
  values: string[];
};

type SchemaCheckConstraint = {
  tableName: string;
  expression: string;
  name?: string;
  columnName?: string;
};

type SchemaIndex = {
  tableName: string;
  columns: string[];
  name?: string;
  isUnique?: boolean;
};

type SchemaMetadata = {
  dialect?: string;
  extensions: string[];
  enumTypes: SchemaEnumType[];
  checks: SchemaCheckConstraint[];
  indexes: SchemaIndex[];
};

export type ProjectSchemaData = {
  project: ProjectRow;
  tables: TableRow[];
  columns: ColumnRow[];
  relationships: RelationshipRow[];
  columnsByTable: Map<string, ColumnRow[]>;
  relationshipRefs: Map<string, string>;
  metadata: SchemaMetadata;
};

export type ExportResult = {
  format: ExportFormat;
  language: string;
  filename: string;
  code: string;
};

function escapeIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function pascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function camelCase(value: string) {
  const parts = value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((part) => part.toLowerCase());

  return parts
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");
}

function normalizeSchemaMetadata(input: unknown): SchemaMetadata {
  const base: SchemaMetadata = {
    dialect: "postgresql",
    extensions: [],
    enumTypes: [],
    checks: [],
    indexes: [],
  };

  if (!input || typeof input !== "object") {
    return base;
  }

  const metadata = input as Partial<SchemaMetadata>;
  return {
    dialect: typeof metadata.dialect === "string" ? metadata.dialect : base.dialect,
    extensions: Array.isArray(metadata.extensions) ? metadata.extensions.filter((value): value is string => typeof value === "string") : base.extensions,
    enumTypes: Array.isArray(metadata.enumTypes) ? metadata.enumTypes.filter((value): value is SchemaEnumType => Boolean(value) && typeof value.name === "string" && Array.isArray(value.values)) : base.enumTypes,
    checks: Array.isArray(metadata.checks) ? metadata.checks.filter((value): value is SchemaCheckConstraint => Boolean(value) && typeof value.tableName === "string" && typeof value.expression === "string") : base.checks,
    indexes: Array.isArray(metadata.indexes) ? metadata.indexes.filter((value): value is SchemaIndex => Boolean(value) && typeof value.tableName === "string" && Array.isArray(value.columns)) : base.indexes,
  };
}

function mapMongoType(dataType: string) {
  const normalized = dataType.toLowerCase();

  if (
    normalized.includes("int") ||
    normalized.includes("numeric") ||
    normalized.includes("decimal") ||
    normalized.includes("double") ||
    normalized.includes("real")
  ) {
    return "Number";
  }

  if (normalized.includes("bool")) {
    return "Boolean";
  }

  if (
    normalized.includes("date") ||
    normalized.includes("time") ||
    normalized.includes("timestamp")
  ) {
    return "Date";
  }

  if (normalized.includes("json")) {
    return "Object";
  }

  return "String";
}

function mapPrismaType(dataType: string) {
  const normalized = dataType.toLowerCase();

  if (normalized.includes("uuid")) return "String";
  if (normalized.includes("bool")) return "Boolean";
  if (
    normalized.includes("int") ||
    normalized.includes("serial") ||
    normalized.includes("bigint")
  ) return "Int";
  if (
    normalized.includes("numeric") ||
    normalized.includes("decimal") ||
    normalized.includes("double") ||
    normalized.includes("real") ||
    normalized.includes("float")
  ) return "Float";
  if (
    normalized.includes("date") ||
    normalized.includes("time") ||
    normalized.includes("timestamp")
  ) return "DateTime";
  if (normalized.includes("json")) return "Json";
  return "String";
}

function mapTypescriptType(dataType: string) {
  const normalized = dataType.toLowerCase();

  if (normalized.includes("bool")) return "boolean";
  if (
    normalized.includes("int") ||
    normalized.includes("numeric") ||
    normalized.includes("decimal") ||
    normalized.includes("double") ||
    normalized.includes("real") ||
    normalized.includes("float") ||
    normalized.includes("serial")
  ) {
    return "number";
  }
  if (
    normalized.includes("date") ||
    normalized.includes("time") ||
    normalized.includes("timestamp")
  ) {
    return "Date";
  }
  if (normalized.includes("json")) return "Record<string, unknown>";
  return "string";
}

function mapLaravelType(dataType: string) {
  const normalized = dataType.toLowerCase();

  if (normalized.includes("uuid")) return "uuid";
  if (normalized.includes("text")) return "text";
  if (normalized.includes("bool")) return "boolean";
  if (
    normalized.includes("int") ||
    normalized.includes("serial") ||
    normalized.includes("bigint")
  ) {
    return "integer";
  }
  if (
    normalized.includes("numeric") ||
    normalized.includes("decimal") ||
    normalized.includes("double") ||
    normalized.includes("real") ||
    normalized.includes("float")
  ) {
    return "decimal";
  }
  if (normalized.includes("date") || normalized.includes("timestamp")) return "timestamp";
  if (normalized.includes("json")) return "json";
  return "string";
}

function formatMongoDefault(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "now()" || normalized === "current_timestamp") {
    return "Date.now";
  }

  if (normalized === "true" || normalized === "false") {
    return normalized;
  }

  if (!Number.isNaN(Number(value))) {
    return value;
  }

  return JSON.stringify(value);
}

function relationFieldName(targetTableName: string) {
  const base = camelCase(targetTableName);
  return base || "relation";
}

function formatFilename(projectName: string, extension: string) {
  const base =
    projectName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "schemaflow-export";

  return `${base}.${extension}`;
}

export function getDefaultFormat(databaseType: string): ExportFormat {
  if (databaseType === "mongodb") return "mongoose";
  return "postgresql";
}

export async function loadProjectSchema(
  app: FastifyInstance,
  projectId: string,
): Promise<ProjectSchemaData> {
  const projectRes = await app.db.query<ProjectRow>(
    `
      SELECT id, name, database_type, schema_metadata
      FROM projects
      WHERE id = $1;
    `,
    [projectId],
  );

  const project = projectRes.rows[0];
  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const tablesRes = await app.db.query<TableRow>(
    `
      SELECT id, name
      FROM tables
      WHERE project_id = $1
      ORDER BY created_at ASC;
    `,
    [projectId],
  );

  const tables = tablesRes.rows;
  const tableIds = tables.map((table) => table.id);

  const columnsRes =
    tableIds.length > 0
      ? await app.db.query<ColumnRow>(
          `
            SELECT id, name, data_type, is_nullable, is_primary, is_unique, default_value, position, table_id
            FROM columns
            WHERE table_id = ANY($1::uuid[])
            ORDER BY table_id, position ASC, created_at ASC;
          `,
          [tableIds],
        )
      : { rows: [] as ColumnRow[] };

  const relationshipsRes = await app.db.query<RelationshipRow>(
    `
      SELECT
        r.id,
        r.source_table_id,
        source_table.name AS source_table_name,
        r.source_column_id,
        source_column.name AS source_column_name,
        r.target_table_id,
        target_table.name AS target_table_name,
        r.target_column_id,
        target_column.name AS target_column_name,
        r.on_delete,
        r.on_update
      FROM relationships r
      JOIN tables source_table ON source_table.id = r.source_table_id
      JOIN columns source_column ON source_column.id = r.source_column_id
      JOIN tables target_table ON target_table.id = r.target_table_id
      JOIN columns target_column ON target_column.id = r.target_column_id
      WHERE source_table.project_id = $1
      ORDER BY r.created_at ASC;
    `,
    [projectId],
  );

  const columnsByTable = new Map<string, ColumnRow[]>();
  for (const column of columnsRes.rows) {
    const existing = columnsByTable.get(column.table_id) ?? [];
    existing.push(column);
    columnsByTable.set(column.table_id, existing);
  }

  const relationshipRefs = new Map<string, string>();
  for (const relationship of relationshipsRes.rows) {
    relationshipRefs.set(
      `${relationship.source_table_name}.${relationship.source_column_name}`,
      relationship.target_table_name,
    );
  }

  return {
    project,
    tables,
    columns: columnsRes.rows,
    relationships: relationshipsRes.rows,
    columnsByTable,
    relationshipRefs,
    metadata: normalizeSchemaMetadata(project.schema_metadata),
  };
}

function buildColumnLookup(schema: ProjectSchemaData) {
  const byTableAndColumn = new Map<string, ColumnRow>();
  for (const table of schema.tables) {
    const columns = schema.columnsByTable.get(table.id) ?? [];
    for (const column of columns) {
      byTableAndColumn.set(`${table.name}.${column.name}`, column);
    }
  }
  return byTableAndColumn;
}

function isSuspiciousRelationship(
  schema: ProjectSchemaData,
  relationship: RelationshipRow,
  columnLookup: Map<string, ColumnRow>,
) {
  const sourceColumn = columnLookup.get(`${relationship.source_table_name}.${relationship.source_column_name}`);
  const targetColumn = columnLookup.get(`${relationship.target_table_name}.${relationship.target_column_name}`);
  if (!sourceColumn || !targetColumn) {
    return true;
  }

  if (sourceColumn.data_type.trim().toLowerCase() !== targetColumn.data_type.trim().toLowerCase()) {
    return true;
  }

  if (
    sourceColumn.is_primary &&
    targetColumn.is_primary &&
    relationship.source_column_name.toLowerCase() === "id" &&
    relationship.target_column_name.toLowerCase() === "id" &&
    relationship.source_table_name !== relationship.target_table_name
  ) {
    return true;
  }

  const sourceTable = schema.tables.find((table) => table.id === relationship.source_table_id);
  const sourceColumns = sourceTable ? (schema.columnsByTable.get(sourceTable.id) ?? []) : [];
  if (
    sourceColumn.is_primary &&
    targetColumn.is_primary &&
    sourceColumns.length > 1
  ) {
    return true;
  }

  return false;
}

function normalizeRelationships(schema: ProjectSchemaData) {
  const columnLookup = buildColumnLookup(schema);
  return schema.relationships.filter((relationship) => !isSuspiciousRelationship(schema, relationship, columnLookup));
}

function formatSqlReferentialAction(keyword: "DELETE" | "UPDATE", action: string) {
  const normalized = action.trim().toUpperCase();
  if (!normalized || normalized === "NO ACTION") {
    return null;
  }

  return `ON ${keyword} ${normalized}`;
}

function parseNumericCheck(expression: string, columnName: string) {
  const escapedColumn = columnName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = expression.match(new RegExp(`^${escapedColumn}\\s*(>=|>)\\s*(-?\\d+(?:\\.\\d+)?)$`, "i"));
  if (!match) {
    return null;
  }

  const [, operator, rawValue] = match;
  const value = Number(rawValue);
  if (Number.isNaN(value)) {
    return null;
  }

  return {
    operator,
    value,
    min: operator === ">" ? value + 1 : value,
  };
}

function buildSqlExport(schema: ProjectSchemaData): ExportResult {
  if (schema.tables.length === 0) {
    return {
      format: "postgresql",
      language: "sql",
      filename: formatFilename(schema.project.name, "sql"),
      code: "-- No tables found for this project.",
    };
  }

  const createStatements = schema.tables.flatMap((table) => {
    const columns = schema.columnsByTable.get(table.id) ?? [];
    if (columns.length === 0) {
      return [`-- Skipped empty table ${escapeIdentifier(table.name)} because it has no columns.`];
    }

    const definitions = columns.map((column) => {
      let line = `${escapeIdentifier(column.name)} ${column.data_type}`;

      if (!column.is_nullable) {
        line += " NOT NULL";
      }

      if (column.is_unique) {
        line += " UNIQUE";
      }

      if (column.default_value) {
        line += ` DEFAULT ${column.default_value}`;
      }

      return line;
    });

    const primaryKeys = columns
      .filter((column) => column.is_primary)
      .map((column) => escapeIdentifier(column.name));

    if (primaryKeys.length > 0) {
      definitions.push(`PRIMARY KEY (${primaryKeys.join(", ")})`);
    }

    const checks = schema.metadata.checks
      .filter((check) => check.tableName === table.name)
      .map((check) => check.name
        ? `CONSTRAINT ${escapeIdentifier(check.name)} CHECK (${check.expression})`
        : `CHECK (${check.expression})`);

    definitions.push(...checks);

    return [[
      `CREATE TABLE ${escapeIdentifier(table.name)} (`,
      `  ${definitions.join(",\n  ")}`,
      ");",
    ].join("\n")];
  });

  const relationshipStatements = normalizeRelationships(schema).map((relationship) => {
    const constraintName = [
      "fk",
      relationship.source_table_name,
      relationship.source_column_name,
      relationship.target_table_name,
      relationship.target_column_name,
    ].join("_");

    const clauses = [
      `ALTER TABLE ${escapeIdentifier(relationship.source_table_name)}`,
      `ADD CONSTRAINT ${escapeIdentifier(constraintName)}`,
      `FOREIGN KEY (${escapeIdentifier(relationship.source_column_name)})`,
      `REFERENCES ${escapeIdentifier(relationship.target_table_name)} (${escapeIdentifier(relationship.target_column_name)})`,
      formatSqlReferentialAction("DELETE", relationship.on_delete),
      formatSqlReferentialAction("UPDATE", relationship.on_update),
    ].filter(Boolean);

    return `${clauses.join(" ")};`;
  });

  const extensionStatements = schema.metadata.extensions.map((extension) =>
    `CREATE EXTENSION IF NOT EXISTS ${escapeIdentifier(extension)};`,
  );
  const enumStatements = schema.metadata.enumTypes.map((enumType) =>
    `CREATE TYPE ${escapeIdentifier(enumType.name)} AS ENUM (${enumType.values.map((value) => `'${value.replace(/'/g, "''")}'`).join(", ")});`,
  );
  const indexStatements = schema.metadata.indexes
    .filter((index) => index.columns.length > 0)
    .map((index) => [
      "CREATE",
      index.isUnique ? "UNIQUE" : null,
      "INDEX",
      index.name ? escapeIdentifier(index.name) : null,
      "ON",
      escapeIdentifier(index.tableName),
      `(${index.columns.map((column) => escapeIdentifier(column)).join(", ")})`,
      ";",
    ].filter(Boolean).join(" "));

  return {
    format: "postgresql",
    language: "sql",
    filename: formatFilename(schema.project.name, "sql"),
    code: [...extensionStatements, ...enumStatements, ...createStatements, ...relationshipStatements, ...indexStatements].join("\n\n"),
  };
}

function buildMongooseExport(schema: ProjectSchemaData): ExportResult {
  const relationshipRefs = new Map<string, string>();
  for (const relationship of normalizeRelationships(schema)) {
    relationshipRefs.set(
      `${relationship.source_table_name}.${relationship.source_column_name}`,
      relationship.target_table_name,
    );
  }

  const models = schema.tables
    .filter((table) => (schema.columnsByTable.get(table.id) ?? []).length > 0)
    .map((table) => {
      const schemaName = pascalCase(table.name) || "Diagram";
      const tableIndexes = schema.metadata.indexes.filter((index) => index.tableName === table.name);
      const tableChecks = schema.metadata.checks.filter((check) => check.tableName === table.name);
      const fields = (schema.columnsByTable.get(table.id) ?? []).map((column) => {
        const pieces = [`type: ${mapMongoType(column.data_type)}`];
        const enumType = schema.metadata.enumTypes.find((item) => item.name === column.data_type);

        if (!column.is_nullable || column.is_primary) {
          pieces.push("required: true");
        }

        if (column.is_unique) {
          pieces.push("unique: true");
        }

        if (enumType?.values.length) {
          pieces.push(`enum: [${enumType.values.map((value) => JSON.stringify(value)).join(", ")}]`);
        }

        const defaultValue = formatMongoDefault(column.default_value);
        if (defaultValue) {
          pieces.push(`default: ${defaultValue}`);
        }

        const ref = relationshipRefs.get(`${table.name}.${column.name}`);
        if (ref) {
          pieces.push(`ref: "${pascalCase(ref) || ref}"`);
        }

        const numericCheck = tableChecks
          .filter((check) => check.columnName === column.name)
          .reduce<ReturnType<typeof parseNumericCheck>>((found, check) => {
            if (found) {
              return found;
            }
            return parseNumericCheck(check.expression, column.name);
          }, null);
        if (numericCheck) {
          pieces.push(`min: ${numericCheck.min}`);
        }

        return `  ${column.name}: { ${pieces.join(", ")} }`;
      });

      const indexLines = tableIndexes
        .filter((index) => index.columns.length > 0)
        .map((index) => `${schemaName}Schema.index({ ${index.columns.map((column) => `${camelCase(column) || column}: 1`).join(", ")} }, {${index.isUnique ? " unique: true" : ""} });`);

      return [
        `const ${schemaName}Schema = new mongoose.Schema({`,
        fields.length > 0 ? fields.join(",\n") : "  // No columns defined yet",
        `}, { timestamps: true });`,
        "",
        ...indexLines,
        ...(indexLines.length > 0 ? [""] : []),
        `export const ${schemaName} = mongoose.model("${schemaName}", ${schemaName}Schema);`,
      ].join("\n");
    });

  return {
    format: "mongoose",
    language: "javascript",
    filename: formatFilename(schema.project.name, "models.js"),
    code: [
      `import mongoose from "mongoose";`,
      "",
      models.join("\n\n"),
    ].join("\n"),
  };
}

function buildPrismaExport(schema: ProjectSchemaData): ExportResult {
  const relationMap = new Map<string, RelationshipRow[]>();
  for (const relationship of normalizeRelationships(schema)) {
    const existing = relationMap.get(relationship.source_table_id) ?? [];
    existing.push(relationship);
    relationMap.set(relationship.source_table_id, existing);
  }

  const models = schema.tables.map((table) => {
    const modelName = pascalCase(table.name) || "Model";
    const columns = schema.columnsByTable.get(table.id) ?? [];
    const relations = relationMap.get(table.id) ?? [];

    const fieldLines = columns.map((column) => {
      const prismaType = mapPrismaType(column.data_type);
      const pieces = [`  ${camelCase(column.name) || column.name} ${prismaType}${column.is_nullable ? "?" : ""}`];

      if (column.is_primary) {
        pieces.push("@id");
      }
      if (column.is_unique && !column.is_primary) {
        pieces.push("@unique");
      }
      if (column.default_value?.trim().toLowerCase() === "gen_random_uuid()") {
        pieces.push('@default(dbgenerated("gen_random_uuid()"))');
      } else if (column.default_value?.trim().toLowerCase() === "now()") {
        pieces.push("@default(now())");
      }

      return pieces.join(" ");
    });

    const relationLines = relations.map((relationship) => {
      const targetModel = pascalCase(relationship.target_table_name) || "RelatedModel";
      const fieldName = relationFieldName(relationship.target_table_name);
      const localField = camelCase(relationship.source_column_name) || relationship.source_column_name;
      const remoteField = camelCase(relationship.target_column_name) || relationship.target_column_name;
      return `  ${fieldName} ${targetModel}? @relation(fields: [${localField}], references: [${remoteField}])`;
    });

    return [
      `model ${modelName} {`,
      ...fieldLines,
      ...relationLines,
      `}`,
    ].join("\n");
  });

  return {
    format: "prisma",
    language: "prisma",
    filename: formatFilename(schema.project.name, "prisma"),
    code: [
      `generator client {`,
      `  provider = "prisma-client-js"`,
      `}`,
      ``,
      `datasource db {`,
      `  provider = "${schema.project.database_type === "mongodb" ? "mongodb" : "postgresql"}"`,
      `  url      = env("DATABASE_URL")`,
      `}`,
      ``,
      models.join("\n\n"),
    ].join("\n"),
  };
}

function buildDrizzleExport(schema: ProjectSchemaData): ExportResult {
  const tableDefs = schema.tables.map((table) => {
    const tableVar = `${camelCase(table.name) || "table"}Table`;
    const columns = schema.columnsByTable.get(table.id) ?? [];
    const fieldLines = columns.map((column) => {
      const baseType = column.data_type.toLowerCase().includes("int")
        ? "integer"
        : column.data_type.toLowerCase().includes("bool")
          ? "boolean"
          : column.data_type.toLowerCase().includes("timestamp")
            ? "timestamp"
            : "text";

      const modifiers = [
        column.is_primary ? ".primaryKey()" : "",
        !column.is_nullable ? ".notNull()" : "",
        column.is_unique ? ".unique()" : "",
      ].join("");

      return `  ${camelCase(column.name) || column.name}: ${baseType}("${column.name}")${modifiers},`;
    });

    return [
      `export const ${tableVar} = pgTable("${table.name}", {`,
      ...fieldLines,
      `});`,
    ].join("\n");
  });

  return {
    format: "drizzle",
    language: "typescript",
    filename: formatFilename(schema.project.name, "drizzle.ts"),
    code: [
      `import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";`,
      ``,
      tableDefs.join("\n\n"),
    ].join("\n"),
  };
}

function buildTypeOrmExport(schema: ProjectSchemaData): ExportResult {
  const entities = schema.tables.map((table) => {
    const entityName = pascalCase(table.name) || "Entity";
    const columns = schema.columnsByTable.get(table.id) ?? [];
    const lines = columns.map((column) => {
      const tsType = mapTypescriptType(column.data_type);
      const decorator = column.is_primary
        ? "@PrimaryColumn()"
        : `@Column({ type: "${column.data_type}", nullable: ${column.is_nullable}, unique: ${column.is_unique} })`;

      return [decorator, `  ${camelCase(column.name) || column.name}${column.is_nullable ? "?" : "!"}: ${tsType};`].join("\n");
    });

    return [
      `@Entity("${table.name}")`,
      `export class ${entityName} {`,
      ...lines,
      `}`,
    ].join("\n");
  });

  return {
    format: "typeorm",
    language: "typescript",
    filename: formatFilename(schema.project.name, "typeorm.ts"),
    code: [
      `import { Column, Entity, PrimaryColumn } from "typeorm";`,
      ``,
      entities.join("\n\n"),
    ].join("\n"),
  };
}

function buildSequelizeExport(schema: ProjectSchemaData): ExportResult {
  const models = schema.tables.map((table) => {
    const modelName = pascalCase(table.name) || "Model";
    const columns = schema.columnsByTable.get(table.id) ?? [];

    const fieldLines = columns.map((column) => {
      const sequelizeType = column.data_type.toLowerCase().includes("int")
        ? "DataTypes.INTEGER"
        : column.data_type.toLowerCase().includes("bool")
          ? "DataTypes.BOOLEAN"
          : column.data_type.toLowerCase().includes("timestamp")
            ? "DataTypes.DATE"
            : "DataTypes.STRING";

      return `    ${camelCase(column.name) || column.name}: { type: ${sequelizeType}, allowNull: ${column.is_nullable}, unique: ${column.is_unique}, primaryKey: ${column.is_primary} },`;
    });

    return [
      `export const ${modelName} = sequelize.define("${modelName}", {`,
      ...fieldLines,
      `  }, { tableName: "${table.name}" });`,
    ].join("\n");
  });

  return {
    format: "sequelize",
    language: "javascript",
    filename: formatFilename(schema.project.name, "sequelize.js"),
    code: [
      `import { DataTypes, Sequelize } from "sequelize";`,
      ``,
      `const sequelize = new Sequelize(process.env.DATABASE_URL || "", { dialect: "postgres" });`,
      ``,
      models.join("\n\n"),
    ].join("\n"),
  };
}

function buildLaravelExport(schema: ProjectSchemaData): ExportResult {
  const migrations = schema.tables.map((table) => {
    const columns = schema.columnsByTable.get(table.id) ?? [];
    const lines = columns.map((column) => {
      const method = mapLaravelType(column.data_type);
      const suffixes = [
        column.is_nullable ? "->nullable()" : "",
        column.is_unique ? "->unique()" : "",
      ]
        .filter(Boolean)
        .join("");

      if (column.is_primary) {
        return `            $table->${method}("${column.name}")->primary();`;
      }

      return `            $table->${method}("${column.name}")${suffixes};`;
    });

    return [
      `Schema::create("${table.name}", function (Blueprint $table) {`,
      ...lines,
      `        });`,
    ].join("\n");
  });

  return {
    format: "laravel",
    language: "php",
    filename: formatFilename(schema.project.name, "migration.php"),
    code: [
      `<?php`,
      ``,
      `use Illuminate\\Database\\Migrations\\Migration;`,
      `use Illuminate\\Database\\Schema\\Blueprint;`,
      `use Illuminate\\Support\\Facades\\Schema;`,
      ``,
      `return new class extends Migration`,
      `{`,
      `    public function up(): void`,
      `    {`,
      migrations.map((block) => block.split("\n").map((line) => `        ${line}`).join("\n")).join("\n\n"),
      `    }`,
      ``,
      `    public function down(): void`,
      `    {`,
      schema.tables.map((table) => `        Schema::dropIfExists("${table.name}");`).join("\n"),
      `    }`,
      `};`,
    ].join("\n"),
  };
}

export function buildExport(
  schema: ProjectSchemaData,
  format: ExportFormat,
): ExportResult {
  switch (format) {
    case "mongoose":
      return buildMongooseExport(schema);
    case "prisma":
      return buildPrismaExport(schema);
    case "drizzle":
      return buildDrizzleExport(schema);
    case "typeorm":
      return buildTypeOrmExport(schema);
    case "sequelize":
      return buildSequelizeExport(schema);
    case "laravel":
      return buildLaravelExport(schema);
    case "postgresql":
    default:
      return buildSqlExport(schema);
  }
}

export const SUPPORTED_EXPORT_FORMATS: ExportFormat[] = [
  "postgresql",
  "mongoose",
  "prisma",
  "drizzle",
  "typeorm",
  "sequelize",
  "laravel",
];
