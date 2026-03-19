import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, SVGProps, WheelEvent as ReactWheelEvent } from "react";
import { useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  MarkerType,
  useNodesState,
  type Connection,
  type ReactFlowInstance,
  type Node,
  type NodeChange,
  type OnNodesDelete,
} from "reactflow";
import "reactflow/dist/style.css";
import { CommentGroupNode } from "../components/schema/CommentGroupNode";
import { RelationshipEdge } from "../components/schema/RelationshipEdge";
import { TableNode } from "../components/schema/TableNode";
import { Navbar } from "../components/layout/Navbar";
import { useTheme } from "../hooks/useTheme";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { setAuthToken } from "../lib/axios";
import {
  createColumn,
  createRelationship,
  createTable,
  deleteColumn,
  deleteTable,
  updateTable,
  fetchColumns,
  fetchExportSql,
  fetchRelationships,
  fetchTables,
  getSchemaApiErrorMessage,
  // type CreateColumnPayload,
  type SchemaColumn,
  type SchemaRelationship,
  type SchemaTable,
} from "../features/schema/api";
import {
  fetchProject,
  fetchProjectBySlug,
} from "../features/projects/api";
import {
  buildEdges,
  buildNodes,
  type NodeParentMap,
  type NodePositionMap,
} from "../features/schema/utils";
import { useSchemaStore } from "../features/schema/store";

const nodeTypes = { tableNode: TableNode, commentGroup: CommentGroupNode };
const edgeTypes = { relationshipEdge: RelationshipEdge };
// const COLORS = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6"];
// const LAYOUT_EXTENT: [[number, number], [number, number]] = [
//   [-20000, -20000],
//   [20000, 20000],
// ];

type Group = {
  id: string;
  title: string;
  color: string;
  position: { x: number; y: number };
  width: number;
  height: number;
};
type Layout = {
  positions: NodePositionMap;
  parents: NodeParentMap;
  groups: Group[];
};

const EMPTY_TABLES: SchemaTable[] = [];
const EMPTY_COLUMNS: SchemaColumn[] = [];
const EMPTY_RELATIONSHIPS: SchemaRelationship[] = [];

const keyFor = (projectId: string) => `schemaforge-layout:${projectId}`;

function loadLayout(projectId: string): Layout {
  if (!projectId || typeof window === "undefined") {
    return { positions: {}, parents: {}, groups: [] };
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(keyFor(projectId)) ??
      '{"positions":{},"parents":{},"groups":[]}',
    ) as Layout;
  } catch {
    return { positions: {}, parents: {}, groups: [] };
  }
}

function saveLayout(projectId: string, layout: Layout) {
  if (!projectId || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(keyFor(projectId), JSON.stringify(layout));
}

async function fetchSchema(projectId: string) {
  const [tables, relationships] = await Promise.all([
    fetchTables(projectId),
    fetchRelationships(projectId),
  ]);
  const columnGroups = await Promise.all(
    tables.map((table) => fetchColumns(table.id)),
  );

  return {
    tables,
    columns: columnGroups.flat(),
    relationships,
  };
}

function inferPayload(
  connection: Connection,
  tables: SchemaTable[],
  columns: SchemaColumn[],
) {
  if (
    !connection.source ||
    !connection.target ||
    connection.source === connection.target
  ) {
    return null;
  }

  const sourceTable = tables.find((item) => item.id === connection.source);
  const targetTable = tables.find((item) => item.id === connection.target);

  if (!sourceTable || !targetTable) {
    return null;
  }

  const sourceColumns = columns.filter(
    (item) => item.table_id === sourceTable.id,
  );

  const targetPrimary =
    columns.find(
      (item) => item.table_id === targetTable.id && item.is_primary,
    ) ?? columns.find((item) => item.table_id === targetTable.id);

  if (!targetPrimary) {
    return null;
  }

  const targetBase = targetTable.name.replace(/s$/i, "").toLowerCase();

  const foreignKey =
    sourceColumns.find((item) =>
      [
        targetBase + "_id",
        targetTable.name.toLowerCase() + "_id",
        targetBase + "id",
        targetTable.name.toLowerCase() + "id"
      ].includes(
        item.name.toLowerCase(),
      ),
    ) ??
    sourceColumns.find((item) => !item.is_primary) ??
    sourceColumns[0];

  if (!foreignKey) {
    return null;
  }

  return {
    source_table_id: sourceTable.id,
    source_column_id: foreignKey.id,
    target_table_id: targetTable.id,
    target_column_id: targetPrimary.id,
    on_delete: "CASCADE",
    on_update: "CASCADE",
  };
}

// --- Icons ---
function SaveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3h7.9L16 5.6V15.5A1.5 1.5 0 0 1 14.5 17h-9A1.5 1.5 0 0 1 4 15.5Z" />
      <path d="M7 3v4h5V3M7.2 17v-5.2h5.6V17" />
    </svg>
  );
}

