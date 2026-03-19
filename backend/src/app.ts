import cors from "@fastify/cors";
import { clerkPlugin } from "@clerk/fastify";
import Fastify from "fastify";
import { exportRoutes } from "./modules/export/export.routes";
import { healthRoutes } from "./modules/health/health.routes";
import { columnRoutes } from "./modules/columns/column.routes";
import projectRoutes from "./modules/projects/routes/project.routes";
import { relationshipRoutes } from "./modules/relationships/relationship.routes";
import { tableRoutes } from "./modules/tables/table.routes";
import dbConnector from "./plugins/db";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  await app.register(clerkPlugin);
  await app.register(dbConnector);

  await app.register(healthRoutes, { prefix: "/api" });
  await app.register(projectRoutes, { prefix: "/api" });
  await app.register(tableRoutes, { prefix: "/api" });
  await app.register(columnRoutes, { prefix: "/api" });
  await app.register(relationshipRoutes, { prefix: "/api" });
  await app.register(exportRoutes, { prefix: "/api" });

  return app;
}
