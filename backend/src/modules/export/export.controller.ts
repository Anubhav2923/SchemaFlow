import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  buildExport,
  getDefaultFormat,
  loadProjectSchema,
  SUPPORTED_EXPORT_FORMATS,
  type ExportFormat,
} from "./export.service";

type ExportParams = {
  projectId: string;
};

type ExportQuery = {
  format?: string;
};

function normalizeFormat(input: string | undefined, fallback: ExportFormat) {
  const value = (input ?? fallback).trim().toLowerCase();
  return SUPPORTED_EXPORT_FORMATS.includes(value as ExportFormat)
    ? (value as ExportFormat)
    : null;
}

export async function exportCode(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { projectId } = request.params as ExportParams;
  const { format: formatInput } = request.query as ExportQuery;

  try {
    const schema = await loadProjectSchema(app, projectId);
    const fallbackFormat = getDefaultFormat(schema.project.database_type);
    const format = normalizeFormat(formatInput, fallbackFormat);

    if (!format) {
      return reply.status(400).send({
        message: `Unsupported export format. Supported formats: ${SUPPORTED_EXPORT_FORMATS.join(", ")}`,
      });
    }

    const result = buildExport(schema, format);
    return reply.send(result);
  } catch (error) {
    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return reply.status(404).send({ message: "Project not found" });
    }

    request.log.error({ error }, "Failed to export project code");
    return reply.status(500).send({ message: "Failed to export project code" });
  }
}

export async function exportSQL(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { projectId } = request.params as ExportParams;

  try {
    const schema = await loadProjectSchema(app, projectId);
    const result = buildExport(schema, getDefaultFormat(schema.project.database_type));
    return reply.send({ sql: result.code });
  } catch (error) {
    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return reply.status(404).send({ message: "Project not found" });
    }

    request.log.error({ error }, "Failed to export project SQL");
    return reply.status(500).send({ message: "Failed to export project SQL" });
  }
}
