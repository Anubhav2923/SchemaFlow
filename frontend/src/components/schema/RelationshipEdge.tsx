import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "reactflow";

const EDGE_COLORS: Record<string, string> = {
  "one-to-one": "#22d3ee",
  "one-to-many": "#818cf8",
  "many-to-many": "#c084fc",
};

const DARK_EDGE_COLORS: Record<string, string> = {
  "one-to-one": "#06b6d4",
  "one-to-many": "#6366f1",
  "many-to-many": "#a855f7",
};

type EdgeData = {
  isDark?: boolean;
  cardinality?: "one-to-one" | "one-to-many" | "many-to-many";
  sourceColumnName?: string;
  targetColumnName?: string;
  onDelete?: string;
  relationshipId?: string;
  onEdit?: () => void;
};

function SourceDot({ x, y, color }: { x: number; y: number; color: string }) {
  return <circle cx={x} cy={y} r={4.5} fill={color} stroke="white" strokeWidth={1.5} />;
}

function FlowArrow({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const length = 14;
  const spread = 7;
  const tip = { x, y };
  const base = { x: x - cos * length, y: y - sin * length };
  const top = { x: base.x - sin * spread, y: base.y + cos * spread };
  const bot = { x: base.x + sin * spread, y: base.y - cos * spread };

  return (
    <path
      d={`M ${tip.x} ${tip.y} L ${top.x} ${top.y} L ${bot.x} ${bot.y} Z`}
      fill="white"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  );
}

function CrowsFoot({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const len = 14;
  const spread = 8;
  const tip = { x, y };
  const base = { x: x - cos * len, y: y - sin * len };
  const top = { x: base.x - sin * spread, y: base.y + cos * spread };
  const bot = { x: base.x + sin * spread, y: base.y - cos * spread };

  return (
    <g>
      <line x1={tip.x} y1={tip.y} x2={top.x} y2={top.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={tip.x} y1={tip.y} x2={base.x} y2={base.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={tip.x} y1={tip.y} x2={bot.x} y2={bot.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line
        x1={base.x - sin * spread}
        y1={base.y + cos * spread}
        x2={base.x + sin * spread}
        y2={base.y - cos * spread}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  );
}

function OneBar({ x, y, angle, color, offset = 10 }: { x: number; y: number; angle: number; color: string; offset?: number }) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const spread = 8;
  const base = { x: x - cos * offset, y: y - sin * offset };
  const top = { x: base.x - sin * spread, y: base.y + cos * spread };
  const bot = { x: base.x + sin * spread, y: base.y - cos * spread };

  return <line x1={top.x} y1={top.y} x2={bot.x} y2={bot.y} stroke={color} strokeWidth={2} strokeLinecap="round" />;
}

function OneToOneMarker({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  return (
    <g>
      <OneBar x={x} y={y} angle={angle} color={color} offset={12} />
      <OneBar x={x} y={y} angle={angle} color={color} offset={18} />
      <FlowArrow x={x} y={y} angle={angle} color={color} />
    </g>
  );
}

function OneToManyMarker({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  return (
    <g>
      <CrowsFoot x={x} y={y} angle={angle} color={color} />
      <FlowArrow x={x} y={y} angle={angle} color={color} />
    </g>
  );
}

function ManyToManyMarker({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  return (
    <g>
      <CrowsFoot x={x} y={y} angle={angle} color={color} />
      <OneBar x={x} y={y} angle={angle} color={color} offset={18} />
      <FlowArrow x={x} y={y} angle={angle} color={color} />
    </g>
  );
}

function angleFromPositions(sX: number, sY: number, tX: number, tY: number): number {
  return (Math.atan2(tY - sY, tX - sX) * 180) / Math.PI;
}

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  selected,
}: EdgeProps<EdgeData>) {
  const isDark = data?.isDark ?? false;
  const cardinality = data?.cardinality ?? "one-to-many";
  const colorMap = isDark ? DARK_EDGE_COLORS : EDGE_COLORS;
  const color = colorMap[cardinality] ?? colorMap["one-to-many"];

  const sX = Number.isFinite(sourceX) ? sourceX : 0;
  const sY = Number.isFinite(sourceY) ? sourceY : 0;
  const tX = Number.isFinite(targetX) ? targetX : 0;
  const tY = Number.isFinite(targetY) ? targetY : 0;

  const [edgePath, lX, lY] = getSmoothStepPath({
    sourceX: sX,
    sourceY: sY,
    sourcePosition,
    targetX: tX,
    targetY: tY,
    targetPosition,
    borderRadius: 10,
  });

  const labelX = Number.isFinite(lX) ? lX : 0;
  const labelY = Number.isFinite(lY) ? lY : 0;
  const tgtAngle = angleFromPositions(sX, sY, tX, tY);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3.5 : 2.5,
          opacity: selected ? 1 : 0.95,
        }}
      />

      <svg overflow="visible" style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}>
        <SourceDot x={sX} y={sY} color={color} />
        {cardinality === "one-to-one" && <OneToOneMarker x={tX} y={tY} angle={tgtAngle} color={color} />}
        {cardinality === "one-to-many" && <OneToManyMarker x={tX} y={tY} angle={tgtAngle} color={color} />}
        {cardinality === "many-to-many" && <ManyToManyMarker x={tX} y={tY} angle={tgtAngle} color={color} />}
      </svg>

      {(data?.sourceColumnName || data?.targetColumnName) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "auto",
            }}
          >
            <div
              onClick={(event) => {
                event.stopPropagation();
                data.onEdit?.();
              }}
              className={`rounded-full border px-3 py-1 text-[11px] font-black shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-400 hover:border-indigo-500/50"
                  : "border-slate-200 bg-white text-slate-500 hover:border-indigo-400"
              }`}
              style={{ borderColor: `${color}55`, color }}
            >
              <div className="flex items-center gap-1.5 active:opacity-60">
                <span>{data.sourceColumnName}</span>
                <span className="opacity-70">→</span>
                <span>{data.targetColumnName}</span>
                <span
                  className="ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]"
                  style={{ backgroundColor: `${color}14` }}
                >
                  {cardinality === "one-to-one" ? "1:1" : cardinality === "one-to-many" ? "1:N" : "N:M"}
                </span>
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
