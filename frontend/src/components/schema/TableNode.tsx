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
