import type { Edge, Node } from "reactflow";
import type { GraphEdgeRecord, GraphNodeRecord, GraphPositionMap } from "../types/graph";

export function normalizeGraph(nodes: Node[], edges: Edge[]) {
  const nodesById: GraphNodeRecord = {};
  const positionsById: GraphPositionMap = {};
  const edgesById: GraphEdgeRecord = {};

  nodes.forEach((node) => {
    nodesById[node.id] = node;
    positionsById[node.id] = { x: node.position.x, y: node.position.y };
  });

  edges.forEach((edge) => {
    edgesById[edge.id] = edge;
  });

  return {
    nodesById,
    nodeOrder: nodes.map((node) => node.id),
    positionsById,
    edgesById,
    edgeOrder: edges.map((edge) => edge.id),
  };
}
