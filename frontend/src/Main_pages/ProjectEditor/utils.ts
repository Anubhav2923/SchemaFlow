import type { NodePositionMap } from "../../features/schema/utils";
import type { SchemaTable, SchemaColumn, SchemaRelationship } from "../../features/schema/api";
import type { ImportableSchema, PreviewSchemaData, TemplatePreviewLayout, TemplateSchema } from "./constants";
import { autoLayoutPositions } from "../../features/schema/utils";

// ─── Local storage helpers ────────────────────────────────────────────────────
const keyFor = (k: string) => `schemaforge-layout:${k}`;
const templateKeyFor = (templateId: string) => `schemaforge-template-layout:${templateId}`;

export function loadPositions(k: string): NodePositionMap {
  try { return JSON.parse(window.localStorage.getItem(keyFor(k)) ?? "{}") as NodePositionMap; } catch { return {}; }
}
export function savePositions(k: string, p: NodePositionMap) {
  window.localStorage.setItem(keyFor(k), JSON.stringify(p));
}
export function loadTemplatePreviewLayout(templateId: string): TemplatePreviewLayout {
  try {
    return JSON.parse(window.localStorage.getItem(templateKeyFor(templateId)) ?? "{}") as TemplatePreviewLayout;
  } catch {
    return {};
  }
}
export function saveTemplatePreviewLayout(templateId: string, layout: TemplatePreviewLayout) {
  window.localStorage.setItem(templateKeyFor(templateId), JSON.stringify(layout));
}
export function clearTemplatePreviewLayout(templateId: string) {
  window.localStorage.removeItem(templateKeyFor(templateId));
}

