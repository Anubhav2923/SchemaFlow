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
import { fastifyStatic } from "@fastify/static";
import path from "path";
import fs from "fs";

export async function buildApp() {
  const app = Fastify({ logger: true });
  const isDevelopment = process.env.NODE_ENV !== "production";

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(fastifyRateLimit, {
    max: isDevelopment ? 5000 : 300,
    timeWindow: "1 minute",
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
  
  // Serve Static Frontend (Prod - single service on Render)
  // Render build copies frontend/dist -> backend/dist/public
  // Local dev fallback: ../../frontend/dist
  const publicPath = path.join(__dirname, "public");
  const localFrontendPath = path.join(__dirname, "../../frontend/dist");
  const frontendPath = fs.existsSync(publicPath) ? publicPath : localFrontendPath;
  if (fs.existsSync(frontendPath)) {
    await app.register(fastifyStatic, {
      root: frontendPath,
      prefix: "/",
      wildcard: false, // needed for catch-all below
    });

    // SPA Catch-all: Route everything else to index.html for React Router
    // IMPORTANT: don't hijack /api 404s — let them return JSON
    app.setNotFoundHandler((req, res) => {
      if (req.raw.url?.startsWith("/api")) {
        res.status(404).send({ status: "error", message: "Not found" });
        return;
      }
      res.status(200).sendFile("index.html");
    });
  }

  return app;
}
