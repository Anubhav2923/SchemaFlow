import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import axios from "axios";
import { z } from "zod";
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

  const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
  const headers = {
    Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
    Accept: "application/json",
  };

  const payload = {
    model: env.NVIDIA_MODEL,
    messages: messages,
    max_tokens: 16384,
    temperature: 0.60,
    top_p: 0.95,
    stream: false,
    chat_template_kwargs: { enable_thinking: true },
  };

  try {
    const response = await axios.post(invokeUrl, payload, {
      headers: headers,
      responseType: "json",
      timeout: 45000,
    });

    const content = response.data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("NVIDIA_EMPTY_RESPONSE");
    }

    return content;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`NVIDIA_HTTP_${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
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
          "CRITICAL DESIGN RULES: " +
          "1. NEVER link a primary key (id) to another primary key (id) as a foreign key unless it's a strict 1:1 extension. " +
          "2. One-to-many relationships MUST use proper foreign key columns (e.g., place category_id in posts, not post.id -> category.id). " +
          "3. Many-to-many relationships MUST use a separate junction table. " +
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

    
    const GeneratedSchemaZod = z.object({
      summary: z.string().optional(),
      tables: z.array(z.object({
        name: z.string(),
        columns: z.array(z.object({
          name: z.string(),
          data_type: z.string(),
          is_nullable: z.boolean().default(false),
          is_primary: z.boolean().default(false),
          is_unique: z.boolean().default(false),
          default_value: z.any().nullable().optional()
        }))
      })),
      relationships: z.array(z.object({
        sourceTable: z.string(),
        sourceColumn: z.string(),
        targetTable: z.string(),
        targetColumn: z.string(),
        on_delete: z.string().optional(),
        on_update: z.string().optional()
      })).optional(),
      notes: z.array(z.string()).optional()
    });

    const validated = GeneratedSchemaZod.parse(parsed);
    return reply.send({ result: validated });
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
          '{"summary":"string","suggestions":[{"title":"string","priority":"high|medium|low","reason":"string","action":"string"}]}. ' +
          "CRITICAL CHECKS: Detect if any primary key (id) is incorrectly used as a foreign key pointing to another id. Suggest adding dedicated columns (e.g., category_id) instead of linking id to id. Ensure many-to-many use junction tables.",
      },
      {
        role: "user",
        content: `Review and optimize this schema:\n${schemaContextToPrompt(schema)}`,
      },
    ]);

    const parsed = JSON.parse(extractJsonBlock(content)) as unknown;
    
    const OptimizedSchemaZod = z.object({
      summary: z.string().optional(),
      suggestions: z.array(z.object({
        title: z.string(),
        priority: z.enum(["high", "medium", "low"]).catch("medium"),
        reason: z.string(),
        action: z.string()
      }))
    });

    const validated = OptimizedSchemaZod.parse(parsed);
    return reply.send({ result: validated });
  } catch (error) {
    if (error instanceof Error && error.message === "NVIDIA_API_KEY_MISSING") {
      return reply.status(503).send({ message: "NVIDIA_API_KEY is not configured on the backend." });
    }

    request.log.error({ error }, "Failed to optimize schema with AI");
    return reply.status(500).send({ message: "Failed to optimize schema with AI" });
  }
}
