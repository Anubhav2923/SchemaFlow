import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type ExportParams = {
  projectId: string;
};

type TableRow = {
  id: string;
  name: string;
};

type ColumnRow = {
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

type RelationshipRow = {
  source_table_name: string;
  source_column_name: string;
  target_table_name: string;
  target_column_name: string;
  on_delete: string;
  on_update: string;
};

function escapeIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

export async function exportSQL(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { projectId } = request.params as ExportParams;

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

  if (tables.length === 0) {
    return reply.send({ sql: "-- No tables found for this project." });
  }

  const tableIds = tables.map((table) => table.id);

  const columnsRes = await app.db.query<ColumnRow>(
    `
      SELECT id, name, data_type, is_nullable, is_primary, is_unique, default_value, position, table_id
      FROM columns
      WHERE table_id = ANY($1::uuid[])
      ORDER BY table_id, position ASC, created_at ASC;
    `,
    [tableIds],
  );

  const relationshipsRes = await app.db.query<RelationshipRow>(
    `
      SELECT
        source_table.name AS source_table_name,
        source_column.name AS source_column_name,
        target_table.name AS target_table_name,
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

  const createStatements = tables.map((table) => {
    const columns = columnsByTable.get(table.id) ?? [];
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

    return [
      `CREATE TABLE ${escapeIdentifier(table.name)} (`,
      `  ${definitions.join(",\n  ")}`,
      ");",
    ].join("\n");
  });

  const relationshipStatements = relationshipsRes.rows.map((relationship) => {
    const constraintName = [
      "fk",
      relationship.source_table_name,
      relationship.source_column_name,
      relationship.target_table_name,
      relationship.target_column_name,
    ].join("_");

    return [
      `ALTER TABLE ${escapeIdentifier(relationship.source_table_name)}`,
      `ADD CONSTRAINT ${escapeIdentifier(constraintName)}`,
      `FOREIGN KEY (${escapeIdentifier(relationship.source_column_name)})`,
      `REFERENCES ${escapeIdentifier(relationship.target_table_name)} (${escapeIdentifier(relationship.target_column_name)})`,
      `ON DELETE ${relationship.on_delete} ON UPDATE ${relationship.on_update};`,
    ].join(" ");
  });

  return reply.send({
    sql: [...createStatements, ...relationshipStatements].join("\n\n"),
  });
}
