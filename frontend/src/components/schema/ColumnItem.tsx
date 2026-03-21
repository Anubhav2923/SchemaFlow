import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { SchemaColumn } from "../../features/schema/api";

type ColumnItemProps = {
  column: SchemaColumn;
  isDark?: boolean;
  accentColor?: string;
};

function ColumnItemComponent({ column, isDark = false, accentColor = "#6366f1" }: ColumnItemProps) {
  return (
    <div className="relative group">
      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${column.id}-left`}
        className={`!h-[8px] !w-[8px] !border-[1.5px] !transition-all hover:!scale-150 ${
          isDark ? "!border-slate-900" : "!border-white"
        }`}
        style={{ left: "-4px", backgroundColor: accentColor }}
      />

      <div
        className={`flex items-center justify-between gap-8 px-5 py-2.5 text-[12px] group/row transition-colors border-b last:border-b-0 ${
          isDark ? "border-slate-800/40 hover:bg-slate-800/60" : "border-slate-50/60 hover:bg-slate-50/80"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex w-4 items-center justify-center shrink-0">
            {column.is_primary ? (
              <svg className="h-3.5 w-3.5" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            ) : (
              <div className={`h-1 w-1 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
            )}
          </div>

          <span className={`truncate text-[13px] font-bold font-mono tracking-tight select-none ${isDark ? "text-slate-100" : "text-slate-700"}`}
                style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
            {column.name}
          </span>
        </div>

        <span className={`text-[11px] font-mono font-semibold tracking-tight shrink-0 select-none ${isDark ? "text-slate-300" : "text-slate-500"}`}
              style={isDark ? { color: "#cbd5e1" } : undefined}>
          {column.data_type.split('(')[0]}
        </span>
      </div>

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${column.id}-right`}
        className={`!h-[8px] !w-[8px] !border-[1.5px] !transition-all hover:!scale-150 ${
          isDark ? "!border-slate-900" : "!border-white"
        }`}
        style={{ right: "-4px", backgroundColor: accentColor }}
      />
    </div>
  );
}

export const ColumnItem = memo(ColumnItemComponent);
