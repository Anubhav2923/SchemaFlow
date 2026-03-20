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
      className={`relative min-w-80 rounded-lg border transition-all duration-300 ${
        isDark
          ? selected
            ? "border-indigo-500 bg-[#0f172a] shadow-lg ring-1 ring-indigo-500/30"
            : "border-slate-800 bg-[#0f172a]"
          : selected
            ? "border-indigo-400 bg-white shadow-xl ring-2 ring-indigo-500/10"
            : "border-slate-300 bg-white shadow-sm"
      }`}
    >
      {/* Top Accent Strip */}
      <div
        className={`absolute inset-x-0 top-0 h-1 rounded-t-lg ${
          isDark
            ? "bg-gradient-to-r from-pink-500 to-indigo-500"
            : "bg-gradient-to-r from-pink-400 to-purple-500"
        }`}
      />
      
      {/* Header */}
      <div className={`px-5 py-3 border-b flex justify-center items-center rounded-t-lg ${
        isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50"
      }`}>
         <h3 className={`text-[15px] font-black uppercase tracking-wider ${isDark ? "text-slate-100" : "text-slate-700"}`}>
          {data.name}
         </h3>
      </div>

      {/* Column List */}
      <div className="py-2">
        {data.columns.length > 0 ? (
          data.columns.map((column) => (
            <ColumnItem key={column.id} column={column} isDark={isDark} />
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
