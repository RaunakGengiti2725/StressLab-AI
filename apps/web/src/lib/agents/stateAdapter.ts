import type { AgentInput, RegionInfo } from "./types";
import type { MaterialProfile } from "@shared/materials";
import type { FaceRegion, Vec3 } from "@/lib/simulation/types";

interface StoreSnapshot {
  material: MaterialProfile;
  activeTool: string;
  regions: FaceRegion[];
  anchorRegionId: number | null;
  forceRegionId: number | null;
  forceDelta: Vec3;
  maxStress: number;
  maxDisplacement: number;
  dangerPct: number;
  isDeformed: boolean;
  geometryFactors: Float32Array | null;
  vertexCount: number;
  faceCount: number;
}

function computeForceMagnitude(delta: Vec3): number {
  return Math.sqrt(delta[0] ** 2 + delta[1] ** 2 + delta[2] ** 2);
}

function normalizeDirection(delta: Vec3): Vec3 {
  const mag = computeForceMagnitude(delta);
  if (mag < 1e-6) return [0, 0, 0];
  return [delta[0] / mag, delta[1] / mag, delta[2] / mag];
}

function regionToInfo(
  region: FaceRegion | undefined,
): RegionInfo | null {
  if (!region) return null;
  return {
    id: region.id,
    centroid: region.centroid,
    vertexCount: region.vertexIndices.length,
  };
}

function countStressConcentrators(gf: Float32Array | null): number {
  if (!gf) return 0;
  let count = 0;
  for (let i = 0; i < gf.length; i++) {
    if (gf[i]! > 1.5) count++;
  }
  return count;
}

function countThinWalls(gf: Float32Array | null): number {
  if (!gf) return 0;
  let count = 0;
  for (let i = 0; i < gf.length; i++) {
    if (gf[i]! > 2.0) count++;
  }
  return count;
}

function testModeFromTool(tool: string): string | null {
  const modes = ["bend", "twist", "compress", "tension"];
  return modes.includes(tool) ? tool : null;
}

export function buildAgentInput(snapshot: StoreSnapshot): AgentInput {
  const forceMag = computeForceMagnitude(snapshot.forceDelta);
  const stressConcentrators = countStressConcentrators(snapshot.geometryFactors);
  const thinWalls = countThinWalls(snapshot.geometryFactors);
  const vertexCount = snapshot.vertexCount;
  const displacedCount = snapshot.isDeformed
    ? Math.max(1, Math.round(vertexCount * 0.6))
    : 0;
  const avgDisplacement = snapshot.isDeformed
    ? snapshot.maxDisplacement * 0.4
    : 0;
  const avgStress = snapshot.isDeformed ? snapshot.maxStress * 0.35 : 0;

  return {
    material: snapshot.material,
    testMode: testModeFromTool(snapshot.activeTool),
    forceMagnitude: forceMag,
    forceDirection: normalizeDirection(snapshot.forceDelta),
    anchorRegion: regionToInfo(
      snapshot.anchorRegionId !== null
        ? snapshot.regions[snapshot.anchorRegionId]
        : undefined,
    ),
    forceRegion: regionToInfo(
      snapshot.forceRegionId !== null
        ? snapshot.regions[snapshot.forceRegionId]
        : undefined,
    ),
    deformation: {
      maxDisplacement: snapshot.maxDisplacement,
      avgDisplacement,
      displacedVertexCount: displacedCount,
      totalVertexCount: vertexCount,
    },
    stress: {
      maxStress: snapshot.maxStress,
      avgStress,
      dangerZonePct: snapshot.dangerPct,
      stressConcentratorCount: stressConcentrators,
      thinWallCount: thinWalls,
    },
    geometry: {
      vertexCount,
      faceCount: snapshot.faceCount,
      regionCount: snapshot.regions.length,
    },
    isSimulationActive: snapshot.isDeformed,
  };
}
