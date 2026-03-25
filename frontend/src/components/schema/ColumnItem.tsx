import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { SchemaColumn } from "../../features/schema/api";

type ColumnItemProps = {
  column: SchemaColumn;
  isDark?: boolean;
  accentColor?: string;
  tableSelected?: boolean;
};

function ColumnItemComponent({ column, isDark = false, accentColor = "#6366f1", tableSelected = false }: ColumnItemProps) {
  return (
    <div className="relative group">
      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${column.id}-left`}
        className={`!h-[8px] !w-[8px] !border-[1.5px] hover:!scale-150 ${
          tableSelected ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        } ${
          isDark ? "!border-slate-900" : "!border-white"
        }`}
        style={{ left: "-4px", backgroundColor: accentColor }}
      />

      <div
        className={`flex items-center justify-between gap-8 px-4 py-2 group/row border-b last:border-none ${
          isDark ? "border-slate-800/70 hover:bg-slate-800/20" : "border-slate-200/85 hover:bg-slate-50/80"
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

          <span className={`truncate text-[14px] font-medium tracking-[0.01em] select-none ${isDark ? "text-slate-100" : "text-slate-800"}`}>
            {column.name}
          </span>
        </div>

        <span className={`text-[12px] font-medium tracking-[0.01em] shrink-0 select-none ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          {column.data_type.split('(')[0]}
        </span>
      </div>

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${column.id}-right`}
        className={`!h-[8px] !w-[8px] !border-[1.5px] hover:!scale-150 ${
          tableSelected ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        } ${
          isDark ? "!border-slate-900" : "!border-white"
        }`}
        style={{ right: "-4px", backgroundColor: accentColor }}
      />
    </div>
  );
}

export const ColumnItem = memo(ColumnItemComponent);
