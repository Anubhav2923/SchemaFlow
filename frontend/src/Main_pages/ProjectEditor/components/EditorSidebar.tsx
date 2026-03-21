import type { FormEvent, ChangeEvent } from "react";
import { PlusIcon } from "./Icons";
import { SchemaPanel } from "./SchemaPanel";
import { RelationshipsPanel } from "./RelationshipsPanel";
import { TemplatesPanel } from "./TemplatesPanel";
import { ImportPanel } from "./ImportPanel";
import { DATABASE_OPTIONS } from "../constants";
import type { SchemaColumn, SchemaTable, SchemaRelationship } from "../../../features/schema/api";

type SidebarMode = "schema" | "relationships" | "templates" | "import";

interface EditorSidebarProps {
  isDark: boolean;
  // header bar
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  projectDatabaseType: string;
  handleDatabaseTypeChange: (type: string) => void;
  tableName: string;
  setTableName: (v: string) => void;
  handleCreateTable: (e: FormEvent) => void;
  // tab mode
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  tables: SchemaTable[];
  relationships: SchemaRelationship[];
  columns: SchemaColumn[];
  // schema panel props
  filteredTables: SchemaTable[];
  filteredRelationships: SchemaRelationship[];
  expandedTableId: string | null;
  setExpandedTableId: (id: string | null) => void;
  focusTable: (id: string) => void;
  renamingTableId: string | null;
  setRenamingTableId: (id: string | null) => void;
  renameTableValue: string;
  setRenameTableValue: (v: string) => void;
  handleRenameTable: (id: string) => void;
  handleDeleteTable: (id: string) => void;
  addingColTableId: string | null;
  setAddingColTableId: (id: string | null) => void;
  newColName: string;
  setNewColName: (v: string) => void;
  newColType: string;
  setNewColType: (v: string) => void;
  newColPK: boolean;
  setNewColPK: (v: boolean) => void;
  newColUnique: boolean;
  setNewColUnique: (v: boolean) => void;
  newColNotNull: boolean;
  setNewColNotNull: (v: boolean) => void;
  handleAddColumn: (tableId: string) => void;
  addColIsPending: boolean;
  activeColId: string | null;
  setActiveColId: (id: string | null) => void;
  renamingColId: string | null;
  setRenamingColId: (id: string | null) => void;
  renameColValue: string;
  setRenameColValue: (v: string) => void;
  handleRenameColumn: (id: string) => void;
  handleDeleteColumn: (id: string) => void;
  handleChangeColumnType: (colId: string, type: string) => void;
  handleToggleColumnProp: (col: SchemaColumn, prop: "is_primary" | "is_unique" | "is_nullable") => void;
  handleDeleteRel: (id: string) => void;
  // templates
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  // import
  sqlImport: string;
  setSqlImport: (v: string) => void;
  handleImportSql: () => void;
  handleImportSqlFile: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function EditorSidebar({
  isDark, searchQuery, setSearchQuery, projectDatabaseType, handleDatabaseTypeChange,
  tableName, setTableName, handleCreateTable,
  sidebarMode, setSidebarMode, tables, relationships, columns,
  filteredTables, filteredRelationships,
  expandedTableId, setExpandedTableId, focusTable,
  renamingTableId, setRenamingTableId, renameTableValue, setRenameTableValue, handleRenameTable,
  handleDeleteTable,
  addingColTableId, setAddingColTableId, newColName, setNewColName, newColType, setNewColType,
  newColPK, setNewColPK, newColUnique, setNewColUnique, newColNotNull, setNewColNotNull,
  handleAddColumn, addColIsPending,
  activeColId, setActiveColId,
  renamingColId, setRenamingColId, renameColValue, setRenameColValue,
  handleRenameColumn, handleDeleteColumn, handleChangeColumnType, handleToggleColumnProp,
  handleDeleteRel,
  selectedTemplateId, setSelectedTemplateId,
  sqlImport, setSqlImport, handleImportSql, handleImportSqlFile,
}: EditorSidebarProps) {
  const TABS = [
    { key: "schema", label: `Schema (${tables.length})` },
    { key: "relationships", label: `Links (${relationships.length})` },
    { key: "templates", label: "Templates" },
    { key: "import", label: "Import" },
  ] as const;

  return (
    <aside className={`flex min-h-0 flex-col border-r transition-colors ${isDark ? "border-[#1e293b] bg-[#0f172a]" : "border-[#e2e8f0] bg-white"}`}>
      {/* Header bar */}
      <div className={`px-4 py-4 border-b space-y-4 ${isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-100 bg-slate-50/80"}`}>
        <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2">
          <input
            id="schema-search"
            type="text"
            placeholder="Search tables, columns, or relationships"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`h-11 rounded-xl border px-3 text-[14px] font-semibold outline-none ${isDark ? "border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-600" : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400"}`}
          />
          <select
            value={projectDatabaseType}
            onChange={(e) => void handleDatabaseTypeChange(e.target.value)}
            className={`h-11 rounded-xl border px-3 text-[13px] font-semibold outline-none ${isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
          >
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
            className={`h-11 rounded-xl border px-3 text-[14px] font-semibold outline-none transition ${isDark ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-600 focus:border-indigo-500" : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-indigo-500"}`}
          />
          <button type="submit" className="h-11 w-11 flex items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition shadow-md shadow-indigo-500/20 shrink-0">
            <PlusIcon className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Tab bar */}
      <div className={`flex border-b shrink-0 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSidebarMode(tab.key)}
            className={`flex-1 py-3 text-[11px] font-extrabold uppercase tracking-[0.08em] transition ${sidebarMode === tab.key
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : isDark ? "text-slate-600 hover:text-slate-400" : "text-slate-400 hover:text-slate-600"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {sidebarMode === "schema" && (
        <SchemaPanel
          isDark={isDark}
          filteredTables={filteredTables}
          columns={columns}
          searchQuery={searchQuery}
          expandedTableId={expandedTableId}
          setExpandedTableId={setExpandedTableId}
          focusTable={focusTable}
          renamingTableId={renamingTableId}
          setRenamingTableId={setRenamingTableId}
          renameTableValue={renameTableValue}
          setRenameTableValue={setRenameTableValue}
          handleRenameTable={handleRenameTable}
          handleDeleteTable={handleDeleteTable}
          addingColTableId={addingColTableId}
          setAddingColTableId={setAddingColTableId}
          newColName={newColName}
          setNewColName={setNewColName}
          newColType={newColType}
          setNewColType={setNewColType}
          newColPK={newColPK}
          setNewColPK={setNewColPK}
          newColUnique={newColUnique}
          setNewColUnique={setNewColUnique}
          newColNotNull={newColNotNull}
          setNewColNotNull={setNewColNotNull}
          handleAddColumn={handleAddColumn}
          addColIsPending={addColIsPending}
          activeColId={activeColId}
          setActiveColId={setActiveColId}
          renamingColId={renamingColId}
          setRenamingColId={setRenamingColId}
          renameColValue={renameColValue}
          setRenameColValue={setRenameColValue}
          handleRenameColumn={handleRenameColumn}
          handleDeleteColumn={handleDeleteColumn}
          handleChangeColumnType={handleChangeColumnType}
          handleToggleColumnProp={handleToggleColumnProp}
        />
      )}

      {sidebarMode === "relationships" && (
        <RelationshipsPanel
          isDark={isDark}
          filteredRelationships={filteredRelationships}
          columns={columns}
          tables={tables}
          searchQuery={searchQuery}
          handleDeleteRel={handleDeleteRel}
        />
      )}

      {sidebarMode === "templates" && (
        <TemplatesPanel
          isDark={isDark}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
        />
      )}

      {sidebarMode === "import" && (
        <ImportPanel
          isDark={isDark}
          sqlImport={sqlImport}
          setSqlImport={setSqlImport}
          handleImportSql={handleImportSql}
          handleImportSqlFile={handleImportSqlFile}
        />
      )}
    </aside>
  );
}
