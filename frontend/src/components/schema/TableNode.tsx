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
      className={`group relative min-w-[300px] max-w-[350px] rounded-[6px] border shadow-sm transition-all duration-200 ${
        isDark
          ? selected
            ? "border-indigo-400 bg-[#0f172a] ring-2 ring-indigo-400/60 shadow-[0_0_0_1px_rgba(129,140,248,0.55),0_18px_38px_-18px_rgba(99,102,241,0.85)]"
            : "border-slate-700 bg-[#0f172a]"
          : selected
            ? "border-indigo-500 bg-white ring-2 ring-indigo-500/35 shadow-[0_0_0_1px_rgba(99,102,241,0.22),0_18px_36px_-20px_rgba(99,102,241,0.45)]"
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

      {selected && (
        <div className="pointer-events-none absolute right-3 top-3 z-10">
          <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
            isDark ? "bg-indigo-500/20 text-indigo-200" : "bg-indigo-50 text-indigo-600"
          }`}>
            Selected
          </span>
        </div>
      )}
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
