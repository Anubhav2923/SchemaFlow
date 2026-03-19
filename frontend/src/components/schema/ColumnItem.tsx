import type { SchemaColumn } from "../../features/schema/api";

type ColumnItemProps = {
  column: SchemaColumn;
  isDark?: boolean;
};

export function ColumnItem({ column, isDark = false }: ColumnItemProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-[11px] transition hover:shadow-sm ${
        isDark 
          ? "border-[#2b3048] bg-[#1d2133] hover:border-[#40486c]" 
          : "border-[#edf0f8] bg-[#fbfcff] hover:border-[#ccd4e8]"
      }`}
    >
      <div className="flex w-4 items-center justify-center">
        {column.is_primary ? (
          <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        ) : column.is_unique ? (
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--ink-faint)] opacity-40" />
        )}
      </div>

      <span className={`truncate font-bold tracking-tight ${isDark ? "text-[#e7ebff]" : "text-[#2e3a5f]"}`}>
        {column.name}
      </span>

      <span className={`text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 ${isDark ? "text-[#8d96c0]" : "text-[#9ea5c2]"}`}>
        {column.data_type}
      </span>
      
      {!column.is_nullable && !column.is_primary && (
        <span className="text-[9px] font-black text-rose-400 opacity-60" title="Not Null">N</span>
      )}
    </div>
  );
}
