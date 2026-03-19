import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const DEV_USER_ID = "dev-user-1";

type CreateProjectBody = {
  name: string;
  description?: string;
};

type ProjectParams = {
  id: string;
};

// Types for Clerk auth on the request
declare module 'fastify' {
  interface FastifyRequest {
    auth: {
      userId: string | null;
      sessionId: string | null;
    }
  }
}

export async function createProject(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { name, description } = request.body as CreateProjectBody;
  // Use Clerk userId or fallback to a common guest account for anonymous workspaces
  const userId = request.auth?.userId || "clerk_guest";

  if (!name?.trim()) {
    return reply.status(400).send({ message: "Project name is required" });
  }

  const result = await app.db.query(
    `
      INSERT INTO projects (name, description, user_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
    [name.trim(), description?.trim() || null, userId],
  );

  return reply.status(201).send(result.rows[0]);
}

export async function getProjects(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const userId = request.auth?.userId;
  
  if (!userId) {
    // Unauthenticated users see no projects in the dashboard list as requested
    return [];
  }

  const result = await app.db.query(
    `
      SELECT *
      FROM projects
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `,
    [userId],
  );

  return result.rows;
}

export async function getProjectById(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as ProjectParams;
  const userId = request.auth?.userId;

  // For individual workspace viewing, we allow guests ("clerk_guest") OR the owner.
  // This allows shared workspace viewing if we want to support it later, 
  // currently we just check if it belongs to the user or is a guest project.
  const result = await app.db.query(
    `
      SELECT *
      FROM projects
      WHERE id = $1 AND (user_id = $2 OR user_id = 'clerk_guest');
    `,
    [id, userId || 'non_existent_id'],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Project not found or access denied" });
  }

  return result.rows[0];
}

export async function deleteProject(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as ProjectParams;
  const userId = request.auth?.userId;

  if (!userId) {
    return reply.status(401).send({ message: "Must be logged in to delete projects" });
  }

  const result = await app.db.query(
    `
      DELETE FROM projects
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `,
    [id, userId],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Project not found or permission denied" });
  }

  return reply.send({ message: "Project deleted" });
}
