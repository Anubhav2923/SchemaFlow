import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type CreateColumnBody = {
  name: string;
  data_type: string;
  is_nullable?: boolean;
  is_primary?: boolean;
  is_unique?: boolean;
  default_value?: string | null;
  position?: number;
  table_id: string;
};

type ColumnParams = {
  id: string;
};

type TableColumnsParams = {
  tableId: string;
};

export async function createColumn(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const {
    name,
    data_type: dataType,
    is_nullable: isNullable = true,
    is_primary: isPrimary = false,
    is_unique: isUnique = false,
    default_value: defaultValue = null,
    position,
    table_id: tableId,
  } = request.body as CreateColumnBody;

  if (!name?.trim() || !dataType?.trim() || !tableId) {
    return reply
      .status(400)
      .send({ message: "Column name, data_type, and table_id are required" });
  }

  const tableResult = await app.db.query(`SELECT id FROM tables WHERE id = $1`, [
    tableId,
  ]);

  if (tableResult.rows.length === 0) {
    return reply.status(404).send({ message: "Table not found" });
  }

  const nextPositionResult = await app.db.query(
    `
      SELECT COALESCE(MAX(position), -1) + 1 AS next_position
      FROM columns
      WHERE table_id = $1;
    `,
    [tableId],
  );

  const resolvedPosition =
    typeof position === "number"
      ? position
      : Number(nextPositionResult.rows[0]?.next_position ?? 0);

  const normalizedIsPrimary = Boolean(isPrimary);
  const normalizedIsNullable = normalizedIsPrimary ? false : Boolean(isNullable);
  const normalizedIsUnique = normalizedIsPrimary ? true : Boolean(isUnique);

  const result = await app.db.query(
    `
      INSERT INTO columns (
        name,
        data_type,
        is_nullable,
        is_primary,
        is_unique,
        default_value,
        position,
        table_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `,
    [
      name.trim(),
      dataType.trim(),
      normalizedIsNullable,
      normalizedIsPrimary,
      normalizedIsUnique,
      defaultValue,
      resolvedPosition,
      tableId,
    ],
  );

  return reply.status(201).send(result.rows[0]);
}

export async function getColumnsByTable(
  app: FastifyInstance,
  request: FastifyRequest,
) {
  const { tableId } = request.params as TableColumnsParams;

  const result = await app.db.query(
    `
      SELECT *
      FROM columns
      WHERE table_id = $1
      ORDER BY position ASC, created_at ASC;
    `,
    [tableId],
  );

  return result.rows;
}

export async function deleteColumn(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as ColumnParams;

  const result = await app.db.query(
    `
      DELETE FROM columns
      WHERE id = $1
      RETURNING id;
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Column not found" });
  }

  return reply.send({ message: "Column deleted" });
}
