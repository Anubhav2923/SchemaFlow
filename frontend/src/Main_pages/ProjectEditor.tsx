import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, SVGProps } from "react";
import { useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  applyNodeChanges,
  SelectionMode,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  type OnNodesChange,
  type NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { toPng, toSvg } from "html-to-image";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Navbar } from "../components/layout/Navbar";
import { TableNode } from "../components/schema/TableNode";
import { GroupNode } from "../components/schema/GroupNode";
import { RelationshipEdge } from "../components/schema/RelationshipEdge";
import { useTheme } from "../hooks/useTheme";
import { setAuthToken } from "../lib/axios";
import { fetchProject, fetchProjectBySlug, updateProject } from "../features/projects/api";
import {
  createTable, createColumn,
  updateTable, updateColumn,
  deleteTable, deleteColumn,
  createRelationship, deleteRelationship, updateRelationship,
  fetchColumns, fetchTables, fetchRelationships,
  fetchGroups, createGroup, updateGroup, deleteGroup,
  fetchExportCode, generateSchemaWithAi, optimizeSchemaWithAi,
  getSchemaApiErrorMessage,
  type SchemaColumn, type SchemaTable, type SchemaRelationship, type SchemaGroup, type CreateColumnPayload, type AiGeneratedRelationship, type AiGeneratedTable, type ExportFormat,
} from "../features/schema/api";
import { buildNodes, buildEdges, type NodePositionMap } from "../features/schema/utils";
import { useSchemaStore } from "../features/schema/store";

// ─── PostgreSQL data types ────────────────────────────────────────────────────
const PG_TYPES = [
  { group: "Text", options: ["varchar(255)", "varchar(100)", "text", "char(1)", "character varying"] },
  { group: "Integer", options: ["int", "integer", "bigint", "smallint", "serial", "bigserial", "smallserial"] },
  { group: "Decimal", options: ["numeric(10,2)", "decimal(10,2)", "real", "float", "double precision", "money"] },
  { group: "Date & Time", options: ["timestamp", "timestamptz", "date", "time", "timetz", "interval"] },
  { group: "Boolean", options: ["boolean"] },
  { group: "JSON", options: ["json", "jsonb"] },
  { group: "Binary", options: ["bytea"] },
  { group: "UUID", options: ["uuid"] },
  { group: "Array", options: ["text[]", "int[]", "jsonb[]"] },
  { group: "Network", options: ["inet", "cidr", "macaddr"] },
  { group: "Geo", options: ["point", "line", "polygon", "geometry"] },
  { group: "Other", options: ["xml", "tsvector", "tsquery", "oid"] },
];

// ─── Professional Color Palette ──────────────────────────────────────────────
const SIDEBAR_COLORS = [
  "#818cf8", // indigo-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#fb7185", // rose-400
  "#22d3ee", // cyan-400
  "#a78bfa", // violet-400
  "#f472b6", // pink-400
  "#38bdf8", // sky-400
  "#2dd4bf", // teal-400
  "#60a5fa", // blue-400
];

function getTableColor(index: number) {
  return SIDEBAR_COLORS[index % SIDEBAR_COLORS.length];
}

type ConnectDialogState = {
  connection?: Connection;
  sourceColId: string;
  targetColId: string;
  sourceTableId: string;
  targetTableId: string;
  relationshipId?: string;
};

