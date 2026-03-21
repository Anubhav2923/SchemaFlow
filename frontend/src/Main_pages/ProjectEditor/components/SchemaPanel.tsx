import { TypeSelect } from "./TypeSelect";
import { PlusIcon, TrashIcon, EditIcon } from "./Icons";
import { getTableColor } from "../constants";
import type { SchemaColumn, SchemaTable } from "../../../features/schema/api";

interface SchemaPanelProps {
  isDark: boolean;
  filteredTables: SchemaTable[];
  columns: SchemaColumn[];
  searchQuery: string;
  // expand / collapse
  expandedTableId: string | null;
  setExpandedTableId: (id: string | null) => void;
  focusTable: (id: string) => void;
  // rename table
  renamingTableId: string | null;
  setRenamingTableId: (id: string | null) => void;
  renameTableValue: string;
  setRenameTableValue: (v: string) => void;
  handleRenameTable: (id: string) => void;
  // delete table
  handleDeleteTable: (id: string) => void;
  // add column
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
  // column interactions
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
}

export function SchemaPanel({
  isDark, filteredTables, columns, searchQuery,
  expandedTableId, setExpandedTableId, focusTable,
  renamingTableId, setRenamingTableId, renameTableValue, setRenameTableValue, handleRenameTable,
  handleDeleteTable,
  addingColTableId, setAddingColTableId, newColName, setNewColName, newColType, setNewColType,
  newColPK, setNewColPK, newColUnique, setNewColUnique, newColNotNull, setNewColNotNull,
  handleAddColumn, addColIsPending,
  activeColId, setActiveColId, renamingColId, setRenamingColId, renameColValue,
  setRenameColValue, handleRenameColumn, handleDeleteColumn, handleChangeColumnType, handleToggleColumnProp,
}: SchemaPanelProps) {
  return (
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
                        <button onClick={() => void handleAddColumn(table.id)} disabled={addColIsPending}
                          className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition">
                          {addColIsPending ? "Adding…" : "Add Column"}
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
  );
}
