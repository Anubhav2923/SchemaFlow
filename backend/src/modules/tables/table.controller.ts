import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type CreateTableBody = {
  name: string;
  project_id: string;
};

type TableParams = {
  id: string;
};

type ProjectTablesParams = {
  projectId: string;
};

export async function createTable(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { name, project_id: projectId } = request.body as CreateTableBody;

  if (!name?.trim() || !projectId) {
    return reply
      .status(400)
      .send({ message: "Table name and project_id are required" });
  }

  const userId = request.auth?.userId;

  if (!userId) {
    return reply.status(401).send({ message: "Must be logged in to modify schema" });
  }

  const projectResult = await app.db.query(
    `SELECT id FROM projects WHERE id = $1 AND (user_id = $2 OR user_id = 'clerk_guest')`,
    [projectId, userId],
  );

  if (projectResult.rows.length === 0) {
    return reply.status(404).send({ message: "Project not found or permission denied" });
  }

  const result = await app.db.query(
    `
      INSERT INTO tables (name, project_id)
      VALUES ($1, $2)
      RETURNING *;
    `,
    [name.trim(), projectId],
  );

  return reply.status(201).send(result.rows[0]);
}

export async function getTablesByProject(
  app: FastifyInstance,
  request: FastifyRequest,
) {
  const { projectId } = request.params as ProjectTablesParams;

  const result = await app.db.query(
    `
      SELECT *
      FROM tables
      WHERE project_id = $1
      ORDER BY created_at ASC;
    `,
    [projectId],
  );

  return result.rows;
}

export async function deleteTable(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as TableParams;

  const userId = request.auth?.userId;
  
  if (!userId) {
    return reply.status(401).send({ message: "Must be logged in to delete tables" });
  }

  const result = await app.db.query(
    `
      DELETE FROM tables
      WHERE id = $1 AND EXISTS (
        SELECT 1 FROM projects WHERE projects.id = tables.project_id AND projects.user_id = $2
      )
      RETURNING id;
    `,
    [id, userId],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Table not found" });
  }

  return reply.send({ message: "Table deleted" });
}
