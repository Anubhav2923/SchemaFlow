import cors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import { clerkPlugin } from "@clerk/fastify";
import Fastify from "fastify";
import { aiRoutes } from "./modules/ai/ai.routes";
import { exportRoutes } from "./modules/export/export.routes";
import { healthRoutes } from "./modules/health/health.routes";
import { columnRoutes } from "./modules/columns/column.routes";
import projectRoutes from "./modules/projects/routes/project.routes";
import { relationshipRoutes } from "./modules/relationships/relationship.routes";
import { tableRoutes } from "./modules/tables/table.routes";
import dbConnector from "./plugins/db";

import groupRoutes from "./modules/groups/groups.routes";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(fastifyRateLimit, {
    max: 100, // 100 requests per minute per IP
    timeWindow: '1 minute'
  });

  await app.register(clerkPlugin);
  await app.register(dbConnector);

  await app.register(healthRoutes, { prefix: "/api" });
  await app.register(projectRoutes, { prefix: "/api" });
  await app.register(tableRoutes, { prefix: "/api" });
  await app.register(columnRoutes, { prefix: "/api" });
  await app.register(relationshipRoutes, { prefix: "/api" });
  await app.register(groupRoutes, { prefix: "/api/groups" });
  await app.register(exportRoutes, { prefix: "/api" });
  await app.register(aiRoutes, { prefix: "/api/ai" });

  return app;
}
