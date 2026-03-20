import { FastifyInstance } from "fastify";
import {
  createColumn,
  deleteColumn,
  updateColumn,
  getColumnsByTable,
} from "./column.controller";

export async function columnRoutes(app: FastifyInstance) {
  app.post("/columns", async (request, reply) =>
    createColumn(app, request, reply),
  );

  app.get("/tables/:tableId/columns", async (request) =>
    getColumnsByTable(app, request),
  );

  app.delete("/columns/:id", async (request, reply) =>
    deleteColumn(app, request, reply),
  );

  app.patch("/columns/:id", async (request, reply) =>
    updateColumn(app, request, reply),
  );
}
