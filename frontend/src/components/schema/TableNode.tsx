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
      className={`group relative min-w-[300px] max-w-[350px] rounded-[6px] border ${
        isDark
          ? selected
            ? "border-indigo-400 bg-[#0f172a] shadow-[0_8px_18px_-12px_rgba(15,23,42,0.9)]"
            : "border-slate-700 bg-[#0f172a] shadow-[0_4px_12px_-10px_rgba(15,23,42,0.85)]"
          : selected
            ? "border-indigo-500 bg-white shadow-[0_8px_18px_-12px_rgba(15,23,42,0.18)]"
            : "border-slate-300 bg-white shadow-[0_4px_12px_-10px_rgba(15,23,42,0.14)] hover:border-slate-400"
      }`}
      style={{
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      }}
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
            isDark ? "border border-indigo-400/35 bg-slate-900 text-indigo-200" : "border border-indigo-200 bg-white text-indigo-600"
          }`}>
            Selected
          </span>
        </div>
      )}
      {/* Header - Technical Theme */}
      <div
        className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? "border-slate-800 bg-slate-900/55" : "border-slate-200 bg-slate-50"}`}
        style={{ textRendering: "geometricPrecision" }}
      >
        <h3 className={`text-[15px] font-semibold tracking-[0.01em] leading-none ${isDark ? "text-slate-100" : "text-slate-900"}`}>
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