// ─── File download ────────────────────────────────────────────────────────────
export function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── SQL parsing ──────────────────────────────────────────────────────────────
function splitSqlDefinitions(value: string) {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

export function parseSqlDump(sql: string): ImportableSchema {
  const tables: ImportableSchema["tables"] = [];
  const relationships: ImportableSchema["relationships"] = [];
  const normalized = sql.replace(/\r/g, "");
  const tableMatches = [...normalized.matchAll(/CREATE\s+TABLE\s+["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\);/gi)];

  for (const match of tableMatches) {
    const [, tableName, body] = match;
    const definitions = splitSqlDefinitions(body);
    const primaryColumns = new Set<string>();
    const columns = definitions
      .map((definition) => definition.trim())
      .filter(Boolean)
      .flatMap((definition) => {
        if (/^PRIMARY\s+KEY/i.test(definition)) {
          const pkMatch = definition.match(/\((.*?)\)/);
          if (pkMatch?.[1]) {
            pkMatch[1]
              .split(",")
              .map((part) => part.replace(/["`\s]/g, ""))
              .filter(Boolean)
              .forEach((name) => primaryColumns.add(name));
          }
          return [];
        }

        const colMatch = definition.match(/^["`]?([a-zA-Z0-9_]+)["`]?\s+([a-zA-Z0-9_(),]+)([\s\S]*)$/i);
        if (!colMatch) {
          return [];
        }

        const [, columnName, dataType, remainder] = colMatch;
        const tail = remainder.toUpperCase();

        const inlineReferenceMatch = remainder.match(
          /REFERENCES\s+["`]?([a-zA-Z0-9_]+)["`]?\s*\(\s*["`]?([a-zA-Z0-9_]+)["`]?\s*\)/i,
        );
        if (inlineReferenceMatch) {
          const [, targetTable, targetColumn] = inlineReferenceMatch;
          const deleteMatch = remainder.match(/ON\s+DELETE\s+(CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT)/i);
          const updateMatch = remainder.match(/ON\s+UPDATE\s+(CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT)/i);
          relationships.push({
            sourceTable: tableName,
            sourceColumn: columnName,
            targetTable,
            targetColumn,
            on_delete: deleteMatch?.[1]?.toUpperCase() ?? "NO ACTION",
            on_update: updateMatch?.[1]?.toUpperCase() ?? "CASCADE",
          });
        }

        return [{
          name: columnName,
          data_type: dataType,
          is_nullable: !tail.includes("NOT NULL"),
          is_primary: tail.includes("PRIMARY KEY"),
          is_unique: tail.includes("UNIQUE"),
          default_value: null,
        }];
      })
      .map((column) => ({
        ...column,
        is_primary: column.is_primary || primaryColumns.has(column.name),
        is_unique: column.is_unique || primaryColumns.has(column.name),
        is_nullable: primaryColumns.has(column.name) ? false : column.is_nullable,
      }));

    tables.push({ name: tableName, columns });
  }

  const fkMatches = [...normalized.matchAll(/ALTER\s+TABLE\s+["`]?([a-zA-Z0-9_]+)["`]?\s+ADD\s+CONSTRAINT\s+["`]?.*?["`]?\s+FOREIGN\s+KEY\s*\(["`]?([a-zA-Z0-9_]+)["`]?\)\s+REFERENCES\s+["`]?([a-zA-Z0-9_]+)["`]?\s*\(["`]?([a-zA-Z0-9_]+)["`]?\)\s+ON\s+DELETE\s+([A-Z ]+)\s+ON\s+UPDATE\s+([A-Z ]+)/gi)];
  for (const match of fkMatches) {
    relationships.push({
      sourceTable: match[1],
      sourceColumn: match[2],
      targetTable: match[3],
      targetColumn: match[4],
      on_delete: match[5].trim(),
      on_update: match[6].trim(),
    });
  }

  const tableConstraintMatches = [...normalized.matchAll(
    /(?:CONSTRAINT\s+["`]?([a-zA-Z0-9_]+)["`]?\s+)?FOREIGN\s+KEY\s*\(\s*["`]?([a-zA-Z0-9_]+)["`]?\s*\)\s+REFERENCES\s+["`]?([a-zA-Z0-9_]+)["`]?\s*\(\s*["`]?([a-zA-Z0-9_]+)["`]?\s*\)([\s\S]*?)(?:,|$)/gi,
  )];
  for (const match of tableConstraintMatches) {
    const sourceColumn = match[2];
    const targetTable = match[3];
    const targetColumn = match[4];
    const tail = match[5] ?? "";

    const sourceTableMatch = tableMatches.find(([, , body]) =>
      body.includes(match[0]),
    );
    const sourceTable = sourceTableMatch?.[1];
    if (!sourceTable) continue;

    const deleteMatch = tail.match(/ON\s+DELETE\s+(CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT)/i);
    const updateMatch = tail.match(/ON\s+UPDATE\s+(CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT)/i);

    relationships.push({
      sourceTable,
      sourceColumn,
      targetTable,
      targetColumn,
      on_delete: deleteMatch?.[1]?.toUpperCase() ?? "NO ACTION",
      on_update: updateMatch?.[1]?.toUpperCase() ?? "CASCADE",
    });
  }

  return { tables, relationships };
}

// ─── Template preview helpers ─────────────────────────────────────────────────
export function buildTemplatePreviewSchema(schema: ImportableSchema): PreviewSchemaData {
  const previewTables: SchemaTable[] = schema.tables.map((table, index) => ({
    id: `preview-table-${table.name}-${index}`,
    name: table.name,
    project_id: "template-preview",
    group_id: null,
    x: null,
    y: null,
    created_at: new Date(0).toISOString(),
  }));

  const tableIdByName = new Map(previewTables.map((table) => [table.name, table.id]));
  const previewColumns: SchemaColumn[] = [];
  const columnIdByKey = new Map<string, string>();

  schema.tables.forEach((table) => {
    const previewTableId = tableIdByName.get(table.name);
    if (!previewTableId) return;

    table.columns.forEach((column, index) => {
      const columnId = `preview-column-${table.name}-${column.name}-${index}`;
      previewColumns.push({
        id: columnId,
        name: column.name,
        data_type: column.data_type,
        is_nullable: column.is_nullable ?? true,
        is_primary: column.is_primary ?? false,
        is_unique: column.is_unique ?? false,
        default_value: column.default_value ?? null,
        position: index,
        table_id: previewTableId,
        created_at: new Date(0).toISOString(),
      });
      columnIdByKey.set(`${table.name}.${column.name}`, columnId);
    });
  });

  const previewRelationships: SchemaRelationship[] = schema.relationships.flatMap((relationship, index) => {
    const sourceTableId = tableIdByName.get(relationship.sourceTable);
    const targetTableId = tableIdByName.get(relationship.targetTable);
    const sourceColumnId = columnIdByKey.get(`${relationship.sourceTable}.${relationship.sourceColumn}`);
    const targetColumnId = columnIdByKey.get(`${relationship.targetTable}.${relationship.targetColumn}`);

    if (!sourceTableId || !targetTableId || !sourceColumnId || !targetColumnId) {
      return [];
    }

    return [{
      id: `preview-rel-${index}`,
      source_table_id: sourceTableId,
      source_column_id: sourceColumnId,
      target_table_id: targetTableId,
      target_column_id: targetColumnId,
      on_delete: relationship.on_delete ?? "NO ACTION",
      on_update: relationship.on_update ?? "CASCADE",
      created_at: new Date(0).toISOString(),
    }];
  });

  return {
    tables: previewTables,
    columns: previewColumns,
    relationships: previewRelationships,
  };
}

export function buildTemplatePreviewPositions(
  previewData: PreviewSchemaData,
  defaultLayout: TemplatePreviewLayout = {},
): NodePositionMap {
  const positions: NodePositionMap = {};
  const tableIdByName = new Map(
    previewData.tables.map((table) => [table.name.toLowerCase(), table.id]),
  );

  Object.entries(defaultLayout).forEach(([tableName, position]) => {
    const tableId = tableIdByName.get(tableName.toLowerCase());
    if (!tableId) return;
    positions[tableId] = position;
  });

  return positions;
}

export function computeTemplatePreviewPositions(
  template: TemplateSchema,
  previewData: PreviewSchemaData,
  savedLayout: TemplatePreviewLayout,
): NodePositionMap {
  const preferredLayout = Object.keys(savedLayout).length > 0
    ? savedLayout
    : (template.previewLayout ?? {});
  const presetPositions = buildTemplatePreviewPositions(previewData, preferredLayout);
  const autoPositions = autoLayoutPositions(previewData.tables, previewData.relationships, presetPositions);
  return { ...autoPositions, ...presetPositions };
}
