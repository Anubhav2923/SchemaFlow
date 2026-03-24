import { create } from "zustand";
import type { Edge, Node, NodeChange } from "reactflow";

export type GraphPosition = { x: number; y: number };

type SchemaStoreState = {
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  positionsById: Record<string, GraphPosition>;
  nodesById: Record<string, Node>;
  nodeOrder: string[];
  edgesById: Record<string, Edge>;
  edgeOrder: string[];
  hydrateGraph: (nodes: Node[], edges: Edge[]) => void;
  setPersistedPositions: (positions: Record<string, GraphPosition>) => void;
  updateNodePosition: (nodeId: string, position: GraphPosition, options?: { dragging?: boolean }) => void;
  updateNodePositions: (updates: Array<{ id: string; position: GraphPosition; dragging?: boolean }>) => void;
  updateNodeDimensions: (nodeId: string, payload: { width?: number; height?: number; x?: number; y?: number }) => void;
  applyNodeChanges: (changes: NodeChange[]) => void;
  setSelectedNodeIds: (nodeIds: string[]) => void;
  clearSelection: () => void;
  selectNode: (nodeId: string | null) => void;
};

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

export const selectGraphNodes = (state: SchemaStoreState) =>
  state.nodeOrder.map((id) => state.nodesById[id]).filter(Boolean);

export const selectGraphEdges = (state: SchemaStoreState) =>
  state.edgeOrder.map((id) => state.edgesById[id]).filter(Boolean);

