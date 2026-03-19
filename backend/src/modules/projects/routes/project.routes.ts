import { FastifyInstance } from "fastify";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
} from "../controller/project.controller";

export default async function projectRoutes(app: FastifyInstance) {
  app.post("/projects", async (request, reply) =>
    createProject(app, request, reply),
  );

  app.get("/projects", async (request, reply) => getProjects(app, request, reply));

  app.get("/projects/:id", async (request, reply) =>
    getProjectById(app, request, reply),
  );

  app.delete("/projects/:id", async (request, reply) =>
    deleteProject(app, request, reply),
  );
}
