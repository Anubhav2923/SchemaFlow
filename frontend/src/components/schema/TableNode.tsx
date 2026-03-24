import { memo } from "react";
import type { NodeProps } from "reactflow";
import type { SchemaColumn } from "../../features/schema/api";
import { ColumnItem } from "./ColumnItem";

type TableNodeData = {
  name: string;
  columns: SchemaColumn[];
  isDark: boolean;
  accentColor: string;
  onDelete?: () => void;
};

function TableNodeComponent({ data, selected }: NodeProps<TableNodeData>) {
  const isDark = data.isDark;
  const accentColor = data.accentColor;

  return (
    <div
      className={`group relative min-w-[300px] max-w-[350px] rounded-[6px] border shadow-sm transition-all duration-200 ${
        isDark
          ? selected
            ? "border-indigo-500 bg-[#0f172a] ring-1 ring-indigo-500/50 shadow-md"
            : "border-slate-700 bg-[#0f172a]"
          : selected
            ? "border-indigo-500 bg-white ring-1 ring-indigo-500/30 shadow-md"
            : "border-slate-300 bg-white shadow-sm hover:border-slate-400"
      }`}
    >
      {/* Header-Top Technical Accent */}
      <div
        className="absolute inset-x-0 -top-px h-[4px] rounded-t-[6px]"
        style={{
          backgroundColor: accentColor,
        }}
      />

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          data.onDelete?.();
        }}
        className={`absolute -right-2.5 -top-2.5 z-20 flex h-7 w-7 cursor-scissors items-center justify-center rounded-full border shadow-md transition-all duration-200 ${
          isDark
            ? "border-slate-700 bg-[#1e293b] text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-300"
            : "border-slate-200 bg-white text-rose-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600"
        } ${selected ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"}`}
        title={`Cut table ${data.name}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
          <line x1="20" y1="4" x2="8.12" y2="15.88"/>
          <line x1="14.47" y1="14.48" x2="20" y2="20"/>
          <line x1="8.12" y1="8.12" x2="12" y2="12"/>
        </svg>
      </button>

      {/* Header - Technical Theme */}
      <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-50"}`}>
        <h3 className={`text-[14px] font-bold tracking-wide leading-none ${isDark ? "text-slate-200" : "text-slate-800"}`}>
          {data.name}
        </h3>
      </div>

      {/* Column List */}
      <div className="py-2">
        {data.columns.length > 0 ? (
          data.columns.map((column) => (
            <ColumnItem key={column.id} column={column} isDark={isDark} accentColor={accentColor} tableSelected={selected} />
          ))
        ) : (
          <div className="px-5 py-8 text-center text-[11px] font-bold text-slate-400 italic">
            No columns defined
          </div>
        )}
      </div>
    </div>
  );
}

export const TableNode = memo(TableNodeComponent);
