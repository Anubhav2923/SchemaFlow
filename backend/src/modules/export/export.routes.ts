import { FastifyInstance } from "fastify";
import { exportSQL } from "./export.controller";

export async function exportRoutes(app: FastifyInstance) {
  app.get("/projects/:projectId/export-sql", async (req, reply) =>
    exportSQL(app, req, reply)
  );
}