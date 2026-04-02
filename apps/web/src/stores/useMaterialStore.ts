import { create } from "zustand";

import { MATERIALS } from "@/data/materials";
import type { MaterialProfile } from "@shared/materials";

interface MaterialState {
  selectedId: string;
  materials: MaterialProfile[];
  setSelectedId: (id: string) => void;
}

export const useMaterialStore = create<MaterialState>((set) => ({
  selectedId: "pla",
  materials: MATERIALS,
  setSelectedId: (id) => set({ selectedId: id }),
}));

export function getSelectedMaterial(state: MaterialState): MaterialProfile {
  return state.materials.find((m) => m.id === state.selectedId) ?? MATERIALS[0]!;
}
