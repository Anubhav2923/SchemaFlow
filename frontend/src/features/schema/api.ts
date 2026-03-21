import { apiClient } from "../../lib/axios";

export type SchemaTable = {
  id: string;
  name: string;
  project_id: string;
  group_id: string | null;
  x: number | null;
  y: number | null;
  created_at: string;
};

export type SchemaGroup = {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  project_id: string;
  created_at: string;
};

export type SchemaColumn = {
  id: string;
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary: boolean;
  is_unique: boolean;
  default_value: string | null;
  position: number;
  table_id: string;
  created_at: string;
};

export type SchemaRelationship = {
  id: string;
  source_table_id: string;
  source_column_id: string;
  target_table_id: string;
  target_column_id: string;
  on_delete: string;
  on_update: string;
  created_at: string;
};

export type ExportSqlResponse = {
  sql: string;
};

export type ExportFormat =
  | "postgresql"
  | "mongoose"
  | "prisma"
  | "drizzle"
  | "typeorm"
  | "sequelize"
  | "laravel";

export type ExportCodeResponse = {
  format: ExportFormat;
  language: string;
  filename: string;
  code: string;
};

export type AiGeneratedColumn = {
  name: string;
  data_type: string;
  is_nullable?: boolean;
  is_primary?: boolean;
  is_unique?: boolean;
  default_value?: string | null;
};

export type AiGeneratedTable = {
  name: string;
  columns: AiGeneratedColumn[];
};

export type AiGeneratedRelationship = {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  on_delete?: string;
  on_update?: string;
};

export type AiSchemaResponse = {
  result: {
    summary?: string;
    notes?: string[];
    tables?: AiGeneratedTable[];
    relationships?: AiGeneratedRelationship[];
  };
};

export type AiOptimizationResponse = {
  result: {
    summary?: string;
    suggestions?: Array<{
      title: string;
      priority: "high" | "medium" | "low";
      reason: string;
      action: string;
    }>;
  };
};

export type CreateTablePayload = {
  name: string;
  project_id: string;
  x?: number;
  y?: number;
};

export type CreateColumnPayload = {
  name: string;
  data_type: string;
  table_id: string;
  is_nullable?: boolean;
  is_primary?: boolean;
  is_unique?: boolean;
  default_value?: string;
  position?: number;
};

export type CreateRelationshipPayload = {
  source_table_id: string;
  source_column_id: string;
  target_table_id: string;
  target_column_id: string;
  on_delete?: string;
  on_update?: string;
};

export type CreateGroupPayload = {
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  project_id: string;
  table_ids?: string[];
};

export async function fetchTables(projectId: string) {
  const response = await apiClient.get<SchemaTable[]>(
    `/projects/${projectId}/tables`,
  );
  return response.data;
}

export async function fetchColumns(tableId: string) {
  const response = await apiClient.get<SchemaColumn[]>(
    `/tables/${tableId}/columns`,
  );
  return response.data;
}

export async function fetchRelationships(projectId: string) {
  const response = await apiClient.get<SchemaRelationship[]>(
    `/projects/${projectId}/relationships`,
  );
  return response.data;
}

export async function fetchGroups(projectId: string) {
  const response = await apiClient.get<SchemaGroup[]>(
    `/groups/project/${projectId}`,
  );
  return response.data;
}

export async function fetchExportSql(projectId: string) {
  const response = await apiClient.get<ExportSqlResponse>(
    `/projects/${projectId}/export-sql`,
  );
  return response.data;
}

export async function fetchExportCode(projectId: string, format: ExportFormat) {
  const response = await apiClient.get<ExportCodeResponse>(
    `/projects/${projectId}/export-code`,
    { params: { format } },
  );
  return response.data;
}

export async function generateSchemaWithAi(payload: {
  prompt: string;
  databaseType?: string;
  projectId?: string;
}) {
  const response = await apiClient.post<AiSchemaResponse>("/ai/generate-schema", payload);
  return response.data;
}

export async function optimizeSchemaWithAi(projectId: string) {
  const response = await apiClient.post<AiOptimizationResponse>("/ai/optimize-schema", { projectId });
  return response.data;
}

export async function createTable(payload: CreateTablePayload) {
  const response = await apiClient.post<SchemaTable>("/tables", payload);
  return response.data;
}

export async function createColumn(payload: CreateColumnPayload) {
  const response = await apiClient.post<SchemaColumn>("/columns", payload);
  return response.data;
}

export async function createRelationship(payload: CreateRelationshipPayload) {
  const response = await apiClient.post<SchemaRelationship>(
    "/relationships",
    payload,
  );
  return response.data;
}

export async function createGroup(payload: CreateGroupPayload) {
  const response = await apiClient.post<SchemaGroup>("/groups", payload);
  return response.data;
}

export async function updateTable(
  tableId: string,
  payload: { name?: string; group_id?: string | null; x?: number; y?: number },
) {
  const response = await apiClient.patch<SchemaTable>(`/tables/${tableId}`, payload);
  return response.data;
}

export async function updateGroup(groupId: string, payload: Partial<SchemaGroup>) {
  const response = await apiClient.patch<SchemaGroup>(`/groups/${groupId}`, payload);
  return response.data;
}

export async function updateColumn(columnId: string, payload: Partial<CreateColumnPayload>) {
  const response = await apiClient.patch<SchemaColumn>(`/columns/${columnId}`, payload);
  return response.data;
}

export async function updateRelationship(relId: string, payload: Partial<SchemaRelationship>) {
  const response = await apiClient.patch<SchemaRelationship>(`/relationships/${relId}`, payload);
  return response.data;
}

export async function deleteTable(tableId: string) {
  await apiClient.delete(`/tables/${tableId}`);
}

export async function deleteColumn(columnId: string) {
  await apiClient.delete(`/columns/${columnId}`);
}

export async function deleteRelationship(relationshipId: string) {
  await apiClient.delete(`/relationships/${relationshipId}`);
}

export async function deleteGroup(groupId: string) {
  await apiClient.delete(`/groups/${groupId}`);
}

export function getSchemaApiErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as {
      response?: {
        data?: {
          message?: string;
        };
        status?: number;
      };
    }).response;

    if (response?.data?.message) {
      return response.data.message;
    }

    if (response?.status === 404) {
      return "The API route was not found. Restart the backend server so the latest routes are loaded.";
    }
  }

  return "Something went wrong while updating the schema.";
}
