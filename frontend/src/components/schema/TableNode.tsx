import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { SchemaColumn } from "../../features/schema/api";
import { ColumnItem } from "./ColumnItem";

type TableNodeData = {
  name: string;
  columns: SchemaColumn[];
  isDark: boolean;
};

export function TableNode({ data, selected }: NodeProps<TableNodeData>) {
  const isDark = data.isDark;

  return (
    <div
      className={`min-w-80 rounded-[20px] border shadow-[0_18px_60px_rgba(98,109,171,0.12)] transition duration-300 ${
        isDark
          ? selected
            ? "border-[#8088ff] bg-[#111625] ring-2 ring-[#8088ff]/30 shadow-[0_0_0_8px_rgba(128,136,255,0.08)]"
            : "border-[#2d3450] bg-[#131724]"
          : selected
            ? "border-[#6670ea] bg-white ring-2 ring-[#6670ea]/20 shadow-[0_0_0_8px_rgba(102,112,234,0.06)] scale-[1.02]"
            : "border-[#dfe2f3] bg-white"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1.5 rounded-t-[20px] ${
          isDark
            ? "bg-indigo-500 opacity-60"
            : "bg-indigo-400"
        }`}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-3 !w-3 !border-2 !transition hover:!scale-125 ${
          isDark ? "!border-[#171a27] !bg-[#8088ff]" : "!border-white !bg-[#6a73eb]"
        }`}
      />

      <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--line-soft)] mb-3 bg-[#fbfcfd]/20 dark:bg-[#1a1f2e]/40 rounded-t-[20px]">
        <div className="flex items-center gap-2.5">
           <svg className="h-4 w-4 text-indigo-500 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
           </svg>
           <h3 className={`text-base font-black tracking-tight ${isDark ? "text-white" : "text-[#1e293b]"}`}>
            {data.name}
           </h3>
        </div>
        <div
          className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#6871e7] ${
            isDark ? "bg-[#252b43]" : "bg-[#f1f3ff]"
          }`}
        >
          {data.columns.length}
        </div>
      </div>

      <div className="space-y-1.5 p-4 pt-1">
        {data.columns.length > 0 ? (
          data.columns.map((column) => (
            <ColumnItem key={column.id} column={column} isDark={isDark} />
          ))
        ) : (
          <div
            className={`rounded-[14px] border border-dashed px-3 py-6 text-center text-[11px] font-bold ${
              isDark
                ? "border-[#313857] text-[#7f89b4]"
                : "border-[#e5e8f5] text-[#a2a9c6]"
            }`}
          >
            No columns yet
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`!h-3 !w-3 !border-2 !transition hover:!scale-125 ${
          isDark ? "!border-[#171a27] !bg-[#8088ff]" : "!border-white !bg-[#6a73eb]"
        }`}
      />
    </div>
  );
}