// ─── TypeSelect dropdown with portal ─────────────────────────────────────────
function TypeSelect({ value, onChange, isDark, size = "md" }: { value: string; onChange: (v: string) => void; isDark: boolean; size?: "sm" | "md" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as globalThis.Node) && !menuRef.current?.contains(e.target as globalThis.Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [open]);

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? setOpen(false) : openMenu()}
        className={`w-full flex items-center justify-between rounded-lg font-bold border transition ${size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-2 text-[12px]"
          } ${isDark ? "bg-slate-900 border-slate-700 text-slate-200 hover:border-indigo-500" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400"
          }`}
      >
        <span className="truncate">{value}</span>
        <svg className={`h-3 w-3 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="m5 7 5 6 5-6" /></svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: Math.max(pos.width, 220) }}
          className={`z-[9999] max-h-72 overflow-y-auto rounded-xl border shadow-2xl ${isDark ? "bg-[#0f172a] border-slate-700" : "bg-white border-slate-200"}`}
        >
          {PG_TYPES.map(({ group, options }) => (
            <div key={group}>
              <p className={`px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-600" : "text-slate-400"}`}>{group}</p>
              {options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[12px] font-bold transition ${value === opt ? "bg-indigo-500/20 text-indigo-400" : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                    }`}
                >{opt}</button>
              ))}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a1 1 0 011-1h6a1 1 0 011 1v2" /></svg>;
}
function EditIcon(props: SVGProps<SVGSVGElement>) {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
}
function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
}

// ─── Cardinality colors (matches RelationshipEdge) ────────────────────────────
const CARDINALITY_COLOR: Record<string, string> = {
  "one-to-one": "#22d3ee",
  "one-to-many": "#818cf8",
  "many-to-many": "#c084fc",
};
const CARDINALITY_LABEL: Record<string, string> = {
  "one-to-one": "1 : 1",
  "one-to-many": "1 : N",
  "many-to-many": "N : M",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const nodeTypes = { tableNode: TableNode, groupNode: GroupNode };
const edgeTypes = { relationshipEdge: RelationshipEdge };
const EMPTY_TABLES: SchemaTable[] = [];
const EMPTY_COLUMNS: SchemaColumn[] = [];
const EMPTY_RELS: SchemaRelationship[] = [];
const EMPTY_GROUPS: SchemaGroup[] = [];
const EXPORT_FORMATS: Array<{ value: ExportFormat; label: string }> = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mongoose", label: "MongoDB / Mongoose" },
  { value: "prisma", label: "Prisma" },
  { value: "drizzle", label: "Drizzle ORM" },
  { value: "typeorm", label: "TypeORM" },
  { value: "sequelize", label: "Sequelize" },
  { value: "laravel", label: "Laravel" },
];
const DATABASE_OPTIONS = ["postgresql", "mongodb", "mysql", "sqlserver"] as const;
type ImportableSchema = {
  summary?: string;
  tables: AiGeneratedTable[];
  relationships: AiGeneratedRelationship[];
};
const TEMPLATE_SCHEMAS: Array<{ id: string; name: string; description: string; schema: ImportableSchema }> = [
  {
    id: "blog",
    name: "Blog",
    description: "Posts, authors, categories, comments, and tags.",
    schema: {
      summary: "A publishing-friendly schema for blogs and editorial workflows.",
      tables: [
        { name: "users", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "email", data_type: "varchar(255)", is_unique: true, is_nullable: false }, { name: "display_name", data_type: "varchar(120)", is_nullable: false }] },
        { name: "posts", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "author_id", data_type: "uuid", is_nullable: false }, { name: "title", data_type: "varchar(255)", is_nullable: false }, { name: "slug", data_type: "varchar(255)", is_unique: true, is_nullable: false }, { name: "body", data_type: "text", is_nullable: false }, { name: "published_at", data_type: "timestamp", is_nullable: true }] },
        { name: "comments", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "post_id", data_type: "uuid", is_nullable: false }, { name: "user_id", data_type: "uuid", is_nullable: false }, { name: "body", data_type: "text", is_nullable: false }] },
        { name: "categories", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "name", data_type: "varchar(120)", is_unique: true, is_nullable: false }] },
      ],
      relationships: [
        { sourceTable: "posts", sourceColumn: "author_id", targetTable: "users", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "comments", sourceColumn: "post_id", targetTable: "posts", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "comments", sourceColumn: "user_id", targetTable: "users", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
      ],
    },
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Catalog, carts, orders, payments, and fulfillment.",
    schema: {
      summary: "A transactional starter for storefronts and ordering systems.",
      tables: [
        { name: "customers", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "email", data_type: "varchar(255)", is_unique: true, is_nullable: false }, { name: "full_name", data_type: "varchar(140)", is_nullable: false }] },
        { name: "products", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "name", data_type: "varchar(255)", is_nullable: false }, { name: "sku", data_type: "varchar(80)", is_unique: true, is_nullable: false }, { name: "price", data_type: "numeric(10,2)", is_nullable: false }] },
        { name: "orders", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "customer_id", data_type: "uuid", is_nullable: false }, { name: "status", data_type: "varchar(50)", is_nullable: false }, { name: "total_amount", data_type: "numeric(10,2)", is_nullable: false }] },
        { name: "order_items", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "order_id", data_type: "uuid", is_nullable: false }, { name: "product_id", data_type: "uuid", is_nullable: false }, { name: "quantity", data_type: "integer", is_nullable: false }, { name: "unit_price", data_type: "numeric(10,2)", is_nullable: false }] },
      ],
      relationships: [
        { sourceTable: "orders", sourceColumn: "customer_id", targetTable: "customers", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "order_items", sourceColumn: "order_id", targetTable: "orders", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "order_items", sourceColumn: "product_id", targetTable: "products", targetColumn: "id", on_delete: "RESTRICT", on_update: "CASCADE" },
      ],
    },
  },
  {
    id: "saas",
    name: "SaaS Starter",
    description: "Organizations, users, memberships, billing, and projects.",
    schema: {
      summary: "A multi-tenant SaaS baseline with teams and subscription-friendly entities.",
      tables: [
        { name: "organizations", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "name", data_type: "varchar(255)", is_nullable: false }, { name: "slug", data_type: "varchar(255)", is_unique: true, is_nullable: false }] },
        { name: "users", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "email", data_type: "varchar(255)", is_unique: true, is_nullable: false }, { name: "full_name", data_type: "varchar(140)", is_nullable: false }] },
        { name: "memberships", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "organization_id", data_type: "uuid", is_nullable: false }, { name: "user_id", data_type: "uuid", is_nullable: false }, { name: "role", data_type: "varchar(50)", is_nullable: false }] },
        { name: "projects", columns: [{ name: "id", data_type: "uuid", is_primary: true, is_unique: true, is_nullable: false }, { name: "organization_id", data_type: "uuid", is_nullable: false }, { name: "name", data_type: "varchar(255)", is_nullable: false }] },
      ],
      relationships: [
        { sourceTable: "memberships", sourceColumn: "organization_id", targetTable: "organizations", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "memberships", sourceColumn: "user_id", targetTable: "users", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
        { sourceTable: "projects", sourceColumn: "organization_id", targetTable: "organizations", targetColumn: "id", on_delete: "CASCADE", on_update: "CASCADE" },
      ],
    },
  },
];
const keyFor = (k: string) => `schemaforge-layout:${k}`;

function loadPositions(k: string): NodePositionMap {
  try { return JSON.parse(window.localStorage.getItem(keyFor(k)) ?? "{}") as NodePositionMap; } catch { return {}; }
}
function savePositions(k: string, p: NodePositionMap) {
  window.localStorage.setItem(keyFor(k), JSON.stringify(p));
}

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

function parseSqlDump(sql: string): ImportableSchema {
  const tables: AiGeneratedTable[] = [];
  const relationships: AiGeneratedRelationship[] = [];
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

  return { tables, relationships };
}

function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
async function fetchSchema(projectId: string) {
  const tables = await fetchTables(projectId);
  if (tables.length === 0) return { tables: [], columns: [], relationships: [], groups: [] };
  const [cols, rels, grps] = await Promise.all([
    Promise.all(tables.map(t => fetchColumns(t.id))).then(g => g.flat()),
    fetchRelationships(projectId),
    fetchGroups(projectId),
  ]);
  return { tables, columns: cols, relationships: rels, groups: grps };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
function ProjectEditor() {
  const { projectId = "", username = "", diagramSlug = "" } = useParams();
  const queryClient = useQueryClient();
  const { theme, toggleTheme, isDark } = useTheme();
  const { selectedNodeId, selectNode } = useSchemaStore();
  const { userId, getToken } = useAuth();
  const clerk = useClerk();

  const [tableName, setTableName] = useState("");
  const [viewportZoom, setViewportZoom] = useState(0.9);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [positions, setPositions] = useState<NodePositionMap>({});
  const [hasFitView, setHasFitView] = useState(false);
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [sidebarMode, setSidebarMode] = useState<"schema" | "relationships" | "templates" | "import">("schema");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>("postgresql");
  const [sqlImport, setSqlImport] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; priority: "high" | "medium" | "low"; reason: string; action: string }>>([]);
  const [projectDatabaseType, setProjectDatabaseType] = useState<string>("postgresql");

  // Selection state
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  // table UI
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  const [renamingTableId, setRenamingTableId] = useState<string | null>(null);
  const [renameTableValue, setRenameTableValue] = useState("");

  // column add form
  const [addingColTableId, setAddingColTableId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState("varchar(255)");
  const [newColPK, setNewColPK] = useState(false);
  const [newColUnique, setNewColUnique] = useState(false);
  const [newColNotNull, setNewColNotNull] = useState(false);

  // column interaction
  const [activeColId, setActiveColId] = useState<string | null>(null);
  const [renamingColId, setRenamingColId] = useState<string | null>(null);
  const [renameColValue, setRenameColValue] = useState("");

  // relationship connect dialog
  const [connectDialog, setConnectDialog] = useState<ConnectDialogState | null>(null);
  const [dialogCardinality, setDialogCardinality] = useState<"one-to-one" | "one-to-many" | "many-to-many">("one-to-many");
  const [dialogOnDelete, setDialogOnDelete] = useState<"CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION">("CASCADE");

  const routeStorageKey = projectId || (username && diagramSlug ? `${username}:${diagramSlug}` : "");

  const projectQuery = useQuery({
    queryKey: ["project-meta", projectId, username, diagramSlug],
    queryFn: () => projectId ? fetchProject(projectId) : fetchProjectBySlug(username, diagramSlug),
    enabled: !!(projectId || (username && diagramSlug)),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const resolvedProjectId = projectQuery.data?.id || projectId;

  useEffect(() => {
    if (!projectQuery.data?.database_type) return;
    setProjectDatabaseType(projectQuery.data.database_type);
    setSelectedExportFormat(projectQuery.data.database_type === "mongodb" ? "mongoose" : "postgresql");
  }, [projectQuery.data?.database_type]);

  useEffect(() => { setPositions(loadPositions(routeStorageKey)); }, [routeStorageKey]);
  useEffect(() => { savePositions(routeStorageKey, positions); }, [positions, routeStorageKey]);

  const schemaQuery = useQuery({
    queryKey: ["schema", resolvedProjectId],
    queryFn: () => fetchSchema(resolvedProjectId ?? ""),
    enabled: Boolean(resolvedProjectId),
    refetchInterval: username && diagramSlug ? 5000 : false,
  });

  const exportCodeQuery = useQuery({
    queryKey: ["export-code", resolvedProjectId, selectedExportFormat],
    queryFn: () => fetchExportCode(resolvedProjectId ?? "", selectedExportFormat),
    enabled: Boolean(resolvedProjectId && isCodeDrawerOpen),
    staleTime: 10_000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["schema", resolvedProjectId] });
  }, [queryClient, resolvedProjectId]);

  const ensureAuth = useCallback(async () => {
    if (!userId) { clerk.openSignIn(); return false; }
    const token = await getToken();
    setAuthToken(token);
    if (!token) { clerk.openSignIn(); return false; }
    return true;
  }, [clerk, getToken, userId]);

  // ── Mutations ──
  const createTableMut = useMutation({
    mutationFn: createTable,
    onSuccess: (newTable) => {
      setTableName("");
      // Smart positioning: place next to the last table
      if (tables.length > 0) {
        const lastTable = tables[tables.length - 1];
        const lastPos = positions[lastTable.id] || {
          x: 80 + ((tables.length - 1) % 2) * 360,
          y: 80 + Math.floor((tables.length - 1) / 2) * 280
        };
        setPositions(prev => ({
          ...prev,
          [newTable.id]: { x: lastPos.x + 360, y: lastPos.y }
        }));
      }
      invalidate();
    },
    onError: (e) => alert(getSchemaApiErrorMessage(e))
  });
  const deleteTableMut = useMutation({ mutationFn: deleteTable, onSuccess: () => { setExpandedTableId(null); selectNode(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const renameTableMut = useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => updateTable(id, { name }), onSuccess: () => { setRenamingTableId(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const addColMut = useMutation({ mutationFn: createColumn, onSuccess: () => { setNewColName(""); setNewColType("varchar(255)"); setNewColPK(false); setNewColUnique(false); setNewColNotNull(false); setAddingColTableId(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const deleteColMut = useMutation({ mutationFn: deleteColumn, onSuccess: invalidate, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const updateColMut = useMutation({ mutationFn: ({ id, ...body }: { id: string } & Partial<CreateColumnPayload>) => updateColumn(id, body), onSuccess: () => { setRenamingColId(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });

  const createRelMut = useMutation({ mutationFn: createRelationship, onSuccess: () => { setConnectDialog(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const deleteRelMut = useMutation({ mutationFn: deleteRelationship, onSuccess: invalidate, onError: (e) => alert(getSchemaApiErrorMessage(e)) });

  const createGrpMut = useMutation({ mutationFn: createGroup, onSuccess: invalidate });
  const updateGrpMut = useMutation({ mutationFn: ({ id, ...body }: { id: string } & Partial<SchemaGroup>) => updateGroup(id, body), onSuccess: invalidate });
  const deleteGrpMut = useMutation({ mutationFn: deleteGroup, onSuccess: invalidate });
  const mutateGroup = updateGrpMut.mutate;
  const removeGroup = deleteGrpMut.mutate;

  const tables = schemaQuery.data?.tables ?? EMPTY_TABLES;
  const columns = schemaQuery.data?.columns ?? EMPTY_COLUMNS;
  const relationships = schemaQuery.data?.relationships ?? EMPTY_RELS;
  const groups = schemaQuery.data?.groups ?? EMPTY_GROUPS;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredTables = useMemo(
    () =>
      normalizedSearch
        ? tables.filter((table) => {
            const tableColumns = columns.filter((column) => column.table_id === table.id);
            return (
              table.name.toLowerCase().includes(normalizedSearch) ||
              tableColumns.some((column) => column.name.toLowerCase().includes(normalizedSearch))
            );
          })
        : tables,
    [columns, normalizedSearch, tables]
  );
  const filteredRelationships = useMemo(
    () =>
      normalizedSearch
        ? relationships.filter((rel) =>
            [rel.source_table_id, rel.target_table_id, rel.source_column_id, rel.target_column_id].some((id) =>
              columns.find((column) => column.id === id)?.name?.toLowerCase().includes(normalizedSearch) ||
              tables.find((table) => table.id === id)?.name?.toLowerCase().includes(normalizedSearch)
            )
          )
        : relationships,
    [columns, normalizedSearch, relationships, tables]
  );

  const updateRelMut = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<SchemaRelationship>) => updateRelationship(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["schema", resolvedProjectId] });
      setConnectDialog(null);
    },
    onError: (err) => alert(getSchemaApiErrorMessage(err)),
  });

  const updateProjectMut = useMutation({
    mutationFn: ({ id, databaseType }: { id: string; databaseType: string }) =>
      updateProject(id, { database_type: databaseType }),
    onSuccess: (project) => {
      setProjectDatabaseType(project.database_type);
      void queryClient.invalidateQueries({ queryKey: ["project-meta", projectId, username, diagramSlug] });
    },
    onError: (err) => alert(getSchemaApiErrorMessage(err)),
  });

  const aiGenerateMut = useMutation({
    mutationFn: generateSchemaWithAi,
    onError: (err) => alert(getSchemaApiErrorMessage(err)),
  });

  const aiOptimizeMut = useMutation({
    mutationFn: optimizeSchemaWithAi,
    onError: (err) => alert(getSchemaApiErrorMessage(err)),
  });

  const onNodeResize = useCallback((nodeId: string, x: number, y: number, width: number, height: number) => {
    setFlowNodes(nds => nds.map(n => n.id === nodeId ? { ...n, position: { x, y }, style: { ...n.style, width, height } } : n));
  }, []);

  const handleGroupRename = useCallback((id: string, name: string) => {
    mutateGroup({ id, name });
  }, [mutateGroup]);

  const handleGroupColorChange = useCallback((id: string, color: string) => {
    mutateGroup({ id, color });
  }, [mutateGroup]);

  const handleGroupRemove = useCallback((id: string) => {
    removeGroup(id);
  }, [removeGroup]);

  const handleGroupResizeStop = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    onNodeResize(id, x, y, width, height);
    mutateGroup({ id, x, y, width, height });
  }, [mutateGroup, onNodeResize]);

  const handleEditRelationship = useCallback((rel: SchemaRelationship) => {
      setDialogOnDelete(rel.on_delete as "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION");
      // Determine cardinality for dialog (visual only since derived in buildEdges)
      const srcCol = columns.find(c => c.id === rel.source_column_id);
      const tgtCol = columns.find(c => c.id === rel.target_column_id);
      const srcIsOne = srcCol?.is_primary || srcCol?.is_unique;
      const tgtIsOne = tgtCol?.is_primary || tgtCol?.is_unique;
      const cardinality = srcIsOne && tgtIsOne ? "one-to-one" : srcIsOne ? "one-to-many" : "many-to-many";
      setDialogCardinality(cardinality);

      setConnectDialog({
        relationshipId: rel.id,
        sourceColId: rel.source_column_id,
        targetColId: rel.target_column_id,
        sourceTableId: rel.source_table_id,
        targetTableId: rel.target_table_id,
      });
  }, [columns]);

  const edges: Edge[] = useMemo(
    () => buildEdges(relationships, columns, isDark, handleEditRelationship),
    [relationships, columns, isDark, handleEditRelationship]
  );

  const isDragging = useRef(false);

  const onNodeDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const onNodeDragStop = useCallback((_e: unknown, node: Node) => {
    isDragging.current = false;
    if (node.type === "groupNode") {
      mutateGroup({ id: node.id, x: node.position.x, y: node.position.y });
    } else {
      setPositions(c => ({ ...c, [node.id]: node.position }));
    }
  }, [mutateGroup]);

  const computedNodes = useMemo(
    () => buildNodes(
      tables,
      columns,
      groups,
      positions,
      isDark,
      handleGroupRename,
      handleGroupColorChange,
      handleGroupRemove,
      onNodeResize,
      handleGroupResizeStop
    ),
    [
      tables,
      columns,
      groups,
      positions,
      isDark,
      handleGroupRename,
      handleGroupColorChange,
      handleGroupRemove,
      onNodeResize,
      handleGroupResizeStop,
    ]
  );

  useEffect(() => {
    // DO NOT rebuild nodes while dragging — this prevents the 'jump back' bug and lag
    if (isDragging.current) return;

    setFlowNodes(computedNodes);
  }, [computedNodes]);

  const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    setFlowNodes(nds => {
      const updated = applyNodeChanges(changes, nds);
      return updated.map(n => {
        if (n.type !== "groupNode") return n;
        const orig = nds.find(o => o.id === n.id);
        if (!orig) return n;
        return {
          ...n,
          style: {
            ...orig.style,
            ...n.style,
          }
        };
      });
    });
  }, []);

  const onSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
    setSelectedNodes(sel);
    const id = sel.find(n => n.type === "tableNode")?.id ?? null;
    if (id !== selectedNodeId) selectNode(id);
  }, [selectNode, selectedNodeId]);

  useEffect(() => {
    if (!reactFlowInstance || flowNodes.length === 0 || hasFitView) return;
    const t = setTimeout(() => { reactFlowInstance.fitView({ padding: 0.2, duration: 600 }); setHasFitView(true); }, 150);
    return () => clearTimeout(t);
  }, [flowNodes.length, hasFitView, reactFlowInstance]);

  const focusTable = useCallback((tableId: string) => {
    const node = flowNodes.find(n => n.id === tableId);
    if (!node || !reactFlowInstance) return;
    reactFlowInstance.setCenter(
      node.position.x + (node.width ?? 320) / 2,
      node.position.y + (node.height ?? 180) / 2,
      { zoom: 1.0, duration: 400 },
    );
    selectNode(tableId);
  }, [flowNodes, reactFlowInstance, selectNode]);

  // ── Handle drag-to-connect ───────────────────────────────────────────────────
  const onConnect = useCallback(async (connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (!source || !target || !sourceHandle || !targetHandle) return;

    const sourceColId = sourceHandle.replace(/-right$/, "");
    const targetColId = targetHandle.replace(/-left$/, "");

    if (!sourceColId || !targetColId) return;

    setDialogCardinality("one-to-many");
    setDialogOnDelete("CASCADE");
    setConnectDialog({
      connection,
      sourceColId,
      targetColId,
      sourceTableId: source,
      targetTableId: target,
    });
  }, []);

   const confirmRelationship = useCallback(async () => {
    if (!connectDialog) return;
    const ok = await ensureAuth();
    if (!ok) return;

    if (connectDialog.relationshipId) {
      updateRelMut.mutate({
        id: connectDialog.relationshipId,
        on_delete: dialogOnDelete,
      });
    } else {
      createRelMut.mutate({
        source_table_id: connectDialog.sourceTableId,
        source_column_id: connectDialog.sourceColId,
        target_table_id: connectDialog.targetTableId,
        target_column_id: connectDialog.targetColId,
        on_delete: dialogOnDelete,
        on_update: "CASCADE",
      });
    }
  }, [connectDialog, createRelMut, updateRelMut, dialogOnDelete, ensureAuth]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCreateTable = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!tableName.trim() || !resolvedProjectId) return;
    const ok = await ensureAuth();
    if (!ok) return;
    await createTableMut.mutateAsync({ name: tableName.trim(), project_id: resolvedProjectId });
  }, [createTableMut, ensureAuth, resolvedProjectId, tableName]);

  const handleDeleteTable = useCallback(async (tableId: string) => {
    const ok = await ensureAuth();
    if (!ok) return;
    deleteTableMut.mutate(tableId);
  }, [deleteTableMut, ensureAuth]);

  const handleRenameTable = useCallback(async (tableId: string) => {
    if (!renameTableValue.trim()) { setRenamingTableId(null); return; }
    const ok = await ensureAuth();
    if (!ok) return;
    renameTableMut.mutate({ id: tableId, name: renameTableValue.trim() });
  }, [ensureAuth, renameTableMut, renameTableValue]);

  const handleAddColumn = useCallback(async (tableId: string) => {
    if (!newColName.trim()) return;
    const ok = await ensureAuth();
    if (!ok) return;
    addColMut.mutate({ name: newColName.trim(), data_type: newColType, table_id: tableId, is_primary: newColPK, is_unique: newColUnique, is_nullable: !newColNotNull });
  }, [addColMut, ensureAuth, newColName, newColNotNull, newColPK, newColType, newColUnique]);

  const handleDeleteColumn = useCallback(async (colId: string) => {
    const ok = await ensureAuth();
    if (!ok) return;
    deleteColMut.mutate(colId);
  }, [deleteColMut, ensureAuth]);

  const handleRenameColumn = useCallback(async (colId: string) => {
    if (!renameColValue.trim()) { setRenamingColId(null); return; }
    const ok = await ensureAuth();
    if (!ok) return;
    updateColMut.mutate({ id: colId, name: renameColValue.trim() });
  }, [ensureAuth, updateColMut, renameColValue]);

  const handleToggleColumnProp = useCallback(async (col: SchemaColumn, prop: "is_primary" | "is_unique" | "is_nullable") => {
    const ok = await ensureAuth();
    if (!ok) return;
    updateColMut.mutate({ id: col.id, [prop]: !col[prop] });
  }, [ensureAuth, updateColMut]);

  const handleChangeColumnType = useCallback(async (colId: string, type: string) => {
    const ok = await ensureAuth();
    if (!ok) return;
    updateColMut.mutate({ id: colId, data_type: type });
  }, [ensureAuth, updateColMut]);

  const handleDeleteRel = useCallback(async (relId: string) => {
    const ok = await ensureAuth();
    if (!ok) return;
    deleteRelMut.mutate(relId);
  }, [deleteRelMut, ensureAuth]);

  const handleCreateGroup = useCallback(async () => {
    const tableNodes = selectedNodes.filter(n => n.type === "tableNode");
    if (tableNodes.length === 0 || !resolvedProjectId) return;

    const ok = await ensureAuth();
    if (!ok) return;

    // Calculate absolute bounding box for ALL selected tables
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    tableNodes.forEach(n => {
      let absX = n.position.x;
      let absY = n.position.y;

      // If the node has a parent, its current n.position is relative
      // We must resolve its absolute position for correct grouping
      if (n.parentNode) {
        const parent = flowNodes.find(p => p.id === n.parentNode);
        if (parent) {
          absX += parent.position.x;
          absY += parent.position.y;
        }
      }

      minX = Math.min(minX, absX);
      minY = Math.min(minY, absY);
      maxX = Math.max(maxX, absX + (n.width ?? 320));
      maxY = Math.max(maxY, absY + (n.height ?? 180));
    });

    const padding = 60;
    const groupX = minX - padding;
    const groupY = minY - padding;

    // Update LOCAL positions state to be relative to the NEW group
    setPositions(prev => {
      const next = { ...prev };
      tableNodes.forEach(n => {
        let absX = n.position.x;
        let absY = n.position.y;
        if (n.parentNode) {
          const parent = flowNodes.find(p => p.id === n.parentNode);
          if (parent) {
            absX += parent.position.x;
            absY += parent.position.y;
          }
        }
        next[n.id] = {
          x: absX - groupX,
          y: absY - groupY
        };
      });
      return next;
    });

    createGrpMut.mutate({
      name: "Comment Box",
      color: "#6366f110",
      x: groupX,
      y: groupY,
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + (padding * 2),
      project_id: resolvedProjectId,
      table_ids: tableNodes.map(n => n.id)
    });
  }, [createGrpMut, resolvedProjectId, selectedNodes, flowNodes, ensureAuth]);

  const handleFitView = useCallback(() => {
    if (!reactFlowInstance) return;
    reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
  }, [reactFlowInstance]);

  const handleCopyCode = useCallback(async () => {
    if (!exportCodeQuery.data?.code) return;
    await navigator.clipboard.writeText(exportCodeQuery.data.code);
  }, [exportCodeQuery.data?.code]);

  const handleDownloadCode = useCallback(() => {
    if (!exportCodeQuery.data) return;
    downloadTextFile(exportCodeQuery.data.filename, exportCodeQuery.data.code);
  }, [exportCodeQuery.data]);

  const handleExportDiagram = useCallback(async (type: "png" | "svg") => {
    const element = document.querySelector(".react-flow") as HTMLElement | null;
    if (!element || !resolvedProjectId) return;

    const dataUrl = type === "png"
      ? await toPng(element, { cacheBust: true, pixelRatio: 2, backgroundColor: isDark ? "#020617" : "#f8fafc" })
      : await toSvg(element, { cacheBust: true, backgroundColor: isDark ? "#020617" : "#f8fafc" });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${resolvedProjectId}-diagram.${type}`;
    link.click();
  }, [isDark, resolvedProjectId]);

  const applyImportedSchema = useCallback(async (schema: ImportableSchema) => {
    if (!resolvedProjectId) return;
    const ok = await ensureAuth();
    if (!ok) return;

    const token = await getToken();
    setAuthToken(token);

    const createdTables = new Map<string, string>();
    const createdColumns = new Map<string, string>();

    for (const table of schema.tables) {
      const createdTable = await createTable({ name: table.name.trim(), project_id: resolvedProjectId });
      createdTables.set(table.name, createdTable.id);

      for (let index = 0; index < table.columns.length; index += 1) {
        const column = table.columns[index];
        const createdColumn = await createColumn({
          name: column.name.trim(),
          data_type: column.data_type.trim(),
          table_id: createdTable.id,
          is_nullable: column.is_nullable ?? true,
          is_primary: column.is_primary ?? false,
          is_unique: column.is_unique ?? false,
          default_value: column.default_value ?? undefined,
          position: index,
        });
        createdColumns.set(`${table.name}.${column.name}`, createdColumn.id);
      }
    }

    for (const relationship of schema.relationships) {
      const sourceTableId = createdTables.get(relationship.sourceTable);
      const targetTableId = createdTables.get(relationship.targetTable);
      const sourceColumnId = createdColumns.get(`${relationship.sourceTable}.${relationship.sourceColumn}`);
      const targetColumnId = createdColumns.get(`${relationship.targetTable}.${relationship.targetColumn}`);

      if (!sourceTableId || !targetTableId || !sourceColumnId || !targetColumnId) continue;

      await createRelationship({
        source_table_id: sourceTableId,
        source_column_id: sourceColumnId,
        target_table_id: targetTableId,
        target_column_id: targetColumnId,
        on_delete: relationship.on_delete ?? "CASCADE",
        on_update: relationship.on_update ?? "CASCADE",
      });
    }

    await queryClient.invalidateQueries({ queryKey: ["schema", resolvedProjectId] });
    setAiSummary(schema.summary ?? "Schema imported successfully.");
  }, [ensureAuth, getToken, queryClient, resolvedProjectId]);

  const handleApplyTemplate = useCallback(async (templateId: string) => {
    const template = TEMPLATE_SCHEMAS.find((item) => item.id === templateId);
    if (!template) return;
    await applyImportedSchema(template.schema);
  }, [applyImportedSchema]);

  const handleImportSql = useCallback(async () => {
    const parsed = parseSqlDump(sqlImport);
    if (parsed.tables.length === 0) {
      alert("No CREATE TABLE statements were found in the SQL import.");
      return;
    }
    await applyImportedSchema(parsed);
    setSqlImport("");
  }, [applyImportedSchema, sqlImport]);

  const handleGenerateWithAi = useCallback(async () => {
    const result = await aiGenerateMut.mutateAsync({
      prompt: aiPrompt,
      databaseType: projectDatabaseType,
      projectId: resolvedProjectId || undefined,
    });

    const schema = {
      summary: result.result.summary,
      tables: result.result.tables ?? [],
      relationships: result.result.relationships ?? [],
    };
    setAiSummary(result.result.summary ?? "AI schema prepared.");
    await applyImportedSchema(schema);
  }, [aiGenerateMut, aiPrompt, applyImportedSchema, projectDatabaseType, resolvedProjectId]);

  const handleOptimizeWithAi = useCallback(async () => {
    if (!resolvedProjectId) return;
    const result = await aiOptimizeMut.mutateAsync(resolvedProjectId);
    setAiSummary(result.result.summary ?? "Optimization suggestions ready.");
    setAiSuggestions(result.result.suggestions ?? []);
  }, [aiOptimizeMut, resolvedProjectId]);

  const handleDatabaseTypeChange = useCallback(async (nextType: string) => {
    if (!resolvedProjectId) return;
    const ok = await ensureAuth();
    if (!ok) return;
    updateProjectMut.mutate({ id: resolvedProjectId, databaseType: nextType });
  }, [ensureAuth, resolvedProjectId, updateProjectMut]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target && ["INPUT", "TEXTAREA"].includes(target.tagName);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        const input = document.getElementById("schema-search");
        if (input instanceof HTMLInputElement) input.focus();
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        handleFitView();
      }

      if (isTyping) return;

      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        const input = document.getElementById("new-table-input");
        if (input instanceof HTMLInputElement) input.focus();
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeId) {
        const selectedTable = tables.find((table) => table.id === selectedNodeId);
        if (selectedTable) {
          event.preventDefault();
          void handleDeleteTable(selectedTable.id);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDeleteTable, handleFitView, selectedNodeId, tables]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <main className={`h-screen overflow-hidden ${isDark ? "bg-[#020617]" : "bg-[#f8fafc]"}`}>
      <Navbar theme={theme} onToggle={toggleTheme} fullWidth />


      {connectDialog && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <div className={`relative w-[420px] rounded-3xl border shadow-2xl p-8 space-y-7 transition-all ${isDark ? "bg-[#0f172a] border-slate-700 shadow-indigo-500/10" : "bg-white border-slate-200"}`}>
            {/* Header section from screenshot */}
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/80">
                {connectDialog.relationshipId ? "Edit Relationship" : "New Relationship"}
              </p>
              <h2 className={`text-[22px] font-black tracking-tight ${isDark ? "text-white" : "text-[#1e293b]"}`}>Configure Foreign Key</h2>
              <p className={`text-[12px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {columns.find(c => c.id === connectDialog.sourceColId)?.name} → {columns.find(c => c.id === connectDialog.targetColId)?.name}
              </p>
            </div>


            <div className="space-y-3">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-600" : "text-slate-400"}`}>Cardinality</p>
              <div className="grid grid-cols-3 gap-3">
                {(["one-to-one", "one-to-many", "many-to-many"] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setDialogCardinality(c)}
                    className={`h-12 flex items-center justify-center rounded-xl text-[13px] font-black border transition-all duration-200 ${dialogCardinality === c
                      ? "text-white border-transparent shadow-lg shadow-indigo-500/30 scale-[1.02]"
                      : isDark ? "border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40" : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100/60"
                      }`}
                    style={dialogCardinality === c ? { background: "#6366f1" } : {}}
                  >
                    {CARDINALITY_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>


            <div className="space-y-3">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-600" : "text-slate-400"}`}>On Delete</p>
              <div className="grid grid-cols-2 gap-3">
                {(["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"] as const).map(a => (
                  <button
                    key={a}
                    onClick={() => setDialogOnDelete(a)}
                    className={`h-12 flex items-center justify-center rounded-xl text-[12px] font-black border transition-all ${dialogOnDelete === a
                      ? isDark ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "bg-indigo-50 border-indigo-400 text-indigo-700"
                      : isDark ? "border-slate-800 text-slate-500 hover:border-slate-700" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                      }`}
                  >{a}</button>
                ))}
              </div>
            </div>


            <div className="flex gap-3 pt-2">
              <button
                onClick={() => confirmRelationship()}
                disabled={createRelMut.isPending}
                className="flex-[1.5] h-14 rounded-2xl bg-indigo-600 text-white text-[14px] font-black hover:bg-indigo-700 disabled:opacity-60 transition shadow-xl shadow-indigo-500/20 active:scale-95"
              >
                {createRelMut.isPending || updateRelMut.isPending ? "Processing…" : connectDialog.relationshipId ? "Save Changes" : "Create Relationship"}
              </button>
              <button
                onClick={() => setConnectDialog(null)}
                className={`flex-1 h-14 rounded-2xl text-[14px] font-black border transition hover:bg-slate-50 active:scale-95 ${isDark ? "border-slate-800 text-slate-500 hover:bg-slate-800/40" : "border-slate-100 text-slate-500"}`}
              >Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className={`grid h-[calc(100vh-64px)] grid-cols-1 ${isCodeDrawerOpen || isAiDrawerOpen ? "xl:grid-cols-[400px_minmax(0,1fr)_420px]" : "xl:grid-cols-[400px_minmax(0,1fr)]"}`}>
        {/* ── Sidebar ── */}
        <aside className={`flex min-h-0 flex-col border-r transition-colors ${isDark ? "border-[#1e293b] bg-[#0f172a]" : "border-[#e2e8f0] bg-white"}`}>
          <div className={`px-4 py-4 border-b space-y-4 ${isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-100 bg-slate-50/80"}`}>
            <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2">
              <input
                id="schema-search"
                type="text"
                placeholder="Search tables, columns, or relationships"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-11 rounded-xl border px-3 text-[12px] font-bold outline-none ${isDark ? "border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-600" : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400"}`}
              />
              <select value={projectDatabaseType} onChange={(e) => void handleDatabaseTypeChange(e.target.value)} className={`h-11 rounded-xl border px-3 text-[12px] font-bold outline-none ${isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}>
                {DATABASE_OPTIONS.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
              </select>
            </div>

            <form onSubmit={handleCreateTable} className="grid grid-cols-[minmax(0,1fr)_52px] gap-2">
              <input
                id="new-table-input"
                type="text"
                placeholder="Create a new table"
                value={tableName}
                onChange={e => setTableName(e.target.value)}
                className={`h-11 rounded-xl border px-3 text-[13px] font-bold outline-none transition ${isDark ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-600 focus:border-indigo-500" : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-indigo-500"}`}
              />
              <button type="submit" className="h-11 w-11 flex items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition shadow-md shadow-indigo-500/20 shrink-0">
                <PlusIcon className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Mode bar */}
          <div className={`flex border-b shrink-0 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            {([
              { key: "schema", label: `Schema (${tables.length})` },
              { key: "relationships", label: `Links (${relationships.length})` },
              { key: "templates", label: "Templates" },
              { key: "import", label: "Import" },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setSidebarMode(tab.key)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition ${sidebarMode === tab.key
                  ? "border-b-2 border-indigo-500 text-indigo-400"
                  : isDark ? "text-slate-600 hover:text-slate-400" : "text-slate-400 hover:text-600"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TABLES TAB ── */}
          {sidebarMode === "schema" && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                {filteredTables.length === 0 && (
                  <div className={`rounded-xl border-2 border-dashed px-4 py-8 text-center text-[12px] font-bold ${isDark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}>
                    {searchQuery ? "No tables or columns matched your search." : "Create your first table above."}
                  </div>
                )}

                {filteredTables.map((table, idx) => {
                  const isExpanded = expandedTableId === table.id;
                  const tableColumns = columns.filter(c => c.table_id === table.id);
                  const isRenaming = renamingTableId === table.id;
                  const isAddingCol = addingColTableId === table.id;
                  const tableColor = getTableColor(idx);

                  return (
                    <div key={table.id} className={`rounded-r-2xl border-l-[6px] transition-all duration-300 ${isExpanded
                      ? isDark ? "bg-slate-900/60 shadow-lg" : "bg-white shadow-md"
                      : isDark ? "border-l-slate-800 bg-slate-900/40" : "border-l-slate-200 bg-white shadow-sm"
                      }`}
                      style={{ borderLeftColor: isExpanded ? tableColor : undefined }}
                    >
                      <div onClick={() => { const n = isExpanded ? null : table.id; setExpandedTableId(n); if (n) focusTable(table.id); }} 
                           className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer ${isExpanded ? (isDark ? "border-b border-slate-800" : "border-b border-slate-100") : ""}`}>
                        <div className={`p-1 rounded-lg transition ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          <svg className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} style={{ color: isExpanded ? tableColor : undefined }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="m9 6 6 6-6 6" /></svg>
                        </div>

                        {isRenaming ? (
                          <input autoFocus value={renameTableValue} onChange={e => setRenameTableValue(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            onBlur={() => void handleRenameTable(table.id)}
                            onKeyDown={e => { if (e.key === "Enter") void handleRenameTable(table.id); if (e.key === "Escape") setRenamingTableId(null); }}
                            className={`flex-1 text-[18px] font-black bg-transparent border-b-2 border-indigo-500 outline-none ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
                          />
                        ) : (
                          <span className={`flex-1 truncate text-[18px] font-black tracking-tight transition-colors ${isExpanded ? "" : isDark ? "text-slate-200" : "text-slate-700"}`}
                            style={{ color: isExpanded ? tableColor : undefined }}
                          >
                            {table.name}
                          </span>
                        )}

                        <span className={`text-[10px] font-bold shrink-0 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{tableColumns.length}</span>

                        <button onClick={(e) => { e.stopPropagation(); setRenamingTableId(table.id); setRenameTableValue(table.name); }} title="Rename table"
                          className={`p-1 rounded-lg transition ${isDark ? "text-slate-600 hover:text-indigo-400 hover:bg-slate-800" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100"}`}>
                          <EditIcon className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); void handleDeleteTable(table.id); }} title="Delete table"
                          className={`p-1 rounded-lg transition ${isDark ? "text-slate-600 hover:text-rose-400 hover:bg-slate-800" : "text-slate-400 hover:text-rose-500 hover:bg-slate-100"}`}>
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="px-2 py-2 space-y-1">
                          {tableColumns.map(col => {
                            const isRenamingCol = renamingColId === col.id;
                            const isActiveCol = activeColId === col.id;
                            return (
                              <div key={col.id} className={`group flex flex-col px-2 py-2 rounded-xl transition ${isActiveCol ? isDark ? "bg-slate-800" : "bg-indigo-50" : isDark ? "hover:bg-slate-800/60" : "hover:bg-slate-50"}`}>
                                <div onClick={() => setActiveColId(isActiveCol ? null : col.id)} className="flex items-center gap-2 cursor-pointer group">
                                  <div className="flex w-4 items-center justify-center shrink-0">
                                    {col.is_primary ? (
                                      <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                    ) : col.is_unique ? (
                                      <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    ) : (
                                      <div className={`h-1.5 w-1.5 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
                                    )}
                                  </div>

                                  {isRenamingCol ? (
                                    <input autoFocus value={renameColValue} onChange={e => setRenameColValue(e.target.value)}
                                      onClick={e => e.stopPropagation()}
                                      onBlur={() => void handleRenameColumn(col.id)}
                                      onKeyDown={e => { if (e.key === "Enter") void handleRenameColumn(col.id); if (e.key === "Escape") setRenamingColId(null); }}
                                      className={`flex-1 text-[14px] font-bold bg-transparent border-b border-indigo-500 outline-none min-w-0 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
                                    />
                                  ) : (
                                    <span className={`flex-1 truncate text-[14px] font-bold min-w-0 ${isDark ? "text-slate-200" : "text-slate-700"}`}>{col.name}</span>
                                  )}

                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={(e) => { e.stopPropagation(); setRenamingColId(col.id); setRenameColValue(col.name); }} title="Rename column"
                                      className={`p-1 rounded transition ${isDark ? "text-slate-500 hover:text-indigo-400" : "text-slate-400 hover:text-indigo-500"}`}>
                                      <EditIcon className="h-3 w-3" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); void handleDeleteColumn(col.id); }} title="Delete column"
                                      className={`p-1 rounded transition ${isDark ? "text-slate-500 hover:text-rose-400" : "text-slate-400 hover:text-rose-500"}`}>
                                      <TrashIcon className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Column Props (Type, PK, UQ, NN) */}
                                {isActiveCol && (
                                  <div className="mt-3 space-y-3 pb-1 border-t pt-3 border-indigo-500/10 transition-all duration-300">
                                    <TypeSelect value={col.data_type} onChange={(t) => handleChangeColumnType(col.id, t)} isDark={isDark} size="sm" />
                                    <div className="flex gap-1">
                                      {(["is_primary", "is_unique", "is_nullable"] as const).map(prop => (
                                        <button
                                          key={prop}
                                          onClick={(e) => { e.stopPropagation(); handleToggleColumnProp(col, prop); }}
                                          title={prop === "is_primary" ? "Primary Key" : prop === "is_unique" ? "Unique" : "Nullable"}
                                          className={`flex-1 h-8 rounded-lg text-[9px] font-black uppercase tracking-tighter border transition ${(prop === "is_nullable" ? !col[prop] : col[prop])
                                            ? "bg-indigo-500 text-white border-transparent"
                                            : isDark ? "border-slate-700 text-slate-600" : "border-slate-200 text-slate-400"
                                            }`}
                                        >
                                          {prop === "is_primary" ? "PK" : prop === "is_unique" ? "UQ" : "NN"}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {isAddingCol ? (
                            <div className={`mt-2 rounded-xl border-2 p-3 space-y-2.5 ${isDark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-500/20 bg-emerald-50/50"}`}>
                              <input autoFocus placeholder="column_name" value={newColName} onChange={e => setNewColName(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") void handleAddColumn(table.id); if (e.key === "Escape") setAddingColTableId(null); }}
                                className={`w-full px-3 py-2 rounded-lg text-[12px] font-bold border outline-none transition ${isDark ? "bg-slate-900 border-slate-700 text-emerald-200 placeholder:text-slate-600 focus:border-emerald-500" : "bg-white border-slate-200 text-slate-700 focus:border-emerald-500"
                                  }`}
                              />
                              <TypeSelect value={newColType} onChange={setNewColType} isDark={isDark} />
                              <div className="flex gap-2">
                                {([
                                  { label: "PK", active: newColPK, set: setNewColPK, title: "Primary Key" },
                                  { label: "UQ", active: newColUnique, set: setNewColUnique, title: "Unique" },
                                  { label: "NN", active: newColNotNull, set: setNewColNotNull, title: "Not Null" },
                                ] as const).map(({ label, active, set, title }) => (
                                  <button key={label} type="button" title={title} onClick={() => set(!active)}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition ${active ? "bg-emerald-500 text-white border-emerald-500" : isDark ? "border-slate-700 text-slate-500 hover:border-slate-500" : "border-slate-200 text-slate-400 hover:border-slate-400"
                                      }`}>{label}</button>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => void handleAddColumn(table.id)} disabled={addColMut.isPending}
                                  className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition">
                                  {addColMut.isPending ? "Adding…" : "Add Column"}
                                </button>
                                <button onClick={() => setAddingColTableId(null)}
                                  className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest border transition ${isDark ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setAddingColTableId(table.id); setNewColName(""); setNewColType("varchar(255)"); setNewColPK(false); setNewColUnique(false); setNewColNotNull(false); }}
                              className={`mt-1 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-dashed border text-[11px] font-black uppercase tracking-widest transition ${isDark ? "border-slate-700 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400" : "border-slate-200 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-600"
                                }`}>
                              <PlusIcon className="h-3 w-3" />Add Column
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            </>
          )}

          {/* ── RELATIONSHIPS TAB ── */}
          {sidebarMode === "relationships" && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              <div className={`rounded-xl p-3 text-[11px] font-bold flex items-start gap-2 ${isDark ? "bg-slate-800/60 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <LinkIcon className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
                <span>Drag from any column dot on the canvas to another column to create a relationship.</span>
              </div>

              {filteredRelationships.length === 0 ? (
                <div className={`rounded-xl border-2 border-dashed px-4 py-8 text-center text-[12px] font-bold ${isDark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}>
                  {searchQuery ? "No relationships matched your search." : <>No relationships yet.<br />Drag column dots to connect tables.</>}
                </div>
              ) : (
                filteredRelationships.map(rel => {
                  const srcCol = columns.find(c => c.id === rel.source_column_id);
                  const tgtCol = columns.find(c => c.id === rel.target_column_id);
                  const srcTable = tables.find(t => t.id === rel.source_table_id);
                  const tgtTable = tables.find(t => t.id === rel.target_table_id);
                  const srcIsOne = srcCol?.is_primary || srcCol?.is_unique;
                  const tgtIsOne = tgtCol?.is_primary || tgtCol?.is_unique;
                  const card = srcIsOne && tgtIsOne ? "one-to-one" : srcIsOne ? "one-to-many" : "many-to-many";
                  const color = CARDINALITY_COLOR[card];

                  return (
                    <div key={rel.id} className={`rounded-xl border p-3 ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white shadow-sm"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white" style={{ background: color }}>
                              {CARDINALITY_LABEL[card]}
                            </span>
                            {rel.on_delete && rel.on_delete !== "NO ACTION" && (
                              <span className={`text-[9px] font-bold uppercase ${isDark ? "text-slate-500" : "text-slate-400"}`}>on delete: {rel.on_delete}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-black truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>{srcTable?.name}</span>
                            <span className={`text-[10px] font-bold truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>.{srcCol?.name}</span>
                          </div>
                          <div className="ml-1 my-0.5 h-4 border-l-2 border-dashed" style={{ borderColor: color }} />
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-black truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>{tgtTable?.name}</span>
                            <span className={`text-[10px] font-bold truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>.{tgtCol?.name}</span>
                          </div>
                        </div>
                        <button onClick={() => void handleDeleteRel(rel.id)} title="Delete relationship"
                          className={`p-1.5 rounded-lg shrink-0 transition ${isDark ? "text-slate-600 hover:text-rose-400 hover:bg-slate-800" : "text-slate-400 hover:text-rose-500 hover:bg-rose-50"}`}>
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {sidebarMode === "templates" && (
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              <div className={`rounded-xl border p-3 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Starter Templates</p>
                <p className={`mt-1 text-[11px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>Drop in a proven starting point, then tailor it on the canvas.</p>
              </div>
              {TEMPLATE_SCHEMAS.map((template) => (
                <button key={template.id} onClick={() => void handleApplyTemplate(template.id)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${isDark ? "border-slate-800 bg-slate-900/40 hover:border-indigo-500/40" : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"}`}>
                  <div className="text-[12px] font-black text-indigo-400">{template.name}</div>
                  <div className={`mt-2 text-[11px] font-bold leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{template.description}</div>
                </button>
              ))}
            </div>
          )}

          {sidebarMode === "import" && (
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Import SQL</p>
                  <p className={`mt-1 text-[11px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>Paste `CREATE TABLE` and `ALTER TABLE` statements to bootstrap the diagram.</p>
                </div>
                <textarea
                  value={sqlImport}
                  onChange={(e) => setSqlImport(e.target.value)}
                  placeholder="Paste CREATE TABLE / ALTER TABLE SQL here"
                  className={`min-h-48 w-full rounded-xl border px-3 py-2 text-[11px] font-mono outline-none ${isDark ? "border-slate-800 bg-slate-950 text-slate-200 placeholder:text-slate-600" : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400"}`}
                />
                <button onClick={() => void handleImportSql()} className="w-full rounded-xl bg-emerald-500 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-emerald-600">Import SQL Dump</button>
              </div>
            </div>
          )}
        </aside>

        {/* ── Canvas ── */}
        <section className="relative flex flex-col h-full overflow-hidden">
          <div className={`flex shrink-0 items-center justify-between border-b px-5 py-3 ${isDark ? "border-[#1e293b] bg-[#0f172a]" : "border-slate-200 bg-white"}`}>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Nebula Canvas</p>
              <p className={`text-[11px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Drag tables · drag column dots to connect
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button onClick={() => { setIsAiDrawerOpen(true); setIsCodeDrawerOpen(false); }} className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>Assistant</button>
              <button onClick={() => { setIsCodeDrawerOpen(true); setIsAiDrawerOpen(false); }} className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>Code</button>
              <button onClick={handleFitView} className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>Fit View</button>
              <button onClick={() => void handleExportDiagram("png")} className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>PNG</button>
              <span className={`rounded-lg border px-3 py-1 text-[10px] font-black ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                {Math.round(viewportZoom * 100)}%
              </span>
            </div>
          </div>

          <div className="relative flex-1 min-h-0">
            <ReactFlow
              key="schemaforge-canvas"
              onInit={setReactFlowInstance}
              onMove={(_e, vp) => {
                if (!Number.isNaN(vp.zoom)) setViewportZoom(vp.zoom);
              }}
              nodes={flowNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              onSelectionChange={onSelectionChange}
              onConnect={onConnect}
              fitView={!hasFitView}
              panOnDrag={[1, 2]}
              selectionOnDrag={true}
              selectionMode={SelectionMode.Partial}
              minZoom={0.05}
              maxZoom={4}
              defaultViewport={{ x: 80, y: 80, zoom: 0.9 }}
              connectionLineStyle={{ stroke: "#818cf8", strokeWidth: 2 }}
              connectionLineType={"smoothstep" as never}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={40}
                size={1.5}
                color={isDark ? "rgba(148,163,184,0.3)" : "rgba(100,116,139,0.15)"}
              />
              <MiniMap
                pannable
                zoomable
                className={isDark ? "bg-slate-950/90" : "bg-white/95"}
                nodeColor={(node) => node.type === "groupNode" ? "#6366f1" : "#818cf8"}
                maskColor={isDark ? "rgba(2,6,23,0.72)" : "rgba(248,250,252,0.75)"}
              />
              <Controls
                showZoom={true}
                showFitView={true}
                showInteractive={false}
                className={`border-none shadow-2xl ${isDark ? "bg-slate-900 fill-white" : "bg-white"}`}
              />
            </ReactFlow>

            {/* Creation Hub / Selection Fab */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none">
              {(() => {
                const selTables = selectedNodes.filter(n => n.type === "tableNode");
                // Mirroring check: only allow if ALL selected tables are currently ungrouped
                const noneGrouped = selTables.length > 0 && selTables.every(tn => !tables.find(t => t.id === tn.id)?.group_id);
                if (!noneGrouped) return null;

                return (
                  <button
                    onClick={handleCreateGroup}
                    className="pointer-events-auto px-6 py-2.5 rounded-2xl bg-indigo-500 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M7 8h10M7 12h10M7 16h10" /></svg>
                    Add Comment Box
                  </button>
                );
              })()}
            </div>

            {!isAiDrawerOpen && (
              <button
                onClick={() => { setIsAiDrawerOpen(true); setIsCodeDrawerOpen(false); }}
                className={`absolute right-6 bottom-6 z-20 flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl transition hover:scale-105 active:scale-95 ${isDark ? "border-slate-700 bg-slate-900 text-emerald-300" : "border-slate-200 bg-white text-emerald-600"}`}
                title="Open assistant"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-7 6 1.8-3.6A8 8 0 114 16.9V20z" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {(isCodeDrawerOpen || isAiDrawerOpen) && (
          <aside className={`flex min-h-0 flex-col border-l ${isDark ? "border-slate-800 bg-[#0b1220]" : "border-slate-200 bg-white"}`}>
            <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isAiDrawerOpen ? "text-emerald-400" : "text-indigo-400"}`}>{isAiDrawerOpen ? "AI Engine" : "Code Hub"}</p>
                <p className={`text-[11px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isAiDrawerOpen ? "Generate and optimize with Qwen 3.5" : "Live export formats and downloads"}</p>
              </div>
              <button onClick={() => { setIsAiDrawerOpen(false); setIsCodeDrawerOpen(false); }} className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-slate-900 text-slate-300 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>Close</button>
            </div>

            {isCodeDrawerOpen && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className={`border-b px-4 py-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={selectedExportFormat} onChange={(e) => setSelectedExportFormat(e.target.value as ExportFormat)} className={`h-10 rounded-lg border px-3 text-[12px] font-bold outline-none ${isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                      {EXPORT_FORMATS.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}
                    </select>
                    <button onClick={() => void exportCodeQuery.refetch()} className="rounded-lg bg-indigo-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">Refresh</button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => void handleCopyCode()} className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-slate-900 text-slate-200 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>Copy</button>
                    <button onClick={handleDownloadCode} className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-slate-900 text-slate-200 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>Download</button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  <SyntaxHighlighter
                    language={exportCodeQuery.data?.language ?? "sql"}
                    style={isDark ? oneDark : oneLight}
                    customStyle={{ margin: 0, minHeight: "100%", background: "transparent", fontSize: "12px" }}
                    wrapLongLines
                  >
                    {exportCodeQuery.data?.code ?? (exportCodeQuery.isLoading ? "Loading export..." : "// Open the code hub to preview generated code")}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            {isAiDrawerOpen && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className={`border-b px-4 py-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the schema you want, for example: multi-tenant CRM with organizations, contacts, deals, pipelines, and activity logs."
                    className={`min-h-28 w-full rounded-xl border px-3 py-2 text-[12px] font-medium outline-none ${isDark ? "border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-600" : "border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400"}`}
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => void handleGenerateWithAi()} className="rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">{aiGenerateMut.isPending ? "Generating..." : "Generate ERD"}</button>
                    <button onClick={() => void handleOptimizeWithAi()} className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-slate-900 text-slate-200 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>{aiOptimizeMut.isPending ? "Reviewing..." : "Optimize"}</button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto px-4 py-4 space-y-3">
                  {aiSummary && (
                    <div className={`rounded-2xl border p-4 ${isDark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Summary</p>
                      <p className={`mt-2 text-[12px] font-medium leading-6 ${isDark ? "text-slate-200" : "text-slate-700"}`}>{aiSummary}</p>
                    </div>
                  )}
                  {aiSuggestions.length > 0 && aiSuggestions.map((suggestion) => (
                    <div key={`${suggestion.title}-${suggestion.priority}`} className={`rounded-2xl border p-4 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-[12px] font-black ${isDark ? "text-slate-100" : "text-slate-700"}`}>{suggestion.title}</p>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest ${suggestion.priority === "high" ? "bg-rose-500 text-white" : suggestion.priority === "medium" ? "bg-amber-500 text-white" : "bg-sky-500 text-white"}`}>{suggestion.priority}</span>
                      </div>
                      <p className={`mt-2 text-[11px] font-medium leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{suggestion.reason}</p>
                      <p className={`mt-3 text-[11px] font-bold leading-5 ${isDark ? "text-slate-200" : "text-slate-700"}`}>{suggestion.action}</p>
                    </div>
                  ))}
                  {!aiSummary && aiSuggestions.length === 0 && (
                    <div className={`rounded-2xl border-2 border-dashed p-6 text-center text-[12px] font-bold ${isDark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}>
                      Ask Qwen to generate a schema or review the current one.
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}

export default ProjectEditor;
