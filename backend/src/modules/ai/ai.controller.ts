import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env";
import { loadProjectSchema } from "../export/export.service";

type GenerateSchemaBody = {
  prompt: string;
  databaseType?: string;
  projectId?: string;
};

type OptimizeSchemaBody = {
  projectId: string;
};

type NvidiaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function extractJsonBlock(value: string) {
  const fenced = value.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return value.slice(firstBrace, lastBrace + 1);
  }

  return value.trim();
}

async function callNvidia(messages: NvidiaMessage[]) {
  if (!env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY_MISSING");
  }

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.NVIDIA_MODEL,
      messages,
      max_tokens: 4096,
      temperature: 0.4,
      top_p: 0.9,
      stream: false,
      chat_template_kwargs: {
        enable_thinking: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`NVIDIA_HTTP_${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("NVIDIA_EMPTY_RESPONSE");
  }

  return content;
}

function schemaContextToPrompt(schema: Awaited<ReturnType<typeof loadProjectSchema>>) {
  return JSON.stringify(
    {
      project: {
        id: schema.project.id,
        name: schema.project.name,
        databaseType: schema.project.database_type,
      },
      tables: schema.tables.map((table) => ({
        id: table.id,
        name: table.name,
        columns: (schema.columnsByTable.get(table.id) ?? []).map((column) => ({
          id: column.id,
          name: column.name,
          dataType: column.data_type,
          nullable: column.is_nullable,
          primary: column.is_primary,
          unique: column.is_unique,
          defaultValue: column.default_value,
        })),
      })),
      relationships: schema.relationships.map((relationship) => ({
        sourceTable: relationship.source_table_name,
        sourceColumn: relationship.source_column_name,
        targetTable: relationship.target_table_name,
        targetColumn: relationship.target_column_name,
        onDelete: relationship.on_delete,
        onUpdate: relationship.on_update,
      })),
    },
    null,
    2,
  );
}

export async function generateSchemaWithAi(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { prompt, databaseType, projectId } = request.body as GenerateSchemaBody;

  if (!prompt?.trim()) {
    return reply.status(400).send({ message: "prompt is required" });
  }

  try {
    const existingSchema = projectId ? await loadProjectSchema(app, projectId) : null;
    const content = await callNvidia([
      {
        role: "system",
        content:
          "You are an expert database architect. Return strictly valid JSON only. Do not use markdown. " +
          "Use this JSON shape: " +
          '{"summary":"string","tables":[{"name":"string","columns":[{"name":"string","data_type":"string","is_nullable":true,"is_primary":false,"is_unique":false,"default_value":null}]}],"relationships":[{"sourceTable":"string","sourceColumn":"string","targetTable":"string","targetColumn":"string","on_delete":"CASCADE","on_update":"CASCADE"}],"notes":["string"]}.',
      },
      existingSchema
        ? {
            role: "user",
            content: `Current schema context:\n${schemaContextToPrompt(existingSchema)}`,
          }
        : {
            role: "user",
            content: "There is no existing schema yet.",
          },
      {
        role: "user",
        content:
          `Generate a production-ready schema for this request: ${prompt.trim()}\n` +
          `Preferred database: ${(databaseType ?? existingSchema?.project.database_type ?? "postgresql").trim().toLowerCase()}\n` +
          "Favor practical naming, include primary keys, and add foreign keys when appropriate.",
      },
    ]);

    const parsed = JSON.parse(extractJsonBlock(content)) as unknown;
    return reply.send({ result: parsed });
  } catch (error) {
    if (error instanceof Error && error.message === "NVIDIA_API_KEY_MISSING") {
      return reply.status(503).send({ message: "NVIDIA_API_KEY is not configured on the backend." });
    }

    request.log.error({ error }, "Failed to generate schema with AI");
    return reply.status(500).send({ message: "Failed to generate schema with AI" });
  }
}

export async function optimizeSchemaWithAi(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { projectId } = request.body as OptimizeSchemaBody;

  if (!projectId) {
    return reply.status(400).send({ message: "projectId is required" });
  }

  try {
    const schema = await loadProjectSchema(app, projectId);
    const content = await callNvidia([
      {
        role: "system",
        content:
          "You are an expert database reviewer. Return strictly valid JSON only with this shape: " +
          '{"summary":"string","suggestions":[{"title":"string","priority":"high|medium|low","reason":"string","action":"string"}]}.',
      },
      {
        role: "user",
        content: `Review and optimize this schema:\n${schemaContextToPrompt(schema)}`,
      },
    ]);

    const parsed = JSON.parse(extractJsonBlock(content)) as unknown;
    return reply.send({ result: parsed });
  } catch (error) {
    if (error instanceof Error && error.message === "NVIDIA_API_KEY_MISSING") {
      return reply.status(503).send({ message: "NVIDIA_API_KEY is not configured on the backend." });
    }

    request.log.error({ error }, "Failed to optimize schema with AI");
    return reply.status(500).send({ message: "Failed to optimize schema with AI" });
  }
}
