import type { MaterialProfile } from "@shared/materials";
import type { Vec3 } from "@/lib/simulation/types";

export interface RegionInfo {
  id: number;
  centroid: Vec3;
  vertexCount: number;
}

export interface AgentInput {
  material: MaterialProfile;
  testMode: string | null;
  forceMagnitude: number;
  forceDirection: Vec3;
  anchorRegion: RegionInfo | null;
  forceRegion: RegionInfo | null;

  deformation: {
    maxDisplacement: number;
    avgDisplacement: number;
    displacedVertexCount: number;
    totalVertexCount: number;
  };

  stress: {
    maxStress: number;
    avgStress: number;
    dangerZonePct: number;
    stressConcentratorCount: number;
    thinWallCount: number;
  };

  geometry: {
    vertexCount: number;
    faceCount: number;
    regionCount: number;
  };

  isSimulationActive: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}
