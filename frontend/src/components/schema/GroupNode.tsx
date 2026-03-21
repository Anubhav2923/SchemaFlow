import { memo, useEffect, useState } from "react";
import { NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";

export type GroupNodeData = {
  name: string;
  color: string;
  isDark: boolean;
  onRename?: (newName: string) => void;
  onColorChange?: (newColor: string) => void;
  onRemove?: () => void;
  onResize?: (x: number, y: number, width: number, height: number) => void;
  onResizeStop?: (x: number, y: number, width: number, height: number) => void;
};

const PALETTE = [
  { hex: "#6366f1", alpha: "#6366f11a", label: "Indigo" },
  { hex: "#3b82f6", alpha: "#3b82f61a", label: "Blue" },
  { hex: "#0ea5e9", alpha: "#0ea5e91a", label: "Sky" },
  { hex: "#06b6d4", alpha: "#06b6d41a", label: "Cyan" },
  { hex: "#14b8a6", alpha: "#14b8a61a", label: "Teal" },
  { hex: "#10b981", alpha: "#10b9811a", label: "Emerald" },
  { hex: "#84cc16", alpha: "#84cc161a", label: "Lime" },
  { hex: "#f59e0b", alpha: "#f59e0b1a", label: "Amber" },
  { hex: "#f97316", alpha: "#f973161a", label: "Orange" },
  { hex: "#ef4444", alpha: "#ef44441a", label: "Red" },
  { hex: "#f43f5e", alpha: "#f43f5e1a", label: "Rose" },
  { hex: "#ec4899", alpha: "#ec48991a", label: "Pink" },
  { hex: "#d946ef", alpha: "#d946ef1a", label: "Fuchsia" },
  { hex: "#8b5cf6", alpha: "#8b5cf61a", label: "Violet" },
  { hex: "#64748b", alpha: "#64748b1a", label: "Slate" },
];

function GroupNodeComponent({ data, selected }: NodeProps<GroupNodeData>) {
  const { name, color, isDark, onRename, onColorChange, onRemove, onResize, onResizeStop } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(name);
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    setVal(name);
  }, [name]);

  useEffect(() => {
    if (!showPalette) return;
    const close = () => setShowPalette(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [showPalette]);

  const commitRename = () => {
    setIsEditing(false);
    if (val.trim()) onRename?.(val.trim());
  };

  // Detect the border color from the chosen bg color
  const paletteMatch = PALETTE.find(p => p.alpha === color || p.hex === color);
  const borderColor = paletteMatch?.hex ?? "#6366f1";

  return (
    <>
      {/* NodeResizer MUST be a sibling of the content div, not nested inside */}
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={120}
        lineStyle={{
          borderColor: borderColor,
          borderWidth: 2,
          borderStyle: "dashed",
        }}
        handleStyle={{
          width: 14,
          height: 14,
          borderRadius: 3,
          backgroundColor: borderColor,
          border: "2px solid white",
          boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
        }}
        onResize={(_e, params) => {
          onResize?.(params.x, params.y, params.width, params.height);
        }}
        onResizeEnd={(_e, params) => {
          onResizeStop?.(params.x, params.y, params.width, params.height);
        }}
      />

      {/* The content wrapper — must be 100% w/h so ResizeHandles appear on exact edges */}
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: color,
          borderRadius: "24px",
          border: selected
            ? `3px dashed ${borderColor}`
            : isDark
              ? "2px solid rgba(148,163,184,0.15)"
              : "2px solid rgba(148,163,184,0.25)",
          boxSizing: "border-box",
          position: "relative",
          pointerEvents: "auto",
          transition: "border 0.2s, background-color 0.2s",
          boxShadow: isDark ? "inset 0 1px 3px rgba(0,0,0,0.4)" : "inset 0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* ── Header label above the box ── */}
        <div
          style={{
            position: "absolute",
            top: -46,
            left: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 10
          }}
        >
          {isEditing ? (
            <input
              autoFocus
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setIsEditing(false); }}
              style={{
                padding: "6px 16px",
                borderRadius: 14,
                border: `2px solid ${borderColor}`,
                outline: "none",
                fontSize: 14,
                fontWeight: 900,
                background: isDark ? "#0f172a" : "white",
                color: isDark ? "white" : "#1e293b",
                letterSpacing: "0.02em",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              style={{
                cursor: "pointer",
                padding: "6px 18px",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: "0.04em",
                background: isDark ? "#1e293b" : "white",
                color: isDark ? "#f1f5f9" : "#334155",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                whiteSpace: "nowrap",
                userSelect: "none",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                transition: "transform 0.1s, box-shadow 0.1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; }}
            >
              {name || "Comment Box"}
            </span>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)", // Adjusted opacity
              padding: "4px 8px",
              borderRadius: 14,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.2)"}`
            }}
          >
            {/* Color palette toggle */}
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowPalette(v => !v); }}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "3px solid white",
                background: borderColor,
                cursor: "pointer",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                flexShrink: 0,
                transition: "transform 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              title="Change color"
            />

            <div style={{ width: 1, height: 16, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />

            {/* Delete button */}
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation();
                onRemove?.();
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isDark ? "#fca5a5" : "#ef4444",
                opacity: 0.6,
                transition: "opacity 0.2s, background 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.background = "transparent"; }}
              title="Delete comment box"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>

          {showPalette && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: 0,
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 8,
                padding: "12px",
                borderRadius: "18px",
                background: isDark ? "#1e293b" : "white",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                zIndex: 100,
                minWidth: 140
              }}
            >
              {PALETTE.map(p => (
                <button
                  key={p.hex}
                  title={p.label}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    onColorChange?.(p.alpha);
                    setShowPalette(false);
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: p.hex,
                    border: p.alpha === color ? "3px solid white" : "2px solid transparent",
                    cursor: "pointer",
                    outline: "none",
                    boxShadow: p.alpha === color ? `0 0 0 2px ${p.hex}` : "0 2px 4px rgba(0,0,0,0.05)",
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                />
              ))}
            </div>
          )}
        </div>

        {/* Subtle bottom-right resize hint when selected */}
        {selected && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: 0.4,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={borderColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" transform="rotate(225 12 12)" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 900, color: borderColor, letterSpacing: "0.1em" }}>RESIZE</span>
          </div>
        )}
      </div>
    </>
  );
}

export const GroupNode = memo(GroupNodeComponent);
