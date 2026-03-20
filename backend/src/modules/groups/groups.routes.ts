import { FastifyInstance } from "fastify";
import {
  createGroup,
  getGroupsByProject,
  updateGroup,
  deleteGroup,
} from "./groups.controller";

export default async function groupRoutes(app: FastifyInstance) {
  app.post("/", (request, reply) => createGroup(app, request, reply));
  app.get("/project/:projectId", (request, reply) => getGroupsByProject(app, request));
  app.patch("/:id", (request, reply) => updateGroup(app, request, reply));
  app.delete("/:id", (request, reply) => deleteGroup(app, request, reply));
}
