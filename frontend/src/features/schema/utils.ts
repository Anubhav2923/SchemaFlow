import type { Edge, Node } from "reactflow";
import type { SchemaColumn, SchemaGroup, SchemaRelationship, SchemaTable } from "./api";

const HORIZONTAL_GAP = 360;
const VERTICAL_GAP = 280;
const AUTO_LAYOUT_HORIZONTAL_GAP = 420;
const AUTO_LAYOUT_VERTICAL_GAP = 250;
const AUTO_LAYOUT_CLUSTER_GAP = 320;
const TABLE_WIDTH = 320;
const TABLE_ACCENTS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
  "#6366f1",
  "#f97316",
  "#06b6d4",
];

export type NodePositionMap = Record<string, { x: number; y: number }>;

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getTableAccentColor(table: Pick<SchemaTable, "id" | "name">): string {
  const key = `${table.name}:${table.id}`;
  return TABLE_ACCENTS[hashString(key) % TABLE_ACCENTS.length];
}

function getComponentIds(
  tableIds: string[],
  adjacency: Map<string, Set<string>>,
): string[][] {
  const seen = new Set<string>();
  const components: string[][] = [];

  tableIds.forEach((tableId) => {
    if (seen.has(tableId)) return;
    const queue = [tableId];
    const component: string[] = [];
    seen.add(tableId);

    while (queue.length > 0) {
      const current = queue.shift() as string;
      component.push(current);
      (adjacency.get(current) ?? []).forEach((next) => {
        if (seen.has(next)) return;
        seen.add(next);
        queue.push(next);
      });
    }

    components.push(component);
  });

  return components;
}

function distributeLayerPositions(
  layer: string[],
  preferredCenters: number[],
  gap: number,
): Map<string, number> {
  if (layer.length === 0) return new Map();

  const ordered = layer
    .map((tableId, index) => ({ tableId, center: preferredCenters[index] ?? index * gap }))
    .sort((left, right) => left.center - right.center);

  const placed = ordered.map((item) => ({ ...item, x: item.center }));

  for (let index = 1; index < placed.length; index += 1) {
    const previous = placed[index - 1];
    if (placed[index].x - previous.x < gap) {
      placed[index].x = previous.x + gap;
    }
  }

  for (let index = placed.length - 2; index >= 0; index -= 1) {
    const next = placed[index + 1];
    if (next.x - placed[index].x < gap) {
      placed[index].x = next.x - gap;
    }
  }

  const minX = placed[0]?.x ?? 0;
  const maxX = placed[placed.length - 1]?.x ?? 0;
  const center = (minX + maxX) / 2;

  return new Map(placed.map((item) => [item.tableId, item.x - center]));
}

