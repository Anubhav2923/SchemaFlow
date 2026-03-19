import { FastifyInstance } from "fastify";
import {
  createTable,
  deleteTable,
  getTablesByProject,
} from "./table.controller";

export async function tableRoutes(app: FastifyInstance) {
  app.post("/tables", async (request, reply) =>
    createTable(app, request, reply),
  );

  app.get("/projects/:projectId/tables", async (request) =>
    getTablesByProject(app, request),
  );

  app.delete("/tables/:id", async (request, reply) =>
    deleteTable(app, request, reply),
  );
}
