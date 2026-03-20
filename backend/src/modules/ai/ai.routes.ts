import type { FastifyInstance } from "fastify";
import { generateSchemaWithAi, optimizeSchemaWithAi } from "./ai.controller";

export async function aiRoutes(app: FastifyInstance) {
  app.post("/generate-schema", async (request, reply) =>
    generateSchemaWithAi(app, request, reply),
  );

  app.post("/optimize-schema", async (request, reply) =>
    optimizeSchemaWithAi(app, request, reply),
  );
}
