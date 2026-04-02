import { create } from "zustand";
import * as THREE from "three";

import type { FaceRegion, Vec3 } from "@/lib/simulation/types";
import {
  extractRegions,
  buildFaceToRegionMap,
  buildVertexAdjacency,
} from "@/lib/simulation/regionExtraction";
import { computeGeometryFactors } from "@/lib/simulation/geometryAnalysis";

interface SimulationState {
  regions: FaceRegion[];
  faceToRegion: Int32Array | null;
  originalPositions: Float32Array | null;
  vertexAdjacency: Map<number, number[]> | null;
  geometryFactors: Float32Array | null;
  regionVertexMap: Map<number, number[]>;

  hoveredRegionId: number | null;
  anchorRegionId: number | null;
  forceRegionId: number | null;

  forceDelta: Vec3;

  maxStress: number;
  maxDisplacement: number;
  dangerPct: number;
  isDeformed: boolean;

  initFromGeometry: (geometry: THREE.BufferGeometry) => void;
  setHoveredRegion: (id: number | null) => void;
  setAnchorRegion: (id: number) => void;
  setForceRegion: (id: number) => void;
  updateForceDelta: (delta: Vec3) => void;
  setResults: (results: {
    maxStress: number;
    maxDisplacement: number;
    dangerPct: number;
  }) => void;
  setIsDeformed: (v: boolean) => void;
  resetSimulation: () => void;
  clearGeometry: () => void;
}

const INITIAL_SIMULATION: Pick<
  SimulationState,
  | "hoveredRegionId"
  | "anchorRegionId"
  | "forceRegionId"
  | "forceDelta"
  | "maxStress"
  | "maxDisplacement"
  | "dangerPct"
  | "isDeformed"
> = {
  hoveredRegionId: null,
  anchorRegionId: null,
  forceRegionId: null,
  forceDelta: [0, 0, 0],
  maxStress: 0,
  maxDisplacement: 0,
  dangerPct: 0,
  isDeformed: false,
};

export const useSimulationStore = create<SimulationState>((set) => ({
  regions: [],
  faceToRegion: null,
  originalPositions: null,
  vertexAdjacency: null,
  geometryFactors: null,
  regionVertexMap: new Map(),
  ...INITIAL_SIMULATION,

  initFromGeometry: (geometry: THREE.BufferGeometry) => {
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const positions = new Float32Array(posAttr.array.length);
    positions.set(posAttr.array);

    const regions = extractRegions(geometry);
    const indexAttr = geometry.getIndex();
    const faceCount = indexAttr
      ? indexAttr.count / 3
      : posAttr.count / 3;
    const faceToRegion = buildFaceToRegionMap(regions, faceCount);
    const vertexAdjacency = buildVertexAdjacency(geometry);
    const geometryFactors = computeGeometryFactors(geometry);

    const regionVertexMap = new Map<number, number[]>();
    for (const r of regions) {
      regionVertexMap.set(r.id, r.vertexIndices);
    }

    set({
      regions,
      faceToRegion,
      originalPositions: positions,
      vertexAdjacency,
      geometryFactors,
      regionVertexMap,
      ...INITIAL_SIMULATION,
    });
  },

  setHoveredRegion: (id) => set({ hoveredRegionId: id }),

  setAnchorRegion: (id) =>
    set((s) => ({
      anchorRegionId: id,
      forceRegionId: s.forceRegionId === id ? null : s.forceRegionId,
    })),

  setForceRegion: (id) =>
    set((s) => ({
      forceRegionId: s.anchorRegionId === id ? s.forceRegionId : id,
      forceDelta: [0, 0, 0] as Vec3,
    })),

  updateForceDelta: (delta) => set({ forceDelta: delta }),

  setResults: (results) => set(results),

  setIsDeformed: (v) => set({ isDeformed: v }),

  resetSimulation: () => set(INITIAL_SIMULATION),

  clearGeometry: () =>
    set({
      regions: [],
      faceToRegion: null,
      originalPositions: null,
      vertexAdjacency: null,
      geometryFactors: null,
      regionVertexMap: new Map(),
      ...INITIAL_SIMULATION,
    }),
}));
