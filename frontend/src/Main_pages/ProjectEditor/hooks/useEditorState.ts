import { useState } from "react";
import type { Node } from "reactflow";
import type { ExportFormat } from "../../../features/schema/api";

export type SidebarMode = "schema" | "relationships" | "templates" | "import";
export type ConnectDialogState = {
  connection?: unknown;
  sourceColId: string;
  targetColId: string;
  sourceTableId: string;
  targetTableId: string;
  relationshipId?: string;
};

export function useEditorState() {
  const [tableName, setTableName] = useState("");
  const [viewportZoom, setViewportZoom] = useState(0.9);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("schema");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>("postgresql");
  const [sqlImport, setSqlImport] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; priority: "high" | "medium" | "low"; reason: string; action: string }>>([]);
  const [projectDatabaseType, setProjectDatabaseType] = useState<string>("postgresql");
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number } | null>(null);
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
  // relationship dialog
  const [connectDialog, setConnectDialog] = useState<ConnectDialogState | null>(null);
  const [dialogCardinality, setDialogCardinality] = useState<"one-to-one" | "one-to-many" | "many-to-many">("one-to-many");
  const [dialogOnDelete, setDialogOnDelete] = useState<"CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION">("CASCADE");

  return {
    tableName, setTableName,
    viewportZoom, setViewportZoom,
    sidebarMode, setSidebarMode,
    selectedTemplateId, setSelectedTemplateId,
    searchQuery, setSearchQuery,
    isCodeDrawerOpen, setIsCodeDrawerOpen,
    isAiDrawerOpen, setIsAiDrawerOpen,
    selectedExportFormat, setSelectedExportFormat,
    sqlImport, setSqlImport,
    aiPrompt, setAiPrompt,
    aiSummary, setAiSummary,
    aiSuggestions, setAiSuggestions,
    projectDatabaseType, setProjectDatabaseType,
    canvasContextMenu, setCanvasContextMenu,
    selectedNodes, setSelectedNodes,
    expandedTableId, setExpandedTableId,
    renamingTableId, setRenamingTableId,
    renameTableValue, setRenameTableValue,
    addingColTableId, setAddingColTableId,
    newColName, setNewColName,
    newColType, setNewColType,
    newColPK, setNewColPK,
    newColUnique, setNewColUnique,
    newColNotNull, setNewColNotNull,
    activeColId, setActiveColId,
    renamingColId, setRenamingColId,
    renameColValue, setRenameColValue,
    connectDialog, setConnectDialog,
    dialogCardinality, setDialogCardinality,
    dialogOnDelete, setDialogOnDelete,
  };
}
