import type { Edge, Node } from "reactflow";

export type GraphNodeRecord = Record<string, Node>;
export type GraphEdgeRecord = Record<string, Edge>;
export type GraphPositionMap = Record<string, { x: number; y: number }>;
