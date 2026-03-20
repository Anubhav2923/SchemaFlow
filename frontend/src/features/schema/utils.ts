import type { Edge, Node } from "reactflow";
import type { SchemaColumn, SchemaGroup, SchemaRelationship, SchemaTable } from "./api";

const HORIZONTAL_GAP = 360;
const VERTICAL_GAP = 280;

export type NodePositionMap = Record<string, { x: number; y: number }>;

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
    const row = Math.floor(index / 2);
    const col = index % 2;

    const fallback = {
      x: 80 + col * HORIZONTAL_GAP,
      y: 80 + row * VERTICAL_GAP,
    };

    const parentId = table.group_id ?? undefined;
    const parentGroup = parentId ? groups.find((g) => g.id === parentId) : null;

    // Stored position: for grouped tables this is relative to parent
    const storedPos = positions[table.id];

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
