import { Handle, Position } from "reactflow";
import type { SchemaColumn } from "../../features/schema/api";

type ColumnItemProps = {
  column: SchemaColumn;
  isDark?: boolean;
};

export function ColumnItem({ column, isDark = false }: ColumnItemProps) {
  return (
    <div className="relative group">
      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${column.id}-left`}
        className={`!h-[10px] !w-[10px] !border-[1.5px] !transition-all hover:!scale-125 ${
          isDark 
            ? "!border-[#0f172a] !bg-indigo-500" 
            : "!border-white !bg-[#6366f1]"
        }`}
        style={{ left: "-5px" }}
      />

      <div
        className={`flex items-center justify-between gap-6 px-4 py-2 text-[12px] transition-colors`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex w-4 items-center justify-center shrink-0">
            {column.is_primary ? (
              <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            ) : (
              <div className={`h-1.5 w-1.5 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
            )}
          </div>

          <span className={`truncate text-[13px] font-bold tracking-tight ${isDark ? "text-slate-200" : "text-slate-600"}`}>
            {column.name}
          </span>
        </div>

        <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {column.data_type.split('(')[0]}
        </span>
      </div>

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${column.id}-right`}
        className={`!h-[10px] !w-[10px] !border-[1.5px] !transition-all hover:!scale-125 ${
          isDark 
            ? "!border-[#0f172a] !bg-indigo-500" 
            : "!border-white !bg-[#6366f1]"
        }`}
        style={{ right: "-5px" }}
      />
    </div>
  );
}
