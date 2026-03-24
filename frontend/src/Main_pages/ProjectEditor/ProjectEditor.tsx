import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent } from "react";
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  applyNodeChanges, SelectionMode,
  type Connection, type Edge, type Node,
  type ReactFlowInstance, type OnNodesChange, type NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { toPng, toSvg } from "html-to-image";
// Removed Navbar since it's managed externally
import { useTheme } from "../../hooks/useTheme";
import { setAuthToken } from "../../lib/axios";
import { fetchProject, fetchProjectBySlug, updateProject } from "../../features/projects/api";
import {
  createTable, createColumn, updateTable, updateColumn,
  deleteTable, deleteColumn, createRelationship, deleteRelationship, updateRelationship,
  fetchColumns, fetchTables, fetchRelationships, fetchGroups, createGroup, updateGroup, deleteGroup,
  fetchExportCode, generateSchemaWithAi, optimizeSchemaWithAi, getSchemaApiErrorMessage,
  type SchemaColumn, type SchemaTable, type SchemaRelationship, type SchemaGroup,
  type CreateColumnPayload,
} from "../../features/schema/api";
import { autoLayoutPositions, buildNodes, buildEdges, type NodePositionMap } from "../../features/schema/utils";
import { useSchemaStore } from "../../features/schema/store";
import { useEditorState } from "./hooks/useEditorState";
import { EditorSidebar } from "./components/EditorSidebar";
import { RightDrawer } from "./components/RightDrawer";
import { ConnectDialog } from "./components/ConnectDialog";
import { TableNode } from "../../components/schema/TableNode";
import { GroupNode } from "../../components/schema/GroupNode";
import { RelationshipEdge } from "../../components/schema/RelationshipEdge";
import {
  EMPTY_TABLES, EMPTY_COLUMNS, EMPTY_RELS,
  TEMPLATE_SCHEMAS,
} from "./constants";
import {
  loadPositions, savePositions, loadTemplatePreviewLayout, saveTemplatePreviewLayout,
  downloadTextFile, parseSqlDump, buildTemplatePreviewSchema,
  computeTemplatePreviewPositions,
} from "./utils";
import type { TemplatePreviewLayout } from "./constants";

const EMPTY_GROUPS: SchemaGroup[] = [];

async function fetchSchema(projectId: string) {
  const tables = await fetchTables(projectId);
  const [cols, rels, grps] = await Promise.all([
    tables.length > 0 ? Promise.all(tables.map(t => fetchColumns(t.id))).then(g => g.flat()) : Promise.resolve([]),
    fetchRelationships(projectId),
    fetchGroups(projectId),
  ]);
  return { tables, columns: cols, relationships: rels, groups: grps };
}

interface ProjectEditorProps {
  projectId?: string;
  username?: string;
  diagramSlug?: string;
}

const STATIC_NODE_TYPES = {
  tableNode: TableNode,
  groupNode: GroupNode
};
const STATIC_EDGE_TYPES = {
  relationshipEdge: RelationshipEdge
};

