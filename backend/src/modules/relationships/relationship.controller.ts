import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type CreateRelationshipBody = {
  source_table_id: string;
  source_column_id: string;
  target_table_id: string;
  target_column_id: string;
  on_delete?: string;
  on_update?: string;
};

type RelationshipParams = {
  id: string;
};

type ProjectRelationshipsParams = {
  projectId: string;
};

const RELATION_ACTIONS = new Set([
  "NO ACTION",
  "RESTRICT",
  "CASCADE",
  "SET NULL",
  "SET DEFAULT",
]);

function normalizeRelationAction(value: string | undefined) {
  const normalized = (value ?? "NO ACTION").trim().toUpperCase();
  return RELATION_ACTIONS.has(normalized) ? normalized : null;
}

export async function createRelationship(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const {
    source_table_id: sourceTableId,
    source_column_id: sourceColumnId,
    target_table_id: targetTableId,
    target_column_id: targetColumnId,
    on_delete: onDeleteInput,
    on_update: onUpdateInput,
  } = request.body as CreateRelationshipBody;

  if (!sourceTableId || !sourceColumnId || !targetTableId || !targetColumnId) {
    return reply.status(400).send({
      message:
        "source_table_id, source_column_id, target_table_id, and target_column_id are required",
    });
  }

  const onDelete = normalizeRelationAction(onDeleteInput);
  const onUpdate = normalizeRelationAction(onUpdateInput);

  if (!onDelete || !onUpdate) {
    return reply.status(400).send({
      message: "on_delete and on_update must be valid SQL referential actions",
    });
  }

  if (sourceColumnId === targetColumnId) {
    return reply.status(400).send({
      message: "A relationship must connect two different columns",
    });
  }

  const validationResult = await app.db.query(
    `
      SELECT
        c.id,
        c.table_id,
        t.project_id
      FROM columns c
      JOIN tables t ON t.id = c.table_id
      WHERE c.id = ANY($1::uuid[]);
    `,
    [[sourceColumnId, targetColumnId]],
  );

  if (validationResult.rows.length !== 2) {
    return reply.status(404).send({ message: "Referenced columns were not found" });
  }

  const sourceColumn = validationResult.rows.find((row) => row.id === sourceColumnId);
  const targetColumn = validationResult.rows.find((row) => row.id === targetColumnId);

  if (
    !sourceColumn ||
    !targetColumn ||
    sourceColumn.table_id !== sourceTableId ||
    targetColumn.table_id !== targetTableId
  ) {
    return reply.status(400).send({
      message: "Columns must belong to the provided source and target tables",
    });
  }

  if (sourceColumn.project_id !== targetColumn.project_id) {
    return reply.status(400).send({
      message: "Relationships can only be created within the same project",
    });
  }

  const result = await app.db.query(
    `
      INSERT INTO relationships (
        source_table_id,
        source_column_id,
        target_table_id,
        target_column_id,
        on_delete,
        on_update
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `,
    [sourceTableId, sourceColumnId, targetTableId, targetColumnId, onDelete, onUpdate],
  );

  return reply.status(201).send(result.rows[0]);
}

export async function getRelationshipsByProject(
  app: FastifyInstance,
  request: FastifyRequest,
) {
  const { projectId } = request.params as ProjectRelationshipsParams;

  const result = await app.db.query(
    `
      SELECT r.*
      FROM relationships r
      JOIN tables source_table ON source_table.id = r.source_table_id
      WHERE source_table.project_id = $1
      ORDER BY r.created_at ASC;
    `,
    [projectId],
  );

  return result.rows;
}

export async function deleteRelationship(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as RelationshipParams;

  const result = await app.db.query(
    `
      DELETE FROM relationships
      WHERE id = $1
      RETURNING id;
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Relationship not found" });
  }

  return reply.send({ message: "Relationship deleted" });
}
