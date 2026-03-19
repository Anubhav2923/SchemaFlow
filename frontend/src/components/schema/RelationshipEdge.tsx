import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "reactflow";
import type { EdgeProps } from "reactflow";

export function RelationshipEdge({
  id,
  label,
  markerEnd,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
}: EdgeProps<{ isDark?: boolean }>) {
  const isDark = data?.isDark ?? false;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 18,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: isDark ? "#8088ff" : "#aeb5d8", strokeWidth: 2 }}
      />
      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan absolute rounded-full border px-2 py-1 text-[10px] font-semibold shadow-[0_6px_18px_rgba(98,109,171,0.1)] ${
            isDark
              ? "border-[#323954] bg-[#1a1e2c] text-[#9ca6d3]"
              : "border-[#e3e6f4] bg-white text-[#8087a8]"
          }`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
