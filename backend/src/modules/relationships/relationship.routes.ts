import { FastifyInstance } from "fastify";
import {
  createRelationship,
  deleteRelationship,
  getRelationshipsByProject,
} from "./relationship.controller";

export async function relationshipRoutes(app: FastifyInstance) {
  app.post("/relationships", async (request, reply) =>
    createRelationship(app, request, reply),
  );

  app.get("/projects/:projectId/relationships", async (request) =>
    getRelationshipsByProject(app, request),
  );

  app.delete("/relationships/:id", async (request, reply) =>
    deleteRelationship(app, request, reply),
  );
}
