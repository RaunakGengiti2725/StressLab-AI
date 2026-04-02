export type Vec3 = [number, number, number];

export type TestMode = "bend" | "twist" | "compress" | "tension";

export const TEST_MODES: readonly TestMode[] = [
  "bend",
  "twist",
  "compress",
  "tension",
] as const;

export function isTestMode(tool: string): tool is TestMode {
  return (TEST_MODES as readonly string[]).includes(tool);
}

export interface FaceRegion {
  id: number;
  faceIndices: number[];
  vertexIndices: number[];
  normal: Vec3;
  centroid: Vec3;
}

export interface DeformationParams {
  positions: Float32Array;
  vertexCount: number;
  anchorCentroid: Vec3;
  forceCentroid: Vec3;
  anchorPositionKeys: Set<string>;
  forceDelta: Vec3;
  testMode: TestMode;
  youngsModulusGpa: number;
}

export interface SimulationResult {
  displacements: Float32Array;
  stressValues: Float32Array;
  vertexColors: Float32Array;
  maxStress: number;
  maxDisplacement: number;
  dangerPct: number;
}

export function positionKey(x: number, y: number, z: number): string {
  return `${Math.round(x * 1000)},${Math.round(y * 1000)},${Math.round(z * 1000)}`;
}
