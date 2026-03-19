import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type CreateProjectBody = {
  name: string;
  description?: string;
  database_type?: string;
  owner_username?: string;
};

type UpdateProjectBody = {
  name?: string;
  description?: string | null;
  database_type?: string;
  is_favorite?: boolean;
  is_archived?: boolean;
};

type ProjectParams = {
  id: string;
};

type ProjectSlugParams = {
  username: string;
  slug: string;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  owner_username: string;
  slug: string;
  database_type: string;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

declare module "fastify" {
  interface FastifyRequest {
    auth: {
      userId: string | null;
      sessionId: string | null;
    };
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeUsername(value: string | undefined | null, fallback: string) {
  const base = slugify(value ?? "");
  return base || slugify(fallback) || "user";
}

async function buildUniqueSlug(
  app: FastifyInstance,
  ownerUsername: string,
  name: string,
) {
  const baseSlug = slugify(name) || "diagram";

  const existing = await app.db.query<{ slug: string }>(
    `
      SELECT slug
      FROM projects
      WHERE owner_username = $1 AND slug = $2
      LIMIT 1;
    `,
    [ownerUsername, baseSlug],
  );

  if (existing.rows.length === 0) {
    return baseSlug;
  }

  let suffix = 2;
  while (suffix < 100) {
    const candidate = `${baseSlug}-${suffix}`;
    const clash = await app.db.query<{ slug: string }>(
      `
        SELECT slug
        FROM projects
        WHERE owner_username = $1 AND slug = $2
        LIMIT 1;
      `,
      [ownerUsername, candidate],
    );

    if (clash.rows.length === 0) {
      return candidate;
    }

    suffix += 1;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

function mapProjectRow(row: ProjectRow) {
  return row;
}

export async function createProject(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { name, description, database_type, owner_username } =
    request.body as CreateProjectBody;
  const userId = request.auth?.userId;

  if (!userId) {
    return reply.status(401).send({ message: "Must be logged in to create projects" });
  }

  if (!name?.trim()) {
    return reply.status(400).send({ message: "Project name is required" });
  }

  const normalizedOwnerUsername = normalizeUsername(owner_username, userId);
  const slug = await buildUniqueSlug(app, normalizedOwnerUsername, name.trim());
  const normalizedDatabaseType = (database_type ?? "postgresql").trim().toLowerCase();

  try {
    const result = await app.db.query<ProjectRow>(
      `
        INSERT INTO projects (name, description, user_id, owner_username, slug, database_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `,
      [
        name.trim(),
        description?.trim() || null,
        userId,
        normalizedOwnerUsername,
        slug,
        normalizedDatabaseType,
      ],
    );

    return reply.status(201).send(mapProjectRow(result.rows[0]));
  } catch (error: any) {
    if (error?.code === "23505") {
      return reply.status(409).send({
        message: "A diagram with that name already exists for this workspace.",
      });
    }

    request.log.error({ error }, "Failed to create project");
    return reply.status(500).send({
      message: "Unable to create the diagram right now.",
    });
  }
}

export async function getProjects(
  app: FastifyInstance,
  request: FastifyRequest,
) {
  const userId = request.auth?.userId;

  if (!userId) {
    return [];
  }

  const result = await app.db.query<ProjectRow>(
    `
      SELECT *
      FROM projects
      WHERE user_id = $1
      ORDER BY is_favorite DESC, is_archived ASC, updated_at DESC, created_at DESC;
    `,
    [userId],
  );

  return result.rows.map(mapProjectRow);
}

export async function getProjectById(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as ProjectParams;
  const userId = request.auth?.userId;

  const result = await app.db.query<ProjectRow>(
    `
      SELECT *
      FROM projects
      WHERE id = $1 AND user_id = $2;
    `,
    [id, userId || "non_existent_id"],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Project not found or access denied" });
  }

  return mapProjectRow(result.rows[0]);
}

export async function getProjectBySlug(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { username, slug } = request.params as ProjectSlugParams;
  const normalizedUsername = slugify(username);
  const normalizedSlug = slugify(slug);

  const result = await app.db.query<ProjectRow>(
    `
      SELECT *
      FROM projects
      WHERE owner_username = $1 AND slug = $2;
    `,
    [normalizedUsername, normalizedSlug],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Project not found or access denied" });
  }

  return mapProjectRow(result.rows[0]);
}

export async function updateProject(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as ProjectParams;
  const { name, description, database_type, is_favorite, is_archived } =
    request.body as UpdateProjectBody;
  const userId = request.auth?.userId;

  if (!userId) {
    return reply.status(401).send({ message: "Must be logged in to update projects" });
  }

  const result = await app.db.query<ProjectRow>(
    `
      UPDATE projects
      SET
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        database_type = COALESCE($5, database_type),
        is_favorite = COALESCE($6, is_favorite),
        is_archived = COALESCE($7, is_archived),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `,
    [
      id,
      userId,
      name?.trim() || null,
      description === undefined ? null : description?.trim() || null,
      database_type?.trim().toLowerCase() || null,
      typeof is_favorite === "boolean" ? is_favorite : null,
      typeof is_archived === "boolean" ? is_archived : null,
    ],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ message: "Project not found or permission denied" });
  }

  return mapProjectRow(result.rows[0]);
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
