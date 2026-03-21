import { createPortal } from "react-dom";
import { CARDINALITY_LABEL } from "../constants";
import type { SchemaColumn } from "../../../features/schema/api";

interface ConnectDialogState {
  connection?: unknown;
  sourceColId: string;
  targetColId: string;
  sourceTableId: string;
  targetTableId: string;
  relationshipId?: string;
}

interface ConnectDialogProps {
  isDark: boolean;
  connectDialog: ConnectDialogState;
  columns: SchemaColumn[];
  dialogCardinality: "one-to-one" | "one-to-many" | "many-to-many";
  setDialogCardinality: (v: "one-to-one" | "one-to-many" | "many-to-many") => void;
  dialogOnDelete: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  setDialogOnDelete: (v: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION") => void;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function ConnectDialog({
  isDark, connectDialog, columns,
  dialogCardinality, setDialogCardinality,
  dialogOnDelete, setDialogOnDelete,
  onConfirm, onCancel, isProcessing,
}: ConnectDialogProps) {
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <div className={`relative w-[420px] rounded-3xl border shadow-2xl p-8 space-y-7 transition-all ${isDark ? "bg-[#0f172a] border-slate-700 shadow-indigo-500/10" : "bg-white border-slate-200"}`}>

        {/* Header */}
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/80">
            {connectDialog.relationshipId ? "Edit Relationship" : "New Relationship"}
          </p>
          <h2 className={`text-[22px] font-black tracking-tight ${isDark ? "text-white" : "text-[#1e293b]"}`}>Configure Foreign Key</h2>
          <p className={`text-[12px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {columns.find(c => c.id === connectDialog.sourceColId)?.name} → {columns.find(c => c.id === connectDialog.targetColId)?.name}
          </p>
        </div>

        {/* Cardinality */}
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

        {/* On Delete */}
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

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-[1.5] h-14 rounded-2xl bg-indigo-600 text-white text-[14px] font-black hover:bg-indigo-700 disabled:opacity-60 transition shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            {isProcessing ? "Processing…" : connectDialog.relationshipId ? "Save Changes" : "Create Relationship"}
          </button>
          <button
            onClick={onCancel}
            className={`flex-1 h-14 rounded-2xl text-[14px] font-black border transition hover:bg-slate-50 active:scale-95 ${isDark ? "border-slate-800 text-slate-500 hover:bg-slate-800/40" : "border-slate-100 text-slate-500"}`}
          >Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
