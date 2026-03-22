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
        className={`flex items-center justify-between gap-8 px-4 py-2 group/row transition-colors border-b last:border-none ${
          isDark ? "border-slate-800/60 hover:bg-slate-800/30" : "border-slate-100 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex w-4 items-center justify-center shrink-0">
            {column.is_primary ? (
              <svg className="h-3.5 w-3.5" style={{ color: "#eab308" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            ) : (
              <div className={`h-[5px] w-[5px] rounded-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
            )}
          </div>

          <span className={`truncate text-[13px] font-medium tracking-wide select-none ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            {column.name}
          </span>
        </div>

        <span className={`text-[12px] font-normal tracking-wide shrink-0 select-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>
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
