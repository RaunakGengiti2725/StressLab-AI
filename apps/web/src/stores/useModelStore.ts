import { create } from "zustand";

interface GeometryMeta {
  vertexCount: number;
  faceCount: number;
  center: [number, number, number];
  radius: number;
}

interface ModelState {
  loaded: boolean;
  source: string | null;
  name: string;
  vertexCount: number;
  faceCount: number;
  center: [number, number, number] | null;
  radius: number;

  shouldFitView: boolean;
  shouldResetCamera: boolean;

  loadSample: () => void;
  clearModel: () => void;
  setGeometryMeta: (meta: GeometryMeta) => void;
  requestFitView: () => void;
  requestResetCamera: () => void;
  consumeFitView: () => void;
  consumeResetCamera: () => void;
}

export const useModelStore = create<ModelState>((set) => ({
  loaded: false,
  source: null,
  name: "",
  vertexCount: 0,
  faceCount: 0,
  center: null,
  radius: 0,

  shouldFitView: false,
  shouldResetCamera: false,

  loadSample: () =>
    set({
      loaded: true,
      source: "sample-bracket",
      name: "Sample Bracket",
      shouldFitView: true,
    }),

  clearModel: () =>
    set({
      loaded: false,
      source: null,
      name: "",
      vertexCount: 0,
      faceCount: 0,
      center: null,
      radius: 0,
    }),

  setGeometryMeta: (meta) => set(meta),
  requestFitView: () => set({ shouldFitView: true }),
  requestResetCamera: () => set({ shouldResetCamera: true }),
  consumeFitView: () => set({ shouldFitView: false }),
  consumeResetCamera: () => set({ shouldResetCamera: false }),
}));
