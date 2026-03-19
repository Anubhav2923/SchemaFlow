import { NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";

type CommentGroupNodeData = {
  title: string;
  color: string;
  isDark: boolean;
};

export function CommentGroupNode({ data, selected }: NodeProps<CommentGroupNodeData>) {
  const isDark = data.isDark;

  return (
    <div
      className={`h-full w-full rounded-[12px] border p-4 ${
        isDark
          ? "bg-[rgba(20,24,38,0.55)]"
          : "bg-[rgba(255,255,255,0.08)]"
      }`}
      style={{
        borderColor: data.color,
        boxShadow: selected ? `0 0 0 2px ${data.color}33 inset` : undefined,
      }}
    >
      <NodeResizer
        minWidth={280}
        minHeight={180}
        color={data.color}
        lineStyle={{ borderColor: data.color }}
        handleStyle={{ background: data.color, width: 8, height: 8 }}
      />
      <div className="pointer-events-none">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.24em] ${
            isDark ? "text-[#d7ddff]" : "text-[#70789f]"
          }`}
        >
          {data.title}
        </p>
        <p className={`mt-2 text-xs ${isDark ? "text-[#8f98c5]" : "text-[#99a0bf]"}`}>
          Grouped schema note
        </p>
      </div>
    </div>
  );
}
