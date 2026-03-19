import { create } from "zustand";

type SchemaState = {
  selectedNodeId: string | null;
  selectNode: (nodeId: string | null) => void;
};

export const useSchemaStore = create<SchemaState>((set) => ({
  selectedNodeId: null,
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
}));
