import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "reactflow";

// Crow's foot notation colours per cardinality
const EDGE_COLORS: Record<string, string> = {
  "one-to-one":   "#22d3ee", // cyan
  "one-to-many":  "#818cf8", // indigo
  "many-to-many": "#c084fc", // violet
};

const DARK_EDGE_COLORS: Record<string, string> = {
  "one-to-one":   "#06b6d4",
  "one-to-many":  "#6366f1",
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

// Crow's foot "many" end SVG marker
function CrowsFoot({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  // Three lines: top, middle, bottom of crow's foot
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
      {/* Three lines of crow's foot */}
      <line x1={tip.x} y1={tip.y} x2={top.x} y2={top.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={tip.x} y1={tip.y} x2={base.x} y2={base.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={tip.x} y1={tip.y} x2={bot.x} y2={bot.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
      {/* Perpendicular "many" bar */}
      <line
        x1={base.x - sin * spread} y1={base.y + cos * spread}
        x2={base.x + sin * spread} y2={base.y - cos * spread}
        stroke={color} strokeWidth={2} strokeLinecap="round"
      />
    </g>
  );
}

// Single vertical bar "one" end
function OneBar({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const d = 10;
  const spread = 8;
  const base = { x: x - cos * d, y: y - sin * d };
  const top = { x: base.x - sin * spread, y: base.y + cos * spread };
  const bot = { x: base.x + sin * spread, y: base.y - cos * spread };
  // Optional second bar for "one and only one"
  const base2 = { x: x - cos * (d + 5), y: y - sin * (d + 5) };
  const top2 = { x: base2.x - sin * spread, y: base2.y + cos * spread };
  const bot2 = { x: base2.x + sin * spread, y: base2.y - cos * spread };

  return (
    <g>
      <line x1={top.x} y1={top.y} x2={bot.x} y2={bot.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={top2.x} y1={top2.y} x2={bot2.x} y2={bot2.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

// Arrow angle helper
function angleFromPositions(sX: number, sY: number, tX: number, tY: number): number {
  return (Math.atan2(tY - sY, tX - sX) * 180) / Math.PI;
}

export function RelationshipEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
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
    sourceX: sX, sourceY: sY, sourcePosition,
    targetX: tX, targetY: tY, targetPosition,
    borderRadius: 8,
  });

  const labelX = Number.isFinite(lX) ? lX : 0;
  const labelY = Number.isFinite(lY) ? lY : 0;

  const srcAngle = angleFromPositions(tX, tY, sX, sY);
  const tgtAngle = angleFromPositions(sX, sY, tX, tY);

  const isOneToOne   = cardinality === "one-to-one";
  const isManyToMany = cardinality === "many-to-many";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 1.5,
          opacity: selected ? 1 : 0.8,
        }}
      />

      {/* Animation Overlay: Moving Dots (Always subtly active) */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 3.5 : 2}
        strokeDasharray="8, 12"
        className="animate-edge-flow shadow-lg"
        style={{
          opacity: selected ? 0.9 : 0.25,
          strokeLinecap: 'round',
          filter: selected ? `drop-shadow(0 0 4px ${color})` : 'none',
          transition: 'opacity 0.3s, filter 0.3s'
        }}
      />

      {/* Source and Target Markers */}
      <svg overflow="visible" style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}>
        {isManyToMany ? (
          <CrowsFoot x={sourceX} y={sourceY} angle={srcAngle} color={color} />
        ) : (
          <OneBar x={sourceX} y={sourceY} angle={srcAngle} color={color} />
        )}

        {isOneToOne ? (
          <OneBar x={targetX} y={targetY} angle={tgtAngle} color={color} />
        ) : (
          <CrowsFoot x={targetX} y={targetY} angle={tgtAngle} color={color} />
        )}
      </svg>

      <style>{`
        @keyframes edge-flow {
          from { stroke-dashoffset: 32; }
          to { stroke-dashoffset: 0; }
        }
        .animate-edge-flow {
          animation: edge-flow 1.5s linear infinite;
        }
      `}</style>

      {/* Inline label: FK column names */}
      {(data?.sourceColumnName || data?.targetColumnName) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute"
            style={{ 
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, 
              pointerEvents: "auto" 
            }}
          >
            <div
              onClick={(e) => { 
                e.stopPropagation(); 
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
                <span className="opacity-40">→</span>
                <span>{data.targetColumnName}</span>
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
