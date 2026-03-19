import { MarkerType } from "reactflow";
import type { Edge, Node } from "reactflow";
import type { SchemaColumn, SchemaRelationship, SchemaTable } from "./api";

type TableNodeData = {
  name: string;
  columns: SchemaColumn[];
  isDark: boolean;
};

const HORIZONTAL_GAP = 360;
const VERTICAL_GAP = 280;

export type NodePositionMap = Record<string, { x: number; y: number }>;
export type NodeParentMap = Record<string, string | null | undefined>;

export function buildNodes(
  tables: SchemaTable[],
  columns: SchemaColumn[],
  positions: NodePositionMap = {},
  parentMap: NodeParentMap = {},
  isDark = false,
): Node<TableNodeData>[] {
  return tables.map((table, index) => {
    const tableColumns = columns.filter((column) => column.table_id === table.id);
    const row = Math.floor(index / 2);
    const columnIndex = index % 2;

    const fallbackPosition = {
      x: 80 + columnIndex * HORIZONTAL_GAP,
      y: 80 + row * VERTICAL_GAP,
    };

    const parentNode = parentMap[table.id] ?? undefined;

    return {
      id: table.id,
      type: "tableNode",
      position: positions[table.id] ?? fallbackPosition,
      parentNode: parentNode ?? undefined,
      extent: parentNode ? "parent" : undefined,
      data: {
        name: table.name,
        columns: tableColumns,
        isDark,
      },
    };
  });
}

export function buildEdges(
  relationships: SchemaRelationship[],
  columns: SchemaColumn[],
  isDark = false,
): Edge[] {
  return relationships.map((relationship) => {
    const sourceColumn = columns.find(
      (column) => column.id === relationship.source_column_id,
    );
    const targetColumn = columns.find(
      (column) => column.id === relationship.target_column_id,
    );

    return {
      id: relationship.id,
      type: "relationshipEdge",
      source: relationship.source_table_id,
      target: relationship.target_table_id,
      data: { isDark },
      label:
        sourceColumn && targetColumn
          ? `${sourceColumn.name} -> ${targetColumn.name}`
          : "foreign key",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: isDark ? "#8088ff" : "#aeb5d8",
      },
    };
  });
}
