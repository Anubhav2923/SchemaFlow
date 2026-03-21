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
      className={`relative min-w-[340px] rounded-xl border ${isDark
          ? selected
            ? "bg-[#081120] shadow-[0_18px_45px_rgba(15,23,42,0.55)] ring-2"
            : "border-slate-700/80 bg-[#0b1220] shadow-[0_14px_34px_rgba(2,6,23,0.38)]"
          : selected
            ? "bg-white shadow-[0_18px_44px_rgba(99,102,241,0.18)] ring-2"
            : "border-slate-300 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.10)]"
        }`}
      style={{
        backdropFilter: "none", // Removed to prevent text blurriness when zoomed in ReactFlow
        borderColor: selected ? accentColor : undefined,
        boxShadow: selected ? `0 18px 44px ${accentColor}26` : undefined,
        ["--tw-ring-color" as string]: `${accentColor}33`,
        transition: "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
      }}
    >
      {/* Top Accent Strip */}
      <div
        className="absolute inset-x-0 top-0 h-1.5 rounded-t-xl"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
          boxShadow: `0 0 14px ${accentColor}55`,
        }}
      />

      {/* Header */}
      <div className={`px-6 py-4 border-b flex justify-center items-center rounded-t-xl ${isDark ? "border-slate-700 bg-slate-900/82" : "border-slate-200 bg-slate-50/92"
        }`}>
        <h3 className={`text-[17px] font-extrabold uppercase tracking-[0.06em] antialiased ${isDark ? "text-slate-50" : "text-slate-800"}`}>
          {data.name}
        </h3>
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
