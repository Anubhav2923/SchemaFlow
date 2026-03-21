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
        className={`!h-[10px] !w-[10px] !border-[1.5px] !transition-all hover:!scale-125 ${isDark ? "!border-[#0f172a]" : "!border-white"
          }`}
        style={{ left: "-5px", backgroundColor: accentColor }}
      />

      <div
        className={`flex items-center justify-between gap-6 px-5 py-3 text-[14px] transition-colors`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex w-5 items-center justify-center shrink-0">
            {column.is_primary ? (
              <svg className="h-4 w-4" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            ) : (
              <div className={`h-2 w-2 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
            )}
          </div>

          <span className={`truncate text-[15px] font-extrabold tracking-tight antialiased ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            {column.name}
          </span>
        </div>

        <span className={`text-[12px] font-black uppercase tracking-widest shrink-0 antialiased ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {column.data_type.split('(')[0]}
        </span>
      </div>

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${column.id}-right`}
        className={`!h-[10px] !w-[10px] !border-[1.5px] !transition-all hover:!scale-125 ${isDark ? "!border-[#0f172a]" : "!border-white"
          }`}
        style={{ right: "-5px", backgroundColor: accentColor }}
      />
    </div>
  );
}

export const ColumnItem = memo(ColumnItemComponent);
