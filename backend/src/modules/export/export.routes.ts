import { FastifyInstance } from "fastify";
import { exportCode, exportSQL } from "./export.controller";

export async function exportRoutes(app: FastifyInstance) {
  app.get("/projects/:projectId/export-code", async (req, reply) =>
    exportCode(app, req, reply)
  );
  app.get("/projects/:projectId/export-sql", async (req, reply) =>
    exportSQL(app, req, reply)
  );
}
