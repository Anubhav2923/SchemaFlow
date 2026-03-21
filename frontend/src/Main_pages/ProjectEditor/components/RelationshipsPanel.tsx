import { TrashIcon, LinkIcon } from "./Icons";
import { CARDINALITY_COLOR, CARDINALITY_LABEL } from "../constants";
import type { SchemaRelationship, SchemaColumn, SchemaTable } from "../../../features/schema/api";

interface RelationshipsPanelProps {
  isDark: boolean;
  filteredRelationships: SchemaRelationship[];
  columns: SchemaColumn[];
  tables: SchemaTable[];
  searchQuery: string;
  handleDeleteRel: (id: string) => void;
}

export function RelationshipsPanel({
  isDark, filteredRelationships, columns, tables, searchQuery, handleDeleteRel,
}: RelationshipsPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
      <div className={`rounded-xl p-3 text-[11px] font-bold flex items-start gap-2 ${isDark ? "bg-slate-800/60 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
        <LinkIcon className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
        <span>Drag from any column dot on the canvas to another column to create a relationship.</span>
      </div>

      {filteredRelationships.length === 0 ? (
        <div className={`rounded-xl border-2 border-dashed px-4 py-8 text-center text-[12px] font-bold ${isDark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}>
          {searchQuery ? "No relationships matched your search." : <><span>No relationships yet.</span><br />Drag column dots to connect tables.</>}
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
  );
}
