import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type CreateGroupBody = {
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  project_id: string;
  table_ids?: string[];
};

type GroupParams = {
  id: string;
};

export async function createGroup(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { name, color, x, y, width, height, project_id, table_ids } = request.body as CreateGroupBody;
  const userId = request.auth?.userId;

  if (!userId) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  // Verify project ownership
  const projectResult = await app.db.query(
    `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
    [project_id, userId],
  );

  if (projectResult.rows.length === 0) {
    return reply.status(404).send({ message: "Project not found or access denied" });
  }

  const client = await app.db.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO groups (name, color, x, y, width, height, project_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
      `,
      [name || "Comment Box", color || "#ffffff33", x || 0, y || 0, width || 400, height || 300, project_id],
    );

    const group = result.rows[0];

    if (table_ids && table_ids.length > 0) {
      await client.query(
        `
        UPDATE tables 
        SET group_id = $1 
        WHERE id = ANY($2::uuid[]) AND project_id = $3
        `,
        [group.id, table_ids, project_id],
      );
    }

    await client.query("COMMIT");
    return reply.status(201).send(group);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getGroupsByProject(
  app: FastifyInstance,
  request: FastifyRequest,
) {
  const { projectId } = request.params as { projectId: string };

  const result = await app.db.query(
    `SELECT * FROM groups WHERE project_id = $1 ORDER BY created_at ASC`,
    [projectId],
  );

  return result.rows;
}

export async function updateGroup(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as GroupParams;
  const { name, color, x, y, width, height } = request.body as any;
  const userId = request.auth?.userId;

  if (!userId) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  const result = await app.db.query(
    `
    UPDATE groups
    SET 
      name = COALESCE($1, name),
      color = COALESCE($2, color),
      x = COALESCE($3, x),
      y = COALESCE($4, y),
      width = COALESCE($5, width),
      height = COALESCE($6, height)
    WHERE id = $7 AND EXISTS (
      SELECT 1 FROM projects WHERE projects.id = groups.project_id AND projects.user_id = $8
    )
    RETURNING *;
    `,
    [name, color, x, y, width, height, id, userId],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Group not found or access denied" });
  }

  return result.rows[0];
}

export async function deleteGroup(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as GroupParams;
  const userId = request.auth?.userId;

  if (!userId) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  const client = await app.db.connect();
  let result;
  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE tables
      SET group_id = NULL
      WHERE group_id = $1
        AND EXISTS (
          SELECT 1 FROM projects WHERE projects.id = tables.project_id AND projects.user_id = $2
        );
      `,
      [id, userId],
    );

    result = await client.query(
      `
      DELETE FROM groups
      WHERE id = $1 AND EXISTS (
        SELECT 1 FROM projects WHERE projects.id = groups.project_id AND projects.user_id = $2
      )
      RETURNING id;
      `,
      [id, userId],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Group not found or access denied" });
  }

  return reply.send({ message: "Group deleted" });
}