export function autoLayoutPositions(
  tables: Pick<SchemaTable, "id" | "group_id">[],
  relationships: Pick<SchemaRelationship, "source_table_id" | "target_table_id">[],
  existing: NodePositionMap = {},
): NodePositionMap {
  const ungroupedTables = tables.filter((table) => !table.group_id);
  if (ungroupedTables.length === 0) return {};

  const parentMap = new Map<string, Set<string>>();
  const childMap = new Map<string, Set<string>>();
  const adjacency = new Map<string, Set<string>>();

  ungroupedTables.forEach((table) => {
    parentMap.set(table.id, new Set());
    childMap.set(table.id, new Set());
    adjacency.set(table.id, new Set());
  });

  relationships.forEach((relationship) => {
    if (!parentMap.has(relationship.source_table_id) || !parentMap.has(relationship.target_table_id)) return;
    parentMap.get(relationship.source_table_id)?.add(relationship.target_table_id);
    childMap.get(relationship.target_table_id)?.add(relationship.source_table_id);
    adjacency.get(relationship.source_table_id)?.add(relationship.target_table_id);
    adjacency.get(relationship.target_table_id)?.add(relationship.source_table_id);
  });

  const positions: NodePositionMap = {};
  const components = getComponentIds(
    ungroupedTables.map((table) => table.id),
    adjacency,
  ).sort((left, right) => right.length - left.length);

  let cursorX = 180;

  components.forEach((componentTableIds) => {
    const rankMemo = new Map<string, number>();
    const rankNode = (tableId: string, stack = new Set<string>()): number => {
      if (rankMemo.has(tableId)) return rankMemo.get(tableId) as number;
      if (stack.has(tableId)) return 0;

      stack.add(tableId);
      const parents = [...(parentMap.get(tableId) ?? [])].filter((parentId) => componentTableIds.includes(parentId));
      const rank = parents.length === 0
        ? 0
        : Math.max(...parents.map((parentId) => rankNode(parentId, stack) + 1));
      stack.delete(tableId);
      rankMemo.set(tableId, rank);
      return rank;
    };

    const layers = new Map<number, string[]>();
    componentTableIds.forEach((tableId) => {
      const rank = rankNode(tableId);
      const layer = layers.get(rank) ?? [];
      layer.push(tableId);
      layers.set(rank, layer);
    });

    const sortedRanks = [...layers.keys()].sort((a, b) => a - b);
    const localPositions = new Map<string, { x: number; y: number }>();

    sortedRanks.forEach((rank) => {
      const layer = layers.get(rank) ?? [];
      const previousRank = layers.get(rank - 1) ?? [];

      layer.sort((left, right) => {
        const leftParents = [...(parentMap.get(left) ?? [])];
        const rightParents = [...(parentMap.get(right) ?? [])];
        const leftExisting = typeof existing[left]?.x === "number" ? existing[left].x : Number.POSITIVE_INFINITY;
        const rightExisting = typeof existing[right]?.x === "number" ? existing[right].x : Number.POSITIVE_INFINITY;

        const leftBarycenter = leftParents.length > 0
          ? leftParents.reduce((sum, parentId) => sum + (localPositions.get(parentId)?.x ?? 0), 0) / leftParents.length
          : Number.isFinite(leftExisting) ? leftExisting : 0;
        const rightBarycenter = rightParents.length > 0
          ? rightParents.reduce((sum, parentId) => sum + (localPositions.get(parentId)?.x ?? 0), 0) / rightParents.length
          : Number.isFinite(rightExisting) ? rightExisting : 0;

        if (leftBarycenter !== rightBarycenter) return leftBarycenter - rightBarycenter;

        const leftDegree = (parentMap.get(left)?.size ?? 0) + (childMap.get(left)?.size ?? 0);
        const rightDegree = (parentMap.get(right)?.size ?? 0) + (childMap.get(right)?.size ?? 0);
        if (rightDegree !== leftDegree) return rightDegree - leftDegree;

        return left.localeCompare(right);
      });

      const preferredCenters = layer.map((tableId) => {
        const parents = [...(parentMap.get(tableId) ?? [])].filter((parentId) => previousRank.includes(parentId));
        if (parents.length > 0) {
          return parents.reduce((sum, parentId) => sum + (localPositions.get(parentId)?.x ?? 0), 0) / parents.length;
        }
        if (typeof existing[tableId]?.x === "number") {
          return existing[tableId].x;
        }
        return 0;
      });

      const xPositions = distributeLayerPositions(layer, preferredCenters, AUTO_LAYOUT_HORIZONTAL_GAP);
      layer.forEach((tableId) => {
        localPositions.set(tableId, {
          x: xPositions.get(tableId) ?? 0,
          y: rank * AUTO_LAYOUT_VERTICAL_GAP,
        });
      });
    });

    const componentValues = [...localPositions.values()];
    const componentMinX = Math.min(...componentValues.map((position) => position.x));
    const componentMaxX = Math.max(...componentValues.map((position) => position.x));
    const componentWidth = Math.max(TABLE_WIDTH, componentMaxX - componentMinX + TABLE_WIDTH);

    componentTableIds.forEach((tableId) => {
      const localPosition = localPositions.get(tableId);
      if (!localPosition) return;
      positions[tableId] = {
        x: cursorX + (localPosition.x - componentMinX),
        y: 120 + localPosition.y,
      };
    });

    cursorX += componentWidth + AUTO_LAYOUT_CLUSTER_GAP;
  });

  tables.filter((table) => table.group_id).forEach((table) => {
    if (existing[table.id]) {
      positions[table.id] = existing[table.id];
    }
  });

  return positions;
}

