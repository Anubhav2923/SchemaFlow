import { memo } from "react";
import type { NodeProps } from "reactflow";
import type { SchemaColumn } from "../../features/schema/api";
import { ColumnItem } from "./ColumnItem";

type TableNodeData = {
  name: string;
  columns: SchemaColumn[];
  isDark: boolean;
  accentColor: string;
};

function TableNodeComponent({ data, selected }: NodeProps<TableNodeData>) {
  const isDark = data.isDark;
  const accentColor = data.accentColor;

  return (
    <div
      className={`relative min-w-[336px] rounded-lg border-t-0 border shadow-md transition-all duration-300 ${isDark
          ? selected
            ? "border-indigo-500/80 bg-slate-900 ring-1 ring-indigo-500/20 shadow-xl shadow-indigo-500/10"
            : "border-slate-800 bg-slate-900"
          : selected
            ? "border-indigo-400 bg-white ring-1 ring-indigo-500/10 shadow-xl shadow-indigo-500/5"
            : "border-slate-200 bg-white shadow-sm"
        }`}
      style={{
        backdropFilter: "none",
      }}
    >
      {/* Header-Top Technical Accent */}
      <div
        className="absolute inset-x-0 -top-[2px] h-[3px] rounded-t-lg"
        style={{
          backgroundColor: accentColor,
        }}
      />

      {/* Header - Technical Theme */}
      <div className={`px-5 py-3 border-b flex justify-between items-center bg-transparent ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-[12px] font-black uppercase tracking-[0.15em] font-mono leading-none ${isDark ? "text-slate-200" : "text-slate-800"}`}>
          {data.name}
        </h3>
        <div className={`h-1 w-1 rounded-full ${selected ? "scale-100 opacity-100" : "scale-0 opacity-0"} transition-all`} style={{ backgroundColor: accentColor }} />
      </div>

      {/* Column List */}
      <div className="py-2">
        {data.columns.length > 0 ? (
          data.columns.map((column) => (
            <ColumnItem key={column.id} column={column} isDark={isDark} accentColor={accentColor} />
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
