import { FastifyInstance } from "fastify";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjectBySlug,
  getProjects,
  updateProject,
} from "../controller/project.controller";

export default async function projectRoutes(app: FastifyInstance) {
  app.post("/projects", async (request, reply) =>
    createProject(app, request, reply),
  );

  app.get("/projects", async (request) => getProjects(app, request));

  app.get("/projects/:id", async (request, reply) =>
    getProjectById(app, request, reply),
  );

  app.get("/u/:username/diagrams/:slug", async (request, reply) =>
    getProjectBySlug(app, request, reply),
  );

  app.patch("/projects/:id", async (request, reply) =>
    updateProject(app, request, reply),
  );

  app.delete("/projects/:id", async (request, reply) =>
    deleteProject(app, request, reply),
  );
}