export function buildNodes(
  tables: SchemaTable[],
  columns: SchemaColumn[],
  groups: SchemaGroup[] = [],
  positions: NodePositionMap = {},
  isDark = false,
  onGroupRename?: (id: string, name: string) => void,
  onGroupColorChange?: (id: string, color: string) => void,
  onGroupRemove?: (id: string) => void,
  onGroupResize?: (id: string, x: number, y: number, width: number, height: number) => void,
  onGroupResizeStop?: (id: string, x: number, y: number, width: number, height: number) => void,
): Node[] {
  // ── Group nodes (rendered FIRST so they appear under tables) ──
  const groupNodes: Node[] = groups.map((group) => {
    const gx = Number.isNaN(group.x) ? 0 : (group.x ?? 0);
    const gy = Number.isNaN(group.y) ? 0 : (group.y ?? 0);
    const gw = Number.isNaN(group.width) ? 400 : (group.width ?? 400);
    const gh = Number.isNaN(group.height) ? 300 : (group.height ?? 300);

    return {
      id: group.id,
      type: "groupNode",
      position: { x: gx, y: gy },
      style: {
        width: gw,
        height: gh,
        zIndex: -1,
      },
      data: {
        name: group.name,
        color: group.color ?? "#6366f11a",
        isDark,
        onRename: (newName: string) => onGroupRename?.(group.id, newName),
        onColorChange: (newColor: string) => onGroupColorChange?.(group.id, newColor),
        onRemove: () => onGroupRemove?.(group.id),
        onResize: (x: number, y: number, w: number, h: number) => onGroupResize?.(group.id, x, y, w, h),
        onResizeStop: (x: number, y: number, w: number, h: number) =>
          onGroupResizeStop?.(group.id, x, y, w, h),
      },
    };
  });

  // ── Table nodes ──
  const tableNodes: Node[] = tables.map((table, index) => {
    const tableColumns = columns.filter((c) => c.table_id === table.id);
    const accentColor = getTableAccentColor(table);
    const row = Math.floor(index / 2);
    const col = index % 2;

    const fallback = {
      x: 80 + col * HORIZONTAL_GAP,
      y: 80 + row * VERTICAL_GAP,
    };

    const parentId = table.group_id ?? undefined;
    const parentGroup = parentId ? groups.find((g) => g.id === parentId) : null;

    const hasPersistedPosition =
      typeof table.x === "number" &&
      Number.isFinite(table.x) &&
      typeof table.y === "number" &&
      Number.isFinite(table.y);

    // Prefer the live/local position map first so drag-drop does not snap back
    // to stale persisted coordinates while the async save catches up.
    const storedPos = positions[table.id] ?? (hasPersistedPosition
      ? { x: table.x as number, y: table.y as number }
      : undefined);

    let position: { x: number; y: number };
    if (storedPos && !Number.isNaN(storedPos.x) && !Number.isNaN(storedPos.y)) {
      position = storedPos;
    } else if (parentGroup) {
      // Convert absolute fallback to relative
      const pgx = Number.isNaN(parentGroup.x) ? 0 : (parentGroup.x ?? 0);
      const pgy = Number.isNaN(parentGroup.y) ? 0 : (parentGroup.y ?? 0);
      position = {
        x: fallback.x - pgx,
        y: fallback.y - pgy,
      };
    } else {
      position = fallback;
    }

    return {
      id: table.id,
      type: "tableNode",
      // Assign parent so ReactFlow moves child with parent automatically
      parentNode: parentId,
      // Allow tables to be dragged OUT of the group (no 'extent' restriction)
      extent: undefined,
      position,
      data: {
        name: table.name,
        columns: tableColumns,
        isDark,
        accentColor,
      },
    };
  });

  return [...groupNodes, ...tableNodes];
}

export function buildEdges(
  relationships: SchemaRelationship[],
  columns: SchemaColumn[],
  isDark = false,
  onEdit?: (rel: SchemaRelationship) => void,
): Edge[] {
  return relationships.map((rel) => {
    const sourceCol = columns.find((c) => c.id === rel.source_column_id);
    const targetCol = columns.find((c) => c.id === rel.target_column_id);

    const srcIsOne = sourceCol?.is_primary || sourceCol?.is_unique;
    const tgtIsOne = targetCol?.is_primary || targetCol?.is_unique;
    const cardinality =
      srcIsOne && tgtIsOne ? "one-to-one" :
      srcIsOne             ? "one-to-many" :
                             "many-to-many";

    return {
      id: rel.id,
      type: "relationshipEdge",
      source: rel.source_table_id,
      target: rel.target_table_id,
      sourceHandle: sourceCol ? `${sourceCol.id}-right` : undefined,
      targetHandle: targetCol ? `${targetCol.id}-left`  : undefined,
      data: {
        isDark,
        cardinality,
        sourceColumnName: sourceCol?.name,
        targetColumnName: targetCol?.name,
        onDelete: rel.on_delete,
        relationshipId: rel.id,
        onEdit: () => onEdit?.(rel),
      },
    };
  });
}