export const useSchemaStore = create<SchemaStoreState>((set, get) => ({
  selectedNodeId: null,
  selectedNodeIds: [],
  positionsById: {},
  nodesById: {},
  nodeOrder: [],
  edgesById: {},
  edgeOrder: [],

  hydrateGraph: (nodes, edges) => set((state) => {
    const nextNodeIds = nodes.map((node) => node.id);
    const nextEdgeIds = edges.map((edge) => edge.id);

    // Structural equality check for nodes (ignoring UI-only state like dragging)
    const currentNodesDigest = state.nodeOrder.map(id => {
      const n = state.nodesById[id];
      return n ? `${n.id}:${n.data?.name}:${n.data?.tables?.length ?? 0}:${n.data?.columns?.length ?? 0}` : '';
    }).join('|');

    const incomingNodesDigest = nodes.map(n => 
      `${n.id}:${n.data?.name}:${n.data?.tables?.length ?? 0}:${n.data?.columns?.length ?? 0}`
    ).sort().join('|');

    const hasStructuralChange = currentNodesDigest !== incomingNodesDigest || !arraysEqual(state.nodeOrder, nextNodeIds) || !arraysEqual(state.edgeOrder, nextEdgeIds);

    const nextNodesById: Record<string, Node> = { ...state.nodesById };
    const nextPositionsById: Record<string, GraphPosition> = { ...state.positionsById };
    let hasPositionChange = false;
    let hasNodeChange = hasStructuralChange;

    nodes.forEach((node) => {
      const currentNode = state.nodesById[node.id];
      const persistedPosition = state.positionsById[node.id];
      const incomingPosition = persistedPosition ?? node.position;

      // Merge logic: preserve store state while taking structural data from incoming props
      const resolvedNode: Node = currentNode
        ? {
            ...node,
            position: incomingPosition,
            selected: currentNode.selected,
            dragging: currentNode.dragging,
            width: currentNode.width ?? node.width,
            height: currentNode.height ?? node.height,
          }
        : {
            ...node,
            position: incomingPosition,
          };

      // Check for attribute mismatch beyond just structure
      if (!currentNode || JSON.stringify(currentNode.data) !== JSON.stringify(resolvedNode.data)) {
        nextNodesById[node.id] = resolvedNode;
        hasNodeChange = true;
      }

      const currentPos = state.positionsById[node.id];
      if (!currentPos || currentPos.x !== resolvedNode.position.x || currentPos.y !== resolvedNode.position.y) {
        nextPositionsById[node.id] = {
          x: resolvedNode.position.x,
          y: resolvedNode.position.y,
        };
        hasPositionChange = true;
      }
    });

    if (!hasNodeChange && !hasPositionChange && !hasStructuralChange) {
      return state;
    }

    const nextEdgesById: Record<string, Edge> = {};
    edges.forEach((edge) => {
      const currentEdge = state.edgesById[edge.id];
      nextEdgesById[edge.id] = currentEdge ? { ...edge, selected: currentEdge.selected } : edge;
    });

    const result: Partial<SchemaStoreState> = {
      nodesById: hasNodeChange ? nextNodesById : state.nodesById,
      nodeOrder: nextNodeIds,
      edgesById: nextEdgesById,
      edgeOrder: nextEdgeIds,
      selectedNodeIds: state.selectedNodeIds.filter((id) => nextNodesById[id]),
      selectedNodeId: state.selectedNodeId && nextNodesById[state.selectedNodeId] ? state.selectedNodeId : null,
    };

    if (hasPositionChange) {
      result.positionsById = nextPositionsById;
    }

    return result;
  }),

  setPersistedPositions: (positions) => set((state) => {
    const nextNodesById = { ...state.nodesById };
    const nextPositionsById = { ...state.positionsById };
    let hasChange = false;

    Object.entries(positions).forEach(([nodeId, position]) => {
      const currentPosition = nextPositionsById[nodeId];
      if (currentPosition?.x === position.x && currentPosition?.y === position.y) return;
      nextPositionsById[nodeId] = position;
      const node = nextNodesById[nodeId];
      if (node) {
        nextNodesById[nodeId] = { ...node, position };
      }
      hasChange = true;
    });

    return hasChange ? { positionsById: nextPositionsById, nodesById: nextNodesById } : state;
  }),

  updateNodePosition: (nodeId, position, options) => set((state) => {
    const currentNode = state.nodesById[nodeId];
    if (!currentNode) return state;
    if (
      currentNode.position.x === position.x &&
      currentNode.position.y === position.y &&
      currentNode.dragging === options?.dragging
    ) {
      return state;
    }
    return {
      nodesById: {
        ...state.nodesById,
        [nodeId]: {
          ...currentNode,
          position,
          dragging: options?.dragging ?? currentNode.dragging,
        },
      },
      positionsById: {
        ...state.positionsById,
        [nodeId]: position,
      },
    };
  }),

  updateNodePositions: (updates) => set((state) => {
    if (updates.length === 0) return state;
    const nextNodesById = { ...state.nodesById };
    const nextPositionsById = { ...state.positionsById };
    let hasChange = false;

    updates.forEach(({ id, position, dragging }) => {
      const currentNode = nextNodesById[id];
      if (!currentNode) return;
      if (
        currentNode.position.x === position.x &&
        currentNode.position.y === position.y &&
        currentNode.dragging === dragging
      ) {
        return;
      }

      nextNodesById[id] = {
        ...currentNode,
        position,
        dragging: dragging ?? currentNode.dragging,
      };
      nextPositionsById[id] = position;
      hasChange = true;
    });

    return hasChange ? { nodesById: nextNodesById, positionsById: nextPositionsById } : state;
  }),

  updateNodeDimensions: (nodeId, payload) => set((state) => {
    const currentNode = state.nodesById[nodeId];
    if (!currentNode) return state;

    const nextPosition = typeof payload.x === "number" && typeof payload.y === "number"
      ? { x: payload.x, y: payload.y }
      : currentNode.position;

    return {
      nodesById: {
        ...state.nodesById,
        [nodeId]: {
          ...currentNode,
          position: nextPosition,
          width: payload.width ?? currentNode.width,
          height: payload.height ?? currentNode.height,
          style: {
            ...currentNode.style,
            width: payload.width ?? currentNode.style?.width,
            height: payload.height ?? currentNode.style?.height,
          },
        },
      },
      positionsById: {
        ...state.positionsById,
        [nodeId]: nextPosition,
      },
    };
  }),

  applyNodeChanges: (changes) => set((state) => {
    if (changes.length === 0) return state;
    const nextNodesById = { ...state.nodesById };
    const nextPositionsById = { ...state.positionsById };
    const nextSelectedNodeIds = new Set(state.selectedNodeIds);
    let hasChange = false;

    changes.forEach((change) => {
      const changeId = "id" in change ? change.id : "";
      const currentNode = nextNodesById[changeId];
      if (!currentNode && change.type !== "add") return;

      switch (change.type) {
        case "position": {
          if (!currentNode || !change.position) return;
          if (currentNode.position.x === change.position.x && currentNode.position.y === change.position.y && currentNode.dragging === change.dragging) return;
          
          nextNodesById[changeId] = {
            ...currentNode,
            position: change.position,
            dragging: change.dragging ?? currentNode.dragging,
          };
          nextPositionsById[changeId] = change.position;
          hasChange = true;
          break;
        }
        case "dimensions": {
          if (!currentNode || !change.dimensions) return;
          if (currentNode.width === change.dimensions.width && currentNode.height === change.dimensions.height) return;
          
          nextNodesById[changeId] = {
            ...currentNode,
            width: change.dimensions.width ?? currentNode.width,
            height: change.dimensions.height ?? currentNode.height,
          };
          hasChange = true;
          break;
        }
        case "select": {
          if (!currentNode || currentNode.selected === change.selected) return;
          
          nextNodesById[changeId] = {
            ...currentNode,
            selected: change.selected,
          };
          if (change.selected) nextSelectedNodeIds.add(changeId);
          else nextSelectedNodeIds.delete(changeId);
          hasChange = true;
          break;
        }
        case "remove": {
          delete nextNodesById[changeId];
          delete nextPositionsById[changeId];
          nextSelectedNodeIds.delete(changeId);
          hasChange = true;
          break;
        }
      }
    });

    if (!hasChange) return state;

    const nextNodeOrder = state.nodeOrder.filter(id => !!nextNodesById[id]);
    const selectedNodeIds = nextNodeOrder.filter((id) => nextSelectedNodeIds.has(id));

    return {
      nodesById: nextNodesById,
      nodeOrder: nextNodeOrder,
      positionsById: nextPositionsById,
      selectedNodeIds,
      selectedNodeId: selectedNodeIds[0] ?? null,
    };
  }),

  setSelectedNodeIds: (nodeIds) => set((state) => {
    const nextSelectedNodeIds = [...nodeIds];
    if (
      arraysEqual(state.selectedNodeIds, nextSelectedNodeIds) &&
      state.selectedNodeId === (nextSelectedNodeIds[0] ?? null)
    ) {
      return state;
    }

    const selectedSet = new Set(nextSelectedNodeIds);
    const nextNodesById = { ...state.nodesById };

    state.nodeOrder.forEach((nodeId) => {
      const node = state.nodesById[nodeId];
      if (!node) return;
      const isSelected = selectedSet.has(nodeId);
      if (node.selected === isSelected) return;
      nextNodesById[nodeId] = { ...node, selected: isSelected };
    });

    return {
      nodesById: nextNodesById,
      selectedNodeIds: nextSelectedNodeIds,
      selectedNodeId: nextSelectedNodeIds[0] ?? null,
    };
  }),

  clearSelection: () => set((state) => {
    if (state.selectedNodeIds.length === 0 && state.selectedNodeId === null) return state;
    const nextNodesById = { ...state.nodesById };
    state.selectedNodeIds.forEach((nodeId) => {
      const node = state.nodesById[nodeId];
      if (!node?.selected) return;
      nextNodesById[nodeId] = { ...node, selected: false };
    });
    return {
      nodesById: nextNodesById,
      selectedNodeIds: [],
      selectedNodeId: null,
    };
  }),

  selectNode: (nodeId) => {
    if (!nodeId) {
      get().clearSelection();
      return;
    }
    get().setSelectedNodeIds([nodeId]);
  },
}));