// function RefreshIcon(props: SVGProps<SVGSVGElement>) {
//   return (
//     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
//       <path d="M16 10a6 6 0 1 1-1.5-4" />
//       <path d="M16 4.5v4h-4" />
//     </svg>
//   );
// }

// function ResetIcon(props: SVGProps<SVGSVGElement>) {
//   return (
//     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
//       <path d="M4 10a6 6 0 1 0 2-4.5" />
//       <path d="M4 4.5v4h4" />
//     </svg>
//   );
// }

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4.5 6h11M8 3.5h4M7 6v9m6-9v9M5.5 6l.7 10a1.2 1.2 0 0 0 1.2 1h5.2a1.2 1.2 0 0 0 1.2-1l.7-10" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m5 7 5 6 5-6" />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ProjectEditor() {
  const { projectId = "", username = "", diagramSlug = "" } = useParams();
  const queryClient = useQueryClient();
  const { selectedNodeId, selectNode } = useSchemaStore();
  const { theme, toggleTheme, isDark } = useTheme();

  const { userId, getToken } = useAuth();
  const clerk = useClerk();

  const [tableName, setTableName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [renamingTableId, setRenamingTableId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [addingColumnTableId, setAddingColumnTableId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("varchar(255)");
  const [newColumnIsPrimary, setNewColumnIsPrimary] = useState(false);
  const [newColumnIsUnique, setNewColumnIsUnique] = useState(false);
  const [newColumnIsNullable, setNewColumnIsNullable] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sqlExpanded, setSqlExpanded] = useState(true);
  const [viewportZoom, setViewportZoom] = useState(0.9);
  const [hasFitView, setHasFitView] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [positions, setPositions] = useState<NodePositionMap>({});
  const [parents, setParents] = useState<NodeParentMap>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);
  const routeStorageKey = projectId || (username && diagramSlug ? `${username}:${diagramSlug}` : "");

  const projectQuery = useQuery({
    queryKey: ["project-meta", projectId, username, diagramSlug],
    queryFn: () =>
      projectId
        ? fetchProject(projectId)
        : fetchProjectBySlug(username, diagramSlug),
    enabled: Boolean(projectId || (username && diagramSlug)),
  });
  const project = projectQuery.data;
  const resolvedProjectId = projectQuery.data?.id ?? projectId;
  const schemaDialectLabel =
    project?.database_type === "mongodb"
      ? "MongoDB Schema"
      : project?.database_type === "sql"
        ? "SQL Schema"
        : "PostgreSQL Schema";

  useEffect(() => {
    const layout = loadLayout(routeStorageKey);
    setPositions(layout.positions);
    setParents(layout.parents);
    setGroups(layout.groups);
  }, [routeStorageKey]);

  useEffect(() => {
    saveLayout(routeStorageKey, { positions, parents, groups });
  }, [groups, parents, positions, routeStorageKey]);

  const schemaQuery = useQuery({
    queryKey: ["schema", resolvedProjectId],
    queryFn: () => fetchSchema(resolvedProjectId ?? ""),
    enabled: Boolean(resolvedProjectId),
  });

  const exportQuery = useQuery({
    queryKey: ["schema", resolvedProjectId, "export-sql"],
    queryFn: () => fetchExportSql(resolvedProjectId ?? ""),
    enabled: Boolean(resolvedProjectId),
  });

  const invalidateSchema = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["schema", resolvedProjectId] });
    void queryClient.invalidateQueries({
      queryKey: ["schema", resolvedProjectId, "export-sql"],
    });
  }, [queryClient, resolvedProjectId]);

  const ensureSchemaAuth = useCallback(async () => {
    if (!userId) {
      clerk.openSignIn();
      return false;
    }

    const token = await getToken();
    setAuthToken(token);

    if (!token) {
      clerk.openSignIn();
      return false;
    }

    return true;
  }, [clerk, getToken, userId]);

  const updateTableMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateTable(id, { name }),
    onSuccess: () => { setRenamingTableId(null); setRenameValue(""); invalidateSchema(); },
    onError: () => { setStatusMessage("Failed to rename table."); },
  });

  const createTableMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => { invalidateSchema(); },
  });

  const createColumnMutation = useMutation({
    mutationFn: createColumn,
    onSuccess: () => { setAddingColumnTableId(null); setNewColumnName(""); invalidateSchema(); },
  });

  const createRelationshipMutation = useMutation({
    mutationFn: createRelationship,
    onSuccess: () => { setStatusMessage("Relationship linked."); invalidateSchema(); },
    onError: (error) => { setStatusMessage(getSchemaApiErrorMessage(error)); },
  });

  const deleteTableMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => { setStatusMessage("Table removed."); invalidateSchema(); selectNode(null); },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: deleteColumn,
    onSuccess: () => { invalidateSchema(); },
  });

  const tables = schemaQuery.data?.tables ?? EMPTY_TABLES;
  const columns = schemaQuery.data?.columns ?? EMPTY_COLUMNS;
  const relationships = schemaQuery.data?.relationships ?? EMPTY_RELATIONSHIPS;

  const filteredTables = useMemo(() => {
    if (!searchTerm.trim()) return tables;
    return tables.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, tables]);

  const tableNodes = useMemo(() => buildNodes(tables, columns, positions, parents, isDark), [columns, isDark, parents, positions, tables]);
  const groupNodes = useMemo<Node[]>(() => groups.map((group) => ({
    id: group.id,
    type: "commentGroup",
    position: group.position,
    data: { title: group.title, color: group.color, isDark },
    style: { width: group.width, height: group.height },
  })), [groups, isDark]);

  const builtNodes = useMemo(() => [...groupNodes, ...tableNodes], [groupNodes, tableNodes]);
  const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState(builtNodes);
  const edges = useMemo(() => buildEdges(relationships, columns, isDark), [columns, isDark, relationships]);

  // Sync nodes from query data into ReactFlow state
  useEffect(() => { setFlowNodes(builtNodes); }, [builtNodes, setFlowNodes]);

  // Auto fitView ONCE after the first real nodes load from the API
  useEffect(() => {
    if (hasFitView || !reactFlowInstance || flowNodes.length === 0) return;
    // Small delay to let ReactFlow measure node dimensions first
    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.25, duration: 400 });
      setHasFitView(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [flowNodes, hasFitView, reactFlowInstance]);

  // Reset fitView flag when project changes so it runs again for the new diagram
  useEffect(() => { setHasFitView(false); }, [resolvedProjectId]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    onFlowNodesChange(changes);
    setGroups((current) => current.map((group) => {
      const change = changes.find((item): item is Extract<NodeChange, { type: "dimensions" }> => item.type === "dimensions" && item.id === group.id);
      return change?.dimensions ? { ...group, width: change.dimensions.width, height: change.dimensions.height } : group;
    }));
  }, [onFlowNodesChange]);

  const onNodeDragStop = useCallback((_event: unknown, node: Node) => {
    if (groups.some((group) => group.id === node.id)) {
      setGroups((current) => current.map((group) => group.id === node.id ? { ...group, position: node.position } : group));
      return;
    }
    setPositions((current) => ({ ...current, [node.id]: node.position }));
  }, [groups]);

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    const tableIds = nodes.filter((node) => node.type === "tableNode").map((node) => node.id);
    // const groupId = nodes.find((node) => node.type === "commentGroup")?.id ?? null;
    // setSelectedTables(tableIds);
    // setContextMenu(null);
    selectNode(tableIds.length === 1 ? tableIds[0] : null);
  }, [selectNode]);

  // Remove confirm/alert for delete — just delete directly
  const onNodesDelete: OnNodesDelete = useCallback((nodes) => {
    nodes.forEach(node => {
      if (node.type === "tableNode") {
        deleteTableMutation.mutate(node.id);
      }
    });
  }, [deleteTableMutation]);

  function startRenameTable(table: SchemaTable) {
    setRenamingTableId(table.id);
    setRenameValue(table.name);
  }

  function submitRenameTable(tableId: string) {
    if (renameValue.trim() && renameValue.trim() !== tables.find(t => t.id === tableId)?.name) {
      updateTableMutation.mutate({ id: tableId, name: renameValue.trim() });
    } else {
      setRenamingTableId(null);
    }
  }

  function startAddColumn(tableId: string) {
    setAddingColumnTableId(tableId);
    setNewColumnName("");
    setNewColumnType("varchar(255)");
    setNewColumnIsPrimary(false);
    setNewColumnIsUnique(false);
    setNewColumnIsNullable(true);
  }

  async function submitAddColumn(tableId: string) {
    if (!newColumnName.trim()) { setAddingColumnTableId(null); return; }
    const authorized = await ensureSchemaAuth();
    if (!authorized) return;
    createColumnMutation.mutate({
      name: newColumnName.trim(),
      table_id: tableId,
      data_type: newColumnType,
      is_nullable: newColumnIsNullable,
      is_primary: newColumnIsPrimary,
      is_unique: newColumnIsUnique,
    });
  }

  function focusTable(tableId: string) {
    const node = flowNodes.find((item) => item.id === tableId);
    if (!node || !reactFlowInstance) return;
    const position = node.positionAbsolute ?? node.position;
    const width = node.width ?? 320;
    const height = node.height ?? 180;
    reactFlowInstance.setCenter(position.x + width / 2, position.y + height / 2, { zoom: 1.15, duration: 500 });
  }

  function resetLayout() {
    if (!confirm("Reset entire layout?")) return;
    setPositions({}); setParents({}); setGroups([]); selectNode(null);
  }

  async function submitTableName() {
    if (!tableName.trim() || !resolvedProjectId) return;
    const authorized = await ensureSchemaAuth();
    if (!authorized) return;
    await createTableMutation.mutateAsync({ name: tableName.trim(), project_id: resolvedProjectId });
    setTableName("");
  }

  async function onCreateTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitTableName();
  }

  async function onConnect(connection: Connection) {
    const authorized = await ensureSchemaAuth();
    if (!authorized) return;
    const payload = inferPayload(connection, tables, columns);
    if (payload) await createRelationshipMutation.mutateAsync(payload);
  }

  const onCanvasWheel = useCallback(async (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!reactFlowInstance) {
      return;
    }

    event.preventDefault();

    const zoomAction = event.deltaY < 0 ? reactFlowInstance.zoomIn : reactFlowInstance.zoomOut;
    await zoomAction();
  }, [reactFlowInstance]);

  return (
    <main className={`h-screen overflow-hidden ${isDark ? "bg-[#020617]" : "bg-[#f8fafc]"}`}>
      <Navbar theme={theme} onToggle={toggleTheme} fullWidth />

      <div className="grid h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className={`flex min-h-0 flex-col border-r transition-colors ${isDark ? "border-[#334155] bg-[#0f172a]" : "border-[#e2e8f0] bg-white"}`}>
          <div className="px-5 pt-6 pb-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                <h2 className={`text-lg font-black tracking-tight ${isDark ? "text-white" : "text-[#0f172a]"}`}>Tables</h2>
              </div>
              <button className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-500/10 transition"><SearchIcon className="h-4 w-4" /></button>
            </div>

            <form onSubmit={onCreateTable} className="relative group">
              <input
                type="text" placeholder="Create Table..."
                className={`w-full h-11 pl-4 pr-12 rounded-xl border-2 text-sm font-bold outline-none transition ${isDark ? "bg-[#1e293b] border-[#334155] text-white focus:border-indigo-500" : "bg-slate-50 border-[#e2e8f0] text-slate-700 focus:border-indigo-600"}`}
                value={tableName} onChange={e => setTableName(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submitTableName();
                  }
                }}
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 bg-indigo-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition">
                <PlusIcon className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon className="h-3.5 w-3.5 text-slate-400 opacity-50" /></div>
              <input
                type="text" placeholder="Filter tables..."
                className={`w-full h-9 pl-9 pr-4 rounded-lg text-[11px] font-bold outline-none border-b transition ${isDark ? "bg-transparent border-[#334155] text-slate-300" : "bg-transparent border-slate-100 text-slate-500"}`}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-4 space-y-1.5">
            {filteredTables.map(table => {
              const isSelected = selectedNodeId === table.id;
              const tableColumns = columns.filter(c => c.table_id === table.id);
              const isRenaming = renamingTableId === table.id;
              const isAddingCol = addingColumnTableId === table.id;
              return (
                <div key={table.id} className={`rounded-xl border transition-all duration-200 overflow-hidden ${isSelected ? "border-indigo-500/50 bg-indigo-500/5" : "border-transparent hover:border-indigo-500/20 hover:bg-indigo-500/5"}`}>
                  <button
                    onClick={() => { if (isSelected) selectNode(null); else { selectNode(table.id); focusTable(table.id); } }}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => submitRenameTable(table.id)}
                        onKeyDown={e => { if (e.key === "Enter") submitRenameTable(table.id); if (e.key === "Escape") setRenamingTableId(null); }}
                        onClick={e => e.stopPropagation()}
                        className={`flex-1 text-[15px] font-black tracking-tight bg-transparent border-b-2 border-indigo-500 outline-none text-indigo-400 min-w-0 mr-2`}
                      />
                    ) : (
                      <span className={`text-[15px] font-black tracking-tight ${isSelected ? "text-indigo-400" : (isDark ? "text-slate-200" : "text-slate-700")}`}>{table.name}</span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold opacity-30">{tableColumns.length}</span>
                      <ChevronDownIcon className={`h-4 w-4 transition-transform ${isSelected ? "rotate-180 text-indigo-400" : "opacity-30"}`} />
                    </div>
                  </button>
                  {isSelected && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 mb-3">
                        <button className="flex-1 h-8 rounded-lg bg-[#334155]/20 dark:text-slate-400 text-[10px] font-black uppercase hover:bg-indigo-500/20 hover:text-indigo-400 transition">Add Index</button>
                        <button
                          onClick={() => isAddingCol ? setAddingColumnTableId(null) : startAddColumn(table.id)}
                          className="flex-[1.5] h-8 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition">
                          {isAddingCol ? "Cancel" : "Add Column"}
                        </button>
                      </div>

                      {/* Inline Add Column Form */}
                      {isAddingCol && (
                        <div className={`mb-3 rounded-xl border-2 p-3 space-y-2.5 ${isDark ? "border-emerald-500/30 bg-[#111a28]" : "border-emerald-500/30 bg-emerald-50/50"}`}>
                          {/* Column Name */}
                          <input
                            autoFocus
                            placeholder="column_name"
                            value={newColumnName}
                            onChange={e => setNewColumnName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") void submitAddColumn(table.id); if (e.key === "Escape") setAddingColumnTableId(null); }}
                            className={`w-full h-8 px-3 rounded-lg text-[12px] font-bold outline-none border border-emerald-500/40 focus:border-emerald-500 transition ${isDark ? "bg-[#1a2540] text-emerald-200 placeholder:text-slate-600" : "bg-white text-emerald-800 placeholder:text-slate-400"}`}
                          />

                          {/* Data Type */}
                          <select
                            value={newColumnType}
                            onChange={e => setNewColumnType(e.target.value)}
                            className={`w-full h-8 px-3 rounded-lg text-[11px] font-bold outline-none border border-emerald-500/30 focus:border-emerald-500 transition cursor-pointer ${isDark ? "bg-[#1a2540] text-slate-300 border-slate-700" : "bg-white text-slate-700 border-slate-200"}`}
                          >
                            <optgroup label="Text">
                              <option value="varchar(255)">VARCHAR(255)</option>
                              <option value="varchar(100)">VARCHAR(100)</option>
                              <option value="text">TEXT</option>
                              <option value="char(1)">CHAR(1)</option>
                            </optgroup>
                            <optgroup label="Numbers">
                              <option value="int">INT</option>
                              <option value="bigint">BIGINT</option>
                              <option value="smallint">SMALLINT</option>
                              <option value="serial">SERIAL</option>
                              <option value="bigserial">BIGSERIAL</option>
                              <option value="numeric(10,2)">NUMERIC(10,2)</option>
                              <option value="float">FLOAT</option>
                              <option value="double precision">DOUBLE PRECISION</option>
                            </optgroup>
                            <optgroup label="Date & Time">
                              <option value="timestamp">TIMESTAMP</option>
                              <option value="date">DATE</option>
                              <option value="time">TIME</option>
                            </optgroup>
                            <optgroup label="Other">
                              <option value="boolean">BOOLEAN</option>
                              <option value="uuid">UUID</option>
                              <option value="jsonb">JSONB</option>
                              <option value="bytea">BYTEA</option>
                            </optgroup>
                          </select>

                          {/* Toggles Row */}
                          <div className="flex items-center gap-2">
                            {[
                              { label: "PK", title: "Primary Key", value: newColumnIsPrimary, set: setNewColumnIsPrimary, color: "amber" },
                              { label: "UQ", title: "Unique", value: newColumnIsUnique, set: setNewColumnIsUnique, color: "purple" },
                              { label: "NN", title: "Not Null", value: !newColumnIsNullable, set: (v: boolean) => setNewColumnIsNullable(!v), color: "rose" },
                            ].map(({ label, title, value, set, color }) => (
                              <button
                                key={label}
                                type="button"
                                title={title}
                                onClick={() => set(!value)}
                                className={`flex-1 h-7 rounded-lg text-[10px] font-black uppercase tracking-widest transition border ${value
                                  ? color === "amber" ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                    : color === "purple" ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                      : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                  : isDark ? "bg-transparent text-slate-600 border-slate-700 hover:border-slate-500" : "bg-transparent text-slate-400 border-slate-200 hover:border-slate-400"
                                  }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Enter hint */}
                          <p className={`text-[9px] font-bold uppercase tracking-widest text-center opacity-40 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            Press Enter to add · Esc to cancel
                          </p>
                        </div>
                      )}

                      <div className="space-y-1 mb-4">
                        {tableColumns.map(col => (
                          <div key={col.id} className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-700/20 transition">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex w-4 items-center justify-center">{col.is_primary ? <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> : <div className="h-1 w-1 rounded-full bg-slate-500 opacity-30" />}</div>
                              <span className={`text-[12px] font-bold truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>{col.name}</span>
                              <span className="text-[9px] font-bold opacity-30 uppercase">{col.data_type}</span>
                            </div>
                            <button onClick={() => deleteColumnMutation.mutate(col.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-600"><TrashIcon className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-700/50 pt-3">
                        <button onClick={() => startRenameTable(table)} className="flex items-center gap-1.5 p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 transition text-[10px] font-black uppercase tracking-widest">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Rename
                        </button>
                        <button onClick={() => deleteTableMutation.mutate(table.id)} className="flex items-center gap-1.5 p-1.5 rounded-lg text-rose-400 hover:text-rose-600 transition text-[10px] font-black uppercase tracking-widest">
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {statusMessage && <div className="p-4 bg-indigo-600 text-white text-[10px] font-black uppercase text-center">{statusMessage}</div>}
        </aside>

        {/* Canvas */}
        <section className={`relative`}>
          <div className={`flex items-center justify-between border-b px-5 py-3 ${isDark ? "border-[#334155] bg-[#0f172a]" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-4">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest text-indigo-400`}>NEBULA CANVAS ACTIVE</p>
                <p className={`text-[11px] font-bold text-slate-400`}>Infinite space for database design.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-slate-700 bg-[#1e293b] px-3 py-1.5 text-[10px] font-black text-slate-300">{Math.round(viewportZoom * 100)}%</span>
              <button onClick={() => setPositions(positions)} className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition"><SaveIcon className="h-3 w-3" />Save</button>
              <button onClick={resetLayout} className="rounded-xl border border-slate-700 bg-[#1e293b] px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:border-indigo-400 transition">Reset</button>
            </div>
          </div>

          <div className="relative h-[calc(100%-64px)]" onWheelCapture={onCanvasWheel}>
            <ReactFlow
              onInit={(instance) => { setReactFlowInstance(instance); }}
              onMove={(_e, v) => setViewportZoom(v.zoom)}
              nodes={flowNodes}
              edges={edges}
              nodeTypes={memoizedNodeTypes}
              edgeTypes={memoizedEdgeTypes}
              onNodesChange={onNodesChange}
              onNodeDragStop={onNodeDragStop}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              onNodesDelete={onNodesDelete}
              zoomOnScroll={false}
              panOnScroll={false}
              zoomOnPinch
              selectionOnDrag
              defaultViewport={{ x: 80, y: 80, zoom: 0.9 }}
              defaultEdgeOptions={{
                type: "relationshipEdge",
                markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
              }}
            >
              <Background
                variant={BackgroundVariant.Lines}
                color={isDark ? "rgba(148,163,184,0.18)" : "rgba(100,116,139,0.14)"}
                gap={36}
                size={1}
              />
              <Controls />
            </ReactFlow>

            {/* SQL Panel */}
            <div className={`absolute bottom-8 right-8 w-[440px] overflow-hidden rounded-[24px] border-2 shadow-2xl transition-all duration-300 ${isDark ? "border-[#334155] bg-[#0f172a]/95" : "bg-white border-slate-200"} ${sqlExpanded ? "translate-y-0" : "translate-y-[calc(100%-60px)]"}`}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 cursor-pointer" onClick={() => setSqlExpanded(!sqlExpanded)}>
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">{schemaDialectLabel}</span>
                <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${sqlExpanded ? "" : "rotate-180"}`} />
              </div>
              <pre className={`p-6 text-[11px] font-mono max-h-[400px] overflow-y-auto ${isDark ? "bg-[#0b0f19] text-indigo-300/80" : "bg-slate-50 text-slate-600"}`}>
                {exportQuery.data?.sql ?? "-- Generating DDL..."}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ProjectEditor;