export default function ProjectEditorCore({ projectId = "", username = "", diagramSlug = "" }: ProjectEditorProps) {
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const { selectedNodeId, selectNode } = useSchemaStore();
  const { userId, getToken } = useAuth();
  const clerk = useClerk();

  const state = useEditorState();
  const {
    tableName, setTableName, viewportZoom, setViewportZoom,
    sidebarMode, setSidebarMode, selectedTemplateId, setSelectedTemplateId,
    searchQuery, setSearchQuery, isCodeDrawerOpen, setIsCodeDrawerOpen,
    isAiDrawerOpen, setIsAiDrawerOpen, selectedExportFormat, setSelectedExportFormat,
    sqlImport, setSqlImport, aiPrompt, setAiPrompt,
    aiSummary, setAiSummary, aiSuggestions, setAiSuggestions,
    projectDatabaseType, setProjectDatabaseType,
    canvasContextMenu, setCanvasContextMenu,
    selectedNodes, setSelectedNodes,
    expandedTableId, setExpandedTableId,
    renamingTableId, setRenamingTableId, renameTableValue, setRenameTableValue,
    addingColTableId, setAddingColTableId,
    newColName, setNewColName, newColType, setNewColType,
    newColPK, setNewColPK, newColUnique, setNewColUnique, newColNotNull, setNewColNotNull,
    activeColId, setActiveColId,
    renamingColId, setRenamingColId, renameColValue, setRenameColValue,
    connectDialog, setConnectDialog, dialogCardinality, setDialogCardinality,
    dialogOnDelete, setDialogOnDelete,
  } = state;

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [positions, setPositions] = useState<NodePositionMap>({});
  const [rcRect, setRcRect] = useState<{ startX: number, startY: number, currX: number, currY: number } | null>(null);
  const [hasFitView, setHasFitView] = useState(false);
  const routeStorageKey = projectId || (username && diagramSlug ? `${username}:${diagramSlug}` : "");
  const isDragging = useRef(false);
  const dragSelectionRef = useRef<string[]>([]);

  // ── Queries ──
  const projectQuery = useQuery({
    queryKey: ["project-meta", projectId, username, diagramSlug],
    queryFn: () => projectId ? fetchProject(projectId) : fetchProjectBySlug(username, diagramSlug),
    enabled: !!(projectId || (username && diagramSlug)),
    retry: 1, staleTime: 5 * 60 * 1000,
  });
  const resolvedProjectId = projectQuery.data?.id || projectId;

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

  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [previewFlowNodes, setPreviewFlowNodes] = useState<Node[]>([]);
  const [savedTemplateLayouts, setSavedTemplateLayouts] = useState<Record<string, TemplatePreviewLayout>>({});
  const flowNodesRef = useRef<Node[]>([]);
  const selectedNodeIdRef = useRef(selectedNodeId);
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);

  const tables = schemaQuery.data?.tables ?? EMPTY_TABLES;
  const columns = schemaQuery.data?.columns ?? EMPTY_COLUMNS;
  const relationships = schemaQuery.data?.relationships ?? EMPTY_RELS;
  const groups = schemaQuery.data?.groups ?? EMPTY_GROUPS;

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredTables = useMemo(() =>
    normalizedSearch ? tables.filter(t => {
      const tc = columns.filter(c => c.table_id === t.id);
      return t.name.toLowerCase().includes(normalizedSearch) || tc.some(c => c.name.toLowerCase().includes(normalizedSearch));
    }) : tables,
    [columns, normalizedSearch, tables]
  );
  const filteredRelationships = useMemo(() =>
    normalizedSearch ? relationships.filter(rel =>
      [rel.source_table_id, rel.target_table_id, rel.source_column_id, rel.target_column_id].some(id =>
        columns.find(c => c.id === id)?.name?.toLowerCase().includes(normalizedSearch) ||
        tables.find(t => t.id === id)?.name?.toLowerCase().includes(normalizedSearch)
      )
    ) : relationships,
    [columns, normalizedSearch, relationships, tables]
  );

  // ── Auth helpers ──
  useEffect(() => {
    if (!userId) return;
    void getToken().then(token => setAuthToken(token ?? null));
  }, [getToken, userId]);

  useEffect(() => { setPositions(loadPositions(routeStorageKey)); }, [routeStorageKey]);
  useEffect(() => { savePositions(routeStorageKey, positions); }, [positions, routeStorageKey]);
  useEffect(() => {
    if (!projectQuery.data?.database_type) return;
    setProjectDatabaseType(projectQuery.data.database_type);
    setSelectedExportFormat(projectQuery.data.database_type === "mongodb" ? "mongoose" : "postgresql");
  }, [projectQuery.data?.database_type]);
  useEffect(() => {
    const layouts = Object.fromEntries(TEMPLATE_SCHEMAS.map(t => [t.id, loadTemplatePreviewLayout(t.id)]));
    setSavedTemplateLayouts(layouts);
  }, []);

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
      const nextPos = tables.length > 0
        ? (() => { const last = tables[tables.length - 1]; const lp = positions[last.id] || { x: 80, y: 80 }; return { x: lp.x + 360, y: lp.y }; })()
        : { x: 80, y: 80 };
      setPositions(prev => ({ ...prev, [newTable.id]: nextPos }));
      persistTablePosition(newTable.id, nextPos, false);
      invalidate();
    },
    onError: (e) => alert(getSchemaApiErrorMessage(e)),
  });
  const deleteTableMut = useMutation({ mutationFn: deleteTable, onSuccess: () => { setExpandedTableId(null); selectNode(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const renameTableMut = useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => updateTable(id, { name }), onSuccess: () => { setRenamingTableId(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const addColMut = useMutation({ mutationFn: createColumn, onSuccess: () => { setNewColName(""); setNewColType("varchar(255)"); setNewColPK(false); setNewColUnique(false); setNewColNotNull(false); setAddingColTableId(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const deleteColMut = useMutation({ mutationFn: deleteColumn, onSuccess: invalidate, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const updateColMut = useMutation({ mutationFn: ({ id, ...body }: { id: string } & Partial<CreateColumnPayload>) => updateColumn(id, body), onSuccess: () => { setRenamingColId(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const createRelMut = useMutation({ mutationFn: createRelationship, onSuccess: () => { setConnectDialog(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const deleteRelMut = useMutation({ mutationFn: deleteRelationship, onSuccess: invalidate, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const updateRelMut = useMutation({ mutationFn: ({ id, ...payload }: { id: string } & Partial<SchemaRelationship>) => updateRelationship(id, payload), onSuccess: () => { setConnectDialog(null); invalidate(); }, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const createGrpMut = useMutation({ mutationFn: createGroup, onSuccess: invalidate });
  const updateGrpMut = useMutation({ mutationFn: ({ id, ...body }: { id: string } & Partial<SchemaGroup>) => updateGroup(id, body), onSuccess: invalidate });
  const deleteGrpMut = useMutation({ mutationFn: deleteGroup, onSuccess: invalidate });
  const updateTableLayoutMut = useMutation({ mutationFn: ({ id, ...body }: { id: string; group_id?: string | null; x?: number; y?: number }) => updateTable(id, body), onError: (e) => console.error(getSchemaApiErrorMessage(e)) });
  const aiGenerateMut = useMutation({ mutationFn: generateSchemaWithAi, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const aiOptimizeMut = useMutation({ mutationFn: optimizeSchemaWithAi, onError: (e) => alert(getSchemaApiErrorMessage(e)) });
  const updateProjectMut = useMutation({
    mutationFn: ({ id, databaseType }: { id: string; databaseType: string }) => updateProject(id, { database_type: databaseType }),
    onSuccess: (project) => { setProjectDatabaseType(project.database_type); void queryClient.invalidateQueries({ queryKey: ["project-meta", projectId, username, diagramSlug] }); },
    onError: (e) => alert(getSchemaApiErrorMessage(e)),
  });

  const mutateGroup = updateGrpMut.mutate;
  const removeGroup = deleteGrpMut.mutate;
  const mutateGroupRef = useRef(mutateGroup);
  const removeGroupRef = useRef(removeGroup);
  const persistTablePositionRef = useRef<typeof persistTablePosition>(() => { /* noop until defined */ });

  const persistTablePosition = useCallback((tableId: string, payload: { group_id?: string | null; x: number; y: number }, shouldInvalidate = false) => {
    // Optimistic UI update to prevent tables from snapping back while waiting for server
    if (resolvedProjectId) {
      queryClient.setQueryData(["schema", resolvedProjectId], (current: { tables: SchemaTable[]; columns: SchemaColumn[]; relationships: SchemaRelationship[]; groups: SchemaGroup[] } | undefined) => {
        if (!current) return current;
        return { ...current, tables: current.tables.map(t => t.id === tableId ? { ...t, x: payload.x, y: payload.y, group_id: payload.group_id === undefined ? t.group_id : payload.group_id } : t) };
      });
    }

    updateTableLayoutMut.mutate({ id: tableId, ...payload }, {
      onSuccess: () => {
        if (shouldInvalidate && resolvedProjectId) void queryClient.invalidateQueries({ queryKey: ["schema", resolvedProjectId] });
      },
    });
  }, [queryClient, resolvedProjectId, updateTableLayoutMut]);

  useEffect(() => { mutateGroupRef.current = mutateGroup; }, [mutateGroup]);
  useEffect(() => { removeGroupRef.current = removeGroup; }, [removeGroup]);
  useEffect(() => { persistTablePositionRef.current = persistTablePosition; }, [persistTablePosition]);

  // ── Group callbacks ──
  const handleGroupRename = useCallback((id: string, name: string) => { mutateGroupRef.current({ id, name }); }, []);
  const handleGroupColorChange = useCallback((id: string, color: string) => { mutateGroupRef.current({ id, color }); }, []);
  const handleGroupRemove = useCallback((id: string) => {
    const gn = flowNodesRef.current.find(n => n.id === id && n.type === "groupNode");
    const children = flowNodesRef.current.filter(n => n.type === "tableNode" && n.parentNode === id);
    if (gn) {
      setPositions(c => {
        const next = { ...c };
        children.forEach(tn => {
          const abs = { x: gn.position.x + tn.position.x, y: gn.position.y + tn.position.y };
          next[tn.id] = abs;
          persistTablePositionRef.current(tn.id, { group_id: null, ...abs }, false);
        });
        return next;
      });
    }
    removeGroupRef.current(id);
  }, []);
  const handleDeleteRelationship = useCallback(async (relationshipId: string) => {
    if (!resolvedProjectId) return;
    try {
      await deleteRelMut.mutateAsync(relationshipId);
      queryClient.invalidateQueries({ queryKey: ["schema", resolvedProjectId] });
    } catch (err) {
      console.error("Failed to delete relationship:", err);
    }
  }, [deleteRelMut, queryClient, resolvedProjectId]);

  const onNodeResize = useCallback((nodeId: string, x: number, y: number, width: number, height: number) => {
    setFlowNodes(nds => nds.map(n => n.id === nodeId ? { ...n, position: { x, y }, style: { ...n.style, width, height } } : n));
  }, []);
  const handleGroupResizeStop = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    onNodeResize(id, x, y, width, height); mutateGroupRef.current({ id, x, y, width, height });
  }, [onNodeResize]);

  const handleRelationshipEditInternal = useCallback((rel: SchemaRelationship) => {
    setDialogOnDelete(rel.on_delete as "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION");
    setConnectDialog({ relationshipId: rel.id, sourceColId: rel.source_column_id, targetColId: rel.target_column_id, sourceTableId: rel.source_table_id, targetTableId: rel.target_table_id });
  }, [setConnectDialog, setDialogOnDelete]);

  const edges: Edge[] = useMemo(() => {
    const built = buildEdges(relationships, columns, isDark, handleRelationshipEditInternal);
    return built.map(e => {
      const rel = relationships.find(r => r.id === e.id);
      if (!rel) return e;
      return {
        ...e,
        data: {
          ...e.data,
          handleRemoveEdge: () => handleDeleteRelationship(rel.id)
        }
      };
    });
  }, [relationships, columns, isDark, handleDeleteRelationship, handleRelationshipEditInternal]);


  // ── Template preview ──
  const selectedTemplate = useMemo(() => TEMPLATE_SCHEMAS.find(t => t.id === selectedTemplateId) ?? null, [selectedTemplateId]);
  const templatePreviewData = useMemo(() => selectedTemplate ? buildTemplatePreviewSchema(selectedTemplate.schema) : null, [selectedTemplate]);
  const templatePreviewPositions = useMemo(() => {
    if (!templatePreviewData || !selectedTemplate) return {};
    return computeTemplatePreviewPositions(selectedTemplate, templatePreviewData, savedTemplateLayouts[selectedTemplate.id] ?? {});
  }, [savedTemplateLayouts, selectedTemplate, templatePreviewData]);
  const templatePreviewNodes = useMemo(() => templatePreviewData ? buildNodes(templatePreviewData.tables, templatePreviewData.columns, [], templatePreviewPositions, isDark) : [], [isDark, templatePreviewData, templatePreviewPositions]);
  const templatePreviewEdges = useMemo(() => templatePreviewData ? buildEdges(templatePreviewData.relationships, templatePreviewData.columns, isDark) : [], [isDark, templatePreviewData]);
  const isTemplatePreviewMode = sidebarMode === "templates" && Boolean(selectedTemplate);

  const handleTableNodeDelete = useCallback(async (tableId: string) => {
    const ok = await ensureAuth();
    if (!ok) return;
    deleteTableMut.mutate(tableId);
  }, [deleteTableMut, ensureAuth]);

  // ── Node computation ──
  const computedNodes = useMemo(() => buildNodes(
    tables,
    columns,
    groups,
    positions,
    isDark,
    handleTableNodeDelete,
    handleGroupRename,
    handleGroupColorChange,
    handleGroupRemove,
    onNodeResize,
    handleGroupResizeStop,
  ), [tables, columns, groups, positions, isDark, handleTableNodeDelete, handleGroupRename, handleGroupColorChange, handleGroupRemove, onNodeResize, handleGroupResizeStop]);

  // Synchronize nodes from schema source of truth
  useEffect(() => {
    if (isDragging.current) return;
    
    // Use a simpler approach: only re-sync on structure change or explicit layout trigger
    setFlowNodes((prev) => {
      // If initialized, only update if structural changes occurred
      const prevIds = prev.map(n => n.id).sort().join(',');
      const currIds = computedNodes.map(n => n.id).sort().join(',');
      
      if (prevIds === currIds && prev.length > 0) {
        // Just merge positions cleanly if significantly different (e.g. from Auto Layout)
        return prev.map(pn => {
          const cn = computedNodes.find(n => n.id === pn.id);
          if (!cn) return pn;
          if (Math.abs(pn.position.x - cn.position.x) > 50 || Math.abs(pn.position.y - cn.position.y) > 50) {
             return { ...cn, selected: pn.selected };
          }
          return pn;
        });
      }
      
      return computedNodes;
    });
  }, [tables, columns, groups]); // ONLY when schema data changes reference

  useEffect(() => { setPreviewFlowNodes(templatePreviewNodes); }, [templatePreviewNodes]);

  const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    setFlowNodes(nds => {
      // ── Fix: Multi-node movement ──
      const positionChanges = changes.filter(c => c.type === 'position' && c.dragging);
      if (positionChanges.length > 0) {
        const selectedIds = nds.filter(n => n.selected).map(n => n.id);
        if (selectedIds.length > 1) {
          const extraChanges: NodeChange[] = [];
          positionChanges.forEach(pc => {
            const dragNode = nds.find(n => n.id === (pc as any).id);
            if (dragNode?.selected && (pc as any).positionDelta) {
              const delta = (pc as any).positionDelta;
              selectedIds.forEach(id => {
                if (id !== dragNode.id && !changes.some(c => (c as any).id === id)) {
                  const targetNode = nds.find(n => n.id === id);
                  if (targetNode) {
                    extraChanges.push({
                      id,
                      type: 'position',
                      dragging: true,
                      position: {
                        x: targetNode.position.x + delta.x,
                        y: targetNode.position.y + delta.y
                      }
                    });
                  }
                }
              });
            }
          });
          changes = [...changes, ...extraChanges];
        }
      }

      const updated = applyNodeChanges(changes, nds);
      return updated.map(n => {
        if (n.parentNode && !updated.some(p => p.id === n.parentNode)) {
          return { ...n, parentNode: undefined };
        }
        if (n.type !== "groupNode") return n;
        const orig = nds.find(o => o.id === n.id);
        if (!orig) return n;
        return { ...n, style: { ...orig.style, ...n.style } };
      });
    });
  }, []);
  const onPreviewNodesChange: OnNodesChange = useCallback((changes) => setPreviewFlowNodes(ns => applyNodeChanges(changes, ns)), []);
  const onSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
    const tableId = sel.find(n => n.type === "tableNode")?.id ?? null;
    
    // Guard: Only update if the selection collection OR the primary selected table changed
    if (tableId !== selectedNodeIdRef.current || sel.length !== selectedNodes.length) {
      setSelectedNodes(sel);
      if (tableId !== selectedNodeIdRef.current) {
        selectNode(tableId);
        if (tableId) {
          setSidebarMode("schema");
          setExpandedTableId(tableId);
        }
      }
    }
  }, [selectNode, setSelectedNodes, setSidebarMode, setExpandedTableId, selectedNodes.length]);

  const canvasNodes = isTemplatePreviewMode ? previewFlowNodes : flowNodes;

  useEffect(() => {
    if (!reactFlowInstance || canvasNodes.length === 0 || hasFitView) return;
    const t = setTimeout(() => { reactFlowInstance.fitView({ padding: 0.2, duration: 600 }); setHasFitView(true); }, 150);
    return () => clearTimeout(t);
  }, [canvasNodes.length, hasFitView, reactFlowInstance]);
  useEffect(() => { setHasFitView(false); }, [isTemplatePreviewMode, selectedTemplateId]);

  // ── Focus / drag helpers ──
  const getAbsoluteNodePosition = useCallback((node: Node) => {
    if (!node.parentNode) return node.position;
    const p = flowNodes.find(c => c.id === node.parentNode);
    return p ? { x: p.position.x + node.position.x, y: p.position.y + node.position.y } : node.position;
  }, [flowNodes]);

  const findContainingGroup = useCallback((node: Node, abs: { x: number; y: number }) => {
    const nw = node.width ?? 320; const nh = node.height ?? 180;
    return flowNodes.filter(n => n.type === "groupNode").filter(gn => {
      const w = Number(gn.style?.width ?? gn.width ?? 0); const h = Number(gn.style?.height ?? gn.height ?? 0);
      return abs.x + nw / 2 >= gn.position.x && abs.x + nw / 2 <= gn.position.x + w && abs.y + nh / 2 >= gn.position.y && abs.y + nh / 2 <= gn.position.y + h;
    }).sort((a, b) => Number(a.style?.width ?? 0) * Number(a.style?.height ?? 0) - Number(b.style?.width ?? 0) * Number(b.style?.height ?? 0))[0] ?? null;
  }, [flowNodes]);

  const focusTable = useCallback((tableId: string) => {
    const node = flowNodes.find(n => n.id === tableId);
    if (!node || !reactFlowInstance) return;
    const abs = getAbsoluteNodePosition(node);
    reactFlowInstance.setCenter(abs.x + (node.width ?? 320) / 2, abs.y + (node.height ?? 180) / 2, { zoom: 1.0, duration: 400 });
    selectNode(tableId);
  }, [flowNodes, reactFlowInstance, selectNode, getAbsoluteNodePosition]);

  const onNodeDragStart = useCallback((_e: unknown, node: Node) => {
    isDragging.current = true;
    const selectedIds = flowNodesRef.current.filter((n) => n.selected).map((n) => n.id);
    dragSelectionRef.current = selectedIds.includes(node.id) ? selectedIds : [node.id];
  }, []);
  const onNodeDragStop = useCallback((_e: unknown, node: Node) => {
    isDragging.current = false;
    const trackedIds = dragSelectionRef.current.length > 0 ? dragSelectionRef.current : [node.id];
    dragSelectionRef.current = [];
    const currentNodes = flowNodesRef.current;
    const trackedNodes = trackedIds
      .map((id) => currentNodes.find((n) => n.id === id))
      .filter((n): n is Node => Boolean(n));

    const movedGroupIds = new Set(trackedNodes.filter((n) => n.type === "groupNode").map((n) => n.id));

    trackedNodes.forEach((trackedNode) => {
      if (trackedNode.type === "groupNode") {
        mutateGroup({ id: trackedNode.id, x: trackedNode.position.x, y: trackedNode.position.y });
        return;
      }

      if (trackedNode.parentNode && movedGroupIds.has(trackedNode.parentNode)) return;

      const abs = getAbsoluteNodePosition(trackedNode);
      const containing = findContainingGroup(trackedNode, abs);
      const nextGroupId = containing?.id ?? null;
      const currentGroupId = trackedNode.parentNode ?? tables.find(t => t.id === trackedNode.id)?.group_id ?? null;

      if (containing) {
        const rel = { x: abs.x - containing.position.x, y: abs.y - containing.position.y };
        setPositions(c => ({ ...c, [trackedNode.id]: rel }));
        persistTablePosition(trackedNode.id, { group_id: nextGroupId, ...rel }, currentGroupId !== nextGroupId);
        return;
      }

      setPositions(c => ({ ...c, [trackedNode.id]: abs }));
      persistTablePosition(trackedNode.id, { group_id: null, ...abs }, currentGroupId !== null);
    });
  }, [findContainingGroup, getAbsoluteNodePosition, mutateGroup, persistTablePosition, tables]);

  // ── Action handlers ──
  const handleCreateTable = useCallback(async (e: FormEvent) => {
    e.preventDefault(); if (!tableName.trim() || !resolvedProjectId) return;
    const ok = await ensureAuth(); if (!ok) return;
    await createTableMut.mutateAsync({ name: tableName.trim(), project_id: resolvedProjectId });
  }, [createTableMut, ensureAuth, resolvedProjectId, tableName]);

  const handleDeleteTable = useCallback(async (tableId: string) => { const ok = await ensureAuth(); if (!ok) return; deleteTableMut.mutate(tableId); }, [deleteTableMut, ensureAuth]);
  const handleRenameTable = useCallback(async (tableId: string) => { if (!renameTableValue.trim()) { setRenamingTableId(null); return; } const ok = await ensureAuth(); if (!ok) return; renameTableMut.mutate({ id: tableId, name: renameTableValue.trim() }); }, [ensureAuth, renameTableMut, renameTableValue, setRenamingTableId]);
  const handleAddColumn = useCallback(async (tableId: string) => { if (!newColName.trim()) return; const ok = await ensureAuth(); if (!ok) return; addColMut.mutate({ name: newColName.trim(), data_type: newColType, table_id: tableId, is_primary: newColPK, is_unique: newColUnique, is_nullable: !newColNotNull }); }, [addColMut, ensureAuth, newColName, newColNotNull, newColPK, newColType, newColUnique]);
  const handleDeleteColumn = useCallback(async (colId: string) => { const ok = await ensureAuth(); if (!ok) return; deleteColMut.mutate(colId); }, [deleteColMut, ensureAuth]);
  const handleRenameColumn = useCallback(async (colId: string) => { if (!renameColValue.trim()) { setRenamingColId(null); return; } const ok = await ensureAuth(); if (!ok) return; updateColMut.mutate({ id: colId, name: renameColValue.trim() }); }, [ensureAuth, updateColMut, renameColValue, setRenamingColId]);
  const handleToggleColumnProp = useCallback(async (col: SchemaColumn, prop: "is_primary" | "is_unique" | "is_nullable") => { const ok = await ensureAuth(); if (!ok) return; updateColMut.mutate({ id: col.id, [prop]: !col[prop] }); }, [ensureAuth, updateColMut]);
  const handleChangeColumnType = useCallback(async (colId: string, type: string) => { const ok = await ensureAuth(); if (!ok) return; updateColMut.mutate({ id: colId, data_type: type }); }, [ensureAuth, updateColMut]);
  const handleDeleteRel = useCallback(async (relId: string) => { const ok = await ensureAuth(); if (!ok) return; deleteRelMut.mutate(relId); }, [deleteRelMut, ensureAuth]);
  const handleDeleteGroup = useCallback(async (groupId: string) => { const ok = await ensureAuth(); if (!ok) return; handleGroupRemove(groupId); selectNode(null); setSelectedNodes([]); }, [ensureAuth, handleGroupRemove, selectNode, setSelectedNodes]);
  const handleDatabaseTypeChange = useCallback(async (nextType: string) => { if (!resolvedProjectId) return; const ok = await ensureAuth(); if (!ok) return; updateProjectMut.mutate({ id: resolvedProjectId, databaseType: nextType }); }, [ensureAuth, resolvedProjectId, updateProjectMut]);

  const onConnect = useCallback(async (connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (!source || !target || !sourceHandle || !targetHandle) return;
    setDialogCardinality("one-to-many"); setDialogOnDelete("CASCADE");
    setConnectDialog({ connection, sourceColId: sourceHandle.replace(/-right$/, ""), targetColId: targetHandle.replace(/-left$/, ""), sourceTableId: source, targetTableId: target });
  }, [setConnectDialog, setDialogCardinality, setDialogOnDelete]);

  const confirmRelationship = useCallback(async () => {
    if (!connectDialog) return;
    const ok = await ensureAuth(); if (!ok) return;
    if (connectDialog.relationshipId) {
      updateRelMut.mutate({ id: connectDialog.relationshipId, on_delete: dialogOnDelete });
    } else {
      createRelMut.mutate({ source_table_id: connectDialog.sourceTableId, source_column_id: connectDialog.sourceColId, target_table_id: connectDialog.targetTableId, target_column_id: connectDialog.targetColId, on_delete: dialogOnDelete, on_update: "CASCADE" });
    }
  }, [connectDialog, createRelMut, updateRelMut, dialogOnDelete, ensureAuth]);

  const handleFitView = useCallback(() => { if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 500 }); }, [reactFlowInstance]);
  
  const handleAutoArrange = useCallback(() => {
    if (isTemplatePreviewMode && templatePreviewData) {
      const np = autoLayoutPositions(templatePreviewData.tables, templatePreviewData.relationships);
      setPreviewFlowNodes(ns => ns.map(n => n.type === "tableNode" && np[n.id] ? { ...n, position: np[n.id] } : n));
      setHasFitView(false); return;
    }
    const np = autoLayoutPositions(tables, relationships, positions);
    setPositions(c => ({ ...c, ...np }));
    tables.forEach(t => { if (!np[t.id] || t.group_id) return; persistTablePosition(t.id, { x: np[t.id].x, y: np[t.id].y }, false); });
    setHasFitView(false);
  }, [isTemplatePreviewMode, persistTablePosition, positions, relationships, tables, templatePreviewData]);

  const applyImportedSchema = useCallback(async (schema: { summary?: string; tables: { name: string; columns: { name: string; data_type: string; is_nullable?: boolean; is_primary?: boolean; is_unique?: boolean; default_value?: string | null }[] }[]; relationships: { sourceTable: string; sourceColumn: string; targetTable: string; targetColumn: string; on_delete?: string; on_update?: string }[] }) => {
    if (!resolvedProjectId) return;
    const ok = await ensureAuth(); if (!ok) return;
    const token = await getToken(); setAuthToken(token);
    const createdTables = new Map<string, string>(); const createdColumns = new Map<string, string>();
    for (const table of schema.tables) {
      const ct = await createTable({ name: table.name.trim(), project_id: resolvedProjectId }); createdTables.set(table.name, ct.id);
      for (let i = 0; i < table.columns.length; i++) {
        const col = table.columns[i];
        const cc = await createColumn({ name: col.name.trim(), data_type: col.data_type.trim(), table_id: ct.id, is_nullable: col.is_nullable ?? true, is_primary: col.is_primary ?? false, is_unique: col.is_unique ?? false, default_value: col.default_value ?? undefined, position: i });
        createdColumns.set(`${table.name}.${col.name}`, cc.id);
      }
    }
    for (const rel of schema.relationships) {
      const sti = createdTables.get(rel.sourceTable); const tti = createdTables.get(rel.targetTable);
      const sci = createdColumns.get(`${rel.sourceTable}.${rel.sourceColumn}`); const tci = createdColumns.get(`${rel.targetTable}.${rel.targetColumn}`);
      if (!sti || !tti || !sci || !tci) continue;
      await createRelationship({ source_table_id: sti, source_column_id: sci, target_table_id: tti, target_column_id: tci, on_delete: rel.on_delete ?? "CASCADE", on_update: rel.on_update ?? "CASCADE" });
    }
    await queryClient.invalidateQueries({ queryKey: ["schema", resolvedProjectId] });
    setAiSummary(schema.summary ?? "Schema imported successfully.");
  }, [ensureAuth, getToken, queryClient, resolvedProjectId, setAiSummary]);

  const handleApplyTemplate = useCallback(async (templateId: string) => {
    const t = TEMPLATE_SCHEMAS.find(i => i.id === templateId); if (!t) return;
    await applyImportedSchema(t.schema); setSelectedTemplateId(null); setSidebarMode("schema");
  }, [applyImportedSchema, setSelectedTemplateId, setSidebarMode]);

  const handleImportSql = useCallback(async () => {
    const parsed = parseSqlDump(sqlImport);
    if (parsed.tables.length === 0) { alert("No CREATE TABLE statements were found in the SQL import."); return; }
    await applyImportedSchema(parsed); setSqlImport("");
  }, [applyImportedSchema, sqlImport, setSqlImport]);

  const handleImportSqlFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const text = await file.text(); setSqlImport(text); event.target.value = "";
  }, [setSqlImport]);

  const handleGenerateWithAi = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    const result = await aiGenerateMut.mutateAsync({ prompt: aiPrompt, databaseType: projectDatabaseType, projectId: resolvedProjectId || undefined });
    const schema = { summary: result.result.summary, tables: result.result.tables ?? [], relationships: result.result.relationships ?? [] };
    setAiSummary(result.result.summary ?? "AI schema prepared.");
    await applyImportedSchema(schema);
  }, [aiGenerateMut, aiPrompt, applyImportedSchema, projectDatabaseType, resolvedProjectId, setAiSummary]);

  const handleOptimizeWithAi = useCallback(async () => {
    if (!resolvedProjectId) return;
    const result = await aiOptimizeMut.mutateAsync(resolvedProjectId);
    setAiSummary(result.result.summary ?? "Optimization suggestions ready.");
    setAiSuggestions(result.result.suggestions ?? []);
  }, [aiOptimizeMut, resolvedProjectId, setAiSuggestions, setAiSummary]);

  const handleCancelAi = useCallback(() => {
    aiGenerateMut.reset();
    aiOptimizeMut.reset();
  }, [aiGenerateMut, aiOptimizeMut]);

  const handleSaveTemplateLayout = useCallback(() => {
    if (!selectedTemplate || previewFlowNodes.length === 0 || !templatePreviewData) return;
    const nameById = new Map(templatePreviewData.tables.map(t => [t.id, t.name]));
    const layout = previewFlowNodes.reduce<TemplatePreviewLayout>((acc, n) => {
      if (n.type !== "tableNode") return acc;
      const tn = nameById.get(n.id); if (!tn) return acc;
      acc[tn] = { x: n.position.x, y: n.position.y }; return acc;
    }, {});
    saveTemplatePreviewLayout(selectedTemplate.id, layout);
    setSavedTemplateLayouts(c => ({ ...c, [selectedTemplate.id]: layout }));
  }, [previewFlowNodes, selectedTemplate, templatePreviewData]);

  const handleCopyCode = useCallback(async () => { if (exportCodeQuery.data?.code) await navigator.clipboard.writeText(exportCodeQuery.data.code); }, [exportCodeQuery.data?.code]);
  const handleDownloadCode = useCallback(() => { if (exportCodeQuery.data) downloadTextFile(exportCodeQuery.data.filename, exportCodeQuery.data.code); }, [exportCodeQuery.data]);
  const handleExportDiagram = useCallback(async (type: "png" | "svg") => {
    const el = document.querySelector(".react-flow") as HTMLElement | null;
    if (!el || !resolvedProjectId) return;
    const url = type === "png" ? await toPng(el, { cacheBust: true, pixelRatio: 2, backgroundColor: isDark ? "#020617" : "#f8fafc" }) : await toSvg(el, { cacheBust: true, backgroundColor: isDark ? "#020617" : "#f8fafc" });
    const link = document.createElement("a"); link.href = url; link.download = `${resolvedProjectId}-diagram.${type}`; link.click();
  }, [isDark, resolvedProjectId]);

  const selectedCanvasNode = useMemo(() => selectedNodes[0] ?? null, [selectedNodes]);
  const canWrapSelectedTables = useMemo(() => {
    const tns = selectedNodes.filter(n => n.type === "tableNode");
    return tns.length > 0 && tns.every(n => !tables.find(t => t.id === n.id)?.group_id);
  }, [selectedNodes, tables]);

  const handleDeleteSelectedNode = useCallback(async () => {
    if (!selectedCanvasNode) return;
    if (selectedCanvasNode.type === "tableNode") { await handleDeleteTable(selectedCanvasNode.id); return; }
    if (selectedCanvasNode.type === "groupNode") { await handleDeleteGroup(selectedCanvasNode.id); }
  }, [handleDeleteGroup, handleDeleteTable, selectedCanvasNode]);

  const handleCreateGroup = useCallback(async () => {
    if (!resolvedProjectId) return;
    const tableNodes = selectedNodes.filter(n => n.type === "tableNode");
    const ok = await ensureAuth(); if (!ok) return;
    if (tableNodes.length === 0) {
      const pos = reactFlowInstance ? reactFlowInstance.screenToFlowPosition({ x: window.innerWidth / 2 - 220, y: window.innerHeight / 2 - 120 }) : { x: 180, y: 140 };
      const group = await createGrpMut.mutateAsync({ name: "Comment Box", color: "#6366f11a", x: pos.x, y: pos.y, width: 440, height: 240, project_id: resolvedProjectId });
      queryClient.setQueryData(["schema", resolvedProjectId], (current: any) => {
        if (!current) return current;
        return { ...current, groups: [...current.groups, group] };
      });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    tableNodes.forEach(n => {
      let ax = n.position.x, ay = n.position.y;
      if (n.parentNode) { const p = flowNodes.find(pn => pn.id === n.parentNode); if (p) { ax += p.position.x; ay += p.position.y; } }
      minX = Math.min(minX, ax); minY = Math.min(minY, ay); maxX = Math.max(maxX, ax + (n.width ?? 320)); maxY = Math.max(maxY, ay + (n.height ?? 180));
    });
    const pad = 60; const gx = minX - pad; const gy = minY - pad;
    setPositions(prev => {
      const next = { ...prev };
      tableNodes.forEach(n => {
        let ax = n.position.x, ay = n.position.y;
        if (n.parentNode) { const p = flowNodes.find(pn => pn.id === n.parentNode); if (p) { ax += p.position.x; ay += p.position.y; } }
        next[n.id] = { x: ax - gx, y: ay - gy };
      });
      return next;
    });
    const group = await createGrpMut.mutateAsync({ name: "Comment Box", color: "#6366f11a", x: gx, y: gy, width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2, project_id: resolvedProjectId, table_ids: tableNodes.map(n => n.id) });

    // Optimistically insert group into cache to prevent React Flow crash when tables lookup parentNode
    queryClient.setQueryData(["schema", resolvedProjectId], (current: any) => {
      if (!current) return current;
      return { ...current, groups: [...current.groups, group] };
    });

    tableNodes.forEach(n => {
      let ax = n.position.x, ay = n.position.y;
      if (n.parentNode) { const p = flowNodes.find(pn => pn.id === n.parentNode); if (p) { ax += p.position.x; ay += p.position.y; } }
      persistTablePosition(n.id, { group_id: group.id, x: ax - gx, y: ay - gy }, false);
    });
  }, [createGrpMut, ensureAuth, flowNodes, persistTablePosition, reactFlowInstance, resolvedProjectId, selectedNodes, queryClient]);

  const handleCanvasContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (isTemplatePreviewMode) return; event.preventDefault(); setCanvasContextMenu({ x: event.clientX, y: event.clientY });
  }, [isTemplatePreviewMode, setCanvasContextMenu]);

  useEffect(() => {
    if (!canvasContextMenu) return;
    const close = () => setCanvasContextMenu(null);
    window.addEventListener("pointerdown", close); window.addEventListener("blur", close);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("blur", close); };
  }, [canvasContextMenu, setCanvasContextMenu]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && ["INPUT", "TEXTAREA"].includes(target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); (document.getElementById("schema-search") as HTMLInputElement | null)?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); handleFitView(); }
      if (isTyping) return;
      if (e.key.toLowerCase() === "t") { e.preventDefault(); (document.getElementById("new-table-input") as HTMLInputElement | null)?.focus(); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedCanvasNode) { e.preventDefault(); void handleDeleteSelectedNode(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDeleteSelectedNode, handleFitView, selectedCanvasNode]);

  const onRcPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 2 && !isTemplatePreviewMode) {
      const rect = e.currentTarget.getBoundingClientRect();
      setRcRect({ startX: e.clientX - rect.left, startY: e.clientY - rect.top, currX: e.clientX - rect.left, currY: e.clientY - rect.top });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, [isTemplatePreviewMode]);

  const onRcPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (rcRect) {
      const rect = e.currentTarget.getBoundingClientRect();
      setRcRect({ ...rcRect, currX: e.clientX - rect.left, currY: e.clientY - rect.top });
    }
  }, [rcRect]);

  const onRcPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (rcRect && reactFlowInstance) {
      const rx = Math.min(rcRect.startX, rcRect.currX);
      const ry = Math.min(rcRect.startY, rcRect.currY);
      const rw = Math.max(rcRect.startX, rcRect.currX) - rx;
      const rh = Math.max(rcRect.startY, rcRect.currY) - ry;

      if (rw > 5 || rh > 5) {
        const rect = e.currentTarget.getBoundingClientRect();
        const tl = reactFlowInstance.screenToFlowPosition({ x: rx + rect.left, y: ry + rect.top });
        const br = reactFlowInstance.screenToFlowPosition({ x: rx + rw + rect.left, y: ry + rh + rect.top });

        const selNodes: Node[] = [];
        flowNodesRef.current.forEach(node => {
          if (node.type !== "tableNode" && node.type !== "groupNode") return;
          let ax = node.position.x; let ay = node.position.y;
          if (node.parentNode) {
            const p = flowNodesRef.current.find(pn => pn.id === node.parentNode);
            if (p) { ax += p.position.x; ay += p.position.y; }
          }
          const w = node.width ?? 320;
          const h = node.height ?? 180;
          if (!(ax + w < tl.x || ax > br.x || ay + h < tl.y || ay > br.y)) {
            selNodes.push(node);
          }
        });

        if (selNodes.length > 0) {
          setFlowNodes(nds => nds.map(n => ({ ...n, selected: selNodes.some(sn => sn.id === n.id) })));
          setSelectedNodes(selNodes);
          const first = selNodes.find(n => n.type === "tableNode")?.id ?? null;
          selectNode(first);
        }
      }
      setRcRect(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, [rcRect, reactFlowInstance, setSelectedNodes, selectNode]);

  return (
    <div className="h-full w-full relative">
      {connectDialog && (
        <ConnectDialog
          isDark={isDark}
          connectDialog={connectDialog}
          columns={columns}
          dialogCardinality={dialogCardinality}
          setDialogCardinality={setDialogCardinality}
          dialogOnDelete={dialogOnDelete}
          setDialogOnDelete={setDialogOnDelete}
          onConfirm={() => void confirmRelationship()}
          onCancel={() => setConnectDialog(null)}
          isProcessing={createRelMut.isPending || updateRelMut.isPending}
        />
      )}

      <div className={`grid h-full grid-cols-1 ${isCodeDrawerOpen || isAiDrawerOpen ? "xl:grid-cols-[400px_minmax(0,1fr)_420px]" : "xl:grid-cols-[400px_minmax(0,1fr)]"}`}>

        <EditorSidebar
          isDark={isDark}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          projectDatabaseType={projectDatabaseType} handleDatabaseTypeChange={handleDatabaseTypeChange}
          tableName={tableName} setTableName={setTableName} handleCreateTable={handleCreateTable}
          sidebarMode={sidebarMode} setSidebarMode={setSidebarMode}
          tables={tables} relationships={relationships} columns={columns}
          filteredTables={filteredTables} filteredRelationships={filteredRelationships}
          expandedTableId={expandedTableId} setExpandedTableId={setExpandedTableId} focusTable={focusTable}
          renamingTableId={renamingTableId} setRenamingTableId={setRenamingTableId}
          renameTableValue={renameTableValue} setRenameTableValue={setRenameTableValue} handleRenameTable={handleRenameTable}
          handleDeleteTable={handleDeleteTable}
          addingColTableId={addingColTableId} setAddingColTableId={setAddingColTableId}
          newColName={newColName} setNewColName={setNewColName}
          newColType={newColType} setNewColType={setNewColType}
          newColPK={newColPK} setNewColPK={setNewColPK}
          newColUnique={newColUnique} setNewColUnique={setNewColUnique}
          newColNotNull={newColNotNull} setNewColNotNull={setNewColNotNull}
          handleAddColumn={handleAddColumn} addColIsPending={addColMut.isPending}
          activeColId={activeColId} setActiveColId={setActiveColId}
          renamingColId={renamingColId} setRenamingColId={setRenamingColId}
          renameColValue={renameColValue} setRenameColValue={setRenameColValue}
          handleRenameColumn={handleRenameColumn} handleDeleteColumn={handleDeleteColumn}
          handleChangeColumnType={handleChangeColumnType} handleToggleColumnProp={handleToggleColumnProp}
          handleDeleteRel={handleDeleteRel}
          selectedTemplateId={selectedTemplateId} setSelectedTemplateId={setSelectedTemplateId}
          handleApplyTemplate={handleApplyTemplate} handleSaveTemplateLayout={handleSaveTemplateLayout}
          sqlImport={sqlImport} setSqlImport={setSqlImport}
          handleImportSql={handleImportSql} handleImportSqlFile={handleImportSqlFile}
        />

        {/* Canvas */}
        <section className="relative flex flex-col h-full overflow-hidden">
          <div className={`flex shrink-0 items-center justify-between border-b px-5 py-3 ${isDark ? "border-[#1e293b] bg-[#0f172a]" : "border-slate-200 bg-white"}`}>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-400">Nebula Canvas</p>
              <p className={`text-[12px] font-semibold tracking-[-0.01em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Drag tables · drag column dots to connect</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* AI Temporarily Disabled 
              <button onClick={() => { setIsAiDrawerOpen(true); setIsCodeDrawerOpen(false); }} className={`rounded-lg border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] ${isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>Ask AI</button>
              */}
              <button onClick={() => { setIsCodeDrawerOpen(true); setIsAiDrawerOpen(false); }} className={`rounded-lg border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] ${isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>View Code</button>
              <button onClick={handleFitView} className={`rounded-lg border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] ${isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>Fit View</button>
              <button onClick={() => void handleExportDiagram("png")} className={`rounded-lg border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] ${isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>PNG</button>
              <span className={`rounded-lg border px-3 py-1 text-[11px] font-extrabold ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{Math.round(viewportZoom * 100)}%</span>
            </div>
          </div>
          <div className="relative flex-1 min-h-0"
            onContextMenu={handleCanvasContextMenu}
            onPointerDown={onRcPointerDown}
            onPointerMove={onRcPointerMove}
            onPointerUp={onRcPointerUp}
          >
            {rcRect && (
              <div
                className="pointer-events-none absolute z-[100] border-2 border-indigo-400 bg-indigo-500/20 shadow-sm"
                style={{
                  left: Math.min(rcRect.startX, rcRect.currX),
                  top: Math.min(rcRect.startY, rcRect.currY),
                  width: Math.max(rcRect.startX, rcRect.currX) - Math.min(rcRect.startX, rcRect.currX),
                  height: Math.max(rcRect.startY, rcRect.currY) - Math.min(rcRect.startY, rcRect.currY),
                }}
              />
            )}
            {/* Template action buttons moved to Sidebar cards */}

            <div className="pointer-events-none absolute bottom-5 left-16 ml-3 z-20">
              <button onClick={handleAutoArrange} className={`pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold tracking-wide shadow-sm transition hover:bg-slate-50 active:scale-95 ${isDark ? "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" : "border border-slate-200 bg-white text-slate-700"}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                Auto Arrange
              </button>
            </div>

            <ReactFlow
              onInit={setReactFlowInstance}
              onMove={(_e, vp) => { if (!Number.isNaN(vp.zoom)) setViewportZoom(vp.zoom); }}
              nodes={canvasNodes} edges={isTemplatePreviewMode ? templatePreviewEdges : edges}
              nodeTypes={STATIC_NODE_TYPES} edgeTypes={STATIC_EDGE_TYPES}
              onNodesChange={isTemplatePreviewMode ? onPreviewNodesChange : onNodesChange}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={isTemplatePreviewMode ? () => { isDragging.current = false; } : onNodeDragStop}
              onEdgesChange={undefined}
              onSelectionChange={isTemplatePreviewMode ? undefined : onSelectionChange}
              onConnect={isTemplatePreviewMode ? undefined : onConnect}
              fitView={!hasFitView}
              fitViewOptions={{ padding: 0.2 }}
              snapToGrid snapGrid={[20, 20]}
              panOnDrag={[0, 1]} selectionOnDrag={true}
              selectionMode={SelectionMode.Partial} nodesDraggable nodesConnectable={!isTemplatePreviewMode}
              elementsSelectable onlyRenderVisibleElements minZoom={0.05} maxZoom={4}
              defaultViewport={{ x: 80, y: 80, zoom: 0.9 }}
              connectionLineStyle={{ stroke: "#818cf8", strokeWidth: 2 }}
              connectionLineType={"smoothstep" as never}
            >
              {/* Miro-style professional grid layout */}
              <Background id="grid-dots" variant={BackgroundVariant.Dots} gap={20} size={1} color={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.7)"} />
              <Background id="grid-lines" variant={BackgroundVariant.Lines} gap={160} size={1} color={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"} />
              <Controls showZoom showFitView showInteractive={false} className={`border-none shadow-2xl ${isDark ? "bg-slate-900 fill-white" : "bg-white"}`} />
            </ReactFlow>

            {canWrapSelectedTables && !isTemplatePreviewMode && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
                <button
                  onClick={() => { void handleCreateGroup(); setCanvasContextMenu(null); }}
                  className={`pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-extrabold shadow-2xl transition hover:scale-105 active:scale-95 ${isDark ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/50" : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/30"}`}
                >
                  <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h10M7 16h10" />
                  </svg>
                  Add Comment Box
                </button>
              </div>
            )}

            {/* AI FEATURE TEMPORARILY DISABLED 
            {!isAiDrawerOpen && !isTemplatePreviewMode && (
              <button onClick={() => { setIsAiDrawerOpen(true); setIsCodeDrawerOpen(false); }}
                className={`absolute right-6 bottom-6 z-20 flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl transition hover:scale-105 active:scale-95 ${isDark ? "border-slate-700 bg-slate-900 text-emerald-300" : "border-slate-200 bg-white text-emerald-600"}`}
                title="Open assistant"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-7 6 1.8-3.6A8 8 0 114 16.9V20z" /></svg>
              </button>
            )}
            */}
          </div>
        </section>

        {(isCodeDrawerOpen || isAiDrawerOpen) && (
          <RightDrawer
            isDark={isDark}
            isCodeDrawerOpen={isCodeDrawerOpen} isAiDrawerOpen={isAiDrawerOpen}
            onClose={() => { setIsAiDrawerOpen(false); setIsCodeDrawerOpen(false); }}
            selectedExportFormat={selectedExportFormat} setSelectedExportFormat={setSelectedExportFormat}
            exportCode={exportCodeQuery.data?.code} exportLanguage={exportCodeQuery.data?.language}
            isExportLoading={exportCodeQuery.isLoading}
            onRefreshCode={() => void exportCodeQuery.refetch()}
            onCopyCode={() => void handleCopyCode()} onDownloadCode={handleDownloadCode}
            aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
            onGenerateWithAi={() => void handleGenerateWithAi()} onOptimizeWithAi={() => void handleOptimizeWithAi()}
            onCancelAi={handleCancelAi}
            aiGenerating={aiGenerateMut.isPending} aiOptimizing={aiOptimizeMut.isPending}
            aiSummary={aiSummary} aiSuggestions={aiSuggestions}
          />
        )}
      </div>
    </div>
  );
}
