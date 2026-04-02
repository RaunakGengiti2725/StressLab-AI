import type { DeformationParams } from "./types";
import { positionKey } from "./types";

const REFERENCE_STIFFNESS = 2.0;
const BASE_SENSITIVITY = 0.15;
const MAX_STIFFNESS_RATIO = 100;

function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

export function computeDisplacements(params: DeformationParams): Float32Array {
  const {
    positions,
    vertexCount,
    anchorCentroid,
    forceCentroid,
    anchorPositionKeys,
    forceDelta,
    testMode,
    youngsModulusGpa,
  } = params;

  const displacements = new Float32Array(vertexCount * 3);

  const ax = forceCentroid[0] - anchorCentroid[0];
  const ay = forceCentroid[1] - anchorCentroid[1];
  const az = forceCentroid[2] - anchorCentroid[2];
  const axisLen = Math.sqrt(ax * ax + ay * ay + az * az);
  if (axisLen < 0.001) return displacements;

  const adx = ax / axisLen;
  const ady = ay / axisLen;
  const adz = az / axisLen;

  const forceMag = Math.sqrt(
    forceDelta[0] * forceDelta[0] +
      forceDelta[1] * forceDelta[1] +
      forceDelta[2] * forceDelta[2],
  );
  if (forceMag < 0.001) return displacements;

  const stiffnessRatio = Math.min(
    REFERENCE_STIFFNESS / youngsModulusGpa,
    MAX_STIFFNESS_RATIO,
  );
  const scale = forceMag * stiffnessRatio * BASE_SENSITIVITY;

  let bendDirX = 0, bendDirY = 0, bendDirZ = 0;
  if (testMode === "bend") {
    const dot =
      forceDelta[0] * adx + forceDelta[1] * ady + forceDelta[2] * adz;
    bendDirX = forceDelta[0] - dot * adx;
    bendDirY = forceDelta[1] - dot * ady;
    bendDirZ = forceDelta[2] - dot * adz;
    const bendLen = Math.sqrt(
      bendDirX * bendDirX + bendDirY * bendDirY + bendDirZ * bendDirZ,
    );
    if (bendLen > 0.001) {
      bendDirX /= bendLen;
      bendDirY /= bendLen;
      bendDirZ /= bendLen;
    } else {
      bendDirY = 1;
    }
  }

  for (let i = 0; i < vertexCount; i++) {
    const px = positions[i * 3]!;
    const py = positions[i * 3 + 1]!;
    const pz = positions[i * 3 + 2]!;

    if (anchorPositionKeys.has(positionKey(px, py, pz))) continue;

    const dx = px - anchorCentroid[0];
    const dy = py - anchorCentroid[1];
    const dz = pz - anchorCentroid[2];

    const proj = dx * adx + dy * ady + dz * adz;
    const t = Math.max(0, Math.min(1.2, proj / axisLen));
    const influence = smoothstep(t);

    let ox = 0, oy = 0, oz = 0;

    switch (testMode) {
      case "bend": {
        const bendFactor = influence * influence * scale;
        ox = bendDirX * bendFactor;
        oy = bendDirY * bendFactor;
        oz = bendDirZ * bendFactor;
        break;
      }
      case "tension": {
        const tensionFactor = influence * scale;
        ox = adx * tensionFactor;
        oy = ady * tensionFactor;
        oz = adz * tensionFactor;
        break;
      }
      case "compress": {
        const compFactor = influence * scale * -0.5;
        ox = adx * compFactor;
        oy = ady * compFactor;
        oz = adz * compFactor;
        break;
      }
      case "twist": {
        const angle = influence * scale * 0.03;
        const perpX = dx - proj * adx;
        const perpY = dy - proj * ady;
        const perpZ = dz - proj * adz;
        const cosA = Math.cos(angle) - 1;
        const sinA = Math.sin(angle);
        const crossX = ady * perpZ - adz * perpY;
        const crossY = adz * perpX - adx * perpZ;
        const crossZ = adx * perpY - ady * perpX;
        ox = perpX * cosA + crossX * sinA;
        oy = perpY * cosA + crossY * sinA;
        oz = perpZ * cosA + crossZ * sinA;
        break;
      }
    }

    displacements[i * 3] = ox;
    displacements[i * 3 + 1] = oy;
    displacements[i * 3 + 2] = oz;
  }

  return displacements;
}
